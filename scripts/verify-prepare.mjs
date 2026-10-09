import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'attention-firewall-prepare-'));
const inputs=['scripts/prepare-demo.mjs','server/frozen/questions.json','server/frozen/policy.json','frontend/index.html'];
const outputs=['public/evaluation-config.mjs','server/document.mjs'];

function fixture(name,convert){
 const directory=path.join(temporary,name);
 for(const file of inputs){
  const destination=path.join(directory,file);
  fs.mkdirSync(path.dirname(destination),{recursive:true});
  fs.writeFileSync(destination,convert(fs.readFileSync(path.join(root,file),'utf8')));
 }
 fs.mkdirSync(path.join(directory,'public'),{recursive:true});
 return directory;
}
function prepare(directory){
 return spawnSync(process.execPath,[path.join(directory,'scripts/prepare-demo.mjs')],{cwd:directory,encoding:'utf8'});
}

try{
 let baseline;
 for(const [name,convert] of [
  ['LF',text=>text],
  ['CRLF',text=>text.replace(/\n/g,'\r\n')],
  ['mixed',text=>text.replace(/\n/g,(_,offset)=>offset%2?'\r\n':'\n')]
 ]){
  const directory=fixture(name,convert);
  const result=prepare(directory);
  assert.equal(result.status,0,name+': '+result.stderr);
  const generated=outputs.map(file=>fs.readFileSync(path.join(directory,file),'utf8'));
  baseline??=generated;
  assert.deepEqual(generated,baseline,name+' must generate the same policy and document');
 }
 for(const [name,file,change] of [
  ['questions-format','questions.json',text=>text.replace('{','{ ')],
  ['policy-format','policy.json',text=>text.replace('{','{ ')],
  ['questions-content','questions.json',text=>text.replace('Use only the supplied facts','Ignore the supplied facts')],
  ['policy-content','policy.json',text=>text.replace('0.58','0.59')]
 ]){
  const directory=fixture(name,text=>text.replace(/\n/g,'\r\n'));
  const filename=path.join(directory,'server/frozen',file);
  const content=fs.readFileSync(filename,'utf8');
  // Valid JSON formatting and semantic changes must both remain protected.
  const changed=change(content);
  assert.notEqual(changed,content,'The test must actually change the fixture');
  JSON.parse(changed);
  fs.writeFileSync(filename,changed);
  const result=prepare(directory);
  assert.notEqual(result.status,0,'Changed '+file+' must be rejected');
  assert.ok(result.stderr.includes('Evaluated demo payload drift: '+file));
  for(const output of outputs) assert.equal(fs.existsSync(path.join(directory,output)),false,'Reject before generating files');
 }
 console.log('PASS: LF, CRLF and mixed checkouts generate identical demo files; changed frozen payloads are rejected.');
}finally{
 fs.rmSync(temporary,{recursive:true,force:true});
}

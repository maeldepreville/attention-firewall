import fs from 'node:fs';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
for(const [source,target] of [['question_pack.json','questions.json'],['policy.json','policy.json']]){
 assert.deepEqual(fs.readFileSync(new URL('server/frozen/'+target,root)),fs.readFileSync(new URL('offline/revisions/af-eval-0.2/'+source,root)),'Frozen demo payload drift');
}
const policy=JSON.parse(fs.readFileSync(new URL('server/frozen/policy.json',root),'utf8'));
fs.writeFileSync(new URL('public/evaluation-config.mjs',root),'// Exact evaluated af-eval-0.2 policy payload. Do not tune against the final test.\nexport const POLICY = Object.freeze('+JSON.stringify(policy,null,2)+');\n');
const document=fs.readFileSync(new URL('frontend/index.html',root),'utf8');
fs.writeFileSync(new URL('server/document.mjs',root),'// Static document, no credentials or user data.\nexport default '+JSON.stringify(document)+';\n');
console.log('PASS: demo document generated; evaluated questions and policy are byte-identical.');

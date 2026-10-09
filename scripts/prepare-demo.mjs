import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const root=new URL('../',import.meta.url);
// Preserve the evaluated payloads without requiring the archived offline runner.
for(const [file,expected] of Object.entries({
 'questions.json':'715335b60cafe78beeb36c97c114adb28ab42fdebbe4f1c8750e5dbef15f6aa1',
 'policy.json':'a134461658339884aea00ad93080c3384270b0ca2ab173706f9bc27f3f3713b8'
})){
 const actual=createHash('sha256').update(fs.readFileSync(new URL('server/frozen/'+file,root))).digest('hex');
 assert.equal(actual,expected,'Evaluated demo payload drift: '+file);
}
const policy=JSON.parse(fs.readFileSync(new URL('server/frozen/policy.json',root),'utf8'));
fs.writeFileSync(new URL('public/evaluation-config.mjs',root),'// Exact evaluated af-eval-0.2 policy payload. Do not tune against the final test.\nexport const POLICY = Object.freeze('+JSON.stringify(policy,null,2)+');\n');
const document=fs.readFileSync(new URL('frontend/index.html',root),'utf8');
fs.writeFileSync(new URL('server/document.mjs',root),'// Static document, no credentials or user data.\nexport default '+JSON.stringify(document)+';\n');
console.log('PASS: demo document generated; evaluated questions and policy match their original SHA-256 identities.');

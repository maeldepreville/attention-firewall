import assert from 'node:assert/strict';
import fs from 'node:fs';
import {decide} from '../public/policy.mjs';
import {normalize,handle,assess,validateState} from '../server/model.mjs';
import {createConnection} from '../public/connection.mjs';
const accountId='0123456789abcdef0123456789abcdef',token='test-only-not-a-real-cloudflare-token';
const credentials={accountId,token};
const state={notification:{category:'work',source:'Teams',text:'A release is blocked until the required approval arrives.',received_at:'2026-10-09T17:30:00Z'},evaluated_at:'2026-10-09T17:30:00Z'};
const raw={success:true,result:{model:'clef-flash',answers:{urgency:{type:'score',probabilities:{0:0,1:.1,2:.2,3:.7},score:2.6},importance:{type:'score',probabilities:{0:0,1:0,2:0,3:1},score:3},interrupt_worthy:{type:'noul',noul:.92,probabilities:{true:.92,false:.08}}}}};
// Independent contract fixtures retain policy checks without the private benchmark.
const contexts=[['open',0,.58],['open',8,.708],['focused',0,.72],['focused',8,.848],['protected',0,.86],['protected',8,.988]];
const fixtures=[
 [0,0,0,['LATER','LATER','LATER','LATER','LATER','LATER']],
 [1/3,0,0,['SILENT','SILENT','SILENT','SILENT','SILENT','SILENT']],
 [1/3-1e-6,0,0,['LATER','LATER','LATER','LATER','LATER','LATER']],
 [.5,.5,.70,['INTERRUPT','SILENT','SILENT','SILENT','SILENT','SILENT']],
 [.5,.5,.85,['INTERRUPT','INTERRUPT','INTERRUPT','INTERRUPT','SILENT','SILENT']],
 [.75,.95,0,['INTERRUPT','INTERRUPT','INTERRUPT','INTERRUPT','INTERRUPT','INTERRUPT']],
 [.75-1e-6,.95,0,['SILENT','SILENT','SILENT','SILENT','SILENT','SILENT']],
 [.75,.95-1e-6,0,['SILENT','SILENT','SILENT','SILENT','SILENT','SILENT']],
];
for(const [u,i,w,actions] of fixtures)for(const [n,[mode,interruptions,threshold]] of contexts.entries()){
 const got=decide({urgency:u,importance:i,interrupt_worthy:w},{mode,interruptions});
 assert.equal(got.action,actions[n]);assert.equal(got.critical,u===.75&&i===.95);assert(Math.abs(got.threshold-threshold)<1e-12);
}
for(const [mode,interruptions,threshold] of contexts){
 const equal=decide({urgency:.5,importance:.5,interrupt_worthy:threshold},{mode,interruptions});assert.equal(equal.action,'INTERRUPT');
 const below=decide({urgency:.5,importance:.5,interrupt_worthy:threshold-1e-6},{mode,interruptions});assert.equal(below.action,'SILENT');
 const unavailable=decide(null,{mode,interruptions});assert.equal(unavailable.action,'SILENT');assert.equal(unavailable.threshold,null);assert.equal(unavailable.critical,null);
}
assert.equal(decide({urgency:.5,importance:.5,interrupt_worthy:.99},{mode:'protected',interruptions:20}).action,'INTERRUPT');
assert.equal(decide({urgency:0,importance:0,interrupt_worthy:0},{mode:'open',interruptions:0},-1).threshold,.05);
assert.equal(decide({urgency:1,importance:1,interrupt_worthy:0},{mode:'protected',interruptions:20},1).threshold,.99);
assert.equal(decide({urgency:.5,importance:.5,interrupt_worthy:.65},{mode:'open',interruptions:0},.1).action,'SILENT');
assert.equal(decide({urgency:.5,importance:.5,interrupt_worthy:.65},{mode:'open',interruptions:0},-.1).action,'INTERRUPT');
assert.throws(()=>decide(null,{mode:'constructor',interruptions:0}));
assert.throws(()=>decide({urgency:true,importance:1,interrupt_worthy:1},{mode:'open',interruptions:0}));
console.log('PASS: policy contract fixtures cover all six contexts, inclusive boundaries, pressure, calibration, nulls and critical bypass.');
const norm=normalize(raw);assert(Math.abs(norm.estimates.urgency-2.6/3)<1e-12);
for(const mutate of [r=>r.result.model='other',r=>r.result.answers.urgency.probabilities[0]=.4,r=>r.result.answers.urgency.score=2,r=>r.result.answers.importance.probabilities[0]='0',r=>r.result.answers.interrupt_worthy.noul=true,r=>r.result.answers.urgency.legend={0:'wrong',1:'wrong',2:'wrong',3:'wrong'}]){const r=structuredClone(raw);mutate(r);assert.throws(()=>normalize(r));}
assert.throws(()=>validateState({...state,sender:'hidden'}));assert.throws(()=>validateState({...state,notification:{...state.notification,sender:'hidden'}}));
const rounding=structuredClone(raw);rounding.result.answers.urgency.probabilities={0:.0001,1:.1,2:.2,3:.7};delete rounding.result.answers.urgency.score;assert(Math.abs(normalize(rounding).distributions.urgency.reduce((a,b)=>a+b)-1)<1e-12);
const body={credentials,state,context:{mode:'protected',interruptions:8},calibration:0};
const request=(payload=body,headers={})=>new Request('https://demo.test/api/assess',{method:'POST',headers:{Origin:'https://demo.test','Content-Type':'application/json',...headers},body:JSON.stringify(payload)});
let calls=0;
const fetcher=async(url,options)=>{calls++;assert.equal(url,`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/cloudflare/clef-flash`);assert.equal(options.headers.Authorization,'Bearer '+token);assert.equal(options.redirect,'manual');assert.equal(options.cache,'no-store');const payload=JSON.parse(options.body);assert.deepEqual(payload.state,state);assert.deepEqual(Object.keys(payload).sort(),['model','questions','state']);return Response.json(raw);};
const success=await handle(request(),false,{fetcher});const value=await success.json();assert.equal(value.status,'ok');assert.equal(value.decision.action,'INTERRUPT');assert.equal(value.decision.critical,true);assert.match(success.headers.get('Cache-Control'),/no-store/);assert(!JSON.stringify(value).includes(token));assert(!JSON.stringify(value).includes(accountId));assert.equal(calls,1);
for(const [status,error] of [[307,'service_unavailable'],[401,'credentials_rejected'],[403,'credentials_rejected'],[429,'rate_limited'],[500,'service_unavailable'],[302,'service_unavailable']]){
 const failed=await handle(request(),false,{fetcher:async()=>new Response(token+' '+accountId,{status})});const v=await failed.json();assert.equal(v.error,error);assert.equal(v.estimates,null);assert.equal(v.decision.action,'SILENT');assert.equal(v.decision.critical,null);assert(!JSON.stringify(v).includes(token));assert(!JSON.stringify(v).includes(accountId));
}
const invalid=await handle(request(),false,{fetcher:async()=>Response.json({result:{secret:token}})});assert.equal((await invalid.json()).status,'invalid_output');
for(const req of [request(body,{Origin:'https://evil.test'}),request({...body,credentials:{accountId:'../../evil',token}}),request({...body,context:{mode:'bad',interruptions:0}}),request({...body,state:{...state,attention_mode:'protected'}}),request({...body,credentials:token}),request(body,{'Content-Type':'text/plain'}),request({...body,padding:'x'.repeat(20000)})]){
 const before=calls;const r=await handle(req,false,{fetcher});assert(r.status>=400);assert.equal(calls,before);const text=await r.text();assert(!text.includes(token));
}
const timeout=await assess(credentials,state,{deadline:25,fetcher:(_url,options)=>new Promise((_,reject)=>options.signal.addEventListener('abort',()=>reject(new Error(token))))});assert.equal(timeout.status,'timeout');assert.equal(timeout.estimates,null);assert(!JSON.stringify(timeout).includes(token));
let connectCalls=0;
const connected=await handle(new Request('https://demo.test/api/connect',{method:'POST',headers:{Origin:'https://demo.test','Content-Type':'application/json'},body:JSON.stringify({credentials})}),true,{fetcher:async(_url,options)=>{connectCalls++;const p=JSON.parse(options.body);assert.equal(p.model,'clef-flash');assert.equal(p.state.notification.source,'Attention Firewall');return Response.json(raw);}});assert.equal(connected.status,200);assert.deepEqual(await connected.json(),{status:'ok',error:null});assert.equal(connectCalls,1);
console.log('PASS: typed normalization, exact projection, one-attempt transport, body bounds, safe failures, timeout and credential-free responses.');
let browserCalls=0,abortSeen=false;
const session=createConnection(async(path,options)=>{browserCalls++;assert.equal(options.cache,'no-store');assert.equal(options.redirect,'error');assert.equal(options.referrerPolicy,'no-referrer');assert.equal(options.signal.aborted,false);if(path==='/api/connect')return Response.json({status:'ok',error:null});return Response.json({...value,release:'af-eval-0.2',model:'clef-flash'});});
assert.equal(session.connected,false);await session.connect(accountId,token);assert.equal(session.connected,true);await session.assess(state,{mode:'open',interruptions:0},0);assert.equal(browserCalls,2);session.disconnect();assert.equal(session.connected,false);await assert.rejects(()=>session.assess(state,{mode:'open',interruptions:0},0),/disconnected/);assert.equal(browserCalls,2);
let release;
const stale=createConnection((_path,options)=>new Promise(resolve=>{release=()=>resolve(Response.json({status:'ok'}));options.signal.addEventListener('abort',()=>{abortSeen=true;});}));const pending=stale.connect(accountId,token);stale.disconnect();release();await assert.rejects(()=>pending,/disconnected/);assert.equal(stale.connected,false);assert(abortSeen);
console.log('PASS: session lifecycle, no credentials exposed, Disconnect aborts requests and rejects late connection results.');
let finishAssessment,assessmentAborted=false;
const interrupted=createConnection(async(path,options)=>path==='/api/connect'?Response.json({status:'ok'}):new Promise(resolve=>{finishAssessment=()=>resolve(Response.json(value));options.signal.addEventListener('abort',()=>{assessmentAborted=true;});}));
await interrupted.connect(accountId,token);const inFlight=interrupted.assess(state,{mode:'open',interruptions:0},0);interrupted.disconnect();finishAssessment();await assert.rejects(()=>inFlight,/disconnected/);assert(assessmentAborted);assert.equal(interrupted.connected,false);
console.log('PASS: Disconnect also cancels assessments and prevents stale numeric results entering another session.');
const code=fs.readFileSync('public/connection.mjs','utf8')+fs.readFileSync('server/model.mjs','utf8')+fs.readFileSync('public/app.js','utf8');
assert(!/\b(localStorage|sessionStorage|indexedDB|console\.(log|error|warn)|document\.cookie)\b/.test(code));
console.log('PASS: application credential path contains no browser persistence or logging calls.');

const blocked=createConnection(async()=>Response.json({status:'rejected',error:'request_rejected'},{status:403}));await assert.rejects(()=>blocked.connect(accountId,token),/request_rejected/);assert.equal(blocked.connected,false);
console.log('PASS: browser preserves a blocked request error instead of misreporting a Cloudflare outage.');

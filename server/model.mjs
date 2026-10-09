import questionsFile from './frozen/questions.json' with { type: 'json' };
import { decide } from '../public/policy.mjs';
const QUESTIONS = questionsFile.questions;
const MODEL = '@cf/cloudflare/clef-flash';
const CATEGORIES = new Set(['security','logistics','messaging','work','social','commercial']);
const keys = (value, expected) => value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === expected.length && expected.every(k => Object.hasOwn(value,k));
const require = condition => { if (!condition) throw new Error('Invalid data'); };
const number = (value, high=1) => { require(typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= high); return value; };
export function validateCredentials(value) {
  require(keys(value,['accountId','token']));
  require(typeof value.accountId === 'string' && /^[a-fA-F0-9]{32}$/.test(value.accountId));
  require(typeof value.token === 'string' && /^[\x21-\x7e]{16,512}$/.test(value.token));
  return value;
}
export function validateState(state) {
  require(keys(state,['notification','evaluated_at']));
  const n=state.notification;
  require(keys(n,['category','source','text','received_at']) && CATEGORIES.has(n.category));
  for (const [key,limit] of [['source',120],['text',2000]]) require(typeof n[key] === 'string' && n[key].length > 0 && n[key].length <= limit);
  const timestamp=value=>typeof value==='string' && value.length<=40 && /(Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value));
  require(timestamp(n.received_at) && timestamp(state.evaluated_at) && Date.parse(n.received_at)<=Date.parse(state.evaluated_at));
  return { notification: { category:n.category, source:n.source, text:n.text, received_at:n.received_at }, evaluated_at:state.evaluated_at };
}
export function normalize(raw) {
  require(raw && typeof raw==='object' && !Array.isArray(raw));
  if (Object.hasOwn(raw,'success')) require(raw.success===true);
  const result=Object.hasOwn(raw,'success') ? raw.result : raw;
  require(result && ['clef-flash',MODEL].includes(result.model) && keys(result.answers,Object.keys(QUESTIONS)));
  const estimates={},distributions={};
  for(const key of ['urgency','importance']){
    const answer=result.answers[key];require(answer?.type==='score' && keys(answer.probabilities,['0','1','2','3']));
    let values=[0,1,2,3].map(i=>number(answer.probabilities[String(i)]));
    const total=values.reduce((a,b)=>a+b,0);require(Math.abs(total-1)<=.001+1e-12);
    if(answer.legend!==undefined) require(keys(answer.legend,['0','1','2','3']) && [0,1,2,3].every(i=>answer.legend[String(i)]===QUESTIONS[key].criteria[i]));
    if(total!==1)values=values.map(v=>v/total);
    const expected=values.reduce((sum,v,i)=>sum+i*v,0);
    if(answer.score!==undefined)require(Math.abs(number(answer.score,3)-expected)<=.001+1e-12);
    estimates[key]=expected/3;distributions[key]=values;
  }
  const answer=result.answers.interrupt_worthy;require(answer?.type==='noul');
  estimates.interrupt_worthy=number(answer.noul);
  if(answer.probabilities!==undefined){
    require(keys(answer.probabilities,['true','false']));
    const yes=number(answer.probabilities.true),no=number(answer.probabilities.false);
    require(Math.abs(yes+no-1)<=.001+1e-12 && Math.abs(yes-estimates.interrupt_worthy)<=.001+1e-12);
    estimates.interrupt_worthy=yes/(yes+no);
  }
  return { estimates,distributions };
}
async function boundedBody(response,limit){
  if(!response.body)return '';
  const reader=response.body.getReader();let size=0;const chunks=[];
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();throw new Error('Body limit');}chunks.push(value);}}
  finally{reader.releaseLock();}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
}
export async function assess(credentials,state,{fetcher=fetch,signal,deadline=2000}={}){
  const controller=new AbortController();const start=performance.now();let timer;
  const failed=(status,error)=>({status,error,estimates:null,distributions:null,provider_ms:performance.now()-start});
  const aborted=()=>controller.abort();signal?.addEventListener('abort',aborted,{once:true});
  if(signal?.aborted)controller.abort();
  try{
    const timedOut=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error('Deadline'));},deadline);});
    const run=async()=>{
      const response=await fetcher(`https://api.cloudflare.com/client/v4/accounts/${credentials.accountId}/ai/run/${MODEL}`,{
        method:'POST',headers:{Authorization:'Bearer '+credentials.token,'Content-Type':'application/json'},
        // Workers supports manual redirects; reject every non-success status below.
        // Never follow a Location header with the visitor's Authorization token.
        body:JSON.stringify({model:'clef-flash',state,questions:QUESTIONS}),signal:controller.signal,redirect:'manual',cache:'no-store'
      });
      if(!response.ok){await response.body?.cancel();return failed('provider_error',response.status===401||response.status===403?'credentials_rejected':response.status===429?'rate_limited':'service_unavailable');}
      let raw;try{raw=JSON.parse(await boundedBody(response,2_000_000));}catch{return failed('invalid_output','invalid_response');}
      if(raw?.success===false)return failed('provider_error','service_unavailable');
      try{return {status:'ok',error:null,...normalize(raw),provider_ms:performance.now()-start};}
      catch{return failed('invalid_output','invalid_response');}
    };
    const result=await Promise.race([run(),timedOut]);
    return performance.now()-start>deadline?failed('timeout','deadline_exceeded'):result;
  }catch{return failed(signal?.aborted?'canceled':controller.signal.aborted?'timeout':'provider_error',signal?.aborted?'request_canceled':controller.signal.aborted?'deadline_exceeded':'service_unavailable');}
  finally{clearTimeout(timer);signal?.removeEventListener('abort',aborted);}
}
const response=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','Pragma':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
export async function handle(request,connection=false,options={}){
  // Credentials are request-local only. No logs, caches, sessions or background work.
  let body;
  try{
    const url=new URL(request.url);
    if(request.method!=='POST' || url.search || request.headers.get('origin')!==url.origin || request.headers.get('sec-fetch-site')==='cross-site')return response({status:'rejected',error:'request_rejected'},403);
    if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return response({status:'rejected',error:'invalid_request'},415);
    body=JSON.parse(await boundedBody(request,16_384));
    require(keys(body,connection?['credentials']:['credentials','state','context','calibration']));
    const credentials=validateCredentials(body.credentials);
    const now=new Date().toISOString();
    const state=connection?{notification:{category:'work',source:'Attention Firewall',text:'Connection check only. This is optional information with no deadline or consequence; no action is required.',received_at:now},evaluated_at:now}:validateState(body.state);
    if(!connection){require(keys(body.context,['mode','interruptions']));require(Number.isFinite(body.calibration)&&Math.abs(body.calibration)<=1);decide(null,body.context,body.calibration);}
    const assessment=await assess(credentials,state,{...options,signal:request.signal});
    if(connection)return response({status:assessment.status,error:assessment.error},assessment.status==='ok'?200:assessment.error==='credentials_rejected'?401:assessment.error==='rate_limited'?429:502);
    return response({...assessment,decision:decide(assessment.estimates,body.context,body.calibration),release:'af-eval-0.2',model:'clef-flash'});
  }catch{return response({status:'rejected',error:'invalid_request'},400);}
  finally{if(body?.credentials && typeof body.credentials==='object'){body.credentials.token='';body.credentials.accountId='';}body=null;}
}

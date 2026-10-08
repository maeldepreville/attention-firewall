import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {decide} from '../dist/policy.mjs';
const root=new URL('../',import.meta.url);
const html=fs.readFileSync(new URL('dist/index.html',root),'utf8');
const code=fs.readFileSync(new URL('dist/app.js',root),'utf8').replace("import { decide } from './policy.mjs';",'');
async function scenario({reduced=false,supported=true,cancelDeparture=false}={}){
 let clock=0,id=0,registered;const timers=new Map(),animations=[],elements=new Map();
 const schedule=(fn,delay)=>{timers.set(++id,{at:clock+delay,fn});return id};
 function element(name){const classes=new Set();const el={id:name,hidden:false,textContent:'',dataset:{},disabled:false,attributes:{},listeners:{},className:'',offsetLeft:0,offsetTop:0,classList:{add(...a){a.forEach(n=>classes.add(n))},remove(...a){a.forEach(n=>classes.delete(n))},toggle(n,force){if(force)classes.add(n);else classes.delete(n)},contains(n){return classes.has(n)}},setAttribute(k,v){this.attributes[k]=v},addEventListener(k,v){this.listeners[k]=v},focus(){},contains(){return false}};
 if(supported)el.animate=(frames,options)=>{let resolve,reject,ended=false;const anim={el,frames,options,start:clock,canceled:false,finished:new Promise((yes,no)=>{resolve=yes;reject=no}),cancel(){this.canceled=true;timers.delete(this.timer);if(!ended){ended=true;reject(new Error('canceled'))}}};anim.timer=schedule(()=>{ended=true;resolve()},options.duration);animations.push(anim);return anim};return el;}
 for(const match of html.matchAll(/<[^>]*\bid="([^"]+)"[^>]*>/g)){const el=element(match[1]);el.hidden=/\bhidden\b/.test(match[0]);elements.set(el.id,el);}
 ['front','middle','back'].forEach((slot,i)=>{elements.get('queue-'+slot).offsetLeft=[0,20,13][i];elements.get('queue-'+slot).offsetTop=[28,15,3][i]});
 const choices=['open','focused','protected'].map(mode=>({...element(mode),dataset:{mode}}));
 const ctx=vm.createContext({decide,URL,Map,AbortController,matchMedia:()=>({matches:reduced}),getComputedStyle:el=>({transform:'rotate('+({'queue-front':-5,'queue-middle':9,'queue-back':-12}[el.id]||0)+'deg)'}),document:{baseURI:'https://example.test/',getElementById:n=>{assert(elements.has(n),'Missing '+n);return elements.get(n)},querySelectorAll:()=>choices,addEventListener(){},modelContext:{registerTool(t){registered=t}}},addEventListener(){},requestAnimationFrame:fn=>schedule(fn,16),cancelAnimationFrame:n=>timers.delete(n),clearTimeout:n=>timers.delete(n),setTimeout:schedule});
 vm.runInContext(code,ctx);
 const get=n=>elements.get(n);
 const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve()};
 async function advance(ms){const end=clock+ms;while(true){const job=[...timers.entries()].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!job)break;clock=job[1].at;timers.delete(job[0]);job[1].fn();await flush()}clock=end;await flush()}
 assert(!get('empty-state').hidden);assert(get('feedback').inert);assert(get('notification-space').hidden);
 registered.execute({mode:'focused'});assert(!get('empty-state').hidden);registered.execute({mode:'open'});
 const expected=['Alex','Weekend offers','Your bank','Nora · Project team','Your driver','Jamie','Card security','Nora · Reminder','Alex'];
 for(let n=0;n<expected.length;n++){
  const queued=get('queue-front-message').textContent;const previous=get('message').textContent;
  const pending=get('next').listeners.click();
  if(supported){assert(get('next').disabled);assert.equal(get('arrival-status').textContent,'Sending');assert.equal(get('message').textContent,previous);assert.equal(get('queue-front-message').textContent,queued);assert(get('feedback').inert);
   const duplicate=get('next').listeners.click();await duplicate;
   const mode=registered.execute({mode:n===6?'protected':'open'});assert.equal(mode.status,'sending');assert.equal(get('message').textContent,previous);
   if(cancelDeparture&&n===0){await advance(70);animations.find(a=>a.el.id==='queue-front'&&a.options.fill==='forwards').cancel();await flush()}
   else await advance(reduced?100:440);
  }
  await pending;
  assert(get('empty-state').hidden);assert.equal(get('sender').textContent,expected[n]);assert.equal(get('message').textContent,queued);
  assert.equal(get('arrival-status').textContent,'Assessing');assert(get('decision-result').hidden);assert(!get('processing-state').hidden);assert(get('next').disabled);assert(get('feedback').inert);
  await get('next').listeners.click();assert.equal(get('sender').textContent,expected[n]);
  const mode=registered.execute({mode:n===6?'protected':'open'});assert.equal(mode.status,'processing');
  await advance(1350);assert.equal(get('arrival-status').textContent,'Decision ready');assert(!get('decision-result').hidden);assert(!get('next').disabled);assert(!get('feedback').inert);
  if(n===0){assert.equal(get('context-summary').textContent,'Open · 0 recent interruptions');assert.equal(get('decision-title').textContent,'Interrupt');get('feedback-change').listeners.click();assert.equal(get('decision-title').textContent,'Silent');get('feedback-reset').listeners.click();assert.equal(get('decision-title').textContent,'Interrupt')}
  if(n===1)assert.equal(get('decision-title').textContent,'Later');
  if(n===2)assert.equal(get('decision-title').textContent,'Silent');
  if(n===6){assert.equal(get('decision-band').className,'decision-band interrupt critical');assert.equal(get('decision-tag').textContent,'CRITICAL')}
  await advance(300);
 }
 assert(animations.every(a=>a.canceled),'Animations must release fill styles');
 if(reduced){assert(animations.every(a=>a.frames.every(f=>!('transform' in f)&&!('filter' in f))));assert(animations.every(a=>a.options.duration<=120))}
 if(supported&&!reduced){const departure=animations.find(a=>a.el.id==='queue-front'&&a.options.fill==='forwards');assert.equal(departure.options.duration,440);assert.equal(departure.frames.at(-1).opacity,0);const arrival=animations.find(a=>a.el.id==='notification'&&a.options.duration===680);assert(arrival);assert.equal(arrival.frames[0].opacity,0);assert.equal(arrival.frames.at(-1).transform,'translateY(0) scale(1)');const promotion=animations.find(a=>a.el.id==='queue-front'&&a.options.duration===420);assert.equal(promotion.frames[0].transform,'translate(20px,-13px) rotate(9deg)')}
 console.log('PASS',JSON.stringify({reduced,supported,cancelDeparture}),': 9 sends, preserved card identity, no duplicate delivery, stage ordering, mode changes, decision policy, calibration/Undo, critical, animation cleanup.');
}
await scenario();await scenario({reduced:true});await scenario({supported:false});await scenario({cancelDeparture:true});

const geometry=vm.createContext({});
vm.runInContext(code.slice(code.indexOf('function queueDepartureFrames('),code.indexOf('async function sendNext(')),geometry);
for(const width of [150,158,196]){
 const frames=vm.runInContext(`queueDepartureFrames({offsetWidth:${width}},{transform:'rotate(-5deg)'})`,geometry);
 assert.equal(frames.length,25);
 const values=frames.map(frame=>{const [,x,y,angle]=frame.transform.match(/translate\(([-.\d]+)px,([-.\d]+)px\).*rotate\(([-.\d]+)deg\) scale/);return {x:+x,y:+y,angle:+angle,opacity:frame.opacity,blur:+frame.filter.match(/[-.\d]+/)[0]}});
 assert.deepEqual(values[0],{x:0,y:0,angle:0,opacity:1,blur:0});
 assert.equal(values.at(-1).x,width*.74);assert.equal(values.at(-1).y,width*.4);assert(values.at(-1).angle>80&&values.at(-1).angle<90);
 assert(values.some(v=>v.y<0));assert(values.at(-1).y>0);
 for(let i=1;i<values.length;i++){assert(values[i].x>values[i-1].x);assert(values[i].angle>values[i-1].angle);assert(values[i].opacity<values[i-1].opacity);assert(values[i].blur>=values[i-1].blur)}
 assert.equal(frames.at(-1).opacity,0);
 console.log(`PASS: ${width}px card, continuous right/down path, tangent rotation, progressive blur/fade, no starting rotation snap.`);
}

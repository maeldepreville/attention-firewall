import { decide } from './policy.mjs?v=28';
import { createConnection } from './connection.mjs?v=28';
const $ = id => document.getElementById(id);
const iconURL = name => new URL(`./assets/${name}.jpg`, document.baseURI).href;
const connection = createConnection();
let sessionGeneration = 0, connecting = false;
let assessment = { status: 'pending', estimates: null, error: null, provider_ms: null };

const report = { app:'Teams', category:'work', categoryLabel:'Work / operational', sender:'Nora · Project team', text:'Could you review the release plan before our meeting in 15 minutes? If you cannot, we can review it tomorrow.', icon:'teams' };
const examples = [
  { app:'Messages', category:'messaging', categoryLabel:'Messaging / personal', sender:'Alex', text:'I’m downstairs. Can you let me in?', icon:'messages' },
  { app:'Mail', category:'commercial', categoryLabel:'Commercial / promotional', sender:'Weekend offers', text:'Last chance! Your exclusive 20% discount ends tonight.', icon:'mail' },
  { app:'Wallet', category:'security', categoryLabel:'Security / finance', sender:'Your bank', text:'Your monthly account statement is ready to view.', icon:'wallet' },
  report,
  { app:'Messages', category:'logistics', categoryLabel:'Logistics / transport', sender:'Your driver', text:'I’m at your door with your parcel. Please come down to collect it.', icon:'messages' },
  { app:'Instagram', category:'social', categoryLabel:'Social', sender:'Jamie', text:'I posted the photos from our weekend. You’re in a few of them!', icon:'instagram' },
  { app:'Wallet', category:'security', categoryLabel:'Security / finance', sender:'Card security', text:'Suspicious card activity detected. Confirm whether this payment was yours.', icon:'wallet' },
  { ...report, sender:'Nora · Schedule update', text:'Our review meeting has moved to tomorrow. No preparation or reply is needed tonight.' },
  { app:'Wallet', category:'security', categoryLabel:'Security / finance', sender:'Fraud prevention', text:'An unauthorized €8,400 transfer is leaving your account now. Freeze it within two minutes to stop the loss; after that the funds cannot be recovered.', icon:'wallet' },
  { app:'Mail', category:'work', categoryLabel:'Work / operational', sender:'Project notes', text:'The notes from today’s meeting are ready. Nothing needs your approval; read them when you have time.', icon:'mail' },
  { app:'Teams', category:'work', categoryLabel:'Work / operational', sender:'Incident response', text:'Ransomware is deleting production data and backups right now. You are the on-call owner. Isolate the affected servers immediately to prevent further permanent loss.', icon:'teams' },
  { app:'Messages', category:'messaging', categoryLabel:'Messaging / personal', sender:'Sam', text:'Would you like to get lunch this weekend? Reply whenever you have a moment.', icon:'messages' },
  { app:'Mail', category:'logistics', categoryLabel:'Logistics / transport', sender:'Travel update', text:'Your train leaves in eight minutes. The departure platform has changed to platform 12; go there now to board.', icon:'mail' },
  { app:'Instagram', category:'social', categoryLabel:'Social', sender:'Instagram', text:'Your weekly activity summary is ready. There is nothing you need to respond to.', icon:'instagram' },
  { app:'Teams', category:'work', categoryLabel:'Work / operational', sender:'Nora · Release team', text:'The release team is waiting for your approval. The deployment window closes in five minutes; without it, today’s launch will be postponed.', icon:'teams' },
  { app:'Wallet', category:'security', categoryLabel:'Security / finance', sender:'Payment receipt', text:'Your €4.80 coffee payment went through. This is your receipt; no action is needed.', icon:'wallet' },
  { app:'Messages', category:'messaging', categoryLabel:'Messaging / personal', sender:'Alex', text:'Our table will be released in ten minutes unless you confirm. Can you still make it?', icon:'messages' },
  { app:'Mail', category:'commercial', categoryLabel:'Commercial / promotional', sender:'New arrivals', text:'URGENT: this week’s new collection is here! Browse whenever you like; there is no deadline or reserved item.', icon:'mail' },
  { app:'Mail', category:'security', categoryLabel:'Security / finance', sender:'Account security', text:'An intruder has control of your account and is downloading your private documents now. Revoke the session immediately to stop further disclosure.', icon:'mail' },
  { app:'Teams', category:'work', categoryLabel:'Work / operational', sender:'Design team', text:'The new icon proposals are in the shared folder. Feedback is optional and can wait until next week.', icon:'teams' },
  { app:'Wallet', category:'security', categoryLabel:'Security / finance', sender:'Fraud prevention', text:'Confirmed fraud: someone is making repeated €2,000 withdrawals from your account right now. Freeze the card immediately to prevent further unrecoverable losses.', icon:'wallet' },
  { app:'Mail', category:'logistics', categoryLabel:'Logistics / transport', sender:'Delivery update', text:'Your parcel has arrived at the collection point. It will be kept there for seven days.', icon:'mail' },
  { app:'Messages', category:'messaging', categoryLabel:'Messaging / personal', sender:'Sam', text:'I found the book we talked about. I’ll bring it next time we meet; no need to reply.', icon:'messages' },
  { app:'Teams', category:'work', categoryLabel:'Work / operational', sender:'Payroll team', text:'Please review the payroll correction before tomorrow afternoon. Today’s payments are already safe; this can wait fifteen minutes.', icon:'teams' },
];
const modeNames={open:'Open',focused:'Focused',protected:'Protected'};
const modes=Object.keys(modeNames);
const modeDescription={open:'Useful notifications can reach you easily.',focused:'Only clearly important events break through.',protected:'A higher bar. Critical events can still reach you.'};
const outcomes={INTERRUPT:{title:'Interrupt',subtitle:'Delivered with an interruption',icon:'bell',className:'interrupt'},SILENT:{title:'Silent',subtitle:'Available now, without an interruption',icon:'quiet',className:'silent'},LATER:{title:'Later',subtitle:'Kept for when you have room',icon:'clock',className:'later'}};
let index=-1, context={mode:'open',interruptions:0}, decisionFrameOne=null, decisionFrameTwo=null, decisionRevealTimer=null, isSending=false, isProcessing=false, processingTimer=null;
const corrections=new Map(), feedback=new Map();
const result=()=>index<0?null:decide(assessment.estimates,context,corrections.get(examples[index].category)||0);
const fmt=n=>Number.isFinite(n)?n.toFixed(2):'—';
const signed=n=>`${n<0?'−':'+'}${fmt(Math.abs(n))}`;

function failureMessage(code){
  return ({invalid_credentials:'Enter a 32-character Account ID and a Workers AI API token.',invalid_request:'Please check the connection details and try again.',request_rejected:'This connection request was blocked. Refresh the page and try again.',credentials_rejected:'Cloudflare rejected the connection. Check your Account ID and Workers AI token permission.',rate_limited:'Cloudflare usage or rate limit reached. Please try again later.',deadline_exceeded:'Cloudflare did not answer within the time limit. Please try again.',invalid_response:'Cloudflare returned an assessment we could not validate.',service_unavailable:'Cloudflare could not be reached. Please try again.'})[code]||'The assessment is unavailable. Your notification stays available quietly.';
}
function wipeFields(){ $('af-account').value='';$('af-token').value='';$('af-token').type='password';$('af-show').setAttribute('aria-pressed','false');$('af-show').setAttribute('aria-label','Show token'); }
function connectionBusy(busy){
  connecting=busy;$('af-connect').disabled=busy;$('af-account').disabled=busy;$('af-token').disabled=busy;$('af-show').disabled=busy;
  $('af-button-label').textContent=busy?'Checking connection':'Connect & enter demo';$('af-checking').hidden=!busy;$('af-arrow').style.display=busy?'none':'';$('connection-cancel').hidden=!busy;
  $('af-entry').setAttribute('aria-busy',String(busy));
}
function disconnect(){
  sessionGeneration++;connection.disconnect();wipeFields();connectionBusy(false);
  clearTimeout(processingTimer);clearTimeout(decisionRevealTimer);cancelAnimationFrame(decisionFrameOne);cancelAnimationFrame(decisionFrameTwo);
  document.getAnimations?.().forEach(animation=>animation.cancel());
  index=-1;context={mode:'open',interruptions:0};assessment={status:'pending',estimates:null,error:null,provider_ms:null};isSending=false;isProcessing=false;corrections.clear();feedback.clear();
  $('decision-panel').classList.remove('is-revealing');$('decision-result').classList.remove('is-arriving');
  for(const id of ['sender','message','app-name','category','urgency-score','importance-score','worth-score','baseline-score','pressure-score','threshold-score','reason','policy-path','feedback-confirmation'])$(id).textContent='';
  $('explanation').open=false;$('mode-options').hidden=true;$('attention-mode').setAttribute('aria-expanded','false');
  $('connection-screen').hidden=false;$('demo-screen').hidden=true;$('demo-screen').inert=true;$('disconnect').hidden=true;$('connection-label').textContent='Session only';$('assessment-notice').hidden=true;$('connection-error').hidden=true;
  render();
}
$('af-show').addEventListener('click',()=>{const show=$('af-token').type==='password';$('af-token').type=show?'text':'password';$('af-show').setAttribute('aria-pressed',String(show));$('af-show').setAttribute('aria-label',show?'Hide token':'Show token');});
$('af-form').addEventListener('submit',async event=>{
  event.preventDefault();if(connecting)return;
  let account=$('af-account').value.trim(),token=$('af-token').value.trim();
  $('connection-error').hidden=true;
  if(!/^[a-fA-F0-9]{32}$/.test(account)||!/^\S{16,512}$/.test(token)){$('connection-error').textContent=failureMessage('invalid_credentials');$('connection-error').hidden=false;token=null;account=null;return;}
  wipeFields();connectionBusy(true);const generation=++sessionGeneration;
  try{
    await connection.connect(account,token);if(generation!==sessionGeneration)return;
    connectionBusy(false);$('connection-screen').hidden=true;$('demo-screen').hidden=false;$('demo-screen').inert=false;$('disconnect').hidden=false;$('connection-label').textContent='Clef-flash · connected';
    playAndRelease($('demo-screen'),matchMedia('(prefers-reduced-motion: reduce)').matches?[{opacity:0},{opacity:1}]:[{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:matchMedia('(prefers-reduced-motion: reduce)').matches?120:420,easing:'cubic-bezier(.23,1,.32,1)',fill:'both'});
    render();$('next').focus();$('screen-reader-status').textContent='Connected to Clef-flash. Send your first notification.';
  }catch(error){if(generation!==sessionGeneration)return;connectionBusy(false);$('connection-error').textContent=failureMessage(error.message);$('connection-error').hidden=false;$('af-account').focus();}
  finally{account=null;token=null;}
});
$('disconnect').addEventListener('click',()=>{disconnect();$('af-account').focus();$('screen-reader-status').textContent='Disconnected. Credentials and session state cleared.';});
$('connection-cancel').addEventListener('click',()=>{disconnect();$('af-account').focus();});
addEventListener('pagehide',disconnect);
addEventListener('pageshow',event=>{if(event.persisted)disconnect();wipeFields();});
wipeFields();

function render(){
  const hasNotification=index>=0;
  $('mode-label').textContent=modeNames[context.mode];$('mode-description').textContent=modeDescription[context.mode];$('attention-mode').setAttribute('aria-label',`Your attention: ${modeNames[context.mode]}`);document.querySelectorAll('.mode-option').forEach(option=>option.setAttribute('aria-selected',String(option.dataset.mode===context.mode)));$('mode-marker').dataset.mode=context.mode;
  [1,2,3].forEach((offset,position)=>{const item=examples[(index+offset)%examples.length],slot=['front','middle','back'][position];$(`queue-${slot}-icon`).src=iconURL(item.icon);$(`queue-${slot}-app`).textContent=item.app.toUpperCase();$(`queue-${slot}-message`).textContent=item.text;});
  const busy=isSending||isProcessing;
  $('empty-state').hidden=hasNotification;$('decision-band').hidden=!hasNotification;$('notification-space').hidden=!hasNotification;$('explanation').hidden=!hasNotification||busy;
  const feedbackUnavailable=!hasNotification||busy;
  $('feedback').classList.toggle('is-unavailable',feedbackUnavailable);$('feedback').inert=feedbackUnavailable;$('feedback').setAttribute('aria-hidden',String(feedbackUnavailable));
  $('decision-panel').setAttribute('aria-busy',String(busy));$('next').disabled=busy||!connection.connected;
  if(!hasNotification){$('arrival-status').textContent=isSending?'Sending':'Waiting for notification';return;}
  const e=examples[index],scores=assessment.estimates,d=result(),vote=feedback.get(index),outcome=outcomes[d.action];
  $('app-icon').src=iconURL(e.icon);$('app-name').textContent=e.app;$('sender').textContent=e.sender;$('message').textContent=e.text;$('category').textContent=e.categoryLabel;
  $('decision-band').className=`decision-band ${isProcessing?'processing':outcome.className}${d.critical&&!isProcessing?' critical':''}`;$('decision-result').hidden=isProcessing;$('processing-state').hidden=!isProcessing;$('decision-title').textContent=outcome.title;$('decision-subtitle').textContent=d.critical?'Critical alert · delivered now':assessment.status!=='ok'&&!isProcessing?'Assessment unavailable · delivered quietly':outcome.subtitle;$('decision-tag').hidden=!d.critical;$('decision-tag').textContent=d.critical?'CRITICAL':'';$('arrival-status').textContent=isSending?'Sending':isProcessing?'Assessing':'Decision ready';
  $('context-summary').textContent=`${modeNames[context.mode]} · ${context.interruptions} session interruption${context.interruptions===1?'':'s'}`;
  let reason;
  if(!scores)reason='The model assessment was unavailable. This notification stays available quietly. No urgency, importance or interruption probability has been invented.';
  else if(d.critical)reason='Both urgency and importance meet the narrow critical limit. This event can interrupt even in Protected mode, regardless of the usual interruption threshold.';
  else if(d.action==='LATER')reason='This event has low estimated urgency and importance. It is kept for later, without interrupting you. Nothing is discarded.';
  else if(d.action==='SILENT')reason='This is useful information, but it does not clear the interruption bar for your attention mode and recent interruption load. It is delivered quietly.';
  else reason='The event clears the interruption bar for your attention mode and recent interruption load. It is delivered now with an interruption.';
  $('reason').textContent=reason;$('override-note').hidden=!d.critical;$('override-note').textContent='Critical exception: urgency ≥ 0.75 AND importance ≥ 0.95. Both conditions must hold.';
  $('urgency-score').textContent=fmt(scores?.urgency);$('importance-score').textContent=fmt(scores?.importance);$('worth-score').textContent=fmt(scores?.interrupt_worthy);$('baseline-score').textContent=fmt(d.baseline);$('pressure-score').textContent=signed(d.interruptionPressure);$('calibration-row').hidden=!d.calibration;$('calibration-score').textContent=signed(d.calibration);$('threshold-score').textContent=fmt(d.threshold);
  $('policy-path').textContent=!scores?'MODEL_UNAVAILABLE → SILENT (no estimates)':d.critical?'Critical override → INTERRUPT':d.action==='INTERRUPT'?`${fmt(scores?.interrupt_worthy)} ≥ ${fmt(d.threshold)} → INTERRUPT`:d.action==='SILENT'?`${fmt(scores?.interrupt_worthy)} < ${fmt(d.threshold)}; urgency or importance ≥ 1/3 → SILENT`:`${fmt(scores?.interrupt_worthy)} < ${fmt(d.threshold)}; urgency and importance < 1/3 → LATER`;
  $('feedback-change-label').textContent=d.critical?'Question this call':d.action==='INTERRUPT'?'Keep it quiet':'Should interrupt';
  $('feedback-confirmation').hidden=!vote;$('feedback-reset').hidden=!vote;$('feedback-confirmation').textContent=vote?.message||'';$('feedback-yes').disabled=!!vote||!scores;$('feedback-change').disabled=!!vote||!scores;
  $('technical-note').textContent=assessment.status==='ok'?`Clef-flash · af-eval-0.2. Provider time: ${Math.round(assessment.provider_ms)} ms. Feedback adjusts policy only for this session.`:'Model unavailable. No estimates. '+failureMessage(assessment.error);
  $('assessment-notice').hidden=assessment.status==='ok'||isProcessing;
  $('assessment-notice').textContent=assessment.status==='ok'?'':failureMessage(assessment.error);
}
function revealDecision(){
  const band=$('decision-band'),resultElement=$('decision-result'),panel=$('decision-panel');
  cancelAnimationFrame(decisionFrameOne);cancelAnimationFrame(decisionFrameTwo);clearTimeout(decisionRevealTimer);
  band.classList.add('is-revealing');panel.classList.add('is-revealing');resultElement.classList.add('is-arriving');
  decisionFrameOne=requestAnimationFrame(()=>{decisionFrameTwo=requestAnimationFrame(()=>resultElement.classList.remove('is-arriving'));});
  decisionRevealTimer=setTimeout(()=>{band.classList.remove('is-revealing');panel.classList.remove('is-revealing');},250);
}
function setMode(mode){
  if(!modes.includes(mode))throw new Error('Invalid attention mode');
  context={...context,mode};render();$('screen-reader-status').textContent=`${modeNames[mode]} attention. ${isSending?'Sending notification.':index<0?'Send your first notification using the button above.':isProcessing?'Assessing notification.':outcomes[result().action].title+'.'}`;
}

// A single handoff: keep the departing content intact until it has left,
// then advance the queue and receive that same event in the central stage.
function motion(element,keyframes,options){
  if(typeof element.animate!=='function')return null;
  return element.animate(keyframes,options);
}
function playAndRelease(element,keyframes,options){
  const animation=motion(element,keyframes,options);
  animation?.finished.then(()=>animation.cancel(),()=>animation.cancel());
}
function queuePose(element){
  return {x:element.offsetLeft,y:element.offsetTop,transform:getComputedStyle(element).transform};
}
function promoteQueue(cards,poses,reduced){
  cards.forEach((card,i)=>{
    const destination=queuePose(card);
    const source=poses[i+1];
    const from=source
      ? `translate(${source.x-destination.x}px,${source.y-destination.y}px) ${source.transform}`
      : `translateY(-8px) ${destination.transform} scale(.95)`;
    playAndRelease(card,reduced?[{opacity:i===2?0:1},{opacity:1}]:[
      {transform:from,opacity:i===2?0:1},
      {transform:destination.transform,opacity:1}
    ],{duration:reduced?100:420,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'});
  });
}
function queueDepartureFrames(card,pose){
  // Sample the sketch's rightward sweep and downward bend. Rotation follows
  // the curve's tangent, relative to the card's existing angle at departure.
  const width=card.offsetWidth||158;
  const p1={x:width*.48,y:-width*.07},p2={x:width*.63,y:-width*.08},p3={x:width*.74,y:width*.40};
  const startAngle=Math.atan2(p1.y,p1.x);
  return Array.from({length:25},(_,i)=>{
    const t=i/24,u=1-t;
    const x=3*u*u*t*p1.x+3*u*t*t*p2.x+t*t*t*p3.x;
    const y=3*u*u*t*p1.y+3*u*t*t*p2.y+t*t*t*p3.y;
    const dx=3*u*u*p1.x+6*u*t*(p2.x-p1.x)+3*t*t*(p3.x-p2.x);
    const dy=3*u*u*p1.y+6*u*t*(p2.y-p1.y)+3*t*t*(p3.y-p2.y);
    const angle=(Math.atan2(dy,dx)-startAngle)*180/Math.PI;
    return {offset:t,transform:`translate(${x.toFixed(3)}px,${y.toFixed(3)}px) ${pose.transform} rotate(${angle.toFixed(3)}deg) scale(${1+.09*t})`,opacity:1-t*t,filter:`blur(${(7*Math.pow(t,1.7)).toFixed(3)}px)`};
  });
}
async function sendNext(){
  if(isSending||isProcessing||!connection.connected)return;
  const generation=sessionGeneration;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cards=['front','middle','back'].map(slot=>$(`queue-${slot}`));
  const poses=cards.map(queuePose),hadNotification=index>=0;
  const previousInterrupted=result()?.action==='INTERRUPT';
  cancelAnimationFrame(decisionFrameOne);cancelAnimationFrame(decisionFrameTwo);clearTimeout(decisionRevealTimer);
  $('decision-panel').classList.remove('is-revealing');$('decision-result').classList.remove('is-arriving');
  isSending=true;$('explanation').open=false;render();
  $('screen-reader-status').textContent=`Sending ${examples[(index+1)%examples.length].app} notification.`;
  const departure=motion(cards[0],reduced?[{opacity:1},{opacity:0}]:queueDepartureFrames(cards[0],poses[0]),
    {duration:reduced?100:440,easing:'cubic-bezier(.4,0,.7,1)',fill:'forwards'});
  const departingStage=motion(hadNotification?$('notification'):$('empty-state'),
    reduced?[{opacity:1},{opacity:0}]:[{opacity:1,transform:'translateY(0) scale(1)'},{opacity:0,transform:'translateY(8px) scale(.985)'}],
    {duration:reduced?100:180,easing:'ease-out',fill:'forwards'});
  departingStage?.finished.catch(()=>{});
  // Browser cancellation and missing animation support must still deliver once.
  if(departure)await departure.finished.catch(()=>{});
  if(generation!==sessionGeneration){departure?.cancel();departingStage?.cancel();return;}
  if(previousInterrupted)context={...context,interruptions:Math.min(20,context.interruptions+1)};
  index=(index+1)%examples.length;assessment={status:'pending',estimates:null,error:null,provider_ms:null};isSending=false;isProcessing=true;render();
  departure?.cancel();departingStage?.cancel();
  promoteQueue(cards,poses,reduced);
  playAndRelease($('notification'),reduced?[{opacity:0},{opacity:1}]:[
    {opacity:0,transform:'translateY(-18px) scale(.985)',filter:'blur(1.5px)',offset:0},
    {opacity:1,transform:'translateY(0) scale(1)',filter:'blur(0px)',offset:1}
  ],{duration:reduced?120:680,easing:'cubic-bezier(.25,.1,.25,1)',fill:'both'});
  const e=examples[index],now=new Date().toISOString();
  const state={notification:{category:e.category,source:e.app,text:e.text,received_at:now},evaluated_at:now};
  $('notification-time').textContent='now';
  try{assessment=await connection.assess(state,{mode:context.mode,interruptions:context.interruptions},corrections.get(e.category)||0);}
  catch(error){if(generation!==sessionGeneration)return;assessment={status:'provider_error',estimates:null,error:error.message,provider_ms:null};}
  if(generation!==sessionGeneration)return;
  isProcessing=false;render();if(!reduced)revealDecision();$('screen-reader-status').textContent=`${examples[index].app}. ${outcomes[result().action].title}.`;
}
const modeTrigger=$('attention-mode'),modeOptions=$('mode-options'),modeChoices=[...document.querySelectorAll('.mode-option')];
function openModeMenu(focusIndex){modeOptions.hidden=false;modeTrigger.setAttribute('aria-expanded','true');const index=focusIndex??Math.max(0,modes.indexOf(context.mode));modeChoices[index].focus();}
function closeModeMenu(returnFocus=false){modeOptions.hidden=true;modeTrigger.setAttribute('aria-expanded','false');if(returnFocus)modeTrigger.focus();}
modeTrigger.addEventListener('click',()=>modeOptions.hidden?openModeMenu():closeModeMenu());
modeChoices.forEach(option=>option.addEventListener('click',()=>{setMode(option.dataset.mode);closeModeMenu(true);}));
modeTrigger.addEventListener('keydown',event=>{if(['ArrowDown','ArrowUp','Enter',' '].includes(event.key)){event.preventDefault();openModeMenu(event.key==='ArrowUp'?modes.indexOf(context.mode):undefined);}});
modeOptions.addEventListener('keydown',event=>{let i=modeChoices.indexOf(document.activeElement);if(event.key==='Escape'){event.preventDefault();closeModeMenu(true);}else if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();i=(i+(event.key==='ArrowDown'?1:-1)+modeChoices.length)%modeChoices.length;modeChoices[i].focus();}else if(event.key==='Home'||event.key==='End'){event.preventDefault();modeChoices[event.key==='Home'?0:modeChoices.length-1].focus();}else if(event.key==='Tab'){setTimeout(()=>{if(!document.getElementById('attention-picker').contains(document.activeElement))closeModeMenu();},0);}});
document.addEventListener('pointerdown',event=>{if(!event.target.closest('#attention-picker')&&!modeOptions.hidden)closeModeMenu();});
$('next').addEventListener('click',()=>sendNext());
$('feedback-yes').addEventListener('click',()=>{if(feedback.has(index))return;feedback.set(index,{message:'Noted. The policy stays as it is for this notification.',changed:false});render();});
$('feedback-change').addEventListener('click',()=>{
  if(feedback.has(index)||!assessment.estimates)return;const e=examples[index],scores=assessment.estimates,d=result(),old=corrections.get(e.category)||0;
  if(d.critical){feedback.set(index,{message:'Concern noted. The critical exception stays in place.',changed:false});render();return;}
  const desired=d.action==='INTERRUPT'?scores.interrupt_worthy+.04:scores.interrupt_worthy-.01;
  const adjustment=desired-(d.baseline+d.interruptionPressure);
  corrections.set(e.category,Math.max(-1,Math.min(1,adjustment)));
  feedback.set(index,{changed:true,previous:old,message:`Correction applied for ${e.categoryLabel.toLowerCase()} in this session. Policy adjustment only; model estimates are unchanged.`});render();
});
$('feedback-reset').addEventListener('click',()=>{const vote=feedback.get(index);if(vote?.changed)corrections.set(examples[index].category,vote.previous);feedback.delete(index);render();});
render();

// Same action as the visible categorical control; no hidden activity controls.
const lifecycle=new AbortController();
if(document.modelContext?.registerTool){
  const tool={name:'set_attention_mode',title:'Set attention mode',description:'Set Open, Focused, or Protected in the Attention Firewall demo. Returns the current decision, or a waiting state before the first notification is sent.',inputSchema:{type:'object',properties:{mode:{type:'string',enum:modes}},required:['mode'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>k!=='mode')||!modes.includes(input.mode))throw new Error('Invalid input');setMode(input.mode);return{notification:index<0?null:index+1,mode:context.mode,...result(),status:isSending?'sending':index<0?'waiting':isProcessing?'processing':'ready',simulated:false,connected:connection.connected};}};
  try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}
  addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}

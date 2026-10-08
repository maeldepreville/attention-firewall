import { decide } from './policy.mjs';
const $ = id => document.getElementById(id);
const iconURL = name => new URL(`./assets/${name}.jpg`, document.baseURI).href;
const FAKE_ENGINE_DELAY_MS = 1350;

const report = { app:'Teams', category:'work', categoryLabel:'Work / operational', sender:'Nora · Project team', text:'Could you review the release plan before our 3 pm meeting?', icon:'teams', urgency:.56, importance:.78, interrupt_worthy:.70 };
const examples = [
  { app:'Messages', category:'messaging', categoryLabel:'Messaging / personal', sender:'Alex', text:'I’m downstairs. Can you let me in?', icon:'messages', urgency:.96, importance:.84, interrupt_worthy:.91 },
  { app:'Mail', category:'commercial', categoryLabel:'Commercial / promotional', sender:'Weekend offers', text:'Last chance! Your exclusive 20% discount ends tonight.', icon:'mail', urgency:.15, importance:.10, interrupt_worthy:.08 },
  { app:'Wallet', category:'security', categoryLabel:'Security / finance', sender:'Your bank', text:'Your monthly account statement is ready to view.', icon:'wallet', urgency:.14, importance:.65, interrupt_worthy:.24 },
  report,
  { app:'Messages', category:'logistics', categoryLabel:'Logistics / transport', sender:'Your driver', text:'I’m at your door with your parcel. Please come down to collect it.', icon:'messages', urgency:.97, importance:.90, interrupt_worthy:.95 },
  { app:'Instagram', category:'social', categoryLabel:'Social', sender:'Jamie', text:'I posted the photos from our weekend. You’re in a few of them!', icon:'instagram', urgency:.30, importance:.60, interrupt_worthy:.63 },
  { app:'Wallet', category:'security', categoryLabel:'Security / finance', sender:'Card security', text:'Suspicious card activity detected. Confirm whether this payment was yours.', icon:'wallet', urgency:.98, importance:.98, interrupt_worthy:.97 },
  { ...report, sender:'Nora · Reminder' },
];
const modeNames={open:'Open',focused:'Focused',protected:'Protected'};
const modes=Object.keys(modeNames);
const modeDescription={open:'Useful notifications can reach you easily.',focused:'Only clearly important events break through.',protected:'A higher bar. Critical events can still reach you.'};
const outcomes={INTERRUPT:{title:'Interrupt',subtitle:'Delivered with an interruption',icon:'bell',className:'interrupt'},SILENT:{title:'Silent',subtitle:'Available now, without an interruption',icon:'quiet',className:'silent'},LATER:{title:'Later',subtitle:'Kept for when you have room',icon:'clock',className:'later'}};
let index=-1, context={mode:'open',activity:'free',interruptions:0}, decisionFrameOne=null, decisionFrameTwo=null, decisionRevealTimer=null, isSending=false, isProcessing=false, processingTimer=null;
const corrections=new Map(), feedback=new Map();
const result=()=>index<0?null:decide(examples[index],context,corrections.get(examples[index].category)||0);
const fmt=n=>n.toFixed(2);
const signed=n=>`${n<0?'−':'+'}${fmt(Math.abs(n))}`;

function render(){
  const hasNotification=index>=0;
  $('mode-label').textContent=modeNames[context.mode];$('mode-description').textContent=modeDescription[context.mode];$('attention-mode').setAttribute('aria-label',`Your attention: ${modeNames[context.mode]}`);document.querySelectorAll('.mode-option').forEach(option=>option.setAttribute('aria-selected',String(option.dataset.mode===context.mode)));$('mode-marker').dataset.mode=context.mode;
  [1,2,3].forEach((offset,position)=>{const item=examples[(index+offset)%examples.length],slot=['front','middle','back'][position];$(`queue-${slot}-icon`).src=iconURL(item.icon);$(`queue-${slot}-app`).textContent=item.app.toUpperCase();$(`queue-${slot}-message`).textContent=item.text;});
  const busy=isSending||isProcessing;
  $('empty-state').hidden=hasNotification;$('decision-band').hidden=!hasNotification;$('notification-space').hidden=!hasNotification;$('explanation').hidden=!hasNotification||busy;
  const feedbackUnavailable=!hasNotification||busy;
  $('feedback').classList.toggle('is-unavailable',feedbackUnavailable);$('feedback').inert=feedbackUnavailable;$('feedback').setAttribute('aria-hidden',String(feedbackUnavailable));
  $('decision-panel').setAttribute('aria-busy',String(busy));$('next').disabled=busy;
  if(!hasNotification){$('arrival-status').textContent=isSending?'Sending':'Waiting for notification';return;}
  const e=examples[index],d=result(),vote=feedback.get(index),outcome=outcomes[d.action];
  $('app-icon').src=iconURL(e.icon);$('app-name').textContent=e.app;$('sender').textContent=e.sender;$('message').textContent=e.text;$('category').textContent=e.categoryLabel;
  $('decision-band').className=`decision-band ${isProcessing?'processing':outcome.className}${d.critical&&!isProcessing?' critical':''}`;$('decision-result').hidden=isProcessing;$('processing-state').hidden=!isProcessing;$('decision-title').textContent=outcome.title;$('decision-subtitle').textContent=d.critical?'Critical alert · delivered now':outcome.subtitle;$('decision-tag').hidden=!d.critical;$('decision-tag').textContent=d.critical?'CRITICAL':'';$('arrival-status').textContent=isSending?'Sending':isProcessing?'Assessing':'Decision ready';
  $('context-summary').textContent=`${modeNames[context.mode]} · ${context.interruptions} recent interruption${context.interruptions===1?'':'s'}`;
  let reason;
  if(d.critical)reason='Both urgency and importance meet the narrow critical limit. This event can interrupt even in Protected mode, regardless of the usual interruption threshold.';
  else if(d.action==='LATER')reason='This event has low estimated urgency and importance. It is kept for later, without interrupting you. Nothing is discarded.';
  else if(d.action==='SILENT')reason='This is useful information, but it does not clear the interruption bar for your attention mode and recent interruption load. It is delivered quietly.';
  else reason='The event clears the interruption bar for your attention mode and recent interruption load. It is delivered now with an interruption.';
  $('reason').textContent=reason;$('override-note').hidden=!d.critical;$('override-note').textContent='Critical exception: urgency ≥ 0.95 AND importance ≥ 0.95. Both conditions must hold.';
  $('urgency-score').textContent=fmt(e.urgency);$('importance-score').textContent=fmt(e.importance);$('worth-score').textContent=fmt(e.interrupt_worthy);$('baseline-score').textContent=fmt(d.baseline);$('pressure-score').textContent=signed(d.interruptionPressure);$('calibration-row').hidden=!d.calibration;$('calibration-score').textContent=signed(d.calibration);$('threshold-score').textContent=fmt(d.threshold);
  $('policy-path').textContent=d.critical?'Critical override → INTERRUPT':d.action==='INTERRUPT'?`${fmt(e.interrupt_worthy)} ≥ ${fmt(d.threshold)} → INTERRUPT`:d.action==='SILENT'?`${fmt(e.interrupt_worthy)} < ${fmt(d.threshold)}; urgency or importance ≥ 0.50 → SILENT`:`${fmt(e.interrupt_worthy)} < ${fmt(d.threshold)}; urgency and importance < 0.50 → LATER`;
  $('feedback-change-label').textContent=d.critical?'Question this call':d.action==='INTERRUPT'?'Keep it quiet':'Should interrupt';
  $('feedback-confirmation').hidden=!vote;$('feedback-reset').hidden=!vote;$('feedback-confirmation').textContent=vote?.message||'';$('feedback-yes').disabled=!!vote;$('feedback-change').disabled=!!vote;
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
  if(isSending||isProcessing)return;
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
  if(previousInterrupted)context={...context,interruptions:Math.min(20,context.interruptions+1)};
  index=(index+1)%examples.length;isSending=false;isProcessing=true;render();
  departure?.cancel();departingStage?.cancel();
  promoteQueue(cards,poses,reduced);
  playAndRelease($('notification'),reduced?[{opacity:0},{opacity:1}]:[
    {opacity:0,transform:'translateY(-18px) scale(.985)',filter:'blur(1.5px)',offset:0},
    {opacity:1,transform:'translateY(0) scale(1)',filter:'blur(0px)',offset:1}
  ],{duration:reduced?120:680,easing:'cubic-bezier(.25,.1,.25,1)',fill:'both'});
  clearTimeout(processingTimer);processingTimer=setTimeout(()=>{isProcessing=false;render();if(!reduced)revealDecision();$('screen-reader-status').textContent=`${examples[index].app}. ${outcomes[result().action].title}.`;},FAKE_ENGINE_DELAY_MS);
  $('screen-reader-status').textContent=`Notification ${index+1} of ${examples.length}. ${examples[index].app}. Assessing notification.`;
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
  if(feedback.has(index))return;const e=examples[index],d=result(),old=corrections.get(e.category)||0;
  if(d.critical){feedback.set(index,{message:'Concern noted. The critical exception stays in place.',changed:false});render();return;}
  const desired=d.action==='INTERRUPT'?e.interrupt_worthy+.04:e.interrupt_worthy-.01;
  const adjustment=desired-(d.baseline+d.interruptionPressure);
  corrections.set(e.category,adjustment);
  feedback.set(index,{changed:true,previous:old,message:`Correction applied for ${e.categoryLabel.toLowerCase()} in this session. Simulated calibration only.`});render();
});
$('feedback-reset').addEventListener('click',()=>{const vote=feedback.get(index);if(vote?.changed)corrections.set(examples[index].category,vote.previous);feedback.delete(index);render();});
render();

// Same action as the visible categorical control; no hidden activity controls.
const lifecycle=new AbortController();
if(document.modelContext?.registerTool){
  const tool={name:'set_attention_mode',title:'Set attention mode',description:'Set Open, Focused, or Protected in the simulated Attention Firewall demo. Returns the current decision, or a waiting state before the first notification is sent.',inputSchema:{type:'object',properties:{mode:{type:'string',enum:modes}},required:['mode'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>k!=='mode')||!modes.includes(input.mode))throw new Error('Invalid input');setMode(input.mode);return{notification:index<0?null:index+1,mode:context.mode,...result(),status:isSending?'sending':index<0?'waiting':isProcessing?'processing':'ready',simulated:true};}};
  try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}
  addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}

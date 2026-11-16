/* Ricomponi: pezzi da rimettere al posto, con tocco o trascinamento. */
import {$,shuffle} from './util.js';
import {app,S,bone,save,touchStreak,head,bump} from './state.js';
import {gEl,clearMarks,refreshMastery,boneAt} from './figure.js';
import {gh,endGame} from './game.js';

function thumb(id){
 const b=bone(id),bb=gEl(id).firstElementChild.getBBox(),s=Math.max(bb.width,bb.height)+16;
 return `<svg viewBox="${bb.x+bb.width/2-s/2} ${bb.y+bb.height/2-s/2} ${s} ${s}"><g class="bone m0">${b.s}</g></svg>`;
}
export function startPuzzle(){
 const G=app.G;
 clearMarks();
 G.left=shuffle(app.B).slice(0,app.MOD.id==='corpo'?8:6).map(b=>b.id);G.total=G.left.length;G.sel=null;
 G.left.forEach(id=>gEl(id).classList.add('ghost'));
 puzzlePanel('Tocca (o trascina) un pezzo e portalo sul punto giusto della figura.');
}
function puzzlePanel(msg){
 const G=app.G;
 $('panel').innerHTML=gh()+`<div class="fb">${msg||''}</div><div class="tray">`+G.left.map(id=>`<div class="pc${G.sel===id?' on':''}" data-id="${id}">${thumb(id)}${bone(id).n}</div>`).join('')+'</div>';
}
export function placeAttempt(tid){
 const G=app.G;
 if(!G.sel||G.locked)return;
 const pid=G.sel,ok=tid===pid;G.att++;touchStreak();
 if(ok){
  const g=gEl(pid);g.classList.remove('ghost');g.classList.add('ok');setTimeout(()=>g.classList.remove('ok'),700);
  G.left=G.left.filter(x=>x!==pid);G.sel=null;G.score++;G.q=G.score;G.gain+=10;S.xp+=10;S.ok++;bump(pid,1);
  save();head();refreshMastery();
  if(!G.left.length)return endGame();
  puzzlePanel(`✅ <b>${bone(pid).n}</b> – ${bone(pid).f}`);
 }else{
  const g=gEl(tid);g.classList.add('bad');setTimeout(()=>g.classList.remove('bad'),600);
  G.hearts--;S.ko++;bump(pid,-1);save();head();refreshMastery();
  if(G.hearts<=0)return endGame();
  puzzlePanel(`❌ Non è qui: quello è <b>${bone(tid).n}</b>. Riprova.`);
 }
}
// Tra strutture sovrapposte vince il posto vuoto del pezzo in mano, poi un altro posto vuoto:
// così si possono rimettere anche i pezzi che stanno sotto altri (vertebre sotto lo sterno, bacino sotto il sacro).
export const pickSlot=gs=>gs.find(g=>g.dataset.id===app.G.sel)||gs.find(g=>g.classList.contains('ghost'))||gs[0];
let drag=null;
$('panel').addEventListener('pointerdown',e=>{
 const G=app.G;
 const pc=e.target.closest('.pc');if(!pc||!G||G.mode!=='puzzle'||G.locked)return;
 drag={id:pc.dataset.id,x:e.clientX,y:e.clientY,el:null};G.sel=drag.id;
 document.querySelectorAll('.pc').forEach(p=>p.classList.toggle('on',p===pc));
 try{pc.setPointerCapture(e.pointerId);}catch(_){}
});
$('panel').addEventListener('pointermove',e=>{
 if(!drag)return;
 if(!drag.el&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>8){const f=document.createElement('div');f.id='flt';f.innerHTML=thumb(drag.id);document.body.appendChild(f);drag.el=f;}
 if(drag.el){drag.el.style.left=(e.clientX-28)+'px';drag.el.style.top=(e.clientY-70)+'px';
  document.querySelectorAll('.bone.hov').forEach(x=>x.classList.remove('hov'));const hb=boneAt(e.clientX,e.clientY-42,pickSlot);if(hb)hb.classList.add('hov');}
});
$('panel').addEventListener('pointerup',e=>{
 if(!drag)return;const d=drag;drag=null;
 if(d.el){d.el.remove();document.querySelectorAll('.bone.hov').forEach(x=>x.classList.remove('hov'));const g=boneAt(e.clientX,e.clientY-42,pickSlot);if(g)placeAttempt(g.dataset.id);}
});
$('panel').addEventListener('pointercancel',()=>{if(drag&&drag.el)drag.el.remove();drag=null;});

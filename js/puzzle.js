/* Ricomponi: pezzi da rimettere al posto, con tocco o trascinamento.
   Ossa singole: i pezzi sono le ossa di un gruppo (mano, colonna, cranio…), con la figura ingrandita su quella zona.
   Gruppi: i pezzi sono gruppi interi. Si gioca nella vista attuale; cranio, mano e piede si giocano nella loro vista
   (laterale, palmare, dall'alto: `zv` del gruppo), che si può cambiare dal menu delle viste. */
import {$,shuffle,pick} from './util.js';
import {app,S,bone,save,touchStreak,head,bump,members,itemOf} from './state.js';
import {els,clearMarks,refreshMastery,slotAt,svgEl,visible,visibleIn,focusItem,resetZoom,setView,hasView} from './figure.js';
import {gh,endGame} from './game.js';

// Il pezzo è la sagoma intera del lato destro (sf), anche delle parti coperte da altre ossa: una costa si vede intera.
// Riquadro del pezzo: dalla sagoma intera (sb) se c'è, altrimenti dal primo tracciato disegnato.
const box=id=>{let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;const v=app.view;
 const add=(x,y,w,h)=>{x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x+w);y1=Math.max(y1,y+h);};
 for(const m of members(id)){const sb=bone(m)?.sb?.[v];if(sb)add(...sb);}
 if(x0===Infinity)for(const g of els(id,true)){const b=(g.querySelector('.f')||g).getBBox();add(b.x,b.y,b.width,b.height);}
 return {x:x0,y:y0,w:x1-x0,h:y1-y0};};
const thumbSide=id=>{const b=box(id);return Math.max(b.w,b.h)*1.15+2;};
function thumb(id){
 const b=box(id),s=thumbSide(id),v=app.view;
 const inner=members(id).map(m=>{const x=bone(m),sh=x&&(x.sf[v]||x.s1[v]);return sh?`<g class="bone m0"${x.col?` style="--b:${x.col}"`:''}>${sh}</g>`:'';}).join('');
 return `<svg viewBox="${b.x+b.w/2-s/2} ${b.y+b.h/2-s/2} ${s} ${s}">${inner}</svg>`;
}
// Il pezzo trascinato ha la stessa scala della figura (con zoom compreso), così combacia con il suo posto.
const floatSize=id=>Math.max(36,Math.min(180,thumbSide(id)*svgEl().getScreenCTM().a));
export function startPuzzle(){
 const G=app.G;
 clearMarks();
 if(app.grp){
  G.left=shuffle(app.GR.filter(g=>!g.area&&visible(g.id))).slice(0,app.MOD.id==='corpo'?8:6).map(g=>g.id);resetZoom(true);
 }else{
  // un gruppo con almeno 3 pezzi visibili, nella sua vista di zona se ce l'ha (mano palmare, piede dall'alto…)
  // o in quella attuale; la figura si ingrandisce sulla zona
  const zv=g=>g.zv&&hasView(g.zv)?g.zv:app.view;
  const gs=app.GR.filter(g=>!g.area&&g.m.filter(m=>visibleIn(m,zv(g))).length>=3);
  const g=pick(gs.length?gs:app.GR);G.zone=G.focus=g.id;setView(zv(g),true);
  G.left=shuffle(g.m.filter(visible)).slice(0,8);setTimeout(()=>focusItem(g.id,10,true),30);
 }
 G.total=G.left.length;G.sel=null;
 G.left.forEach(id=>els(id).forEach(e=>e.classList.add('ghost')));
 puzzlePanel(app.grp?'Tocca (o trascina) un pezzo e portalo sul punto giusto della figura.':`Zona: <b>${bone(G.zone).n}</b>. Tocca (o trascina) un pezzo e portalo al suo posto.`);
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
  els(pid).forEach(g=>{g.classList.remove('ghost');g.classList.add('ok');setTimeout(()=>g.classList.remove('ok'),700);});
  G.left=G.left.filter(x=>x!==pid);G.sel=null;G.score++;G.q=G.score;G.gain+=10;S.xp+=10;S.ok++;bump(pid,1);
  save();head();refreshMastery();
  if(!G.left.length)return endGame();
  puzzlePanel(`✅ <b>${bone(pid).n}</b> – ${bone(pid).f}`);
 }else{
  els(tid).forEach(g=>{g.classList.add('bad');setTimeout(()=>g.classList.remove('bad'),600);});
  G.hearts--;S.ko++;bump(pid,-1);save();head();refreshMastery();
  if(G.hearts<=0)return endGame();
  puzzlePanel(`❌ Non è qui: quello è <b>${bone(tid)?bone(tid).n:'un\'altra struttura'}</b>. Riprova.`);
 }
}
// voce corrispondente all'elemento toccato o al posto vuoto trovato
const target=g=>g?itemOf(g.dataset.id):null;
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
 if(!drag.el&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>8){const f=document.createElement('div');f.id='flt';f.innerHTML=thumb(drag.id);drag.size=floatSize(drag.id);f.style.width=f.style.height=drag.size+'px';document.body.appendChild(f);drag.el=f;}
 // il centro del pezzo sta 42 px sopra il dito, che così non lo copre: è lì che verrà lasciato
 if(drag.el){drag.el.style.left=(e.clientX-drag.size/2)+'px';drag.el.style.top=(e.clientY-42-drag.size/2)+'px';
  document.querySelectorAll('.bone.hov').forEach(x=>x.classList.remove('hov'));const t=target(slotAt(e.clientX,e.clientY-42,app.G.sel));if(t)els(t,true).forEach(x=>x.classList.add('hov'));}
});
$('panel').addEventListener('pointerup',e=>{
 if(!drag)return;const d=drag;drag=null;
 if(d.el){d.el.remove();document.querySelectorAll('.bone.hov').forEach(x=>x.classList.remove('hov'));const t=target(slotAt(e.clientX,e.clientY-42,app.G.sel));if(t)placeAttempt(t);}
});
$('panel').addEventListener('pointercancel',()=>{if(drag&&drag.el)drag.el.remove();drag=null;});

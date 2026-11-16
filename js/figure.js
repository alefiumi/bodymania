/* Figura SVG: disegno, zoom e pan, marcature, origine e inserzione dei muscoli. */
import {$} from './util.js';
import {app,S,bone} from './state.js';

export function buildFig(){
 const {B,MODS,MOD,VB}=app;
 let h='';
 B.forEach(b=>{h+=`<g class="bone m0" data-id="${b.id}"${b.col?` style="--b:${b.col}"`:''}><g>${b.s}</g>${b.pair?`<g transform="translate(300 0) scale(-1 1)">${b.s}</g>`:''}</g>`;});
 const mods=Object.keys(MODS).map(k=>`<button data-mod="${k}" class="${k===MOD.id?'on':''}">${MODS[k].label}</button>`).join('');
 $('fig').innerHTML=`<div class="tbar"><div class="mods">${mods}</div><div class="zc"><button data-z="in" aria-label="Ingrandisci">＋</button><button data-z="out" aria-label="Riduci">－</button><button data-z="reset" aria-label="Vista intera">⟲</button></div></div><svg viewBox="${VB.x} ${VB.y} ${VB.w} ${VB.h}" role="img" aria-label="Figura anatomica"><defs><marker id="ar" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#7c3aed"/></marker></defs><g>${h}</g><g id="ov" pointer-events="none"></g></svg>`;
}
let tw=0;
export const svgEl=()=>$('fig').querySelector('svg');
export function svgPt(x,y){const s=svgEl(),p=s.createSVGPoint();p.x=x;p.y=y;return p.matrixTransform(s.getScreenCTM().inverse());}
function applyVB(){const s=svgEl(),VB=app.VB;if(s)s.setAttribute('viewBox',`${VB.x} ${VB.y} ${VB.w} ${VB.h}`);}
const clampT=t=>({...t,x:Math.max(0,Math.min(app.MOD.W-t.w,t.x)),y:Math.max(0,Math.min(app.MOD.H-t.h,t.y))});
export function setVB(t,anim){
 const id=++tw;t=clampT(t);
 if(!anim){app.VB=t;applyVB();return;}
 const s0={...app.VB},t0=performance.now();
 (function f(n){if(id!==tw)return;const k=Math.min(1,(n-t0)/260),e=k*(2-k);
  app.VB={x:s0.x+(t.x-s0.x)*e,y:s0.y+(t.y-s0.y)*e,w:s0.w+(t.w-s0.w)*e,h:s0.h+(t.h-s0.h)*e};applyVB();if(k<1)requestAnimationFrame(f);})(t0);
}
export const resetZoom=anim=>setVB({x:0,y:0,w:app.MOD.W,h:app.MOD.H},anim);
export function zoomAt(k,cx,cy){
 const {MOD,VB}=app;
 const w=Math.max(MOD.W/8,Math.min(MOD.W,VB.w/k)),h=w*MOD.H/MOD.W,fx=(cx-VB.x)/VB.w,fy=(cy-VB.y)/VB.h;
 setVB({x:cx-fx*w,y:cy-fy*h,w,h},false);
}
function focusPts(pts,pad){
 const MOD=app.MOD;
 const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys),asp=MOD.H/MOD.W;
 let w=Math.max(x1-x0+2*pad,(y1-y0+2*pad)/asp,MOD.W/5);w=Math.min(w,MOD.W);const h=w*asp;
 setVB({x:(x0+x1)/2-w/2,y:(y0+y1)/2-h/2,w,h},true);
 return w;
}
export function boneAt(x,y){
 const test=(px,py)=>{const el=document.elementFromPoint(px,py),g=el&&el.closest&&el.closest('.bone');return g&&$('fig').contains(g)?g:null;};
 let g=test(x,y);if(g)return g;
 for(const r of [8,16,24])for(let a=0;a<8;a++){const t=a*Math.PI/4;g=test(x+r*Math.cos(t),y+r*Math.sin(t));if(g)return g;}
 return null;
}

/* ---------- posti vuoti del puzzle ---------- */
// Punti campione (in unità della figura) sul disegno di ogni struttura, calcolati una volta per modulo.
const samples=new Map();
function samplesOf(g){
 const key=app.MOD.id+'/'+g.dataset.id;
 if(samples.has(key))return samples.get(key);
 const pts=[],step=2,inner=g.firstElementChild;
 for(const el of inner.querySelectorAll('.l,.f')){
  if(el.tagName==='line'||el.tagName==='path'&&el.classList.contains('l')){
   const L=el.getTotalLength();for(let d=0;d<=L;d+=step){const p=el.getPointAtLength(d);pts.push([p.x,p.y]);}
  }else{
   const b=el.getBBox();
   for(let x=b.x;x<=b.x+b.width;x+=step)for(let y=b.y;y<=b.y+b.height;y+=step)
    if(el.isPointInFill(new DOMPoint(x,y)))pts.push([x,y]);
   pts.push([b.x+b.width/2,b.y+b.height/2]);
  }
 }
 if(g.childElementCount>1)for(const [x,y] of pts.slice())pts.push([app.MOD.W-x,y]); // copia specchiata (lato sinistro)
 samples.set(key,pts);
 return pts;
}
const SLOT_PX=28; // distanza massima, in pixel sullo schermo, tra il punto di rilascio e un posto vuoto
// Nel puzzle: il posto vuoto più vicino al punto (entro SLOT_PX), anche se coperto da altre ossa;
// a pari distanza vince quello del pezzo in mano (want). Se non ce n'è, la struttura sotto il dito.
export function slotAt(x,y,want){
 const svg=svgEl();if(!svg)return null;
 const r=svg.getBoundingClientRect();
 if(x<r.left||x>r.right||y<r.top||y>r.bottom)return null;
 const ctm=svg.getScreenCTM(),p=svgPt(x,y),max=SLOT_PX/ctm.a;
 let best=null,bestD=Infinity,wantG=null,wantD=Infinity;
 for(const g of document.querySelectorAll('.bone.ghost')){
  let d=Infinity;for(const [sx,sy] of samplesOf(g)){const e=Math.hypot(sx-p.x,sy-p.y);if(e<d)d=e;}
  if(d<bestD){bestD=d;best=g;}
  if(g.dataset.id===want){wantG=g;wantD=d;}
 }
 if(wantG&&wantD<=max&&wantD<=bestD+1.5)return wantG;
 if(best&&bestD<=max)return best;
 return boneAt(x,y);
}
export const gEl=id=>document.querySelector(`.bone[data-id="${id}"]`);
const MARKS=['sel','org','ins','ok','bad','hov'];
export function clearMarks(){document.querySelectorAll('.bone').forEach(g=>g.classList.remove(...MARKS));const o=$('ov');if(o)o.innerHTML='';}
export const mark=(id,c)=>{const g=gEl(id);if(g)g.classList.add(c);};
export function refreshMastery(){app.B.forEach(b=>{const g=gEl(b.id);g.classList.remove('m0','m1','m2','m3');g.classList.add('m'+(S.mastery[b.id]||0));});}
export function showMuscle(m){
 clearMarks();mark(m.o,'org');mark(m.i,'ins');
 const a=bone(m.o).c,b=bone(m.i).c,dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy)||1;
 const w=focusPts([a,b],30),u=w/100,r=6.5*u,fs=6.5*u,down=dy>=0;
 const sx=a[0]+dx/d*(r+u),sy=a[1]+dy/d*(r+u),ex=b[0]-dx/d*(r+2.5*u),ey=b[1]-dy/d*(r+2.5*u);
 const lab=(p,txt,col,above)=>{const wd=txt.length*fs*.56+fs*1.4,hh=fs*1.7,y=above?p[1]-r-hh-u:p[1]+r+u;
  return `<rect x="${p[0]-wd/2}" y="${y}" width="${wd}" height="${hh}" rx="${hh/2}" fill="${col}"/><text x="${p[0]}" y="${y+hh*0.72}" text-anchor="middle" font-size="${fs}" font-weight="700" fill="#fff">${txt}</text>`;};
 const dot=(p,l,col)=>`<circle cx="${p[0]}" cy="${p[1]}" r="${r}" fill="${col}"/><text x="${p[0]}" y="${p[1]+fs*.36}" text-anchor="middle" font-size="${fs*1.1}" font-weight="700" fill="#fff">${l}</text>`;
 $('ov').innerHTML=`<line x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" stroke="#7c3aed" stroke-width="${2.2*u}" stroke-dasharray="${5*u} ${4*u}" marker-end="url(#ar)"/>`+
  dot(a,'O','#2563eb')+dot(b,'I','#ea580c')+lab(a,'O: '+bone(m.o).n,'#2563eb',down)+lab(b,'I: '+bone(m.i).n,'#ea580c',!down);
}
export const muscleHtml=m=>`<div class="md"><b>${m.n}</b><br><span class="tg o">ORIGINE</span> ${m.ot}<br><span class="tg i">INSERZIONE</span> ${m.it}<br><b>Azione</b>: ${m.a}</div>`;

/* ---------- pan, pizzico e rotella ---------- */
const ptrs=new Map();let pan=null,pinch=null,wasPan=false;
// Dice al gestore del clic se il gesto appena finito era un trascinamento (e lo azzera).
export function takePan(){if(!wasPan)return false;wasPan=false;return true;}
const fg=$('fig');
fg.addEventListener('pointerdown',e=>{
 if(e.target.closest('.tbar'))return;
 ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});wasPan=false;
 if(ptrs.size===1)pan={x:e.clientX,y:e.clientY,vx:app.VB.x,vy:app.VB.y};
 else if(ptrs.size===2){pan=null;const [a,b]=[...ptrs.values()];pinch=Math.hypot(a.x-b.x,a.y-b.y);}
});
fg.addEventListener('pointermove',e=>{
 if(!ptrs.has(e.pointerId))return;ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
 const s=svgEl();if(!s)return;
 if(ptrs.size===2&&pinch){
  const [a,b]=[...ptrs.values()],d=Math.hypot(a.x-b.x,a.y-b.y),mid=svgPt((a.x+b.x)/2,(a.y+b.y)/2);
  wasPan=true;zoomAt(d/pinch,mid.x,mid.y);pinch=d;
 }else if(ptrs.size===1&&pan&&app.VB.w<app.MOD.W-1){
  const dx=e.clientX-pan.x,dy=e.clientY-pan.y;
  if(!wasPan&&Math.hypot(dx,dy)<7)return;
  wasPan=true;const sc=1/s.getScreenCTM().a;
  setVB({x:pan.vx-dx*sc,y:pan.vy-dy*sc,w:app.VB.w,h:app.VB.h},false);
 }
});
const endPtr=e=>{ptrs.delete(e.pointerId);if(ptrs.size<2)pinch=null;if(!ptrs.size)pan=null;};
fg.addEventListener('pointerup',endPtr);fg.addEventListener('pointercancel',endPtr);
fg.addEventListener('wheel',e=>{if(!svgEl())return;e.preventDefault();const p=svgPt(e.clientX,e.clientY);zoomAt(e.deltaY<0?1.2:1/1.2,p.x,p.y);},{passive:false});

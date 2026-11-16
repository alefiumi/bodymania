/* Prototipo: scheletro 3D in stile cartoon, con reperi e muscoli di bacino e anca come campione. */
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {OutlineEffect} from 'three/addons/effects/OutlineEffect.js';

const $=id=>document.getElementById(id);
const view=$('view');

const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
view.appendChild(renderer.domElement);
const effect=new OutlineEffect(renderer,{defaultThickness:0.0035,defaultColor:[0.23,0.2,0.16],defaultAlpha:1});
let outline=true;

const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(30,1,0.05,20);
scene.add(camera);
// luce attaccata alla camera: l'ombra cartoon resta coerente mentre si ruota
scene.add(new THREE.HemisphereLight(0xffffff,0x9a8f80,1.5));
const sun=new THREE.DirectionalLight(0xffffff,2.2);sun.position.set(-0.6,0.9,1.2);camera.add(sun);

// tre toni netti: è questo che dà l'effetto cartoon
const ramp=new THREE.DataTexture(new Uint8Array([120,120,120,255, 200,200,200,255, 255,255,255,255]),3,1,THREE.RGBAFormat);
ramp.minFilter=ramp.magFilter=THREE.NearestFilter;ramp.needsUpdate=true;
const COL={bone:0xefe6d2,cartilage:0xb8d8e6,sel:0x7dd3fc};
const mats={};for(const k in COL)mats[k]=new THREE.MeshToonMaterial({color:COL[k],gradientMap:ramp});
// ossa trasparenti, per vedere gli strati che stanno dentro (encefalo)
mats.ghost=new THREE.MeshToonMaterial({color:COL.bone,gradientMap:ramp,transparent:true,opacity:0.16,depthWrite:false});
mats.ghost.userData.outlineParameters={visible:false};

const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.dampingFactor=0.12;controls.rotateSpeed=0.9;controls.zoomSpeed=1.1;
controls.touches={ONE:THREE.TOUCH.ROTATE,TWO:THREE.TOUCH.DOLLY_PAN};

/* ---------- caricamento ---------- */
const parts=[],byFma=new Map();let center=new THREE.Vector3(),height=1.7;
let DATA={bones:{},landmarks:[],muscles:[]};const LM=new Map();
const loader=new GLTFLoader();loader.setMeshoptDecoder(MeshoptDecoder);
const t0=performance.now();
const [gltf,data]=await Promise.all([
 new Promise((ok,ko)=>loader.load('skeleton.glb',ok,undefined,ko)),
 fetch('reperi.json').then(r=>r.json()).catch(()=>null),
]).catch(e=>{$('msg').textContent='Non riesco a caricare il modello: '+e.message;throw e;});
let tris=0;
gltf.scene.traverse(o=>{
 if(!o.isMesh)return;
 o.geometry.computeVertexNormals();
 o.userData.kind=o.userData.kind||'bone';o.userData.label=o.userData.name||o.name;o.userData.fma=o.name;
 o.material=mats[o.userData.kind];
 tris+=o.geometry.index.count/3;parts.push(o);byFma.set(o.name,o);
});
scene.add(gltf.scene);
{const box=new THREE.Box3().setFromObject(gltf.scene);box.getCenter(center);height=box.getSize(new THREE.Vector3()).y;}
controls.minDistance=height*0.06;controls.maxDistance=height*3.2;
if(data)DATA=data;
const STRATI=await fetch('strati.json').then(r=>r.json()).catch(()=>null);
const modelInfo=`${parts.filter(p=>p.userData.kind==='bone').length} ossa · ${Math.round(tris/1000)}k triangoli · caricato in ${Math.round(performance.now()-t0)} ms`;
const boneName=m=>DATA.bones[m.userData.fma]||m.userData.label;

/* ---------- reperi: punti sulla superficie ---------- */
const MK={base:0x0f766e,sel:0xfacc15,o:0x2563eb,i:0xea580c};
const mkMat={};for(const k in MK){mkMat[k]=new THREE.MeshBasicMaterial({color:MK[k]});mkMat[k].userData.outlineParameters={visible:false};}
const ball=new THREE.SphereGeometry(1,14,10);
const markers=new THREE.Group();scene.add(markers);
for(const l of DATA.landmarks){
 const m=new THREE.Mesh(ball,mkMat.base);
 m.position.set(l.p[0]+l.nrm[0]*0.0015,l.p[1]+l.nrm[1]*0.0015,l.p[2]+l.nrm[2]*0.0015);
 m.userData.lm=l;l.mesh=m;l.pos=new THREE.Vector3(...l.p);LM.set(l.id,l);markers.add(m);
}
const lmOf=(k,side)=>LM.get(k+'_'+side)||LM.get(k);
const musclesAt=k=>DATA.muscles.filter(m=>m.o.includes(k)||m.i.includes(k));
const roleAt=(m,k)=>m.o.includes(k)&&m.i.includes(k)?'origine · inserzione':m.o.includes(k)?'origine':'inserzione';

/* ---------- muscoli: linee da origine a inserzione ---------- */
const lineMat=new THREE.MeshBasicMaterial({color:0x7c3aed,transparent:true,opacity:0.85,depthTest:false});
lineMat.userData.outlineParameters={visible:false};
const lines=new THREE.Group();lines.renderOrder=10;scene.add(lines);
const cyl=new THREE.CylinderGeometry(1,1,1,8,1,true);
function segment(a,b){
 const m=new THREE.Mesh(cyl,lineMat),d=b.clone().sub(a);
 m.position.copy(a).addScaledVector(d,0.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());
 m.userData.len=d.length();m.renderOrder=10;lines.add(m);
}

/* ---------- camera ---------- */
const DIR={front:[0,0,1],back:[0,0,-1],right:[-1,0,0],left:[1,0,0],top:[0,1,0.001]};
let tween=null;
function fitDist(){const v=THREE.MathUtils.degToRad(camera.fov)/2,h=height*0.56/Math.tan(v);return Math.max(h,h/Math.min(1,camera.aspect*1.9));}
function setView(name,anim=true){
 // da lontano (o all'avvio) inquadra tutto lo scheletro; da vicino gira attorno al punto che si sta guardando
 const t=controls.target.clone(),d0=camera.position.distanceTo(t),far=d0>fitDist()*0.8||d0<0.15;
 const c=far?center.clone():t,dist=far?fitDist():camera.position.distanceTo(t);
 flyTo(c.clone().add(new THREE.Vector3(...DIR[name]).normalize().multiplyScalar(dist)),c,anim);
}
function flyTo(pos,target,anim=true){
 if(!anim){camera.position.copy(pos);controls.target.copy(target);controls.update();return;}
 tween={p0:camera.position.clone(),t0:controls.target.clone(),p1:pos,t1:target,s:performance.now()};
}
// inquadra un gruppo di punti guardandoli da fuori (dall'asse del corpo verso l'esterno)
function frame(points,minDist=0.3){
 const c=new THREE.Vector3();points.forEach(p=>c.add(p));c.multiplyScalar(1/points.length);
 const r=Math.max(...points.map(p=>p.distanceTo(c)));
 const out=new THREE.Vector3(c.x-center.x,0,c.z-center.z);if(Math.abs(out.x)<0.03)out.set(0,0,1);out.normalize(); // punti sulla linea mediana: da davanti
 const dist=Math.max(minDist,r*1.35/Math.tan(THREE.MathUtils.degToRad(camera.fov)/2)/Math.min(1,camera.aspect));
 flyTo(c.clone().addScaledVector(out,dist).add(new THREE.Vector3(0,r*0.3,0)),c);
}

/* ---------- strati: muscoli, encefalo, nervi (caricati solo quando si accendono) ---------- */
const sideOf=n=>/\bright\b/i.test(n)?'dx':/\bleft\b/i.test(n)?'sx':'';
const baseOf=n=>n.toLowerCase().replace(/\b(right|left) /,'').trim();
const LAYERS={
 muscoli:{file:'muscoli.glb',n:'Muscoli',meshes:[],on:false,color:0xc8553d},
 encefalo:{file:'encefalo.glb',n:'Encefalo',meshes:[],groups:{cort:false,prof:false,tronco:false,altro:false}},
 nervi:{file:'nervi.glb',n:"Nervi dell'orbita",meshes:[],on:false,color:0xf2c200}};
const colMat=new Map();
const toon=c=>{if(!colMat.has(c))colMat.set(c,new THREE.MeshToonMaterial({color:c,gradientMap:ramp}));return colMat.get(c);};
// nome italiano e dati di una parte di uno strato, dal nome inglese della fonte
function describe(layer,en){
 const b=baseOf(en),side=sideOf(en),T=STRATI||{};
 if(layer==='encefalo'){const e=(T.encefalo||{})[b];return e?{n:e.n,g:e.g,c:e.c,d:e.d,side}:{n:en,g:'altro',c:'#cccccc',side};}
 if(layer==='nervi'){const e=(T.nervi||{})[b];return {n:e?e.n:en,side};}
 const M=T.muscoli||{schede:{},nomi:{},parti:{},nomiSchede:{}};
 const cut=k=>b===k?'':b.endsWith(' of '+k)?b.slice(0,-(' of '+k).length):null;
 for(const id in M.schede)for(const k of M.schede[id]){const part=cut(k);if(part!==null)return {n:M.nomiSchede[id]+(part?' ('+(M.parti[part]||part)+')':''),mu:id,side};}
 for(const k in M.nomi){const part=cut(k);if(part!==null)return {n:M.nomi[k]+(part?' ('+(M.parti[part]||part)+')':''),side};}
 return {n:en.replace(/\b(right|left) /i,''),latin:true,side};
}
function loadLayer(name){
 const L=LAYERS[name];
 if(!L.loading)L.loading=new Promise((ok,ko)=>loader.load(L.file,g=>{
  g.scene.traverse(o=>{
   if(!o.isMesh)return;o.geometry.computeVertexNormals();
   const en=o.userData.name||o.name,inf=describe(name,en);
   o.userData={layer:name,kind:name,label:en,fma:o.userData.fma,info:inf,mat:toon(inf.c?new THREE.Color(inf.c).getHex():L.color)};
   o.material=o.userData.mat;L.meshes.push(o);
  });
  scene.add(g.scene);L.loaded=true;ok();
 },undefined,ko));
 return L.loading;
}
const layerVis=o=>o.userData.layer==='encefalo'?LAYERS.encefalo.groups[o.userData.info.g]:LAYERS[o.userData.layer].on;
// ciò che si può toccare: ossa visibili e non trasparenti, più le parti degli strati accesi
function pickables(){
 const a=S.bones==='on'?parts.slice():[];
 for(const k in LAYERS)for(const o of LAYERS[k].meshes)if(o.visible)a.push(o);
 return a;
}

/* ---------- stato e pannello ---------- */
const S={bone:null,lm:null,muscle:null,side:'dx',showLm:true,bones:'on'};
const sideName=s=>s==='dx'?'destro':s==='sx'?'sinistro':'';
const chip=(cls,attr,txt,small='')=>`<button class="chip ${cls}" ${attr}>${txt}${small?` <small>${small}</small>`:''}</button>`;
const NOTE='<p class="note">Da verificare su un atlante: posizioni dei punti e testi sono preparati dall\'AI.</p>';
function refresh(){
 // ossa
 parts.forEach(p=>{p.visible=S.bones!=='off';p.material=p===S.bone?mats.sel:S.bones==='ghost'?mats.ghost:mats[p.userData.kind];});
 for(const k in LAYERS)for(const o of LAYERS[k].meshes){
  o.visible=layerVis(o);const inf=o.userData.info;
  const hi=o===S.bone||(S.muscle&&inf.mu===S.muscle.id&&(!inf.side||inf.side===S.side));
  o.material=hi?mats.sel:o.userData.mat;
 }
 // reperi e linee
 while(lines.children.length)lines.remove(lines.children[0]);
 const mu=S.muscle,role=new Map();
 if(mu){
  const O=mu.o.map(k=>lmOf(k,S.side)),I=mu.i.map(k=>lmOf(k,S.side));
  O.forEach(l=>role.set(l,'o'));I.forEach(l=>role.set(l,'i'));
  if(mu.seg)mu.seg.forEach(([a,b])=>segment(lmOf(a,S.side).pos,lmOf(b,S.side).pos)); // coppie indicate nei dati
  else{O.forEach(l=>segment(l.pos,I[0].pos));for(let n=1;n<I.length;n++)segment(I[n-1].pos,I[n].pos);}
 }
 for(const l of DATA.landmarks){
  l.mesh.visible=mu?role.has(l):S.showLm&&S.bones==='on'; // con le ossa trasparenti o nascoste i punti confonderebbero
  l.mesh.material=mkMat[role.get(l)||(l===S.lm?'sel':'base')];
 }
 panel();
}
function panel(){
 const p=$('panel');let h='';
 if(S.muscle){
  const m=S.muscle;
  h=`<div class="h">${m.n} <i>${sideName(S.side)}</i></div>
   <div class="row"><span class="tg o">ORIGINE</span> ${m.ot}</div>
   <div class="chips">${m.o.map(k=>chip('o',`data-lm="${lmOf(k,S.side).id}"`,lmOf(k,S.side).n)).join('')}</div>
   <div class="row"><span class="tg i">INSERZIONE</span> ${m.it}</div>
   <div class="chips">${m.i.map(k=>chip('i',`data-lm="${lmOf(k,S.side).id}"`,lmOf(k,S.side).n)).join('')}</div>
   <div class="row"><b>Azione</b>: ${m.a}</div><div class="row"><b>Innervazione</b>: ${m.nv}</div>
   <div class="chips"><button class="chip" data-side="${S.side==='dx'?'sx':'dx'}">Mostra il lato ${S.side==='dx'?'sinistro':'destro'}</button><button class="chip" data-go="muscles">Tutti i muscoli</button></div>`+NOTE;
 }else if(S.lm){
  const l=S.lm,ms=musclesAt(l.k);
  h=`<div class="h">${l.n}</div><div class="mut"><i>${l.l}</i> · ${DATA.bones[l.bone]||''}</div><p>${l.d}</p>`+
   (ms.length?`<div class="sub">Muscoli che si attaccano qui</div><div class="chips">${ms.map(m=>chip('',`data-mu="${m.id}"`,m.n,roleAt(m,l.k))).join('')}</div>`:'')+
   `<div class="chips"><button class="chip" data-go="home">Indietro</button></div>`+NOTE;
 }else if(S.bone&&S.bone.userData.layer){
  const b=S.bone,inf=b.userData.info,lay=b.userData.layer;
  const tipo=lay==='muscoli'?'Muscolo':lay==='nervi'?'Nervo':(STRATI.gruppi[inf.g]||'Encefalo');
  h=`<div class="h">${inf.n} <i>${sideName(inf.side)}</i></div><div class="mut">${tipo} · ${inf.latin?'nome latino della fonte':'nome della fonte: '+b.userData.label}</div>`+
   (inf.d?`<p>${inf.d}</p>`:'')+(lay==='muscoli'?'<p class="mut">Per questo muscolo non c\'è ancora la scheda con origine e inserzione.</p>':'')+
   `<div class="chips"><button class="chip" data-hide="1">Nascondi questa parte</button><button class="chip" data-go="layers">Strati</button><button class="chip" data-go="home">Indietro</button></div>`+NOTE;
 }else if(S.bone){
  const b=S.bone,ls=DATA.landmarks.filter(l=>l.bone===b.userData.fma);
  const ms=DATA.muscles.filter(m=>ls.some(l=>m.o.includes(l.k)||m.i.includes(l.k)));
  h=`<div class="h">${boneName(b)}</div><div class="mut">${b.userData.kind==='cartilage'?'Cartilagine':'Osso'} · ${b.userData.label} · ${b.userData.fma}</div>`+
   (ls.length?`<div class="sub">Reperi su questo osso</div><div class="chips">${ls.map(l=>chip('',`data-lm="${l.id}"`,l.n+(l.side&&!/destr|sinistr/.test(DATA.bones[l.bone]||'')?' ('+l.side+')':''))).join('')}</div>`
    :'<p class="mut">Su quest\'osso non ci sono ancora reperi.</p>')+
   (ms.length?`<div class="sub">Muscoli collegati</div><div class="chips">${ms.map(m=>chip('',`data-mu="${m.id}"`,m.n)).join('')}</div>`:'')+
   `<div class="chips"><button class="chip" data-go="home">Indietro</button></div>`;
 }else if(S.list==='layers'){
  const on=(v,attr,txt)=>`<button class="chip${v?' on':''}" ${attr}>${txt}</button>`,E=LAYERS.encefalo.groups,G=STRATI?STRATI.gruppi:{};
  h=`<div class="h">Strati</div>${S.loading?'<p class="mut">Carico lo strato…</p>':''}
   <div class="sub">Ossa</div><div class="chips">${on(S.bones==='on','data-bones="on"','Visibili')}${on(S.bones==='ghost','data-bones="ghost"','Trasparenti')}${on(S.bones==='off','data-bones="off"','Nascoste')}${on(S.showLm,'data-lmt="1"','Reperi')}</div>
   <div class="sub">Muscoli</div><div class="chips">${on(LAYERS.muscoli.on,'data-layer="muscoli"','Muscoli')}</div>
   <div class="sub">Encefalo</div><div class="chips">${['cort','prof','tronco','altro'].map(g=>on(E[g],`data-eg="${g}"`,G[g]||g)).join('')}</div>
   <div class="sub">Nervi</div><div class="chips">${on(LAYERS.nervi.on,'data-layer="nervi"',"Nervi dell'orbita e vie ottiche")}</div>
   <p class="note">Il modello di origine non contiene midollo spinale e nervi periferici (plessi, nervo sciatico…): per quelli serve un'altra fonte.</p>
   <div class="chips"><button class="chip" data-go="home">Indietro</button></div>`;
 }else if(S.list==='muscles'){
  const gs=[...new Set(DATA.muscles.map(m=>m.g))];
  h=`<div class="h">Muscoli</div>`+gs.map(g=>`<div class="sub">${g}</div><div class="chips">${DATA.muscles.filter(m=>m.g===g).map(m=>chip('',`data-mu="${m.id}"`,m.n)).join('')}</div>`).join('')+`<div class="chips"><button class="chip" data-go="home">Indietro</button></div>`+NOTE;
 }else{
  h=`<div class="h">Scheletro, reperi e muscoli</div><p class="mut">Tocca un punto verde (repere) o un osso. Un dito ruota, due dita ingrandiscono e spostano, doppio tocco avvicina.</p>
   <div class="chips"><button class="chip" data-go="layers">🧩 Strati</button><button class="chip" data-go="muscles">💪 Schede dei muscoli (${DATA.muscles.length})</button></div>
   <p class="note">${new Set(DATA.landmarks.map(l=>l.k)).size} reperi per lato · ${NOTE.replace(/<\/?p[^>]*>/g,'')}</p>
   <p class="note">${modelInfo}<br>Modello: BodyParts3D, © The Database Center for Life Science, CC Attribution 4.0 International (semplificato).</p>`;
 }
 p.innerHTML=h;p.scrollTop=0;
}
function showMuscle(m,side=S.side,fly=true){
 S.muscle=m;S.side=side;S.lm=null;S.bone=null;refresh();
 if(fly)frame([...m.o,...m.i].map(k=>lmOf(k,side).pos));
}
function showLandmark(l,fly=true){
 S.muscle=null;S.lm=l;S.bone=null;if(l.side)S.side=l.side;refresh();
 if(fly){const n=new THREE.Vector3(...l.nrm),d=Math.min(camera.position.distanceTo(controls.target),0.45);flyTo(l.pos.clone().addScaledVector(n,Math.max(0.28,d)),l.pos.clone());}
}
function showBone(b){S.muscle=null;S.lm=null;S.bone=b;S.list=null;if(b){const x=new THREE.Box3().setFromObject(b).getCenter(new THREE.Vector3()).x;if(Math.abs(x)>0.02)S.side=x<0?'dx':'sx';}refresh();}

/* ---------- tocco ---------- */
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),tmp=new THREE.Vector3();
function toNdc(x,y){const r=renderer.domElement.getBoundingClientRect();ndc.set((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1);return r;}
function pickBone(x,y){toNdc(x,y);ray.setFromCamera(ndc,camera);const h=ray.intersectObjects(pickables(),false)[0];return h?h.object:null;}
// il repere visibile più vicino al dito, entro 22 px e non coperto da un osso
function pickLandmark(x,y){
 const r=renderer.domElement.getBoundingClientRect();let best=null,bd=22;
 for(const l of DATA.landmarks){
  if(!l.mesh.visible)continue;
  tmp.copy(l.mesh.position).project(camera);if(tmp.z>1)continue;
  const d=Math.hypot((tmp.x+1)/2*r.width+r.left-x,(1-tmp.y)/2*r.height+r.top-y);
  if(d>=bd)continue;
  ray.set(camera.position,tmp.copy(l.mesh.position).sub(camera.position).normalize());
  const h=ray.intersectObjects(pickables(),false)[0],dist=camera.position.distanceTo(l.mesh.position);
  if(h&&h.distance<dist-0.008)continue;
  bd=d;best=l;
 }
 return best;
}
let down=null,lastTap=0;
renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,t:performance.now()};});
renderer.domElement.addEventListener('pointerup',e=>{
 if(!down)return;const moved=Math.hypot(e.clientX-down.x,e.clientY-down.y),dt=performance.now()-down.t;down=null;
 if(moved>8||dt>500)return;
 const l=pickLandmark(e.clientX,e.clientY);
 if(l){showLandmark(l,false);lastTap=0;return;}
 const m=pickBone(e.clientX,e.clientY),now=performance.now();
 if(m&&now-lastTap<350){ // doppio tocco: avvicina e centra l'osso
  const b=new THREE.Box3().setFromObject(m),c=b.getCenter(new THREE.Vector3()),s=b.getSize(new THREE.Vector3()).length();
  const dir=camera.position.clone().sub(controls.target).normalize();
  flyTo(c.clone().add(dir.multiplyScalar(Math.max(controls.minDistance,s*2.2))),c);
 }else if(m&&m.userData.layer==='muscoli'&&m.userData.info.mu)showMuscle(DATA.muscles.find(x=>x.id===m.userData.info.mu),m.userData.info.side||S.side,false); // muscolo con scheda
 else if(m||!S.muscle)showBone(m);
 lastTap=now;
});

/* ---------- pulsanti ---------- */
$('bar').addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.v)setView(b.dataset.v);
 else if(b.id==='outline'){outline=!outline;b.classList.toggle('on',outline);}
 else if(b.id==='layers'){S.muscle=S.lm=S.bone=null;S.list='layers';refresh();}
});
$('panel').addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.mu)showMuscle(DATA.muscles.find(m=>m.id===b.dataset.mu));
 else if(b.dataset.lm)showLandmark(LM.get(b.dataset.lm));
 else if(b.dataset.side)showMuscle(S.muscle,b.dataset.side);
 else if(b.dataset.go){S.muscle=S.lm=S.bone=null;S.list=['muscles','layers'].includes(b.dataset.go)?b.dataset.go:null;refresh();}
 else if(b.dataset.hide){if(S.bone){S.bone.userData.hidden=true;S.bone.visible=false;const L=LAYERS[S.bone.userData.layer];L.meshes.splice(L.meshes.indexOf(S.bone),1);}S.bone=null;S.list='layers';refresh();}
 else if(b.dataset.bones){S.bones=b.dataset.bones;refresh();}
 else if(b.dataset.lmt){S.showLm=!S.showLm;refresh();}
 else if(b.dataset.layer||b.dataset.eg)toggleLayer(b.dataset.layer||'encefalo',b.dataset.eg);
});

async function toggleLayer(name,group){
 const L=LAYERS[name];
 if(!L.loaded){S.loading=true;panel();try{await loadLayer(name);}catch(e){S.loading=false;panel();return;}S.loading=false;}
 if(group){L.groups[group]=!L.groups[group];if(L.groups[group]&&S.bones==='on')S.bones='ghost';} // il cranio copre l'encefalo: lo rendo trasparente
 else L.on=!L.on;
 refresh();
}

/* ---------- ciclo di disegno ---------- */
function resize(){
 const w=view.clientWidth,h=view.clientHeight;if(!w||!h)return;
 renderer.setSize(w,h,false);effect.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(view);resize();
setView('front',false);$('msg').remove();refresh();
let frames=0,last=performance.now(),worst=0,prev=performance.now();
renderer.setAnimationLoop(now=>{
 if(tween){const k=Math.min(1,(now-tween.s)/450),e=k*k*(3-2*k);
  camera.position.lerpVectors(tween.p0,tween.p1,e);controls.target.lerpVectors(tween.t0,tween.t1,e);if(k>=1)tween=null;}
 controls.update();
 // punti e linee tengono una dimensione leggibile a qualsiasi zoom
 const px=2*Math.tan(THREE.MathUtils.degToRad(camera.fov)/2)/view.clientHeight; // metri per pixel a 1 m di distanza
 for(const l of DATA.landmarks)if(l.mesh.visible){const d=camera.position.distanceTo(l.mesh.position);l.mesh.scale.setScalar(Math.max(0.0018,d*px*(l.mesh.material===mkMat.base?4:7)));}
 for(const s of lines.children){const d=camera.position.distanceTo(s.position),r=Math.max(0.0012,d*px*2.2);s.scale.set(r,s.userData.len,r);}
 if(outline)effect.render(scene,camera);else renderer.render(scene,camera);
 frames++;worst=Math.max(worst,now-prev);prev=now;
 if(now-last>=1000){$('fps').textContent=`${Math.round(frames*1000/(now-last))} fps`;frames=0;worst=0;last=now;}
});
window.__proto={LAYERS,toggleLayer,pickables,parts,scene,camera,controls,setView,renderer,S,DATA,LM,showMuscle,showLandmark,showBone,pickLandmark,pickBone,refresh};

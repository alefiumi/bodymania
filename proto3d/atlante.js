/* Prototipo: atlante 3D in stile cartoon a strati sovrapponibili (ossa, muscoli, legamenti, sistema nervoso, vasi, visceri),
   con reperi e aree di origine e inserzione. Modello e nomi: Z-Anatomy (CC BY-SA 4.0) e Terminologia Anatomica 2. */
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
const effect=new OutlineEffect(renderer,{defaultThickness:0.003,defaultColor:[0.23,0.2,0.16],defaultAlpha:1});
let outline=true;

const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(30,1,0.03,20);
scene.add(camera);
// luce attaccata alla camera: l'ombra cartoon resta coerente mentre si ruota
scene.add(new THREE.HemisphereLight(0xffffff,0x9a8f80,1.5));
const sun=new THREE.DirectionalLight(0xffffff,2.2);sun.position.set(-0.6,0.9,1.2);camera.add(sun);

// tre toni netti: è questo che dà l'effetto cartoon
const ramp=new THREE.DataTexture(new Uint8Array([120,120,120,255, 200,200,200,255, 255,255,255,255]),3,1,THREE.RGBAFormat);
ramp.minFilter=ramp.magFilter=THREE.NearestFilter;ramp.needsUpdate=true;
const colMat=new Map();
// thin = senza contorno: su nervi e vasi, che sono tubi sottili, il contorno coprirebbe il colore
const toon=(c,thin=false)=>{const k=c+(thin?'t':'');if(!colMat.has(k)){const m=new THREE.MeshToonMaterial({color:c,gradientMap:ramp});if(thin)m.userData.outlineParameters={visible:false};colMat.set(k,m);}return colMat.get(k);};
const M_SEL=toon(0x7dd3fc),M_O=toon(0x2563eb),M_E=toon(0xea580c);
// ossa trasparenti, per vedere gli strati che stanno dentro
const M_GHOST=new THREE.MeshToonMaterial({color:0xefe6d2,gradientMap:ramp,transparent:true,opacity:0.16,depthWrite:false});
M_GHOST.userData.outlineParameters={visible:false};

const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.dampingFactor=0.12;controls.rotateSpeed=0.9;controls.zoomSpeed=1.1;
controls.touches={ONE:THREE.TOUCH.ROTATE,TWO:THREE.TOUCH.DOLLY_PAN};

/* ---------- dati e nomi ---------- */
const DATA=await fetch('dati.json').then(r=>r.json());
const baseOf=n=>n.replace(/\.(?:[oe]\d*[rl]|[rl]|[a-z])$/,'');
const sideOf=n=>(n.match(/\.(?:[oe]\d*)?([rl])$/)||[,''])[1];
const kindOf=n=>(n.match(/\.([oe])\d*[rl]$/)||[,''])[1];
const rootOf=b=>{b=b.replace(/^\(|\)$/g,'').replace(/['*]/g,'');const m=b.match(/^(.*?\b(?:head|part|belly|tendon|slip|layer|fibres|portion) of )(.+)$/);if(m)b=m[2];return b.replace(/ muscles?$/,'').trim().toLowerCase();};
const itOf=b=>(DATA.names[b]||[b])[0];
const laOf=b=>(DATA.names[b]||[,''])[1];
const sideName=s=>s==='r'?'destro':s==='l'?'sinistro':'';

/* ---------- strati ---------- */
// interruttore -> file che lo contiene, nome, colore di base (null = colore per gruppo)
const LAYERS={
 ossa:{file:'ossa',n:'Ossa',c:0xefe6d2},
 muscoli:{file:'muscoli',n:'Muscoli',c:0xc8553d},
 fasce:{file:'muscoli',n:'Fasce, tendini e borse',c:0xe9dcc9},
 legamenti:{file:'legamenti',n:'Legamenti e articolazioni',c:0xdfe8ee},
 inserzioni:{file:'inserzioni',n:'Aree di origine e inserzione',c:0x2563eb},
 encefalo:{file:'encefalo',n:'Encefalo',c:null},
 midollo:{file:'midollo',n:'Midollo spinale',c:0xf0d98a},
 nervi:{file:'nervi',n:'Nervi',c:0xf2c200},
 meningi:{file:'meningi',n:'Meningi',c:0xd9d2c3},
 sensi:{file:'sensi',n:'Occhio e orecchio',c:null},
 vasi:{file:'vasi',n:'Vasi sanguigni',c:null},
 visceri:{file:'visceri',n:'Visceri',c:null}};
const V={};for(const k in LAYERS)V[k]=false;
const FILES={};   // file -> {promise, loaded}
const meshes=[];  // tutte le parti caricate
const byName=new Map();
// colore pastello stabile per gruppo (lobi dell'encefalo, organi…), con alcune scelte fisse
const FIX={'Frontal lobe':0xf2a694,'Parietal lobe':0xf2d58a,'Temporal lobe':0xa3d69a,'Occipital lobe':0xa9d3f0,'Limbic lobe':0xc7a6e8,'Insula':0xf0a8c0,'Cerebellum':0xc9a0e6,
 'Cartilage':0xb8d8e6,'Ligament':0xdfe8ee,'Articular capsule':0xcfdbe3,'Bone':0xefe6d2};
function groupColor(u){
 const key=u.mat||u.g||u.base;
 if(u.layer==='vasi'){const s=(u.g+' '+u.base).toLowerCase();return /vein|venous|vena|sinus/.test(s)?0x4a7fd4:0xd9483b;}
 if(FIX[key]!==undefined)return FIX[key];
 let h=0;for(const ch of key)h=(h*31+ch.charCodeAt(0))>>>0;
 return new THREE.Color().setHSL((h%360)/360,0.55,0.74).getHex();
}
const loader=new GLTFLoader();loader.setMeshoptDecoder(MeshoptDecoder);
function loadFile(file){
 if(!FILES[file])FILES[file]={promise:new Promise((ok,ko)=>loader.load(file+'.glb',g=>{
  g.scene.traverse(o=>{
   if(!o.isMesh)return;o.geometry.computeVertexNormals();
   const name=o.userData.name||o.name,inf=DATA.objs[name]||[file,'',''],base=baseOf(name); // il caricatore toglie punti e spazi da o.name: il nome vero resta in userData
   const u={name,base,side:sideOf(name),layer:inf[0],mat:inf[1],g:inf[2],kind:kindOf(name),root:inf[0]==='muscoli'||inf[0]==='inserzioni'?rootOf(base):''};
   const L=LAYERS[u.layer]||LAYERS[file];
   u.own=u.layer==='inserzioni'?(u.kind==='e'?M_E:M_O):toon(u.mat==='Cartilage'?FIX.Cartilage:L.c!==null?L.c:groupColor(u),u.layer==='nervi'||u.layer==='vasi');
   o.userData=u;o.material=u.own;meshes.push(o);byName.set(name,o);
  });
  scene.add(g.scene);FILES[file].loaded=true;ok();
 },undefined,ko))};
 return FILES[file].promise;
}

/* ---------- reperi: punta della linea di richiamo dell'etichetta nella fonte ---------- */
// i reperi delle ossa di destra valgono anche a sinistra: il modello è simmetrico
const LMS=[];
DATA.lm.forEach(([b,parent,p,d],i)=>{
 LMS.push({id:'r'+i,b,parent,p:new THREE.Vector3(...p),d:new THREE.Vector3(...d)});
 if(sideOf(parent)==='r')LMS.push({id:'l'+i,b,parent:parent.replace(/r$/,'l'),p:new THREE.Vector3(-p[0],p[1],p[2]),d:new THREE.Vector3(-d[0],d[1],d[2])});
});
const lmByParent=new Map();for(const l of LMS){if(!lmByParent.has(l.parent))lmByParent.set(l.parent,[]);lmByParent.get(l.parent).push(l);}
const MK={base:new THREE.MeshBasicMaterial({color:0x0f766e}),sel:new THREE.MeshBasicMaterial({color:0xfacc15})};
for(const k in MK)MK[k].userData.outlineParameters={visible:false};
const ball=new THREE.SphereGeometry(1,14,10);
const markers=new THREE.Group();scene.add(markers);
function markerOf(l){
 if(!l.mesh){l.mesh=new THREE.Mesh(ball,MK.base);l.mesh.position.copy(l.p).addScaledVector(l.d,0.001);markers.add(l.mesh);}
 return l.mesh;
}

/* ---------- camera ---------- */
let center=new THREE.Vector3(0,0.85,0),height=1.75;
const DIR={front:[0,0,1],back:[0,0,-1],right:[-1,0,0],left:[1,0,0],top:[0,1,0.001]};
let tween=null;
function fitDist(){const v=THREE.MathUtils.degToRad(camera.fov)/2,h=height*0.56/Math.tan(v);return Math.max(h,h/Math.min(1,camera.aspect*1.9));}
function setView(name,anim=true){
 // da lontano (o all'avvio) inquadra tutto il corpo; da vicino gira attorno al punto che si sta guardando
 const t=controls.target.clone(),d0=camera.position.distanceTo(t),far=d0>fitDist()*0.8||d0<0.1;
 const c=far?center.clone():t,dist=far?fitDist():d0;
 flyTo(c.clone().add(new THREE.Vector3(...DIR[name]).normalize().multiplyScalar(dist)),c,anim);
}
function flyTo(pos,target,anim=true){
 if(!anim){camera.position.copy(pos);controls.target.copy(target);controls.update();return;}
 tween={p0:camera.position.clone(),t0:controls.target.clone(),p1:pos,t1:target,s:performance.now()};
}
// inquadra un insieme di parti guardandole da fuori (dall'asse del corpo verso l'esterno)
function frameBox(box,minDist=0.25){
 const c=box.getCenter(new THREE.Vector3()),r=box.getSize(new THREE.Vector3()).length()/2;
 const out=new THREE.Vector3(c.x-center.x,0,c.z-0.02);if(Math.abs(out.x)<0.03)out.set(0,0,out.z<-0.03?-1:1);out.normalize();
 const dist=Math.max(minDist,r*1.35/Math.tan(THREE.MathUtils.degToRad(camera.fov)/2)/Math.min(1,camera.aspect));
 flyTo(c.clone().addScaledVector(out,dist).add(new THREE.Vector3(0,r*0.25,0)),c);
}
const boxOf=list=>{const b=new THREE.Box3();list.forEach(o=>b.expandByObject(o));return b;};

/* ---------- stato ---------- */
// part = parte selezionata; lm = repere; mus = muscolo aperto (radice del nome) sul lato side; bones = on | ghost | off
const S={part:null,lm:null,mus:null,side:'r',bones:'on',allLm:false,list:null,q:''};
const musOf=m=>m&&m.userData.root&&DATA.mus[m.userData.root]?m.userData.root:null;
// parti del muscolo aperto: le sue forme e le sue aree (anche quelle condivise, come il tendine del quadricipite)
function inFocus(m){
 const u=m.userData;if(!S.mus||(u.side&&u.side!==S.side))return false;
 if(u.layer==='muscoli')return u.root===S.mus;
 if(u.layer==='inserzioni'){const d=DATA.mus[S.mus];return d.o.includes(u.name)||d.e.includes(u.name);}
 return false;
}
function visible(m){
 const u=m.userData;if(u.hidden)return false;
 if(u.layer==='ossa')return S.bones!=='off';
 return V[u.layer]||inFocus(m);
}
function refresh(){
 for(const m of meshes){
  m.visible=visible(m);if(!m.visible)continue;
  const u=m.userData;
  m.material=m===S.part?M_SEL:u.layer==='ossa'&&S.bones==='ghost'?M_GHOST:u.layer==='muscoli'&&inFocus(m)?M_SEL:u.own;
 }
 // reperi: quelli dell'osso selezionato (o tutti, se richiesto) e quello aperto
 const want=new Set();
 if(S.bones==='on'){
  if(S.allLm)LMS.forEach(l=>want.add(l));
  const bone=S.part&&S.part.userData.layer==='ossa'?S.part.userData.name:S.lm?S.lm.parent:null;
  if(bone)(lmByParent.get(bone)||[]).forEach(l=>want.add(l));
 }
 if(S.lm)want.add(S.lm);
 for(const l of LMS){if(!want.has(l)){if(l.mesh)l.mesh.visible=false;continue;}const k=markerOf(l);k.visible=true;k.material=l===S.lm?MK.sel:MK.base;}
 panel();
}
const pickables=()=>meshes.filter(m=>m.visible&&!(m.userData.layer==='ossa'&&S.bones==='ghost'));

/* ---------- pannello ---------- */
const chip=(cls,attr,txt,small='')=>`<button class="chip ${cls}" ${attr}>${txt}${small?` <small>${small}</small>`:''}</button>`;
const FONTE='<p class="note">Modello: Z-Anatomy (CC BY-SA 4.0), derivato da BodyParts3D © DBCLS. Nomi: Terminologia Anatomica 2.</p>';
const FUN={'Abductor':'abduttori','Adductor':'adduttori','Extension':'estensori','Flexion':'flessori','External rotation':'extrarotatori','Internal rotator':'intrarotatori',
 'Flexion fingers':'flessori delle dita','Extensor extremities':'estensori delle dita','Levator':'elevatori','Depressor':'depressori','Orbicularis/Constrictor':'orbicolari e costrittori',
 'Biarticular':'biarticolari','Extension hand/foot':'estensori di mano e piede','Flexion hand/foot':'flessori di mano e piede','Ingestion':'deglutizione','Phonation':'fonazione',
 'Masticator':'masticatori','Superficial':'superficiali','Trapezius':'trapezio','Diaphragm':'diaframma'};
const TIPO={ossa:'Osso',muscoli:'Muscolo',fasce:'Fascia, tendine o borsa',legamenti:'Legamento o articolazione',inserzioni:'Area di inserzione',encefalo:'Encefalo',midollo:'Midollo spinale',
 nervi:'Nervo',meningi:'Meninge',sensi:'Organo di senso',vasi:'Vaso sanguigno',visceri:'Viscere'};
function panel(){
 const p=$('panel');let h='';
 if(S.mus){
  const m=DATA.mus[S.mus],c=m.card,has=k=>m[k].some(n=>sideOf(n)===S.side);
  h=`<div class="h">${m.n} <i>${sideName(S.side)}</i></div><div class="mut"><i>${m.la}</i>${FUN[m.mat]?' · gruppo: '+FUN[m.mat]:''}</div>`+
   (m.parts.length>1?`<div class="row"><b>Parti</b>: ${m.parts.map(itOf).join(' · ')}</div>`:'')+
   `<div class="row"><span class="tg o">ORIGINE</span> ${c?c.ot:has('o')?'area blu sul modello':'non indicata nella fonte'}</div>
    <div class="row"><span class="tg i">INSERZIONE</span> ${c?c.it:has('e')?'area arancione sul modello':'non indicata nella fonte'}</div>`+
   (c?`<div class="row"><b>Azione</b>: ${c.a}</div><div class="row"><b>Innervazione</b>: ${c.nv}</div>${c.nota?`<p class="mut">${c.nota}</p>`:''}<p class="note">I testi di origine, inserzione, azione e innervazione sono scritti dall'AI: da verificare su un atlante. Le aree colorate sul modello vengono dalla fonte.</p>`
     :'<p class="mut">Per questo muscolo non c\'è ancora il testo con azione e innervazione.</p>')+
   `<div class="chips"><button class="chip" data-side="${S.side==='r'?'l':'r'}">Lato ${S.side==='r'?'sinistro':'destro'}</button><button class="chip" data-go="muscles">Tutti i muscoli</button><button class="chip" data-go="home">Chiudi</button></div>`;
 }else if(S.lm){
  const l=S.lm;
  h=`<div class="h">${itOf(l.b)}</div><div class="mut"><i>${laOf(l.b)}</i> · ${l.b}</div><div class="row">Su: <b>${itOf(baseOf(l.parent))}</b> <i>${sideName(sideOf(l.parent))}</i></div>
   <div class="chips"><button class="chip" data-part="${l.parent}">Vai all'osso</button><button class="chip" data-go="home">Chiudi</button></div>`+FONTE;
 }else if(S.part){
  const u=S.part.userData,ls=u.layer==='ossa'?(lmByParent.get(u.name)||[]):[];
  h=`<div class="h">${itOf(u.base)} <i>${sideName(u.side)}</i></div><div class="mut"><i>${laOf(u.base)}</i> · ${u.base}</div>
   <div class="row">${TIPO[u.layer]||''}${u.g?' · '+itOf(u.g):''}${u.layer==='inserzioni'?' · '+(u.kind==='o'?'origine':'inserzione'):''}</div>`+
   (ls.length?`<div class="sub">Reperi su questa parte (${ls.length})</div><div class="chips">${ls.map(l=>chip('',`data-lm="${l.id}"`,itOf(l.b))).join('')}</div>`:'')+
   `<div class="chips">${musOf(S.part)?`<button class="chip on" data-mu="${musOf(S.part)}">Scheda del muscolo</button>`:''}<button class="chip" data-hide="1">Nascondi</button><button class="chip" data-go="layers">Strati</button><button class="chip" data-go="home">Chiudi</button></div>`+FONTE;
 }else if(S.list==='layers'){
  const on=(v,attr,txt)=>`<button class="chip${v?' on':''}" ${attr}>${txt}</button>`,lay=k=>on(V[k],`data-layer="${k}"`,LAYERS[k].n);
  h=`<div class="h">Strati</div>${S.loading?'<p class="mut">Carico lo strato…</p>':''}
   <div class="sub">Ossa</div><div class="chips">${on(S.bones==='on','data-bones="on"','Visibili')}${on(S.bones==='ghost','data-bones="ghost"','Trasparenti')}${on(S.bones==='off','data-bones="off"','Nascoste')}${on(S.allLm,'data-lmt="1"','Tutti i reperi')}</div>
   <div class="sub">Apparato locomotore</div><div class="chips">${lay('muscoli')}${lay('fasce')}${lay('legamenti')}${lay('inserzioni')}</div>
   <div class="sub">Sistema nervoso</div><div class="chips">${lay('encefalo')}${lay('midollo')}${lay('nervi')}${lay('meningi')}${lay('sensi')}</div>
   <div class="sub">Altri sistemi</div><div class="chips">${lay('vasi')}${lay('visceri')}</div>
   <div class="chips"><button class="chip" data-go="home">Chiudi</button></div>`;
 }else if(S.list==='muscles'){
  const q=S.q.toLowerCase(),all=Object.entries(DATA.mus).filter(([r,m])=>!q||m.n.toLowerCase().includes(q)||r.includes(q)).sort((a,b)=>a[1].n.localeCompare(b[1].n));
  const gs=[...new Set(all.map(([,m])=>m.g))].sort((a,b)=>itOf(a).localeCompare(itOf(b)));
  h=`<div class="h">Muscoli (${all.length})</div><input id="q" placeholder="Cerca un muscolo…" value="${S.q}">`+
   gs.map(g=>`<div class="sub">${itOf(g)||'Altri'}</div><div class="chips">${all.filter(([,m])=>m.g===g).map(([r,m])=>chip(m.card?'on':'',`data-mu="${r}"`,m.n.replace(/^Muscol[oi] /,''))).join('')}</div>`).join('')+
   `<p class="note">In verde i muscoli che hanno anche il testo con azione e innervazione.</p><div class="chips"><button class="chip" data-go="home">Chiudi</button></div>`;
 }else if(S.list==='search'){
  const q=S.q.toLowerCase().trim(),res=[];
  if(q.length>1){
   const seen=new Set();
   for(const n in DATA.objs){const b=baseOf(n),k=b+'|'+DATA.objs[n][0];if(seen.has(k)||DATA.objs[n][0]==='inserzioni')continue;seen.add(k);if(itOf(b).toLowerCase().includes(q)||b.toLowerCase().includes(q))res.push([itOf(b),TIPO[DATA.objs[n][0]]||'',`data-find="${n}"`]);}
   for(const l of LMS)if(l.id[0]==='r'&&(itOf(l.b).toLowerCase().includes(q)||l.b.toLowerCase().includes(q)))res.push([itOf(l.b),'repere',`data-lm="${l.id}"`]);
  }
  h=`<div class="h">Cerca</div><input id="q" placeholder="Nome di un osso, muscolo, nervo, repere…" value="${S.q}">
   <div class="chips">${res.sort((a,b)=>a[0].length-b[0].length).slice(0,40).map(r=>chip('',r[2],r[0],r[1])).join('')}</div>${q.length>1&&!res.length?'<p class="mut">Nessun risultato.</p>':''}
   <div class="chips"><button class="chip" data-go="home">Chiudi</button></div>`;
 }else{
  h=`<div class="h">Atlante 3D</div><p class="mut">Tocca una parte per vederne il nome. Un dito ruota, due dita ingrandiscono e spostano, doppio tocco avvicina.</p>
   <div class="chips"><button class="chip" data-go="layers">🧩 Strati</button><button class="chip" data-go="muscles">💪 Muscoli</button><button class="chip" data-go="search">🔎 Cerca</button></div>`+FONTE;
 }
 const keep=document.activeElement&&document.activeElement.id==='q';
 p.innerHTML=h;if(!keep)p.scrollTop=0;
 if(keep){const q=$('q');if(q){q.focus();q.setSelectionRange(q.value.length,q.value.length);}}
}

/* ---------- azioni ---------- */
function selectPart(m,fly=false){S.mus=null;S.lm=null;S.part=m;S.list=null;if(m&&m.userData.side)S.side=m.userData.side;refresh();if(m&&fly)frameBox(boxOf([m]),0.2);}
function showLandmark(l,fly=true){S.mus=null;S.part=null;S.lm=l;S.list=null;refresh();if(fly)flyTo(l.p.clone().addScaledVector(l.d,0.3),l.p.clone());}
async function showMuscle(root,side=S.side,fly=true){
 S.mus=root;S.side=side;S.part=null;S.lm=null;S.list=null;
 if(!FILES.muscoli||!FILES.muscoli.loaded||!FILES.inserzioni||!FILES.inserzioni.loaded){S.loading=true;panel();await Promise.all([loadFile('muscoli'),loadFile('inserzioni')]);S.loading=false;}
 refresh();
 const list=meshes.filter(m=>inFocus(m));if(fly&&list.length)frameBox(boxOf(list));
}
const INSIDE=['encefalo','midollo','meningi','sensi','visceri']; // stanno dentro le ossa: accendendoli le rendo trasparenti
async function toggleLayer(k){
 const f=LAYERS[k].file;
 if(!FILES[f]||!FILES[f].loaded){S.loading=true;panel();try{await loadFile(f);}catch(e){S.loading=false;panel();return;}S.loading=false;}
 V[k]=!V[k];
 if(V[k]&&INSIDE.includes(k)&&S.bones==='on')S.bones='ghost';
 refresh();
}
async function findPart(name){
 const k=DATA.objs[name][0];await loadFile(LAYERS[k].file);
 if(k!=='ossa'&&!V[k]){V[k]=true;if(INSIDE.includes(k)&&S.bones==='on')S.bones='ghost';}
 const m=byName.get(name);if(m){m.userData.hidden=false;selectPart(m,true);}
}

/* ---------- tocco ---------- */
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),tmp=new THREE.Vector3();
function pickPart(x,y){const r=renderer.domElement.getBoundingClientRect();ndc.set((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1);ray.setFromCamera(ndc,camera);const h=ray.intersectObjects(pickables(),false)[0];return h?h.object:null;}
// il repere visibile più vicino al dito, entro 22 px e non coperto
function pickLandmark(x,y){
 const r=renderer.domElement.getBoundingClientRect();let best=null,bd=22;
 for(const l of LMS){
  if(!l.mesh||!l.mesh.visible)continue;
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
 const m=pickPart(e.clientX,e.clientY),now=performance.now();
 if(m&&now-lastTap<350){const b=boxOf([m]),c=b.getCenter(new THREE.Vector3()),s=b.getSize(new THREE.Vector3()).length(),dir=camera.position.clone().sub(controls.target).normalize();
  flyTo(c.clone().add(dir.multiplyScalar(Math.max(controls.minDistance,s*2.2))),c);} // doppio tocco: avvicina
 else if(m&&S.mus&&inFocus(m)){/* tocco sul muscolo già aperto: resta la scheda */}
 else if(m||!S.mus)selectPart(m);
 lastTap=now;
});

/* ---------- pulsanti ---------- */
$('bar').addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.v)setView(b.dataset.v);
 else if(b.id==='outline'){outline=!outline;b.classList.toggle('on',outline);}
 else if(b.id==='layers'){S.mus=S.lm=S.part=null;S.list='layers';refresh();}
});
$('panel').addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;const d=b.dataset;
 if(d.mu)showMuscle(d.mu);
 else if(d.lm)showLandmark(LMS.find(l=>l.id===d.lm));
 else if(d.part){const m=byName.get(d.part);if(m)selectPart(m,true);}
 else if(d.find)findPart(d.find);
 else if(d.side)showMuscle(S.mus,d.side);
 else if(d.go){S.mus=S.lm=S.part=null;S.q='';S.list=d.go==='home'?null:d.go;refresh();}
 else if(d.hide){if(S.part)S.part.userData.hidden=true;S.part=null;refresh();}
 else if(d.bones){S.bones=d.bones;refresh();}
 else if(d.lmt){S.allLm=!S.allLm;refresh();}
 else if(d.layer)toggleLayer(d.layer);
});
$('panel').addEventListener('input',e=>{if(e.target.id==='q'){S.q=e.target.value;panel();}});

/* ---------- avvio e ciclo di disegno ---------- */
function resize(){
 const w=view.clientWidth,h=view.clientHeight;if(!w||!h)return;
 renderer.setSize(w,h,false);effect.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(view);resize();
try{await loadFile('ossa');}catch(e){$('msg').textContent='Non riesco a caricare il modello: '+e.message;throw e;}
{const box=boxOf(meshes);box.getCenter(center);height=box.getSize(new THREE.Vector3()).y;}
controls.minDistance=height*0.04;controls.maxDistance=height*3.2;
setView('front',false);$('msg').remove();refresh();
let frames=0,last=performance.now();
renderer.setAnimationLoop(now=>{
 if(tween){const k=Math.min(1,(now-tween.s)/450),e=k*k*(3-2*k);
  camera.position.lerpVectors(tween.p0,tween.p1,e);controls.target.lerpVectors(tween.t0,tween.t1,e);if(k>=1)tween=null;}
 controls.update();
 // i reperi tengono una dimensione leggibile a qualsiasi zoom
 const px=2*Math.tan(THREE.MathUtils.degToRad(camera.fov)/2)/view.clientHeight;
 for(const l of LMS)if(l.mesh&&l.mesh.visible){const d=camera.position.distanceTo(l.mesh.position);l.mesh.scale.setScalar(Math.max(0.0012,d*px*(l===S.lm?7:4.5)));}
 if(outline)effect.render(scene,camera);else renderer.render(scene,camera);
 frames++;
 if(now-last>=1000){$('fps').textContent=`${Math.round(frames*1000/(now-last))} fps · ${Math.round(renderer.info.render.triangles/1000)}k triangoli`;frames=0;last=now;}
});
window.__proto={DATA,S,V,LAYERS,meshes,byName,LMS,camera,controls,renderer,refresh,toggleLayer,showMuscle,showLandmark,selectPart,findPart,pickPart,pickLandmark,setView};

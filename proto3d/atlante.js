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
// origine o inserzione: dai dati (corretti dove la fonte li scambia), altrimenti dal suffisso del nome
const KIND={};for(const d of Object.values(DATA.mus)){d.o.forEach(n=>KIND[n]='o');d.e.forEach(n=>KIND[n]='e');}
const kindOf=n=>KIND[n]||(n.match(/\.([oe])\d*[rl]$/)||[,''])[1];
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
 'Cartilage':0xb8d8e6,'Ligament':0xdfe8ee,'Articular capsule':0xcfdbe3,'Bone':0xefe6d2,'White matter':0xf3efe6,'LCR':0x8fd0ea,
 // strutture profonde dell'encefalo: un colore ciascuna, per distinguerle nella scomposizione e nelle sezioni
 'Caudate nucleus':0xf5a623,'Putamen':0xe07b39,'Lentiform nucleus':0xeaa06a,'Globus pallidus':0xb94e1c,'Hippocampus':0x8e6bbf,'Amygdaloid body':0xd2384a,'Septal nuclei':0xd98bb5,
 'Thalamus':0xf0a8c0,'Hypothalamus':0xf28b82,'Mamillary body':0xe0607a,'Fornix':0xc9a66b,'Corpus callosum':0xe9dcc0,'Red nucleus':0xc0392b,'Optic chiasm':0xf2c200,'Optic tract':0xf2c200};
function groupColor(u){
 const key=FIX[u.base]!==undefined?u.base:u.mat||u.g||u.base;
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
   u.own=u.layer==='inserzioni'?(u.kind==='e'?M_E:M_O):toon(u.mat==='Cartilage'&&u.layer!=='meningi'?FIX.Cartilage:L.c!==null?L.c:groupColor(u),u.layer==='nervi'||u.layer==='vasi');
   u.st=stratumOf(u);o.userData=u;o.material=u.own;meshes.push(o);byName.set(name,o);
  });
  scene.add(g.scene);FILES[file].loaded=true;
  if(FILES.encefalo&&FILES.encefalo.loaded&&FILES.meningi&&FILES.meningi.loaded)makeShells();
  ok();
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

/* ---------- muscoli: punti di origine (blu) e inserzione (arancione) uniti da una linea viola ---------- */
// il punto è il centro dell'area di origine o di inserzione della fonte, portato sulla sua superficie
const PL={o:new THREE.MeshBasicMaterial({color:0x2563eb,depthTest:false}),e:new THREE.MeshBasicMaterial({color:0xea580c,depthTest:false}),
 line:new THREE.MeshBasicMaterial({color:0x7c3aed,transparent:true,opacity:0.85,depthTest:false})};
for(const k in PL)PL[k].userData.outlineParameters={visible:false};
const cyl=new THREE.CylinderGeometry(1,1,1,8,1,true);
const pts=new THREE.Group();scene.add(pts);
const areaPt=new Map();
function areaPoint(m){
 if(areaPt.has(m))return areaPt.get(m);
 m.updateWorldMatrix(true,false);
 const a=m.geometry.attributes.position,v=new THREE.Vector3(),c=new THREE.Vector3();
 for(let i=0;i<a.count;i++)c.add(v.fromBufferAttribute(a,i).applyMatrix4(m.matrixWorld));
 c.divideScalar(a.count);
 let best=c,bd=Infinity;
 for(let i=0;i<a.count;i++){v.fromBufferAttribute(a,i).applyMatrix4(m.matrixWorld);const d=v.distanceToSquared(c);if(d<bd){bd=d;best=v.clone();}}
 areaPt.set(m,best);return best;
}
function drawPoints(roots,side){
 while(pts.children.length)pts.remove(pts.children[0]);
 const out=[];
 for(const r of roots){
  const d=DATA.mus[r];if(!d)continue;
  const get=k=>d[k].filter(n=>!sideOf(n)||sideOf(n)===side).map(n=>byName.get(n)).filter(Boolean).map(areaPoint);
  const O=get('o'),E=get('e');
  const dot=(p,k)=>{const m=new THREE.Mesh(ball,PL[k]);m.position.copy(p);m.renderOrder=11;m.userData.dot=1;pts.add(m);out.push({p,k,r});};
  O.forEach(p=>dot(p,'o'));E.forEach(p=>dot(p,'e'));
  if(!O.length||!E.length)continue;
  const near=(p,L)=>L.reduce((a,b)=>a.distanceTo(p)<b.distanceTo(p)?a:b);
  const seg=new Set(),line=(a,b)=>{const k=a.toArray()+'|'+b.toArray();if(seg.has(k))return;seg.add(k);
   const m=new THREE.Mesh(cyl,PL.line),dd=b.clone().sub(a);m.position.copy(a).addScaledVector(dd,0.5);
   m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dd.clone().normalize());m.userData.len=dd.length();m.renderOrder=10;pts.add(m);};
  O.forEach(p=>line(p,near(p,E)));E.forEach(p=>{if(![...seg].some(s=>s.endsWith(p.toArray()+'')))line(near(p,O),p);});
 }
 return out;
}
// reperi della fonte vicini a un punto (entro 2,5 cm), per dare un nome alle zone di origine e inserzione
function lmNear(p,max=0.025){let best=null,bd=max;for(const l of LMS){const d=l.p.distanceTo(p);if(d<bd){bd=d;best=l;}}return best;}

/* ---------- gruppi di muscoli e nomi comuni ---------- */
const COMBO={
 zampa:{n:"Zampa d'oca",la:'Pes anserinus',mus:['sartorius','gracilis','semitendinosus'],fly:'e',
  t:"Inserzione comune dei tendini di sartorio, gracile e semitendinoso sulla faccia mediale della tibia prossimale, sotto il condilo mediale e dietro la tuberosità tibiale. Tra i tendini e il legamento collaterale mediale c'è la borsa anserina (borsite anserina: dolore mediale del ginocchio). I tre muscoli flettono il ginocchio e lo ruotano internamente; rinforzano il lato mediale."},
 ischio:{n:'Muscoli ischiocrurali',la:'Musculi ischiocrurales',mus:['semitendinosus','semimembranosus','biceps femoris'],
  t:"Semitendinoso, semimembranoso e capo lungo del bicipite femorale originano dalla tuberosità ischiatica: estendono l'anca e flettono il ginocchio. Il capo breve del bicipite origina dalla linea aspra e non agisce sull'anca. Innervazione: nervo sciatico (porzione tibiale; capo breve del bicipite: porzione peroneale)."},
 cuffia:{n:'Cuffia dei rotatori',la:'Cuff musculotendinea',mus:['supraspinatus','infraspinatus','teres minor','subscapularis'],
  t:"Sovraspinato, infraspinato, piccolo rotondo (sul grande tubercolo) e sottoscapolare (sul piccolo tubercolo): tengono la testa dell'omero centrata nella glenoide. Il tendine del sovraspinato, sotto l'arco coraco-acromiale, è quello che si lesiona più spesso."},
 sura:{n:'Tricipite della sura',la:'Musculus triceps surae',mus:['gastrocnemius','soleus'],
  t:"Gastrocnemio (due capi, dai condili femorali) e soleo (da tibia e fibula) si inseriscono con il tendine d'Achille sulla tuberosità del calcagno: flessione plantare della caviglia. Il gastrocnemio flette anche il ginocchio. Innervazione: nervo tibiale (S1-S2, riflesso achilleo)."},
 quadricipite:{n:'Quadricipite femorale',la:'Musculus quadriceps femoris',mus:['rectus femoris','vastus lateralis','vastus medialis','vastus intermedius'],
  t:"Retto femorale (dalla SIAI e dal solco sopracetabolare) e tre vasti (dal femore) si uniscono nel tendine quadricipitale sulla rotula; il legamento rotuleo continua fino alla tuberosità tibiale. Estende il ginocchio; il retto flette anche l'anca. Innervazione: nervo femorale (L2-L4, riflesso rotuleo)."},
};
// abbreviazioni e nomi comuni -> nome inglese di un repere o di una parte, muscolo (mu:) o gruppo (#)
const SYN={'sias':['Anterior superior iliac spine'],'asis':['Anterior superior iliac spine'],'siai':['Anterior inferior iliac spine'],'aiis':['Anterior inferior iliac spine'],
 'sips':['Posterior superior iliac spine'],'psis':['Posterior superior iliac spine'],'sipi':['Posterior inferior iliac spine'],'piis':['Posterior inferior iliac spine'],
 "zampa d'oca":['#zampa','Anserine bursa'],'pes anserinus':['#zampa'],'anserin':['#zampa','Anserine bursa'],'ischiocrurali':['#ischio'],'hamstring':['#ischio'],'flessori del ginocchio':['#ischio'],
 'cuffia dei rotatori':['#cuffia'],'rotatori della spalla':['#cuffia'],'tricipite della sura':['#sura'],'polpaccio':['#sura'],'achille':['#sura','Calcaneal tuberosity'],
 'quadricipite':['#quadricipite'],'scm':['mu:sternocleidomastoid'],'scom':['mu:sternocleidomastoid'],'tfl':['mu:tensor fasciae latae'],'tensore':['mu:tensor fasciae latae'],
 'gerdy':['Tubercle of iliotibial tract'],'lister':['Dorsal radial tubercle'],'louis':['Sternal angle'],'angolo di louis':['Sternal angle'],'pomo d\'adamo':['Laryngeal prominence'],
 'epitroclea':['Medial epicondyle of humerus'],'tabacchiera':['Scaphoid bone'],'astragalo':['Talus'],'perone':['Fibula'],'rotula':['Patella'],'scafoide':['Scaphoid bone','Navicular bone'],
 'piramidale':['Triquetrum bone'],'semilunare':['Lunate bone'],'uncinato':['Hamate bone'],'capitato':['Capitate bone'],'epistrofeo':['Axis (C2)'],'dente':['Dens axis'],
 'broca':['Opercular part of inferior frontal gyrus','Triangular part of inferior frontal gyrus'],'wernicke':['Superior temporal gyrus (Lateral part)','Temporal plane'],
 'rolando':['Central sulcus'],'silvio':['Lat_Fis-post','Aqueduct of midbrain'],'heschl':['Transverse temporal gyri'],'amigdala':['Amygdaloid body'],'corteccia motoria':['Precentral gyrus'],
 'corteccia sensitiva':['Postcentral gyrus'],'area visiva':['Calcarine sulcus'],'fusiforme':['Lateral occipitotemporal gyrus'],'nuclei della base':['Caudate nucleus','Putamen','Globus pallidus'],
 'dura madre':['~dura','Falx cerebri','Tentorium cerebelli'],'aracnoide':['~aracnoide'],'falce':['Falx cerebri'],'tentorio':['Tentorium cerebelli']};
const norm=s=>s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[’`´]/g,"'").trim();

/* ---------- encefalo: strati dalla dura madre ai ventricoli ---------- */
const ST=[
 {n:'Dura madre',t:"Meninge più esterna, spessa e fibrosa, aderente alle ossa del cranio. Forma la falce cerebrale e il tentorio e contiene i seni venosi. Tra dura e osso: spazio epidurale (ematoma epidurale, arterioso); sotto la dura: spazio subdurale (ematoma subdurale, venoso)."},
 {n:'Aracnoide',t:"Meninge intermedia, sottile e trasparente, che passa sopra i solchi. Sotto di essa lo spazio subaracnoideo contiene il liquido cefalorachidiano e le arterie del cervello (emorragia subaracnoidea da aneurisma). La pia madre, aderente alla corteccia, non è disegnata."},
 {n:'Corteccia cerebrale e cervelletto',t:"Sostanza grigia della superficie, divisa in lobi (frontale, parietale, temporale, occipitale, insula, limbico) da solchi e scissure. Dietro e sotto: il cervelletto."},
 {n:'Sostanza bianca e commissure',t:"Fibre mieliniche sotto la corteccia: associative (tra aree dello stesso emisfero), commissurali (corpo calloso e commissura anteriore, tra i due emisferi) e di proiezione (capsula interna, verso tronco e midollo). Il setto pellucido separa i ventricoli laterali. Con questo strato va via anche il nucleo lenticolare intero, per mostrare putamen e globo pallido."},
 {n:'Nuclei della base: caudato e putamen',t:"Striato: nucleo caudato (a C, lungo il ventricolo laterale) e putamen (laterale alla capsula interna; con il globo pallido forma il nucleo lenticolare). Controllo del movimento, malattie di Parkinson e Huntington."},
 {n:'Globo pallido e sistema limbico',t:"Globo pallido (uscita dei nuclei della base). Sistema limbico profondo: ippocampo (memoria), amigdala (emozioni, paura), nuclei del setto, fornice e stria terminale."},
 {n:'Diencefalo',t:"Talamo (smistamento delle vie sensitive e motorie), ipotalamo (omeostasi, ipofisi), corpi mammillari, corpi genicolati, abenula. Davanti: chiasma e tratti ottici. Nei ventricoli: plessi corioidei."},
 {n:'Tronco encefalico',t:"Mesencefalo, ponte e bulbo, con i nuclei dei nervi cranici dal III al XII, il nucleo rosso, i collicoli, le piramidi e le olive."},
 {n:'Ventricoli',t:"Cavità piene di liquido cefalorachidiano: due ventricoli laterali, terzo ventricolo, acquedotto di Silvio, quarto ventricolo."}];
const CORTEX=['Frontal lobe','Parietal lobe','Temporal lobe','Occipital lobe','Limbic lobe','Insula','Interlobar sulci','Inferior frontal sulcus','Cerebellum'];
function stratumOf(u){
 if(u.layer==='meningi')return u.base==='Choroid plexus'?6:u.base==='Cranial arachnoid mater'?1:0;
 if(u.layer!=='encefalo')return -1;
 const b=u.base;
 if(u.mat==='LCR')return 8;
 if(b==='Lentiform nucleus')return 3; // contiene putamen e globo pallido: va via con la sostanza bianca per lasciarli vedere
 if(/^(Caudate nucleus|Putamen)$/.test(b))return 4;
 if(/^(Globus pallidus|Hippocampus|Amygdaloid body|Septal nuclei|Fornix|Stria terminalis|Hippocampal commissure)$/.test(b))return 5;
 if(/^(White matter of telencephalon|Corpus callosum|Anterior commissure|Septum pellucidum)$/.test(b))return 3;
 if(u.g==='Diencephalon'||u.g==='White matter of diencephalon')return 6;
 if(CORTEX.includes(u.g))return 2;
 if(u.g==='Anterior segment of eyeball')return 0;
 return 7;
}
// dura madre e aracnoide craniche non sono nella fonte: le genero avvolgendo la corteccia (forma schematica)
DATA.names['Cranial dura mater']=['Dura madre cranica','Dura mater cranialis'];
DATA.names['Cranial arachnoid mater']=['Aracnoide cranica','Arachnoidea mater cranialis'];
DATA.desc=DATA.desc||{};
DATA.desc['Cranial dura mater']=ST[0].t+' Forma schematica generata dall\'app attorno all\'encefalo: non viene dalla fonte.';
DATA.desc['Cranial arachnoid mater']=ST[1].t+' Forma schematica generata dall\'app attorno all\'encefalo: non viene dalla fonte.';
function makeShells(){
 if(byName.has('~dura'))return;
 const src=meshes.filter(m=>m.userData.layer==='encefalo'&&m.userData.st===2);if(!src.length)return;
 const c=boxOf(src).getCenter(new THREE.Vector3()),NU=96,NV=48,R=new Float32Array(NU*NV),v=new THREE.Vector3();
 const bin=(x,y,z,r)=>{const iu=Math.floor((Math.atan2(z,x)/(2*Math.PI)+0.5)*NU)%NU,iv=Math.min(NV-1,Math.floor(Math.acos(THREE.MathUtils.clamp(y/r,-1,1))/Math.PI*NV));return iv*NU+iu;};
 for(const m of src){m.updateWorldMatrix(true,false);const a=m.geometry.attributes.position;
  for(let i=0;i<a.count;i++){v.fromBufferAttribute(a,i).applyMatrix4(m.matrixWorld).sub(c);const r=v.length();const k=bin(v.x,v.y,v.z,r);if(r>R[k])R[k]=r;}}
 const nb=(k,f)=>{const iu=k%NU,iv=(k-iu)/NU;for(let dv=-1;dv<=1;dv++)for(let du=-1;du<=1;du++){const jv=iv+dv;if(jv<0||jv>=NV)continue;f(jv*NU+(iu+du+NU)%NU);}};
 for(let pass=0,empty=1;empty&&pass<200;pass++){empty=0;const T=R.slice();for(let k=0;k<R.length;k++)if(!R[k]){let s=0,n=0;nb(k,j=>{if(T[j]){s+=T[j];n++;}});if(n)R[k]=s/n;else empty=1;}}
 {const T=R.slice();for(let k=0;k<R.length;k++)nb(k,j=>{if(T[j]>R[k])R[k]=T[j];});}       // chiude i solchi
 for(let pass=0;pass<3;pass++){const T=R.slice();for(let k=0;k<R.length;k++){let s=0,n=0;nb(k,j=>{s+=T[j];n++;});R[k]=s/n;}} // leviga
 const at=(x,y,z)=>{const r=Math.hypot(x,y,z),fu=(Math.atan2(z,x)/(2*Math.PI)+0.5)*NU-0.5,fv=Math.acos(THREE.MathUtils.clamp(y/r,-1,1))/Math.PI*NV-0.5;
  const u0=Math.floor(fu),v0=Math.max(0,Math.min(NV-2,Math.floor(fv))),a=fu-u0,b=Math.max(0,Math.min(1,fv-v0)),g=(u,w)=>R[w*NU+((u%NU)+NU)%NU];
  return (g(u0,v0)*(1-a)+g(u0+1,v0)*a)*(1-b)+(g(u0,v0+1)*(1-a)+g(u0+1,v0+1)*a)*b;};
 const shell=(name,base,off,mat)=>{
  const geo=new THREE.SphereGeometry(1,128,64),p=geo.attributes.position;
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const r=at(v.x,v.y,v.z)+off;v.multiplyScalar(r).add(c);p.setXYZ(i,v.x,v.y,v.z);}
  geo.computeVertexNormals();
  const m=new THREE.Mesh(geo,mat);m.userData={name,base,side:'',layer:'meningi',mat:'',g:'Cranial meninges',kind:'',root:'',own:mat};m.userData.st=stratumOf(m.userData);
  scene.add(m);meshes.push(m);byName.set(name,m);return m;};
 const ara=new THREE.MeshToonMaterial({color:0xdce8f3,gradientMap:ramp,transparent:true,opacity:0.55,depthWrite:false});ara.userData.outlineParameters={visible:false};
 shell('~aracnoide','Cranial arachnoid mater',0.0012,ara).renderOrder=2;
 shell('~dura','Cranial dura mater',0.0028,new THREE.MeshToonMaterial({color:0xcbb59a,gradientMap:ramp})); // fuori da colMat: nelle sezioni resta a una faccia, così l'interno non copre il taglio
}
// piani di sezione: si taglia tutta la scena con un piano che attraversa l'encefalo
const cutPlane=new THREE.Plane(),AX={axial:{n:[0,-1,0],i:1,v:'top',it:'Assiale'},coronal:{n:[0,0,-1],i:2,v:'front',it:'Coronale'},sagittal:{n:[1,0,0],i:0,v:'right',it:'Sagittale'}};
let brainBox=null;

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
// combo = gruppo di muscoli aperto (zampa d'oca…); mv = vista del muscolo: both | shape | lines
// cut = piano di sezione {ax, t}; lev = strati dell'encefalo tolti (0 = tutti presenti)
const S={part:null,lm:null,mus:null,combo:null,side:'r',bones:'on',allLm:false,list:null,q:'',mv:'both',cut:{ax:null,t:0.5},lev:0};
const musOf=m=>m&&m.userData.root&&DATA.mus[m.userData.root]?m.userData.root:null;
const roots=()=>S.combo?COMBO[S.combo].mus:S.mus?[S.mus]:[];
// parti del muscolo aperto: le sue forme e le sue aree (anche quelle condivise, come il tendine del quadricipite)
function inFocus(m){
 const u=m.userData,rs=roots();if(!rs.length||(u.side&&u.side!==S.side))return false;
 if(u.layer==='muscoli')return rs.includes(u.root);
 if(u.layer==='inserzioni')return rs.some(r=>{const d=DATA.mus[r];return d&&(d.o.includes(u.name)||d.e.includes(u.name));});
 return false;
}
function visible(m){
 const u=m.userData;if(u.hidden)return false;
 if(u.layer==='ossa')return S.bones!=='off';
 if(S.lev&&u.st>=0&&u.st<S.lev)return false;
 return V[u.layer]||(inFocus(m)&&S.mv!=='lines');
}
function refresh(noPanel){
 const rs=roots();
 if(rs.length&&S.mv!=='shape')S.pts=drawPoints(rs,S.side);else{while(pts.children.length)pts.remove(pts.children[0]);S.pts=[];}
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
 applyCut();
 if(!noPanel)panel();
}
function applyCut(){
 const ax=S.cut.ax&&brainBox?AX[S.cut.ax]:null;
 if(ax){const p=brainBox.min.clone().lerp(brainBox.max,S.cut.t),n=new THREE.Vector3(...ax.n);cutPlane.setFromNormalAndCoplanarPoint(n,p);renderer.clippingPlanes=[cutPlane];}
 else renderer.clippingPlanes=[];
 // con il taglio si vede anche l'interno delle superfici: la sezione sembra piena
 const side=ax?THREE.DoubleSide:THREE.FrontSide;
 for(const m of [...colMat.values(),M_SEL,M_O,M_E])m.side=side;
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
const AI='<p class="note">Testo scritto dall\'AI: da verificare su un atlante.</p>';
const descOf=b=>DATA.desc&&DATA.desc[b];
// viste del muscolo e reperi vicini ai punti di origine e inserzione
function musTools(){
 const on=(k,t)=>`<button class="chip${S.mv===k?' on':''}" data-mv="${k}">${t}</button>`;
 const near=[];for(const q of S.pts||[]){const l=lmNear(q.p);if(l&&!near.some(x=>x[0]===l&&x[1]===q.k))near.push([l,q.k]);}
 return `<div class="sub">Vista</div><div class="chips">${on('both','Entrambe')}${on('shape','Forma e aree')}${on('lines','Punti e linee')}</div>`+
  (near.length?`<div class="sub">Reperi vicini ai punti</div><div class="chips">${near.map(([l,k])=>chip(k==='o'?'o':'i',`data-lm="${l.id}"`,itOf(l.b),k==='o'?'origine':'inserzione')).join('')}</div>`:'');
}
function panel(){
 const p=$('panel');let h='';
 if(S.combo){
  const c=COMBO[S.combo];
  h=`<div class="h">${c.n} <i>lato ${sideName(S.side)}</i></div><div class="mut"><i>${c.la}</i></div><p>${c.t}</p>
   <div class="chips">${c.mus.map(r=>chip('',`data-mu="${r}"`,DATA.mus[r].n.replace(/^Muscol[oi] /,''))).join('')}</div>`+musTools()+
   `<div class="chips"><button class="chip" data-side="${S.side==='r'?'l':'r'}">Lato ${S.side==='r'?'sinistro':'destro'}</button><button class="chip" data-go="home">Chiudi</button></div>`+AI;
 }else if(S.mus){
  const m=DATA.mus[S.mus],c=m.card,has=k=>m[k].some(n=>sideOf(n)===S.side);
  h=`<div class="h">${m.n} <i>${sideName(S.side)}</i></div><div class="mut"><i>${m.la}</i>${FUN[m.mat]?' · gruppo: '+FUN[m.mat]:''}</div>`+
   (m.parts.length>1?`<div class="row"><b>Parti</b>: ${m.parts.map(itOf).join(' · ')}</div>`:'')+
   `<div class="row"><span class="tg o">ORIGINE</span> ${c?c.ot:has('o')?'area blu sul modello':'non indicata nella fonte'}</div>
    <div class="row"><span class="tg i">INSERZIONE</span> ${c?c.it:has('e')?'area arancione sul modello':'non indicata nella fonte'}</div>`+
   (c?`<div class="row"><b>Azione</b>: ${c.a}</div><div class="row"><b>Innervazione</b>: ${c.nv}</div>${c.nota?`<p class="mut">${c.nota}</p>`:''}<p class="note">I testi di origine, inserzione, azione e innervazione sono scritti dall'AI: da verificare su un atlante. Le aree colorate sul modello vengono dalla fonte.</p>`
     :'<p class="mut">Per questo muscolo non c\'è ancora il testo con azione e innervazione.</p>')+
   (m.fix?'<p class="note">Nella fonte origine e inserzione di questo muscolo erano scambiate: qui sono corrette.</p>':'')+musTools()+
   `<div class="chips"><button class="chip" data-side="${S.side==='r'?'l':'r'}">Lato ${S.side==='r'?'sinistro':'destro'}</button><button class="chip" data-go="muscles">Tutti i muscoli</button><button class="chip" data-go="home">Chiudi</button></div>`;
 }else if(S.lm){
  const l=S.lm;
  const t=descOf(l.b),mus=musclesAt(l);
  h=`<div class="h">${itOf(l.b)}</div><div class="mut"><i>${laOf(l.b)}</i> · ${l.b}</div><div class="row">Su: <b>${itOf(baseOf(l.parent))}</b> <i>${sideName(sideOf(l.parent))}</i></div>`+
   (t?`<p>${t}</p>`:'<p class="mut">La descrizione di questo repere non è ancora scritta.</p>')+
   (mus.length?`<div class="sub">Muscoli con origine o inserzione qui vicino</div><div class="chips">${mus.map(([r,k])=>chip(k==='o'?'o':'i',`data-mu="${r}"`,DATA.mus[r].n.replace(/^Muscol[oi] /,''),k==='o'?'origine':'inserzione')).join('')}</div>`:'')+
   (DATA.objs[l.parent]?'':'<p class="mut">La forma di questa parte non è nel modello (licenza non commerciale nella fonte): resta solo il punto.</p>')+
   `<div class="chips">${DATA.objs[l.parent]?`<button class="chip" data-part="${l.parent}">Vai all'osso</button>`:''}<button class="chip" data-go="home">Chiudi</button></div>`+(t?AI:'')+FONTE;
 }else if(S.part){
  const u=S.part.userData,ls=u.layer==='ossa'?(lmByParent.get(u.name)||[]):[],t=descOf(u.base),brain=u.layer==='encefalo'||u.layer==='meningi';
  h=`<div class="h">${itOf(u.base)} <i>${sideName(u.side)}</i></div><div class="mut"><i>${laOf(u.base)}</i> · ${u.base}</div>
   <div class="row">${TIPO[u.layer]||''}${u.g&&u.g!=='Cranial meninges'?' · '+itOf(u.g):''}${u.layer==='inserzioni'?' · '+(u.kind==='o'?'origine':'inserzione'):''}${brain&&u.st>=0?' · strato: '+ST[u.st].n.toLowerCase():''}</div>`+
   (t?`<p>${t}</p>`:'')+
   (ls.length?`<div class="sub">Reperi su questa parte (${ls.length})</div><div class="chips">${ls.map(l=>chip('',`data-lm="${l.id}"`,itOf(l.b))).join('')}</div>`:'')+
   `<div class="chips">${musOf(S.part)?`<button class="chip on" data-mu="${musOf(S.part)}">Scheda del muscolo</button>`:''}${brain?'<button class="chip on" data-go="brain">🧠 Sezioni e strati</button>':''}<button class="chip" data-hide="1">Nascondi</button><button class="chip" data-go="layers">Strati</button><button class="chip" data-go="home">Chiudi</button></div>`+(t?AI:'')+FONTE;
 }else if(S.list==='brain'){
  const on=(v,attr,txt)=>`<button class="chip${v?' on':''}" ${attr}>${txt}</button>`;
  h=`<div class="h">Encefalo: sezioni e strati</div>${S.loading?'<p class="mut">Carico encefalo e meningi…</p>':''}
   <div class="sub">Sezione sui piani anatomici</div><div class="chips">${on(!S.cut.ax,'data-cut="none"','Nessuna')}${Object.entries(AX).map(([k,a])=>on(S.cut.ax===k,`data-cut="${k}"`,a.it)).join('')}</div>`+
   (S.cut.ax?`<input type="range" id="cutr" min="0" max="1000" value="${Math.round(S.cut.t*1000)}" style="width:100%"><div class="mut">${S.cut.ax==='axial'?'Sposta il piano dal basso in alto':S.cut.ax==='coronal'?'Sposta il piano da dietro in avanti':'Sposta il piano da destra a sinistra'}. Si vede la parte ${S.cut.ax==='axial'?'inferiore, dall\'alto':S.cut.ax==='coronal'?'posteriore, da davanti':'sinistra, dal lato destro'}.</div>`:'')+
   `<div class="sub">Scomposizione: togli uno strato alla volta</div><input type="range" id="levr" min="0" max="${ST.length-1}" step="1" value="${S.lev}" style="width:100%">
   <div class="chips"><button class="chip" data-levd="-1">− Rimetti</button><button class="chip" data-levd="1">Togli +</button></div>
   <div id="levt" class="row">${levText()}</div>
   <div class="chips">${ST.map((s,i)=>chip(i===S.lev?'on':'',`data-lev="${i}"`,`${i+1}. ${s.n}`)).join('')}</div>
   <p class="note">Dura madre e aracnoide craniche hanno una forma schematica generata dall'app (la fonte ha solo falce e tentorio). Testi scritti dall'AI: da verificare.</p>
   <div class="chips"><button class="chip" data-go="layers">Strati</button><button class="chip" data-go="home">Chiudi</button></div>`;
 }else if(S.list==='layers'){
  const on=(v,attr,txt)=>`<button class="chip${v?' on':''}" ${attr}>${txt}</button>`,lay=k=>on(V[k],`data-layer="${k}"`,LAYERS[k].n);
  h=`<div class="h">Strati</div>${S.loading?'<p class="mut">Carico lo strato…</p>':''}
   <div class="sub">Ossa</div><div class="chips">${on(S.bones==='on','data-bones="on"','Visibili')}${on(S.bones==='ghost','data-bones="ghost"','Trasparenti')}${on(S.bones==='off','data-bones="off"','Nascoste')}${on(S.allLm,'data-lmt="1"','Tutti i reperi')}</div>
   <div class="sub">Apparato locomotore</div><div class="chips">${lay('muscoli')}${lay('fasce')}${lay('legamenti')}${lay('inserzioni')}</div>
   <div class="sub">Sistema nervoso</div><div class="chips">${lay('encefalo')}${lay('midollo')}${lay('nervi')}${lay('meningi')}${lay('sensi')}<button class="chip" data-go="brain">🧠 Sezioni e strati</button></div>
   <div class="sub">Altri sistemi</div><div class="chips">${lay('vasi')}${lay('visceri')}</div>
   <div class="chips"><button class="chip" data-go="home">Chiudi</button></div>`;
 }else if(S.list==='muscles'){
  const q=S.q.toLowerCase(),all=Object.entries(DATA.mus).filter(([r,m])=>!q||m.n.toLowerCase().includes(q)||r.includes(q)).sort((a,b)=>a[1].n.localeCompare(b[1].n));
  const gs=[...new Set(all.map(([,m])=>m.g))].sort((a,b)=>itOf(a).localeCompare(itOf(b)));
  h=`<div class="h">Muscoli (${all.length})</div><input id="q" placeholder="Cerca un muscolo…" value="${S.q}">`+
   gs.map(g=>`<div class="sub">${itOf(g)||'Altri'}</div><div class="chips">${all.filter(([,m])=>m.g===g).map(([r,m])=>chip('',`data-mu="${r}"`,m.n.replace(/^Muscol[oi] /,''))).join('')}</div>`).join('')+
   `<p class="note">Testi di origine, inserzione, azione e innervazione scritti dall'AI: da verificare su un atlante.</p><div class="chips"><button class="chip" data-go="home">Chiudi</button></div>`;
 }else if(S.list==='search'){
  const q=norm(S.q),res=[],has=s=>norm(s).includes(q);
  if(q.length>1){
   // prima le abbreviazioni e i nomi comuni (SIAS, zampa d'oca…)
   const top=[],seenT=new Set(),add=(r,k)=>{if(!seenT.has(k)){seenT.add(k);top.push(r);}};
   for(const [k,ts] of Object.entries(SYN)){if(!(k.startsWith(q)||(q.length>3&&q.includes(k))))continue;
    for(const t of ts){
     if(t[0]==='#'){const c=COMBO[t.slice(1)];add([c.n,'gruppo di muscoli',`data-combo="${t.slice(1)}"`],t);}
     else if(t.startsWith('mu:')){const r=t.slice(3);if(DATA.mus[r])add([DATA.mus[r].n,'muscolo',`data-mu="${r}"`],t);}
     else if(t[0]==='~')add([itOf(t==='~dura'?'Cranial dura mater':'Cranial arachnoid mater'),'meninge (schematica)',`data-shell="${t}"`],t);
     else{const l=LMS.find(l=>l.id[0]==='r'&&l.b===t);if(l)add([itOf(t),'repere',`data-lm="${l.id}"`],t);
      const n=Object.keys(DATA.objs).find(n=>baseOf(n)===t&&sideOf(n)!=='l');if(n)add([itOf(t),TIPO[DATA.objs[n][0]]||'',`data-find="${n}"`],n);}
    }}
   const seen=new Set();
   for(const n in DATA.objs){const b=baseOf(n),k=b+'|'+DATA.objs[n][0];if(seen.has(k)||DATA.objs[n][0]==='inserzioni')continue;seen.add(k);if((has(itOf(b))||has(b))&&!seenT.has(n))res.push([itOf(b),TIPO[DATA.objs[n][0]]||'',`data-find="${n}"`]);}
   for(const l of LMS)if(l.id[0]==='r'&&(has(itOf(l.b))||has(l.b))&&!seenT.has(l.b))res.push([itOf(l.b),'repere',`data-lm="${l.id}"`]);
   for(const [k,c] of Object.entries(COMBO))if((has(c.n)||has(c.la))&&!seenT.has('#'+k))res.push([c.n,'gruppo di muscoli',`data-combo="${k}"`]);
   res.sort((a,b)=>a[0].length-b[0].length);res.unshift(...top);
  }
  h=`<div class="h">Cerca</div><input id="q" placeholder="Nome di un osso, muscolo, nervo, repere…" value="${S.q}">
   <div class="chips">${res.slice(0,40).map(r=>chip('',r[2],r[0],r[1])).join('')}</div>${q.length>1&&!res.length?'<p class="mut">Nessun risultato.</p>':''}
   <div class="chips"><button class="chip" data-go="home">Chiudi</button></div>`;
 }else{
  h=`<div class="h">Atlante 3D</div><p class="mut">Tocca una parte per vederne il nome. Un dito ruota, due dita ingrandiscono e spostano, doppio tocco avvicina.</p>
   <div class="chips"><button class="chip" data-go="layers">🧩 Strati</button><button class="chip" data-go="muscles">💪 Muscoli</button><button class="chip" data-go="brain">🧠 Encefalo</button><button class="chip" data-go="search">🔎 Cerca</button></div>`+FONTE;
 }
 const keep=document.activeElement&&document.activeElement.id==='q';
 p.innerHTML=h;if(!keep)p.scrollTop=0;
 if(keep){const q=$('q');if(q){q.focus();q.setSelectionRange(q.value.length,q.value.length);}}
}

/* ---------- azioni ---------- */
function levText(){return `<b>Strato più esterno visibile: ${ST[S.lev].n}</b><br><span class="mut">${ST[S.lev].t}</span>`;}
function selectPart(m,fly=false){S.mus=S.combo=null;S.lm=null;S.part=m;S.list=null;if(m&&m.userData.side)S.side=m.userData.side;refresh();if(m&&fly)frameBox(boxOf([m]),0.2);}
// distanza di un punto dalla superficie di una parte (vertice più vicino)
function distTo(m,p){
 m.updateWorldMatrix(true,false);const a=m.geometry.attributes.position,v=new THREE.Vector3();let bd=Infinity;
 for(let i=0;i<a.count;i++){const d=v.fromBufferAttribute(a,i).applyMatrix4(m.matrixWorld).distanceToSquared(p);if(d<bd)bd=d;}
 return Math.sqrt(bd);
}
// osso (o cartilagine) più vicino al punto di un'area: serve per non confondere ossa vicine (laringe, cranio)
const boneOfArea=new Map();
function nearestBone(m){
 if(boneOfArea.has(m))return boneOfArea.get(m);
 const p=areaPoint(m);let best=null,bd=0.03;
 for(const b of meshes){if(b.userData.layer!=='ossa')continue;if(!b.userData.box)b.userData.box=new THREE.Box3().setFromObject(b);
  if(b.userData.box.distanceToPoint(p)>=bd)continue;const d=distTo(b,p);if(d<bd){bd=d;best=b;}}
 boneOfArea.set(m,best);return best;
}
// muscoli con un'area a meno di 2,5 cm dal repere e appoggiata sullo stesso osso del repere
function musclesAt(l){
 if(!FILES.inserzioni||!FILES.inserzioni.loaded)return [];
 const s=sideOf(l.parent)||'r',bone=byName.get(l.parent),out=[];
 const ok=n=>{if(sideOf(n)&&sideOf(n)!==s||!byName.has(n))return false;const m=byName.get(n);return areaPoint(m).distanceTo(l.p)<0.025&&(!bone||nearestBone(m)===bone);};
 for(const [r,d] of Object.entries(DATA.mus))for(const k of ['o','e'])
  if(!out.some(x=>x[0]===r&&x[1]===k)&&d[k].some(ok))out.push([r,k]);
 return out;
}
function showLandmark(l,fly=true){
 S.mus=S.combo=null;S.part=null;S.lm=l;S.list=null;refresh();if(fly)flyTo(l.p.clone().addScaledVector(l.d,0.3),l.p.clone());
 if(!FILES.inserzioni||!FILES.inserzioni.loaded)loadFile('inserzioni').then(()=>{if(S.lm===l)refresh();});
}
async function showMuscle(root,side=S.side,fly=true,combo=null){
 S.mus=combo?null:root;S.combo=combo;S.side=side;S.part=null;S.lm=null;S.list=null;
 if(!FILES.muscoli||!FILES.muscoli.loaded||!FILES.inserzioni||!FILES.inserzioni.loaded){S.loading=true;panel();await Promise.all([loadFile('muscoli'),loadFile('inserzioni')]);S.loading=false;}
 refresh();
 if(!fly)return;
 let list=meshes.filter(m=>inFocus(m));
 if(combo&&COMBO[combo].fly)list=list.filter(m=>m.userData.kind===COMBO[combo].fly);
 if(!list.length)return;
 if(combo&&COMBO[combo].fly){ // inserzione sul lato mediale (zampa d'oca): la guardo da davanti e dal lato interno
  const b=boxOf(list),c=b.getCenter(new THREE.Vector3()),dir=new THREE.Vector3(Math.sign(center.x-c.x),0,1.2).normalize();
  flyTo(c.clone().addScaledVector(dir,0.4),c);
 }else frameBox(boxOf(list));
}
const showCombo=(k,side=S.side,fly=true)=>showMuscle(null,side,fly,k);
// pannello dell'encefalo: carica encefalo e meningi, ossa trasparenti, avvicina la testa
async function openBrain(){
 S.mus=S.combo=S.lm=S.part=null;S.list='brain';
 if(!FILES.encefalo||!FILES.encefalo.loaded||!FILES.meningi||!FILES.meningi.loaded){S.loading=true;panel();await Promise.all([loadFile('encefalo'),loadFile('meningi')]);S.loading=false;}
 if(!brainBox)brainBox=boxOf(meshes.filter(m=>m.userData.layer==='encefalo'&&m.userData.st===2));
 const first=!V.encefalo;V.encefalo=true;V.meningi=true;if(S.bones==='on')S.bones='ghost';
 refresh();
 if(first)flyBrain(S.cut.ax?AX[S.cut.ax].v:'right');
}
function flyBrain(v){
 const c=brainBox.getCenter(new THREE.Vector3()),r=brainBox.getSize(new THREE.Vector3()).length()/2;
 const dist=r*0.95/Math.tan(THREE.MathUtils.degToRad(camera.fov)/2)/Math.min(1,camera.aspect);
 flyTo(c.clone().addScaledVector(new THREE.Vector3(...DIR[v]).normalize(),dist),c);
}
function setCut(ax){
 S.cut.ax=ax==='none'?null:ax;
 if(S.cut.ax){S.cut.t=S.cut.ax==='axial'?0.6:S.cut.ax==='sagittal'?0.52:0.5;/* sagittale appena a lato della falce: si vede la faccia mediale */flyBrain(AX[S.cut.ax].v);}
 refresh();
}
function setLevel(n){S.lev=n;refresh(true);const r=$('levr');if(r)r.value=n;const t=$('levt');if(t)t.innerHTML=levText();
 document.querySelectorAll('#panel [data-lev]').forEach(b=>b.classList.toggle('on',+b.dataset.lev===n));}
const INSIDE=['encefalo','midollo','meningi','sensi','visceri']; // stanno dentro le ossa: accendendoli le rendo trasparenti
async function toggleLayer(k){
 const f=LAYERS[k].file;
 if(!FILES[f]||!FILES[f].loaded){S.loading=true;panel();try{await loadFile(f);}catch(e){S.loading=false;panel();return;}S.loading=false;}
 V[k]=!V[k];
 if(V[k]&&INSIDE.includes(k)&&S.bones==='on')S.bones='ghost';
 refresh();
}
async function findPart(name){
 const k=DATA.objs[name][0];
 // un muscolo cercato si apre da solo, con origine e inserzione: lo strato dei muscoli lo accende l'utente
 if(k==='muscoli'){const r=rootOf(baseOf(name));if(DATA.mus[r]){showMuscle(r,sideOf(name)||S.side);return;}}
 await loadFile(LAYERS[k].file);
 if(k!=='ossa'&&!V[k]){V[k]=true;if(INSIDE.includes(k)&&S.bones==='on')S.bones='ghost';}
 const m=byName.get(name);if(m){m.userData.hidden=false;if(m.userData.st>=0&&m.userData.st<S.lev)S.lev=m.userData.st;selectPart(m,true);}
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
 else if(m&&roots().length&&inFocus(m)){/* tocco sul muscolo già aperto: resta la scheda */}
 else if(m||(!roots().length&&S.list!=='brain'))selectPart(m);
 lastTap=now;
});

/* ---------- pulsanti ---------- */
$('bar').addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.v)setView(b.dataset.v);
 else if(b.id==='outline'){outline=!outline;b.classList.toggle('on',outline);}
 else if(b.id==='layers'){S.mus=S.combo=S.lm=S.part=null;S.list='layers';refresh();}
 else if(b.id==='brain')openBrain();
});
$('panel').addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;const d=b.dataset;
 if(d.mu)showMuscle(d.mu);
 else if(d.combo)showCombo(d.combo);
 else if(d.mv){S.mv=d.mv;refresh();}
 else if(d.lm)showLandmark(LMS.find(l=>l.id===d.lm));
 else if(d.part){const m=byName.get(d.part);if(m)selectPart(m,true);}
 else if(d.find)findPart(d.find);
 else if(d.shell){openBrain().then(()=>{const m=byName.get(d.shell);if(m){S.lev=0;selectPart(m,true);}});}
 else if(d.side){if(S.combo)showCombo(S.combo,d.side);else showMuscle(S.mus,d.side);}
 else if(d.cut)setCut(d.cut);
 else if(d.lev!==undefined)setLevel(+d.lev);
 else if(d.levd)setLevel(Math.max(0,Math.min(ST.length-1,S.lev+ +d.levd)));
 else if(d.go==='brain')openBrain();
 else if(d.go){S.mus=S.combo=S.lm=S.part=null;S.q='';S.list=d.go==='home'?null:d.go;refresh();}
 else if(d.hide){if(S.part)S.part.userData.hidden=true;S.part=null;refresh();}
 else if(d.bones){S.bones=d.bones;refresh();}
 else if(d.lmt){S.allLm=!S.allLm;refresh();}
 else if(d.layer)toggleLayer(d.layer);
});
$('panel').addEventListener('input',e=>{
 if(e.target.id==='q'){S.q=e.target.value;panel();}
 else if(e.target.id==='cutr'){S.cut.t=e.target.value/1000;applyCut();}   // senza ridisegnare il pannello: il cursore resta in mano
 else if(e.target.id==='levr')setLevel(+e.target.value);
});

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
 for(const m of pts.children){const d=camera.position.distanceTo(m.position);
  if(m.userData.dot)m.scale.setScalar(Math.max(0.0015,d*px*6));else{const r=Math.max(0.0006,d*px*1.6);m.scale.set(r,m.userData.len,r);}}
 // con una sezione il contorno (facce posteriori ingrandite) riempirebbe di scuro il taglio: lo spengo
 if(outline&&!S.cut.ax)effect.render(scene,camera);else renderer.render(scene,camera);
 frames++;
 if(now-last>=1000){$('fps').textContent=`${Math.round(frames*1000/(now-last))} fps · ${Math.round(renderer.info.render.triangles/1000)}k triangoli`;frames=0;last=now;}
});
window.__proto={DATA,S,V,LAYERS,meshes,byName,LMS,camera,controls,renderer,refresh,toggleLayer,showMuscle,showCombo,showLandmark,selectPart,findPart,pickPart,pickLandmark,setView,openBrain,setCut,setLevel,pts};

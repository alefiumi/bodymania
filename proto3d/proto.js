/* Prototipo: scheletro 3D ruotabile in stile cartoon. Solo per giudicare aspetto, fluidità e peso. */
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {OutlineEffect} from 'three/addons/effects/OutlineEffect.js';

const $=id=>document.getElementById(id);
const view=$('view');
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();

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
const COL={bone:0xefe6d2,cartilage:0xb8d8e6,sel:0x38bdf8};
const mats={};for(const k in COL)mats[k]=new THREE.MeshToonMaterial({color:COL[k],gradientMap:ramp});

const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.dampingFactor=0.12;controls.rotateSpeed=0.9;controls.zoomSpeed=1.1;
controls.touches={ONE:THREE.TOUCH.ROTATE,TWO:THREE.TOUCH.DOLLY_PAN};

const parts=[];let center=new THREE.Vector3(),height=1.7,sel=null;
const loader=new GLTFLoader();loader.setMeshoptDecoder(MeshoptDecoder);
const t0=performance.now();
loader.load('skeleton.glb',g=>{
 let tris=0;
 g.scene.traverse(o=>{
  if(!o.isMesh)return;
  o.geometry.computeVertexNormals();
  const ex=o.parent&&o.parent.userData&&o.parent.userData.name?o.parent.userData:o.userData;
  o.userData.kind=ex.kind||'bone';o.userData.label=ex.name||o.name;o.userData.fma=o.name;
  o.material=mats[o.userData.kind];
  tris+=o.geometry.index.count/3;parts.push(o);
 });
 scene.add(g.scene);
 const box=new THREE.Box3().setFromObject(g.scene);box.getCenter(center);height=box.getSize(new THREE.Vector3()).y;
 controls.minDistance=height*0.12;controls.maxDistance=height*3.2;
 setView('front',false);
 $('msg').remove();
 info.model=`${parts.filter(p=>p.userData.kind==='bone').length} ossa · ${Math.round(tris/1000)}k triangoli · caricato in ${Math.round(performance.now()-t0)} ms`;
 showPanel();
},undefined,e=>{$('msg').textContent='Non riesco a caricare il modello: '+e.message;});

const DIR={front:[0,0,1],back:[0,0,-1],right:[-1,0,0],left:[1,0,0],top:[0,1,0.001]};
let tween=null;
function fitDist(){const v=THREE.MathUtils.degToRad(camera.fov)/2,h=height*0.56/Math.tan(v);return Math.max(h,h/Math.min(1,camera.aspect*1.9));}
function setView(name,anim=true){
 const d=new THREE.Vector3(...DIR[name]).normalize().multiplyScalar(fitDist());
 flyTo(center.clone().add(d),center.clone(),anim);
}
function flyTo(pos,target,anim=true){
 if(!anim){camera.position.copy(pos);controls.target.copy(target);controls.update();return;}
 tween={p0:camera.position.clone(),t0:controls.target.clone(),p1:pos,t1:target,s:performance.now()};
}

/* ---------- selezione ---------- */
const info={model:''};
function showPanel(){
 const p=$('panel');
 if(!sel){p.querySelector('.h').textContent='Tocca un osso';return;}
 p.innerHTML=`<div class="h">${sel.userData.label}</div><div class="mut">${sel.userData.kind==='cartilage'?'Cartilagine':'Osso'} · codice ${sel.userData.fma} · nome inglese dalla fonte, i nomi italiani arrivano dopo<br>${info.model}</div>`;
}
function select(m){
 if(sel)sel.material=mats[sel.userData.kind];
 sel=m;if(sel)sel.material=mats.sel;
 showPanel();
}
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();
function pick(x,y){
 const r=renderer.domElement.getBoundingClientRect();
 ndc.set((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1);ray.setFromCamera(ndc,camera);
 const hit=ray.intersectObjects(parts,false)[0];return hit?hit.object:null;
}
let down=null,lastTap=0;
renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,t:performance.now(),n:(down&&performance.now()-down.t<50?2:1)};});
renderer.domElement.addEventListener('pointerup',e=>{
 if(!down)return;const moved=Math.hypot(e.clientX-down.x,e.clientY-down.y),dt=performance.now()-down.t;down=null;
 if(moved>8||dt>500)return;
 const m=pick(e.clientX,e.clientY);select(m);
 const now=performance.now();
 if(m&&now-lastTap<350){ // doppio tocco: avvicina e centra l'osso
  const b=new THREE.Box3().setFromObject(m),c=b.getCenter(new THREE.Vector3()),s=b.getSize(new THREE.Vector3()).length();
  const dir=camera.position.clone().sub(controls.target).normalize();
  flyTo(c.clone().add(dir.multiplyScalar(Math.max(controls.minDistance,s*2.2))),c);
 }
 lastTap=now;
});

/* ---------- pulsanti ---------- */
$('bar').addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.v)setView(b.dataset.v);
 else if(b.id==='outline'){outline=!outline;b.classList.toggle('on',outline);}
 else if(b.id==='spin'){controls.autoRotate=!controls.autoRotate;controls.autoRotateSpeed=4;b.classList.toggle('on',controls.autoRotate);}
});

/* ---------- ciclo di disegno ---------- */
function resize(){
 const w=view.clientWidth,h=view.clientHeight;if(!w||!h)return;
 renderer.setSize(w,h,false);effect.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(view);resize();
let frames=0,last=performance.now(),worst=0,prev=performance.now();
renderer.setAnimationLoop(now=>{
 if(tween){const k=Math.min(1,(now-tween.s)/420),e=k*k*(3-2*k);
  camera.position.lerpVectors(tween.p0,tween.p1,e);controls.target.lerpVectors(tween.t0,tween.t1,e);if(k>=1)tween=null;}
 controls.update();
 if(outline)effect.render(scene,camera);else renderer.render(scene,camera);
 frames++;worst=Math.max(worst,now-prev);prev=now;
 if(now-last>=1000){$('fps').textContent=`${Math.round(frames*1000/(now-last))} fps · fotogramma più lento ${Math.round(worst)} ms`;frames=0;worst=0;last=now;}
});
window.__proto={parts,scene,camera,controls,setView,select,pick,renderer};

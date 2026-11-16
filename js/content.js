/* Carica i contenuti da content/ e li trasforma nelle strutture usate dal gioco. */
import {renderShape} from './shapes.js';

const get=f=>fetch('content/'+f).then(r=>{if(!r.ok)throw new Error(f+': HTTP '+r.status);return r.json();});

export async function loadContent(){
 const idx=await get('index.json');
 const [mods,nc]=await Promise.all([Promise.all(idx.modules.map(id=>get(id+'.json'))),get(idx.nc)]);
 const catNames=[...new Set(mods.map(m=>m.catalog).filter(Boolean))];
 const cats=Object.fromEntries(await Promise.all(catNames.map(async f=>[f,(await get(f)).items])));
 const MODS={};
 for(const m of mods){
  const cat=m.catalog&&cats[m.catalog];
  // Con un catalogo (cervello) i testi arrivano dal catalogo e il modulo dà solo posizione e forma.
  const B=m.structures.map(x=>cat?{...cat[x.id],id:x.id,c:x.c,s:renderShape(x.s),pair:0}:{...x,s:renderShape(x.s)});
  MODS[m.id]={id:m.id,label:m.label,B,M:m.muscles||[],CASES:m.cases,W:m.W,H:m.H};
 }
 return {version:idx.version,MODS,NC:nc.items};
}

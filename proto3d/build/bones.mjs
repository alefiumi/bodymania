import fs from 'node:fs';
const D=process.argv[2];
const rows=f=>fs.readFileSync(D+'/'+f,'utf8').trim().split('\n').slice(1).map(l=>l.split('\t'));
const incl=rows('isa_inclusion_relation_list.txt'), elem=rows('isa_element_parts.txt'), parts=rows('isa_parts_list_e.txt');
const name=new Map(parts.map(r=>[r[0],r[2]]));
const kids=new Map(); for(const [p,,c,cn] of incl){ if(!kids.has(p))kids.set(p,[]); kids.get(p).push(c); name.set(c,cn); }
const files=new Map(); for(const [c,,f] of elem){ if(!files.has(c))files.set(c,new Set()); files.get(c).add(f); }
const root=[...name].filter(([k,v])=>/^bone organ$/i.test(v));
console.log('root',root);
const R=root[0][0];
// foglie = concetti sotto "bone organ" senza figli
const leaves=[]; const seen=new Set();
(function walk(c,path){ if(seen.has(c))return; seen.add(c); const k=kids.get(c)||[]; if(!k.length){leaves.push([c,path]);return;} for(const x of k)walk(x,[...path,name.get(c)]); })(R,[]);
console.log('foglie',leaves.length);
// ogni file a quante foglie appartiene?
const fileLeaf=new Map();
for(const [c] of leaves) for(const f of (files.get(c)||[])) { if(!fileLeaf.has(f))fileLeaf.set(f,[]); fileLeaf.get(f).push(c); }
console.log('file distinti',fileLeaf.size,'file in più foglie',[...fileLeaf.values()].filter(v=>v.length>1).length);
const multi=leaves.filter(([c])=>(files.get(c)||new Set()).size!==1);
console.log('foglie con n file != 1:',multi.length, multi.slice(0,15).map(([c])=>name.get(c)+':'+(files.get(c)||new Set()).size));
const out=leaves.map(([c,p])=>({fma:c,name:name.get(c),path:p.slice(1),files:[...(files.get(c)||[])]}));
fs.writeFileSync(process.argv[3],JSON.stringify(out,null,1));
// riepilogo per categoria di secondo livello
const cat={}; for(const o of out){const k=o.path[0]||'(diretto)';cat[k]=(cat[k]||0)+1;} console.log(cat);
console.log(out.slice(0,5).map(o=>o.name), out.filter(o=>/hip|femur|patella|sesamoid|coccy|hyoid|ossicle|malleus/i.test(o.name)).map(o=>o.name));

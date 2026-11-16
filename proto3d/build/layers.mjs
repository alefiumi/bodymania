// Sceglie i file di BodyParts3D per gli strati (muscoli, encefalo, nervi) e li converte in un .glb per strato.
// Uso: node layers.mjs <cartella dati> <cartella uscita> [solo-elenco]
import fs from 'node:fs';
import {Document, NodeIO} from '@gltf-transform/core';
import {EXTMeshoptCompression, KHRMeshQuantization} from '@gltf-transform/extensions';
import {weld, simplify, quantize, meshopt} from '@gltf-transform/functions';
import {MeshoptEncoder, MeshoptSimplifier} from 'meshoptimizer';

const [D, OUT, only] = process.argv.slice(2);
const OBJ = D + '/isa_BP3D_4.0_obj_99/';
const rows = f => fs.readFileSync(D + '/' + f, 'utf8').trim().split('\n').slice(1).map(l => l.split('\t'));
const elem = rows('isa_element_parts.txt');
const _u = new Map(); const under = id => { if (!_u.has(id)) _u.set(id, new Set(elem.filter(r => r[0] === id).map(r => r[2]))); return _u.get(id); };
const head = f => { const t = fs.readFileSync(OBJ + f + '.obj', 'utf8').slice(0, 900); return {name: (t.match(/English name : (.*)/) || [])[1].trim(), fma: (t.match(/Concept ID : (\S+)/) || [])[1]}; };
const all = fs.readdirSync(OBJ).map(f => f.replace('.obj', ''));
const info = new Map(all.map(f => [f, head(f)]));

const BRAIN = /gyrus|lobule|lobe$|occipital lobe|insula|cerebell|medulla oblongata|midbrain|^pons|pons$|thalamus|hypothalamus|caudate nucleus|amygdala|hippocampus|fornix|corpus callosum|internal capsule|ventricle$|colliculus|pineal|pituitary|stria medullaris|putamen|globus|lentiform|septum pellucidum|mamillary|olfactory|cerebral|claustrum|substantia|nucleus accumbens|tectum|vermis|commissure|habenula|stria terminalis|lamina terminalis|tuber cinereum/i;
const NOT = /artery|vein|branch|papillary|liver|thymus|cavity|wall of|hepatic|portal|biliary|trunk|lung|heart|cardiac|tributary|sinus/i;
const neuraxis = under('FMA' + (elem.find(r => r[1] === 'segment of neuraxis') || [, , ''])[0].replace('FMA', ''));
const layers = {
  // muscoli interi, più capi e parti dei muscoli composti (deltoide, bicipite, trapezio…), gruppi e tendine d'Achille
  muscoli: all.filter(f => { const n = info.get(f).name;
    if (/papillary|heart|cardiac|artery|arteries|vein|ileum|jejunum|retina|ligament|gyrus|nerve|bone/i.test(n)) return false;
    if (/^(right |left )?(rectus femoris|vastus (lateralis|medialis|intermedius)|iliococcygeus|pubococcygeus|puborectalis)$/i.test(n)) return true; // classificati altrove nella fonte
    return under('FMA5022').has(f) || /\b(head|part) of (left |right )?[a-z]/i.test(n) || /^Set of/i.test(n) || /calcaneal tendon/i.test(n); }),
  encefalo: all.filter(f => (neuraxis.has(f) || BRAIN.test(info.get(f).name)) && !NOT.test(info.get(f).name) && !/nerve|tract$|chiasm/i.test(info.get(f).name)),
  nervi: all.filter(f => /nerve|optic tract|optic chiasm|ganglion/i.test(info.get(f).name) && !/artery|vein/i.test(info.get(f).name)),
};
function readObj(f) {
  const pos = [], idx = [];
  for (const l of fs.readFileSync(OBJ + f + '.obj', 'utf8').split('\n')) {
    if (l.startsWith('v ')) { const [, x, y, z] = l.split(/\s+/); pos.push(+x / 1000, +z / 1000, -y / 1000); }
    else if (l.startsWith('f ')) { const v = l.trim().split(/\s+/).slice(1).map(t => parseInt(t) - 1); for (let i = 1; i < v.length - 1; i++) idx.push(v[0], v[i], v[i + 1]); }
  }
  return {pos, idx};
}
await MeshoptEncoder.ready; await MeshoptSimplifier.ready;
const RATIO = {muscoli: [0.14, 0.004], encefalo: [0.3, 0.0015], nervi: [0.6, 0.0004]};
const index = {};
for (const [layer, files] of Object.entries(layers)) {
  const names = files.map(f => info.get(f).name);
  index[layer] = files.map(f => ({id: f, fma: info.get(f).fma, name: info.get(f).name}));
  console.log(layer, files.length, 'parti');
  if (only) { console.log('  ' + [...new Set(names.map(n => n.replace(/\b(right|left) /, '')))].sort().join(' | ')); continue; }
  const doc = new Document(), buffer = doc.createBuffer(), scene = doc.createScene(layer), mat = doc.createMaterial(layer);
  let tris = 0;
  for (const f of files) {
    const o = readObj(f); tris += o.idx.length / 3;
    const prim = doc.createPrimitive().setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(o.pos)).setBuffer(buffer))
      .setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(o.idx)).setBuffer(buffer)).setMaterial(mat);
    scene.addChild(doc.createNode(f).setMesh(doc.createMesh(f).addPrimitive(prim)).setExtras({name: info.get(f).name, fma: info.get(f).fma, kind: layer}));
  }
  doc.createExtension(EXTMeshoptCompression).setRequired(true); doc.createExtension(KHRMeshQuantization).setRequired(true);
  await doc.transform(weld(), simplify({simplifier: MeshoptSimplifier, ratio: RATIO[layer][0], error: RATIO[layer][1]}), quantize({quantizePosition: 14}), meshopt({encoder: MeshoptEncoder, level: 'high'}));
  let after = 0; for (const m of doc.getRoot().listMeshes()) for (const pr of m.listPrimitives()) after += pr.getIndices().getCount() / 3;
  const out = `${OUT}/${layer}.glb`;
  await new NodeIO().registerExtensions([EXTMeshoptCompression, KHRMeshQuantization]).registerDependencies({'meshopt.encoder': MeshoptEncoder}).write(out, doc);
  console.log('  triangoli', tris, '->', after, '·', (fs.statSync(out).size / 1e6).toFixed(2), 'MB');
}
fs.writeFileSync(OUT + '/strati.json', JSON.stringify(index));

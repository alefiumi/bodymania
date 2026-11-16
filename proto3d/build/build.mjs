// Converte le ossa di BodyParts3D (OBJ, mm, Z in alto) in un unico file .glb semplificato e compresso.
// Uso: node build.mjs <cartella dati> <bones.json> <uscita.glb> [rapporto di semplificazione]
import fs from 'node:fs';
import {Document, NodeIO} from '@gltf-transform/core';
import {EXTMeshoptCompression, KHRMeshQuantization} from '@gltf-transform/extensions';
import {weld, simplify, quantize, meshopt, normals} from '@gltf-transform/functions';
import {MeshoptEncoder, MeshoptSimplifier} from 'meshoptimizer';

const [D, bonesFile, out, ratioArg] = process.argv.slice(2);
const ratio = Number(ratioArg || 0.35);
const rows = f => fs.readFileSync(D + '/' + f, 'utf8').trim().split('\n').slice(1).map(l => l.split('\t'));
const elem = rows('isa_element_parts.txt');
const filesOf = id => [...new Set(elem.filter(r => r[0] === id).map(r => r[2]))];
const nameOf = id => elem.find(r => r[0] === id)?.[1];

const parts = JSON.parse(fs.readFileSync(bonesFile, 'utf8')).map(b => ({id: b.fma, name: b.name, kind: 'bone', files: b.files}));
// Lo sterno è descritto in tre parti (non compare tra le "ossa" come pezzo unico)
for (const id of ['FMA7486', 'FMA7487', 'FMA7488']) parts.push({id, name: nameOf(id), kind: 'bone', files: filesOf(id)});
// Cartilagini costali: non sono ossa, ma senza la gabbia toracica resta aperta
filesOf('FMA7591').forEach(f => {
  const own = elem.filter(r => r[2] === f && /(right|left) .* costal cartilage/.test(r[1]))[0];
  parts.push({id: own ? own[0] : 'CART_' + f, name: own ? own[1] : 'costal cartilage', kind: 'cartilage', files: [f]});
});

function readObj(f) {
  const pos = [], idx = [];
  for (const l of fs.readFileSync(`${D}/isa_BP3D_4.0_obj_99/${f}.obj`, 'utf8').split('\n')) {
    if (l.startsWith('v ')) { const [, x, y, z] = l.split(/\s+/); pos.push(+x / 1000, +z / 1000, -y / 1000); } // metri, Y in alto
    else if (l.startsWith('f ')) {
      const v = l.trim().split(/\s+/).slice(1).map(t => parseInt(t) - 1);
      for (let i = 1; i < v.length - 1; i++) idx.push(v[0], v[i], v[i + 1]);
    }
  }
  return {pos, idx};
}

const doc = new Document();
const buffer = doc.createBuffer();
const scene = doc.createScene('scheletro');
const mat = {bone: doc.createMaterial('bone'), cartilage: doc.createMaterial('cartilage')};
let tris = 0;
for (const p of parts) {
  const pos = [], idx = [];
  for (const f of p.files) { const o = readObj(f), base = pos.length / 3; pos.push(...o.pos); for (const i of o.idx) idx.push(i + base); }
  tris += idx.length / 3;
  const prim = doc.createPrimitive()
    .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(pos)).setBuffer(buffer))
    .setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(idx)).setBuffer(buffer))
    .setMaterial(mat[p.kind]);
  const mesh = doc.createMesh(p.id).addPrimitive(prim);
  scene.addChild(doc.createNode(p.id).setMesh(mesh).setExtras({name: p.name, kind: p.kind}));
}
console.log('parti', parts.length, 'triangoli iniziali', tris);

await MeshoptEncoder.ready; await MeshoptSimplifier.ready;
doc.createExtension(EXTMeshoptCompression).setRequired(true);
doc.createExtension(KHRMeshQuantization).setRequired(true);
await doc.transform(
  weld(),
  simplify({simplifier: MeshoptSimplifier, ratio, error: 0.0005}),
  quantize({quantizePosition: 14}),
  meshopt({encoder: MeshoptEncoder, level: 'high'}),
);
let after = 0;
for (const m of doc.getRoot().listMeshes()) for (const pr of m.listPrimitives()) after += pr.getIndices().getCount() / 3;
await new NodeIO().registerExtensions([EXTMeshoptCompression, KHRMeshQuantization]).registerDependencies({'meshopt.encoder': MeshoptEncoder}).write(out, doc);
console.log('triangoli finali', after, 'file', (fs.statSync(out).size / 1e6).toFixed(2), 'MB');
fs.writeFileSync(out.replace(/\.glb$/, '.parts.json'), JSON.stringify(parts.map(({id, name, kind}) => ({id, name, kind}))));

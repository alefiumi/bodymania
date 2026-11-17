// Semplifica e comprime gli strati esportati da Blender (za_export.py).
// Uso: node za_optimize.mjs <cartella con *.raw.glb> <cartella di uscita>
import fs from 'node:fs';
import {NodeIO} from '@gltf-transform/core';
import {EXTMeshoptCompression, KHRMeshQuantization} from '@gltf-transform/extensions';
import {weld, simplify, quantize, meshopt, prune, dedup} from '@gltf-transform/functions';
import {MeshoptEncoder, MeshoptSimplifier, MeshoptDecoder} from 'meshoptimizer';

const [IN, OUT] = process.argv.slice(2);
// rapporto di triangoli da tenere ed errore massimo (frazione della dimensione della parte)
// strato di uscita: [file grezzo, sottostrato (solo sistema nervoso), rapporto di triangoli da tenere, errore massimo]
const SET = {ossa: ['ossa', '', 0.55, 0.0008], muscoli: ['muscoli', '', 0.16, 0.004], legamenti: ['legamenti', '', 0.45, 0.003], inserzioni: ['inserzioni', '', 0.08, 0.004],
  encefalo: ['nervoso', 'encefalo', 0.4, 0.0015], midollo: ['nervoso', 'midollo', 0.4, 0.002], nervi: ['nervoso', 'nervi', 0.3, 0.004], sensi: ['nervoso', 'sensi', 0.35, 0.002],
  meningi: ['nervoso', 'meningi', 0.3, 0.003], vasi: ['vasi', '', 0.22, 0.004], visceri: ['visceri', '', 0.3, 0.003]};
const META = JSON.parse(fs.readFileSync(`${IN}/za_meta.json`, 'utf8')).objects;
await MeshoptEncoder.ready; await MeshoptSimplifier.ready; await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions([EXTMeshoptCompression, KHRMeshQuantization]).registerDependencies({'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder});
const tri = doc => { let n = 0; for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) n += (p.getIndices() ? p.getIndices().getCount() : p.getAttribute('POSITION').getCount()) / 3; return Math.round(n); };
for (const layer of Object.keys(SET)) {
  const [raw, sub, ratio, error] = SET[layer];
  const doc = await io.read(`${IN}/${raw}.raw.glb`);
  for (const n of doc.getRoot().listNodes()) {
    const za = n.getExtras().za; if (za) { n.setName(za); n.setExtras({}); }
    if (sub && n.getMesh() && (META[n.getName()] || {}).sub !== sub) { const m = n.getMesh(); n.dispose(); if (m.listParents().length <= 1) m.dispose(); }
  }
  await doc.transform(prune());
  const before = tri(doc);
  doc.createExtension(EXTMeshoptCompression).setRequired(true); doc.createExtension(KHRMeshQuantization).setRequired(true);
  const steps = [weld()];
  if (ratio < 1) steps.push(simplify({simplifier: MeshoptSimplifier, ratio, error}));
  steps.push(quantize({quantizePosition: 14}), meshopt({encoder: MeshoptEncoder, level: 'high'}));
  await doc.transform(...steps);
  await io.write(`${OUT}/${layer}.glb`, doc);
  console.log(layer.padEnd(11), String(doc.getRoot().listNodes().filter(n => n.getMesh()).length).padStart(4), 'parti ·', before, '->', tri(doc), 'triangoli ·', (fs.statSync(`${OUT}/${layer}.glb`).size / 1e6).toFixed(2), 'MB');
}

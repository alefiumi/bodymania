// Disegni 2D ricavati dal modello 3D (Z-Anatomy): proiezione ortografica con z-buffer, una etichetta per pixel,
// poi i contorni di ogni regione visibile diventano tracciati SVG. Niente pacchetti npm: legge da sé i .glb
// (con il decodificatore meshopt di atlante/vendor) e disegna in software.
// Uso: node atlante/build/proietta_2d.mjs <uscita.json>      (poi: python3 atlante/build/contenuti_2d.py)
// Viste: corpo anteriore (a) e posteriore (p); encefalo laterale (emisfero sinistro) e sagittale (faccia mediale del destro).
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {MeshoptDecoder} from '../vendor/addons/libs/meshopt_decoder.module.js';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.argv[2] || 'proiezioni.json';
await MeshoptDecoder.ready;

/* ---------- lettura dei .glb (EXT_meshopt_compression, KHR_mesh_quantization) ---------- */
function loadGlb(file) {
  const b = fs.readFileSync(path.join(DIR, file));
  const jl = b.readUInt32LE(12), J = JSON.parse(b.subarray(20, 20 + jl).toString());
  const bin = b.subarray(20 + jl + 8);
  const views = J.bufferViews.map(v => {
    const ex = v.extensions && v.extensions.EXT_meshopt_compression;
    if (!ex) return bin.subarray(v.byteOffset || 0, (v.byteOffset || 0) + v.byteLength);
    const out = new Uint8Array(ex.count * ex.byteStride);
    MeshoptDecoder.decodeGltfBuffer(out, ex.count, ex.byteStride, bin.subarray(ex.byteOffset || 0, (ex.byteOffset || 0) + ex.byteLength), ex.mode, ex.filter || 'NONE');
    return out;
  });
  const CT = {5120: [Int8Array, 127], 5121: [Uint8Array, 255], 5122: [Int16Array, 32767], 5123: [Uint16Array, 65535], 5125: [Uint32Array, 0], 5126: [Float32Array, 0]};
  const NC = {SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4};
  function acc(i) {
    const a = J.accessors[i], v = J.bufferViews[a.bufferView], [T, norm] = CT[a.componentType], n = NC[a.type];
    const raw = views[a.bufferView], bs = T.BYTES_PER_ELEMENT, stride = (v.byteStride || n * bs) / bs;
    const src = new T(raw.buffer, raw.byteOffset + (a.byteOffset || 0), Math.floor((raw.byteLength - (a.byteOffset || 0)) / bs));
    const out = new Float32Array(a.count * n);
    for (let k = 0; k < a.count; k++) for (let c = 0; c < n; c++) {
      let x = src[k * stride + c]; if (a.normalized && norm) x = Math.max(x / norm, -1); out[k * n + c] = x;
    }
    return out;
  }
  const parts = [];
  for (const nd of J.nodes) {
    if (nd.mesh == null) continue;
    const t = nd.translation || [0, 0, 0], s = nd.scale || [1, 1, 1], q = nd.rotation || [0, 0, 0, 1];
    const [qx, qy, qz, qw] = q;
    const R = [1 - 2 * (qy * qy + qz * qz), 2 * (qx * qy - qz * qw), 2 * (qx * qz + qy * qw),
      2 * (qx * qy + qz * qw), 1 - 2 * (qx * qx + qz * qz), 2 * (qy * qz - qx * qw),
      2 * (qx * qz - qy * qw), 2 * (qy * qz + qx * qw), 1 - 2 * (qx * qx + qy * qy)];
    const tris = [], verts = [];
    for (const p of J.meshes[nd.mesh].primitives) {
      const P = acc(p.attributes.POSITION), I = p.indices != null ? acc(p.indices) : null;
      const W = new Float32Array(P.length);
      for (let k = 0; k < P.length; k += 3) {
        const x = P[k] * s[0], y = P[k + 1] * s[1], z = P[k + 2] * s[2];
        W[k] = R[0] * x + R[1] * y + R[2] * z + t[0]; W[k + 1] = R[3] * x + R[4] * y + R[5] * z + t[1]; W[k + 2] = R[6] * x + R[7] * y + R[8] * z + t[2];
      }
      const n = I ? I.length : P.length / 3, T = new Float32Array(n * 3);
      for (let k = 0; k < n; k++) { const v = I ? I[k] : k; T[k * 3] = W[v * 3]; T[k * 3 + 1] = W[v * 3 + 1]; T[k * 3 + 2] = W[v * 3 + 2]; }
      tris.push(T); verts.push(W);
    }
    parts.push({name: nd.name, tris: concat(tris), verts: concat(verts)});
  }
  return parts;
}
const concat = a => { if (a.length === 1) return a[0]; const o = new Float32Array(a.reduce((s, x) => s + x.length, 0)); let k = 0; for (const x of a) { o.set(x, k); k += x.length; } return o; };

/* ---------- proiezione con z-buffer ---------- */
// view: proj(x,y,z) -> [u, v, profondità] (u a destra, v in basso, profondità più grande = più vicino)
// parts: [{tris, lab}] (lab = etichetta intera >0; oppure labOf(tri centro) per dividere una parte)
function render(parts, proj, pxPerM) {
  let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
  for (const p of parts) for (let k = 0; k < p.tris.length; k += 3) {
    const [u, v] = proj(p.tris[k], p.tris[k + 1], p.tris[k + 2]);
    if (u < u0) u0 = u; if (u > u1) u1 = u; if (v < v0) v0 = v; if (v > v1) v1 = v;
  }
  const pad = 0.01; u0 -= pad; v0 -= pad; u1 += pad; v1 += pad;
  const w = Math.ceil((u1 - u0) * pxPerM), h = Math.ceil((v1 - v0) * pxPerM);
  const L = new Int32Array(w * h), D = new Float32Array(w * h).fill(-Infinity);
  const P = new Float32Array(9);
  for (const p of parts) {
    const T = p.tris;
    for (let k = 0; k < T.length; k += 9) {
      for (let j = 0; j < 3; j++) { const [u, v, d] = proj(T[k + j * 3], T[k + j * 3 + 1], T[k + j * 3 + 2]); P[j * 3] = (u - u0) * pxPerM; P[j * 3 + 1] = (v - v0) * pxPerM; P[j * 3 + 2] = d; }
      const lab = p.labOf ? p.labOf(T[k] + T[k + 3] + T[k + 6], T[k + 1] + T[k + 4] + T[k + 7], T[k + 2] + T[k + 5] + T[k + 8]) : p.lab;
      const ax = P[0], ay = P[1], bx = P[3], by = P[4], cx = P[6], cy = P[7];
      const area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax); if (Math.abs(area) < 1e-9) continue;
      const xa = Math.max(0, Math.floor(Math.min(ax, bx, cx))), xb = Math.min(w - 1, Math.ceil(Math.max(ax, bx, cx)));
      const ya = Math.max(0, Math.floor(Math.min(ay, by, cy))), yb = Math.min(h - 1, Math.ceil(Math.max(ay, by, cy)));
      for (let y = ya; y <= yb; y++) { const py = y + 0.5;
        for (let x = xa; x <= xb; x++) { const px = x + 0.5;
          const w0 = ((bx - px) * (cy - py) - (by - py) * (cx - px)) / area, w1 = ((cx - px) * (ay - py) - (cy - py) * (ax - px)) / area, w2 = 1 - w0 - w1;
          if (w0 < 0 || w1 < 0 || w2 < 0) continue;
          const d = w0 * P[2] + w1 * P[5] + w2 * P[8], i = y * w + x;
          if (d > D[i]) { D[i] = d; L[i] = lab; }
        } }
    }
  }
  return {L, D, w, h, u0, v0, pxPerM};
}

/* ---------- contorni: bordi tra pixel di etichetta diversa, concatenati in anelli, poi semplificati ---------- */
function trace(R, minArea = 6, tol = 0.75) {
  const {L, w, h} = R, W1 = w + 1, edges = new Map(); // etichetta -> Map(angolo -> [angoli])
  const add = (lab, a, b) => { let m = edges.get(lab); if (!m) edges.set(lab, m = new Map()); const l = m.get(a); if (l) l.push(b); else m.set(a, [b]); };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const a = L[y * w + x]; if (!a) continue;
    if (y === 0 || L[(y - 1) * w + x] !== a) add(a, y * W1 + x, y * W1 + x + 1);
    if (x === w - 1 || L[y * w + x + 1] !== a) add(a, y * W1 + x + 1, (y + 1) * W1 + x + 1);
    if (y === h - 1 || L[(y + 1) * w + x] !== a) add(a, (y + 1) * W1 + x + 1, (y + 1) * W1 + x);
    if (x === 0 || L[y * w + x - 1] !== a) add(a, (y + 1) * W1 + x, y * W1 + x);
  }
  const out = new Map();
  for (const [lab, m] of edges) {
    const loops = [];
    for (const start of [...m.keys()]) {
      while (m.has(start)) {
        const pts = []; let c = start;
        for (;;) {
          const l = m.get(c); if (!l) break;
          const n = l.pop(); if (!l.length) m.delete(c);
          pts.push([c % W1, Math.floor(c / W1)]); c = n; if (c === start) break;
        }
        // punti medi dei lati: toglie la scalettatura dei pixel
        const mid = pts.map((p, i) => { const q = pts[(i + 1) % pts.length]; return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]; });
        let ar = 0; for (let i = 0; i < mid.length; i++) { const p = mid[i], q = mid[(i + 1) % mid.length]; ar += p[0] * q[1] - q[0] * p[1]; }
        if (Math.abs(ar / 2) < minArea) continue;
        loops.push(simplify(mid, tol));
      }
    }
    out.set(lab, loops);
  }
  return out;
}
function simplify(pts, tol) { // Douglas-Peucker su anello chiuso
  if (pts.length < 8) return pts;
  let far = 0, fd = -1; for (let i = 1; i < pts.length; i++) { const d = (pts[i][0] - pts[0][0]) ** 2 + (pts[i][1] - pts[0][1]) ** 2; if (d > fd) { fd = d; far = i; } }
  const dp = (a) => {
    const keep = new Uint8Array(a.length); keep[0] = keep[a.length - 1] = 1; const st = [[0, a.length - 1]];
    while (st.length) { const [i, j] = st.pop(); let md = -1, mk = -1; const [x1, y1] = a[i], [x2, y2] = a[j], dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy || 1e-12;
      for (let k = i + 1; k < j; k++) { const t = Math.max(0, Math.min(1, ((a[k][0] - x1) * dx + (a[k][1] - y1) * dy) / l2)); const d = (a[k][0] - x1 - t * dx) ** 2 + (a[k][1] - y1 - t * dy) ** 2; if (d > md) { md = d; mk = k; } }
      if (md > tol * tol) { keep[mk] = 1; st.push([i, mk], [mk, j]); } }
    return a.filter((_, k) => keep[k]);
  };
  const A = dp(pts.slice(0, far + 1)), B = dp([...pts.slice(far), pts[0]]);
  return [...A, ...B.slice(1, -1)];
}
// anelli in unità della figura -> tracciato SVG relativo con un decimale
function toPath(loops, k) {
  let s = '', px = 0, py = 0;
  for (const lp of loops) {
    lp.forEach((p, i) => {
      const x = Math.round(p[0] * k * 10), y = Math.round(p[1] * k * 10);
      if (i === 0) s += 'M' + (x / 10) + ' ' + (y / 10); else { const dx = (x - px) / 10, dy = (y - py) / 10; s += 'l' + dx + (dy < 0 ? '' : ' ') + dy; }
      px = x; py = y;
    });
    s += 'z';
  }
  return s.replace(/ -/g, '-');
}

/* ---------- etichette ---------- */
const side = n => n.endsWith('.r') ? 'r' : n.endsWith('.l') ? 'l' : '';
const base = n => n.replace(/\.(r|l)$/, '').trim();
function labeler() { const ids = new Map(), names = []; return {id(k) { if (!ids.has(k)) { ids.set(k, names.length + 1); names.push(k); } return ids.get(k); }, names}; }
// centri per etichetta e lato (in pixel), per etichette e linee dei muscoli
function centers(R, labSide) {
  const acc = new Map();
  for (let y = 0; y < R.h; y++) for (let x = 0; x < R.w; x++) { const l = R.L[y * R.w + x]; if (!l) continue; const s = labSide ? labSide(l, x / R.w) : ''; const k = l + '|' + s; const a = acc.get(k) || [0, 0, 0]; a[0] += x; a[1] += y; a[2]++; acc.set(k, a); }
  return acc;
}

/* ---------- corpo: ossa, vista anteriore e posteriore ---------- */
const SKIP = /(cells of ethmoid|Sinus of|Incus|Malleus|Stapes|cartilage(?! of .* rib)|Arytenoid|Corniculate|Cricoid|Thyroid|alar|Sesamoid)/i;
const ossa = loadGlb('ossa.glb').filter(p => !SKIP.test(p.name));
const bodyLab = labeler();
const keyOf = n => /(incisor|canine|premolar|molar)/i.test(n) ? 'Teeth' : /Costal cartilage/.test(n) ? 'Costal cartilages' : base(n);
for (const p of ossa) p.lab = bodyLab.id(keyOf(p.name));
const PX_BODY = 2200; // pixel per metro (2,2 per mm)
const views = {a: (x, y, z) => [x, -y, z], p: (x, y, z) => [-x, -y, -z]};
const body = {names: bodyLab.names, views: {}, areas: {}};
let bodyK = 0, bodyR = {};
for (const [v, proj] of Object.entries(views)) {
  const R = render(ossa, proj, PX_BODY); bodyR[v] = {R, proj};
  if (!bodyK) { bodyK = 300 / R.w; body.W = 300; body.H = Math.round(R.h * bodyK); }
  const loops = trace(R);
  // lato del corpo dal punto sullo schermo: nella vista anteriore il destro del corpo sta a sinistra
  const C = centers(R, (l, fx) => (v === 'a' ? fx < 0.5 : fx > 0.5) ? 'r' : 'l');
  const out = {};
  for (const [lab, lp] of loops) {
    const k = bodyLab.names[lab - 1], c = {};
    for (const s of ['r', 'l']) { const a = C.get(lab + '|' + s); if (a && a[2] > 20) c[s] = [+(a[0] / a[2] * bodyK).toFixed(1), +(a[1] / a[2] * bodyK).toFixed(1), a[2]]; }
    out[k] = {d: toPath(lp, bodyK), c};
  }
  body.views[v] = out;
  console.log('corpo', v, R.w + '×' + R.h, Object.keys(out).length, 'ossa visibili');
}

/* ---------- aree di origine e inserzione: osso su cui stanno e punto visibile in ogni vista ---------- */
{
  const grid = new Map(), G = 0.01; // griglia di 1 cm con i vertici delle ossa
  for (const p of ossa) { const V = p.verts; for (let k = 0; k < V.length; k += 3) { const key = Math.floor(V[k] / G) + ',' + Math.floor(V[k + 1] / G) + ',' + Math.floor(V[k + 2] / G); let c = grid.get(key); if (!c) grid.set(key, c = []); c.push(V[k], V[k + 1], V[k + 2], p.lab); } }
  const nearest = (x, y, z) => { let bd = 1e9, bl = 0; const gx = Math.floor(x / G), gy = Math.floor(y / G), gz = Math.floor(z / G);
    for (let r = 0; r <= 2 && bl === 0; r++) for (let i = -r; i <= r; i++) for (let j = -r; j <= r; j++) for (let k = -r; k <= r; k++) { const c = grid.get((gx + i) + ',' + (gy + j) + ',' + (gz + k)); if (!c) continue; for (let m = 0; m < c.length; m += 4) { const d = (c[m] - x) ** 2 + (c[m + 1] - y) ** 2 + (c[m + 2] - z) ** 2; if (d < bd) { bd = d; bl = c[m + 3]; } } }
    return bl; };
  for (const p of loadGlb('inserzioni.glb')) {
    const V = p.verts, votes = new Map();
    for (let k = 0; k < V.length; k += 3) { const l = nearest(V[k], V[k + 1], V[k + 2]); if (l) votes.set(l, (votes.get(l) || 0) + 1); }
    const best = [...votes].sort((a, b) => b[1] - a[1])[0]; if (!best) continue;
    const a = {bone: bodyLab.names[best[0] - 1], n: V.length / 3};
    for (const [v, {R, proj}] of Object.entries(bodyR)) { // visibile = almeno un vertice non coperto (3 mm di tolleranza)
      let sx = 0, sy = 0, n = 0;
      for (let k = 0; k < V.length; k += 3) { const [u, w, d] = proj(V[k], V[k + 1], V[k + 2]); const x = Math.floor((u - R.u0) * R.pxPerM), y = Math.floor((w - R.v0) * R.pxPerM); if (x < 0 || y < 0 || x >= R.w || y >= R.h) continue; if (d >= R.D[y * R.w + x] - 0.003) { sx += x; sy += y; n++; } }
      if (n) a[v] = [+(sx / n * bodyK).toFixed(1), +(sy / n * bodyK).toFixed(1)];
    }
    body.areas[p.name] = a;
  }
  console.log('aree', Object.keys(body.areas).length);
}

/* ---------- encefalo: vista laterale (emisfero sinistro) e sagittale (faccia mediale del destro) ---------- */
// esclusi: occhio e i nuclei profondi (nuclei della base, nuclei dei nervi cranici…), che in una vista di superficie
// o in una sezione mediana non si vedono: dove la fonte lascia spazi tra le superfici comparirebbero per errore
const DEEP = /(eyeball|nucleus|Vestibular nuclei|Putamen|Globus pallidus|Amygdaloid|Stria terminalis)/i;
// ipofisi ed epifisi nella fonte stanno tra i visceri (ghiandole endocrine)
const enc = [...loadGlb('encefalo.glb').filter(p => !DEEP.test(p.name)), ...loadGlb('visceri.glb').filter(p => /^(Adenohypophysis|Neurohypophysis|Pineal gland)$/.test(p.name))];
const brain = {};
const lateral = (x, y, z) => [-z, -y, x]; // osservatore a sinistra del corpo (+X): la fronte a sinistra
{
  // Area di Wernicke: terzo posteriore del giro temporale superiore (confine approssimato, la fonte non la separa)
  const stg = enc.find(p => p.name === 'Superior temporal gyrus (Lateral part).l');
  let z0 = Infinity, z1 = -Infinity; for (let k = 2; k < stg.tris.length; k += 3) { z0 = Math.min(z0, stg.tris[k]); z1 = Math.max(z1, stg.tris[k]); }
  const zW = z0 + (z1 - z0) / 3;
  for (const [key, keep, extra] of [['lat', n => side(n) !== 'r', true], ['sag', n => side(n) !== 'l', false]]) {
    const lb = labeler(), parts = enc.filter(p => keep(p.name)).map(p => ({tris: p.tris, lab: lb.id(base(p.name))}));
    if (extra) { const P = parts.find(p => p.tris === stg.tris), a = P.lab, wl = lb.id('Wernicke area'); P.labOf = (x, y, z) => z / 3 < zW ? wl : a; }
    const R = render(parts, lateral, 5000), k = 300 / R.w, loops = trace(R, 4, 0.7), C = centers(R);
    const out = {};
    for (const [lab, lp] of loops) { const a = C.get(lab + '|'); out[lb.names[lab - 1]] = {d: toPath(lp, k), c: a ? [+(a[0] / a[2] * k).toFixed(1), +(a[1] / a[2] * k).toFixed(1), a[2]] : null}; }
    brain[key] = {W: 300, H: Math.round(R.h * k), shapes: out};
    console.log('encefalo', key, R.w + '×' + R.h, Object.keys(out).length, 'strutture visibili');
  }
}

fs.writeFileSync(OUT, JSON.stringify({body, brain}));
console.log('scritto', OUT, (fs.statSync(OUT).size / 1e6).toFixed(2), 'MB');

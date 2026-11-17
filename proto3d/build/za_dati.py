# Genera proto3d/dati.json dai metadati di Z-Anatomy (za_meta.json), dalla Terminologia Anatomica (TA2.csv)
# e dalle schede dei muscoli scritte a mano (schede.json).
# Uso: python3 za_dati.py <za_meta.json> <dati.json>
import json, re, sys, os, collections
HERE = os.path.dirname(os.path.abspath(__file__))
META = json.load(open(sys.argv[1])); O = META['objects']; LAB = META['labels']
CARDS = json.load(open(os.path.join(HERE, 'schede.json')))

# --- Terminologia Anatomica 2: inglese -> (italiano, latino) ---
TA = {}
for line in open(os.path.join(HERE, 'TA2.csv'), encoding='utf-8-sig'):
    p = line.strip().strip('"').split(';')
    if len(p) >= 7 and p[0] != 'TA2ID': TA[p[1].strip().lower()] = (p[6].strip(), p[2].strip())
def look(b):
    k = re.sub(r"['*]", '', b.lower()).strip()
    for c in (k, k.strip('()'), re.sub(r' muscles?$', '', k.strip('()')), k.strip('()') + ' muscle', re.sub(r'\s*\(.*\)$', '', k)):
        if c in TA: return TA[c]
    return None
base = lambda n: re.sub(r'\.(?:[oe]\d*[rl]|[rl]|[a-z])$', '', n)
def side(n):
    m = re.search(r'\.(?:[oe]\d*)?([rl])$', n); return m.group(1) if m else ''
def root(b):
    b = re.sub(r"['*]", '', b.strip('()'))
    m = re.match(r'^(.*?\b(?:head|part|belly|tendon|slip|layer|fibres|portion) of )(.+)$', b)
    if m: b = m.group(2)
    return re.sub(r' muscles?$', '', b).strip().lower()
yup = lambda v: [round(v[0], 5), round(v[2], 5), round(-v[1], 5)]  # Blender (Z in alto) -> glTF (Y in alto)

NON_MUSCLE = {'Bursa', 'Fascia', 'Ligament', 'Articular capsule', 'Tendon', 'Cartilage'}
names, objs = {}, {}
def name_of(b):
    if b not in names:
        t = look(b); names[b] = [t[0], t[1]] if t else [b, '']
    return names[b]
for n, v in O.items():
    layer = v['sub'] if v['layer'] == 'nervoso' else v['layer']
    if layer == 'muscoli' and v['mat'] in NON_MUSCLE: layer = 'fasce'   # stesso file dei muscoli, interruttore a parte
    objs[n] = [layer, v['mat'], (v['chain'] or [''])[0]]
    name_of(base(n))
    if v['chain']: name_of(v['chain'][0])

# --- reperi: etichette della fonte con la punta della linea di richiamo ---
lm = []
for l in LAB:
    if l['layer'] not in ('ossa', 'nervoso'): continue
    b = re.sub(r'\.\d+$', '', l['n']); name_of(b)
    lm.append([b, l['parent'], yup(l['p']), yup(l['d'])])

# --- muscoli: forme, aree di origine (o) e di inserzione (e) ---
GROUPS = {'iliopsoas': ['psoas major', 'iliacus'], 'quadriceps femoris': ['rectus femoris', 'vastus lateralis', 'vastus medialis', 'vastus intermedius'],
          'triceps surae': ['gastrocnemius', 'soleus'], 'erector spinae': ['iliocostalis lumborum', 'iliocostalis thoracis', 'longissimus thoracis', 'spinalis thoracis'],
          'common flexor tendon': ['flexor carpi radialis', 'palmaris longus', 'flexor carpi ulnaris', 'pronator teres', 'flexor digitorum superficialis'],
          'common extensor tendon': ['extensor carpi radialis brevis', 'extensor digitorum', 'extensor digiti minimi', 'extensor carpi ulnaris']}
mus = {}
for n, (layer, mat, g) in objs.items():
    if layer != 'muscoli': continue
    r = root(base(n)); m = mus.setdefault(r, {'parts': [], 'o': [], 'e': [], 'mat': mat, 'g': g})
    if base(n) not in m['parts']: m['parts'].append(base(n))
for n, (layer, mat, g) in objs.items():
    if layer != 'inserzioni': continue
    kind = re.search(r'\.([oe])\d*[rl]$', n)
    if not kind: continue
    for r in GROUPS.get(root(base(n)), [root(base(n))]):
        if r in mus: mus[r][kind.group(1)].append(n)
CARD_OF = {'psoas': 'psoas major', 'iliaco': 'iliacus', 'gmax': 'gluteus maximus', 'gmed': 'gluteus medius', 'gmin': 'gluteus minimus', 'tfl': 'tensor fasciae latae', 'pirif': 'piriformis',
 'sart': 'sartorius', 'rf': 'rectus femoris', 'addl': 'adductor longus', 'grac': 'gracilis', 'bfem': 'biceps femoris', 'semit': 'semitendinosus', 'delt': 'deltoid', 'sovra': 'supraspinatus',
 'sotto': 'infraspinatus', 'prot': 'teres minor', 'sscap': 'subscapularis', 'grot': 'teres major', 'gdors': 'latissimus dorsi', 'gpett': 'pectoralis major', 'ppett': 'pectoralis minor',
 'trap': 'trapezius', 'elev': 'levator scapulae', 'romb': ['rhomboid major', 'rhomboid minor'], 'dent': 'serratus anterior', 'bic': 'biceps brachii', 'brac': 'brachialis', 'tric': 'triceps brachii',
 'brrad': 'brachioradialis', 'pron': 'pronator teres', 'frc': 'flexor carpi radialis', 'fuc': 'flexor carpi ulnaris', 'erlc': 'extensor carpi radialis longus', 'erbc': 'extensor carpi radialis brevis',
 'euc': 'extensor carpi ulnaris', 'vlat': 'vastus lateralis', 'vmed': 'vastus medialis', 'vint': 'vastus intermedius', 'semim': 'semimembranosus', 'addg': 'adductor magnus', 'pett': 'pectineus',
 'tibant': 'tibialis anterior', 'tibpost': 'tibialis posterior', 'gastr': 'gastrocnemius', 'soleo': 'soleus', 'perl': 'fibularis longus', 'perb': 'fibularis brevis', 'retto': 'rectus abdominis',
 'qlomb': 'quadratus lumborum', 'scm': 'sternocleidomastoid', 'scal': ['scalenus anterior', 'scalenus medius'], 'splen': 'splenius capitis', 'mass': 'masseter', 'temp': 'temporalis'}
for cid, rs in CARD_OF.items():
    for r in ([rs] if isinstance(rs, str) else rs):
        assert r in mus, (cid, r)
        c = CARDS[cid]; mus[r]['card'] = {'ot': c['ot'], 'it': c['it'], 'a': c['a'], 'nv': c['nv']}
        if not isinstance(rs, str): mus[r]['card']['nota'] = 'Testo comune a: ' + c['n']
for r, m in mus.items():
    t = look(r + ' muscle') or look(r) or look(m['parts'][0])
    m['n'] = t[0] if t else r.capitalize(); m['la'] = t[1] if t else ''
    for p in m['parts']: name_of(p)
out = {'version': 1, 'fonte': 'Z-Anatomy (CC BY-SA 4.0), derivato da BodyParts3D; nomi dalla Terminologia Anatomica 2',
       'names': names, 'objs': objs, 'lm': lm, 'mus': mus}
sys.path.insert(0, HERE); import descrizioni; out['desc'] = descrizioni.build(out)  # testi di ossa, reperi ed encefalo
descrizioni.correggi_aree(mus)  # origine e inserzione scambiate nella fonte
json.dump(out, open(sys.argv[2], 'w'), ensure_ascii=False, separators=(',', ':'))
lay = collections.Counter(v[0] for v in objs.values())
print(dict(lay)); print(len(lm), 'reperi,', len(mus), 'muscoli,', sum(1 for m in mus.values() if m['o'] or m['e']), 'con aree,', sum(1 for m in mus.values() if 'card' in m), 'con scheda,', len(names), 'nomi,', sum(1 for v in names.values() if not v[1]), 'senza traduzione')

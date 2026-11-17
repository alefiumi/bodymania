# Esporta da Z-Anatomy (Startup.blend) gli strati del prototipo come .glb grezzi e un file di metadati.
# Uso: Blender -b Startup.blend --python za_export.py -- <cartella di uscita>
# Fonte: Z-Anatomy (CC BY-SA 4.0), a sua volta derivato da BodyParts3D.
import bpy, json, sys, re
from mathutils import Vector

OUT = sys.argv[-1]
scene = bpy.context.scene
cols = {c.name.split(':')[0]: c for c in scene.collection.children if re.match(r'^\d:', c.name)}
suffix = lambda n: (re.search(r'\.([a-z0-9]+)$', n) or [None, ''])[1]
NC = re.compile(r'^(Kidney|Renal pelvis|Intrarenal (arteries|veins) of (left|right) kidney|Cochlea|Vestibule)(\.[a-z])?$')
SIDE = re.compile(r'\.(?:[oe]\d*)?([rl])$')

def chain(o):
    out = []
    while o.parent is not None:
        o = o.parent; out.append(re.sub(r'\.[a-z0-9]+$', '', o.name))
    return out  # dal più vicino alla radice

def sublayer(o):
    ch = chain(o)
    for k, v in (('Brain', 'encefalo'), ('Spinal cord', 'midollo'), ('Meninges', 'meningi'), ('Eye', 'sensi'), ('Ear', 'sensi'),
                 ('Peripheral nervous system', 'nervi'), ('Central nervous system', 'encefalo')):
        if k in ch: return v
    return 'nervi' if o.type == 'CURVE' else 'encefalo'

LAYERS = {'ossa': '1', 'inserzioni': '2', 'legamenti': '3', 'muscoli': '4', 'vasi': '5', 'nervoso': '7', 'visceri': '8'}
BEVEL = {'nervoso': 0.0011, 'vasi': 0.0012, 'visceri': 0.001}  # raggio minimo dei tubi (nervi, vasi) in metri

# tutto visibile e selezionabile
def unhide(lc):
    lc.exclude = False; lc.hide_viewport = False
    for c in lc.children: unhide(c)
unhide(bpy.context.view_layer.layer_collection)

meta, labels = {}, []
dg = None
for layer, key in LAYERS.items():
    col = cols[key]
    objs = []
    for o in list(col.all_objects):
        s = suffix(o.name)
        if o.type == 'FONT':
            # etichette dei reperi: .t (destra o linea mediana); la linea figlia .j punta al repere
            if s == 't':
                line = next((c for c in o.children if c.type == 'MESH' and len(c.data.vertices) == 2), None)
                if line:
                    a, b = [line.matrix_world @ v.co for v in line.data.vertices]
                    lab = o.matrix_world.translation
                    tip, base = (a, b) if (a - lab).length > (b - lab).length else (b, a)
                    try: body = o.data.body
                    except Exception: body = ''
                    labels.append({'layer': layer, 'n': re.sub(r'\.t$', '', o.name), 'body': body, 'parent': o.parent.name if o.parent else '',
                                   'p': [round(v, 5) for v in tip], 'd': [round(v, 4) for v in (base - tip).normalized()] if (base - tip).length > 1e-6 else [0, 0, 1]})
            continue
        if o.type not in ('MESH', 'CURVE') or s in ('j', 'i', 'g', 's', 't', 'st'): continue
        if NC.match(o.name): continue  # parti con licenza non commerciale nella fonte (rene, orecchio interno): non si esportano
        if o.type == 'MESH' and len(o.data.polygons) == 0: continue
        objs.append(o)
    bpy.ops.object.select_all(action='DESELECT')
    exported = []
    for o in objs:
        info = {'layer': layer, 'sub': sublayer(o) if layer == 'nervoso' else '', 'mat': (o.data.materials[0].name if o.data.materials and o.data.materials[0] else ''),
                'chain': chain(o)[:3], 'curve': o.type == 'CURVE'}
        if o.type == 'CURVE':
            if o.data.bevel_object is None: o.data.bevel_depth = max(o.data.bevel_depth, BEVEL.get(layer, 0.001)); o.data.bevel_resolution = 1; o.data.resolution_u = min(o.data.resolution_u, 6)
            dg = bpy.context.evaluated_depsgraph_get()
            me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
            if len(me.polygons) == 0: continue
            n = bpy.data.objects.new(o.name + '~', me); n.matrix_world = o.matrix_world.copy(); col.objects.link(n)
            name = o.name; o = n
        else:
            name = o.name
            mw = o.matrix_world.copy(); o.parent = None; o.matrix_world = mw
            for m in list(o.modifiers):
                if m.type not in ('MIRROR', 'SUBSURF', 'SOLIDIFY', 'ARMATURE'): pass
        o.hide_viewport = False; o.hide_select = False; o.hide_set(False)
        o.name = name if o.name == name else o.name
        o['za'] = name
        meta[name] = info
        exported.append((o, name))
    bpy.context.view_layer.update()
    for o, name in exported:
        o.select_set(True)
    for o, name in exported:
        bb = [o.matrix_world @ Vector(v) for v in o.bound_box]
        c = sum(bb, Vector()) / 8
        meta[name]['c'] = [round(c.x, 4), round(c.y, 4), round(c.z, 4)]
    bpy.ops.export_scene.gltf(filepath=f'{OUT}/{layer}.raw.glb', export_format='GLB', use_selection=True, export_apply=True, export_yup=True,
                              export_materials='NONE', export_extras=True, export_normals=False, export_texcoords=False, export_animations=False,
                              export_skins=False, export_morph=False, export_cameras=False, export_lights=False)
    print('STRATO', layer, len(exported))
json.dump({'objects': meta, 'labels': labels}, open(f'{OUT}/za_meta.json', 'w'), ensure_ascii=False)
print('ETICHETTE', len(labels))

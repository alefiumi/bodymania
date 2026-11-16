# Genera proto3d/reperi.json: reperi (punti sul modello) e muscoli di bacino e anca.
# Le coordinate sono state prese sul modello (metri, Y in alto, +Z davanti, -X = lato destro del corpo).
import json, sys

RAW = json.loads(r'''[["sias","dx","FMA16586",[-0.1298,0.8958,0.139],[-0.07,-0.01,1]],["sias","sx","FMA16587",[0.1293,0.8951,0.1391],[0.02,0.05,1]],["siai","dx","FMA16586",[-0.1115,0.8531,0.11],[-0.74,-0.4,0.53]],["siai","sx","FMA16587",[0.1118,0.8543,0.1103],[0.86,-0.38,0.34]],["sips","dx","FMA16586",[-0.0386,0.9003,0.0039],[0.43,-0.22,-0.87]],["sips","sx","FMA16587",[0.0407,0.8991,0.0033],[-0.05,-0.38,-0.92]],["sipi","dx","FMA16586",[-0.0506,0.8648,0.0316],[-0.19,-0.94,-0.28]],["sipi","sx","FMA16587",[0.048,0.8632,0.0302],[0.24,-0.87,-0.43]],["cresta","dx","FMA16586",[-0.1013,0.9579,0.0587],[0.15,0.98,0.1]],["cresta","sx","FMA16587",[0.1008,0.9578,0.0585],[-0.24,0.94,0.23]],["tuber_post","dx","FMA16586",[-0.0754,0.7866,0.039],[-0.94,0.01,-0.34]],["tuber_post","sx","FMA16587",[0.0732,0.7814,0.0327],[0.85,-0.04,-0.53]],["spina_isch","dx","FMA16586",[-0.0516,0.8223,0.037],[-0.34,0.49,-0.8]],["spina_isch","sx","FMA16587",[0.0497,0.822,0.0356],[0.36,0.41,-0.83]],["acetabolo","dx","FMA16586",[-0.0599,0.8098,0.0838],[-0.96,-0.11,-0.24]],["acetabolo","sx","FMA16587",[0.0595,0.8119,0.0818],[0.98,-0.1,-0.18]],["pube","dx","FMA16586",[-0.0193,0.7994,0.1381],[-0.04,-0.13,0.99]],["pube","sx","FMA16587",[0.0182,0.7996,0.1382],[-0.07,-0.22,0.97]],["pube_corpo","dx","FMA16586",[-0.0146,0.7936,0.1336],[0.29,-0.65,0.7]],["pube_corpo","sx","FMA16587",[0.0142,0.7929,0.1331],[-0.31,-0.67,0.68]],["sinfisi","dx","FMA16586",[-0.0048,0.7929,0.122],[0.97,-0.18,0.15]],["sinfisi","sx","FMA16587",[0.0047,0.7964,0.1265],[-0.91,-0.29,0.3]],["ramo_inf","dx","FMA16586",[-0.0153,0.7818,0.0967],[0.28,0.66,-0.69]],["ramo_inf","sx","FMA16587",[0.0111,0.7836,0.1014],[-0.41,0.56,-0.72]],["fossa_iliaca","dx","FMA16586",[-0.1082,0.9067,0.0794],[0.76,0.37,0.53]],["fossa_iliaca","sx","FMA16587",[0.1054,0.9055,0.0767],[-0.68,0.3,0.66]],["auricolare","dx","FMA16586",[-0.0451,0.8836,0.0253],[0.93,0.37,0.01]],["auricolare","sx","FMA16587",[0.0471,0.8834,0.0288],[-0.94,0.33,0.05]],["glutea_med","dx","FMA16586",[-0.1077,0.8983,0.0749],[-0.61,-0.13,-0.78]],["glutea_med","sx","FMA16587",[0.1082,0.8896,0.077],[0.61,-0.16,-0.78]],["glutea_min","dx","FMA16586",[-0.1162,0.8738,0.0935],[-0.95,-0.25,-0.2]],["glutea_min","sx","FMA16587",[0.118,0.8823,0.0929],[0.92,-0.31,-0.24]],["glutea_max","dx","FMA16586",[-0.0611,0.8946,0.0182],[-0.94,-0.2,-0.26]],["glutea_max","sx","FMA16587",[0.0609,0.8942,0.0185],[0.87,-0.36,-0.33]],["tfl","dx","FMA16586",[-0.1344,0.9015,0.1277],[-0.92,-0.26,-0.31]],["tfl","sx","FMA16587",[0.1345,0.9014,0.128],[0.9,-0.28,-0.33]],["testa","dx","FMA24474",[-0.0675,0.8228,0.0813],[0.93,0.36,-0.01]],["testa","sx","FMA24475",[0.0675,0.823,0.0821],[-0.85,0.52,0.1]],["gt","dx","FMA24474",[-0.1501,0.7834,0.0749],[-0.99,-0.04,-0.14]],["gt","sx","FMA24475",[0.1502,0.784,0.0761],[0.99,0.03,0.12]],["gt_apice","dx","FMA24474",[-0.1315,0.8062,0.0598],[-0.27,0.81,-0.52]],["gt_apice","sx","FMA24475",[0.1272,0.8068,0.0581],[0.26,0.8,-0.54]],["piccolo_troc","dx","FMA24474",[-0.0957,0.7443,0.0589],[0.56,-0.14,-0.82]],["piccolo_troc","sx","FMA24475",[0.0948,0.7458,0.0591],[-0.69,-0.11,-0.72]],["tub_glutea","dx","FMA24474",[-0.1223,0.7237,0.0686],[-0.31,-0.3,-0.9]],["tub_glutea","sx","FMA24475",[0.1204,0.7245,0.0673],[0.33,-0.33,-0.88]],["linea_aspra","dx","FMA24474",[-0.098,0.5954,0.0794],[0.17,0.01,-0.98]],["linea_aspra","sx","FMA24475",[0.0948,0.5996,0.0809],[-0.55,0.06,-0.83]],["epi_lat","dx","FMA24474",[-0.1127,0.3957,0.0769],[-0.98,-0.16,-0.09]],["epi_lat","sx","FMA24475",[0.1126,0.3951,0.0788],[0.99,-0.12,0.05]],["epi_med","dx","FMA24474",[-0.0319,0.402,0.0695],[0.99,0.03,-0.15]],["epi_med","sx","FMA24475",[0.0323,0.4039,0.0691],[-0.96,0.13,-0.25]],["tub_tibiale","dx","FMA24477",[-0.0872,0.3405,0.1148],[0.04,0.01,1]],["tub_tibiale","sx","FMA24478",[0.0868,0.3393,0.1145],[0.01,-0.01,1]],["zampa_oca","dx","FMA24477",[-0.0626,0.3127,0.0973],[0.81,-0.18,0.56]],["zampa_oca","sx","FMA24478",[0.0648,0.3103,0.099],[-0.68,-0.14,0.72]],["gerdy","dx","FMA24477",[-0.0954,0.3462,0.1082],[-0.63,0.21,0.75]],["gerdy","sx","FMA24478",[0.0948,0.3456,0.109],[0.75,0.27,0.6]],["testa_fibula","dx","FMA24480",[-0.1196,0.3455,0.0674],[-0.94,0.32,-0.04]],["testa_fibula","sx","FMA24481",[0.1191,0.3466,0.0665],[0.94,0.35,-0.03]],["rotula_base","dx","FMA24486",[-0.0853,0.4008,0.1127],[-0.13,0.99,-0.08]],["rotula_base","sx","FMA24487",[0.0856,0.4008,0.1132],[0.05,0.98,0.17]],["rotula_apice","dx","FMA24486",[-0.0847,0.3615,0.1084],[-0.07,-0.94,-0.34]],["rotula_apice","sx","FMA24487",[0.0845,0.3617,0.1082],[0.09,-0.88,-0.47]],["sacro_ant","dx","FMA16202",[-0.029,0.8524,0.0168],[0.34,-0.15,0.93]],["sacro_ant","sx","FMA16202",[0.0271,0.8527,0.0166],[-0.38,-0.08,0.92]],["sacro_post","dx","FMA16202",[-0.034,0.8562,0.0073],[-0.31,0.01,-0.95]],["sacro_post","sx","FMA16202",[0.0339,0.8554,0.0081],[0.62,0.01,-0.78]],["l1","dx","FMA13072",[-0.0199,1.0431,0.096],[-0.83,-0.44,0.35]],["l1","sx","FMA13072",[0.0186,1.0432,0.096],[0.95,-0.14,0.29]],["l3","dx","FMA13074",[-0.0199,1.0028,0.1033],[-0.9,0.08,0.42]],["l3","sx","FMA13074",[0.0185,1.0022,0.1036],[0.9,-0.11,0.42]],["l5","dx","FMA13076",[-0.0227,0.936,0.0847],[-0.94,-0.11,0.34]],["l5","sx","FMA13076",[0.0218,0.9366,0.0834],[0.94,-0.02,0.34]],["promontorio","","FMA16202",[-0.0007,0.9002,0.0748],[0.06,0.87,0.5]],["coccige","","FMA16202",[-0.0034,0.7968,0.0062],[-0.37,-0.08,-0.92]]]''')

# id: (nome, nome latino, descrizione)
L = {
 'sias': ('Spina iliaca antero-superiore (SIAS)', 'Spina iliaca anterior superior', "Estremità anteriore della cresta iliaca, palpabile sotto la cute. Origine del sartorio; vi si fissa il legamento inguinale."),
 'siai': ('Spina iliaca antero-inferiore (SIAI)', 'Spina iliaca anterior inferior', "Sul margine anteriore dell'ileo, sopra l'acetabolo. Origine del capo diretto del retto femorale."),
 'sips': ('Spina iliaca postero-superiore (SIPS)', 'Spina iliaca posterior superior', "Estremità posteriore della cresta iliaca, circa all'altezza di S2. In superficie corrisponde alla fossetta sopra il gluteo."),
 'sipi': ('Spina iliaca postero-inferiore (SIPI)', 'Spina iliaca posterior inferior', "Sotto la SIPS, al limite superiore della grande incisura ischiatica."),
 'cresta': ('Cresta iliaca (punto più alto)', 'Crista iliaca', "Margine superiore dell'ileo, dalla SIAS alla SIPS. Il punto più alto è circa all'altezza di L4."),
 'tuber_post': ('Tuberosità ischiatica', 'Tuber ischiadicum', "Robusta sporgenza dell'ischio su cui si appoggia il peso da seduti. Origine degli ischiocrurali (bicipite femorale capo lungo, semitendinoso, semimembranoso)."),
 'spina_isch': ('Spina ischiatica', 'Spina ischiadica', "Separa la grande dalla piccola incisura ischiatica. Vi si fissa il legamento sacrospinoso."),
 'acetabolo': ('Acetabolo', 'Acetabulum', "Cavità che accoglie la testa del femore. Vi convergono ileo, ischio e pube."),
 'pube': ('Tubercolo pubico', 'Tuberculum pubicum', "Sporgenza anteriore del pube, lateralmente alla sinfisi. Vi si fissa l'estremità mediale del legamento inguinale."),
 'pube_corpo': ('Corpo del pube (faccia anteriore)', 'Corpus ossis pubis', "Sotto la cresta pubica. Origine dell'adduttore lungo."),
 'sinfisi': ('Faccia sinfisaria del pube', 'Facies symphysialis', "Superficie mediale del pube che si unisce a quella opposta nella sinfisi pubica."),
 'ramo_inf': ('Ramo inferiore del pube', 'Ramus inferior ossis pubis', "Si continua con il ramo dell'ischio (ramo ischio-pubico). Origine del gracile."),
 'fossa_iliaca': ('Fossa iliaca', 'Fossa iliaca', "Faccia interna, concava, dell'ala iliaca. Origine del muscolo iliaco."),
 'auricolare': ("Faccia auricolare dell'ileo", 'Facies auricularis', "Superficie articolare per il sacro: forma l'articolazione sacroiliaca."),
 'glutea_med': ('Faccia glutea: zona del gluteo medio', 'Facies glutea', "Faccia esterna dell'ala iliaca, tra la linea glutea anteriore e la posteriore. Origine del gluteo medio."),
 'glutea_min': ('Faccia glutea: zona del gluteo piccolo', 'Facies glutea', "Faccia esterna dell'ala iliaca, tra la linea glutea anteriore e l'inferiore. Origine del gluteo piccolo."),
 'glutea_max': ('Faccia glutea: zona del gluteo massimo', 'Facies glutea', "Faccia esterna dell'ala iliaca, dietro la linea glutea posteriore. Una delle origini del gluteo massimo."),
 'tfl': ('Cresta iliaca presso la SIAS (labbro esterno)', 'Labium externum cristae iliacae', "Tratto anteriore del labbro esterno della cresta. Origine del tensore della fascia lata."),
 'testa': ('Testa del femore', 'Caput femoris', "Si articola con l'acetabolo nell'articolazione dell'anca (coxofemorale)."),
 'gt': ('Grande trocantere (faccia laterale)', 'Trochanter major', "Sporgenza laterale del femore prossimale, palpabile. Inserzione del gluteo medio e, anteriormente, del gluteo piccolo."),
 'gt_apice': ('Grande trocantere (apice)', 'Trochanter major', "Margine superiore del grande trocantere. Inserzione del piriforme."),
 'piccolo_troc': ('Piccolo trocantere', 'Trochanter minor', "Sporgenza postero-mediale sotto il collo del femore. Inserzione dell'ileopsoas."),
 'tub_glutea': ('Tuberosità glutea', 'Tuberositas glutea', "Rilievo sulla faccia posteriore del femore, sotto il grande trocantere. Inserzione del gluteo massimo (fibre profonde)."),
 'linea_aspra': ('Linea aspra', 'Linea aspera', "Cresta longitudinale sulla faccia posteriore della diafisi femorale. Inserzione degli adduttori; origine del capo breve del bicipite femorale."),
 'epi_lat': ('Epicondilo laterale del femore', 'Epicondylus lateralis femoris', "Sporgenza sopra il condilo laterale. Vi si fissa il legamento collaterale laterale."),
 'epi_med': ('Epicondilo mediale del femore', 'Epicondylus medialis femoris', "Sporgenza sopra il condilo mediale. Vi si fissa il legamento collaterale mediale; poco sopra c'è il tubercolo adduttorio."),
 'tub_tibiale': ('Tuberosità tibiale', 'Tuberositas tibiae', "Rilievo anteriore sotto i condili tibiali. Inserzione del legamento rotuleo, cioè del quadricipite."),
 'zampa_oca': ("Zampa d'oca", 'Pes anserinus', "Faccia mediale della tibia prossimale. Inserzione comune di sartorio, gracile e semitendinoso."),
 'gerdy': ('Tubercolo di Gerdy', 'Tuberculum tractus iliotibialis', "Sul condilo laterale della tibia, davanti. Inserzione del tratto ileotibiale."),
 'testa_fibula': ('Testa della fibula', 'Caput fibulae', "Estremità prossimale della fibula, palpabile sotto il ginocchio lateralmente. Inserzione del bicipite femorale."),
 'rotula_base': ('Base della rotula', 'Basis patellae', "Margine superiore della rotula. Inserzione del tendine del quadricipite."),
 'rotula_apice': ('Apice della rotula', 'Apex patellae', "Punta inferiore della rotula. Origine del legamento rotuleo."),
 'sacro_ant': ('Faccia pelvica del sacro (S2–S4)', 'Facies pelvica ossis sacri', "Faccia anteriore, concava, del sacro. Lateralmente ai fori sacrali anteriori origina il piriforme."),
 'sacro_post': ('Faccia dorsale del sacro (parte laterale)', 'Facies dorsalis ossis sacri', "Faccia posteriore del sacro. Una delle origini del gluteo massimo."),
 'l1': ('Corpo di L1 (lato)', 'Corpus vertebrae lumbalis I', "Lato del corpo vertebrale. Lo psoas maggiore origina dai corpi e dai processi trasversi da T12 a L5."),
 'l3': ('Corpo di L3 (lato)', 'Corpus vertebrae lumbalis III', "Lato del corpo vertebrale. Lo psoas maggiore origina dai corpi e dai processi trasversi da T12 a L5."),
 'l5': ('Corpo di L5 (lato)', 'Corpus vertebrae lumbalis V', "Lato del corpo vertebrale. Lo psoas maggiore origina dai corpi e dai processi trasversi da T12 a L5."),
 'promontorio': ('Promontorio del sacro', 'Promontorium', "Margine anteriore sporgente della base del sacro (S1)."),
 'coccige': ('Coccige', 'Os coccygis', "Ultimo tratto della colonna, sotto il sacro. In questo modello è unito al sacro."),
}

BONES = {
 'FMA16586': "Osso dell'anca destro", 'FMA16587': "Osso dell'anca sinistro", 'FMA24474': 'Femore destro', 'FMA24475': 'Femore sinistro',
 'FMA24477': 'Tibia destra', 'FMA24478': 'Tibia sinistra', 'FMA24480': 'Fibula destra', 'FMA24481': 'Fibula sinistra',
 'FMA24486': 'Rotula destra', 'FMA24487': 'Rotula sinistra', 'FMA16202': 'Sacro (con coccige)',
 'FMA10081': 'Dodicesima vertebra toracica (T12)', 'FMA13072': 'Prima vertebra lombare (L1)', 'FMA13073': 'Seconda vertebra lombare (L2)',
 'FMA13074': 'Terza vertebra lombare (L3)', 'FMA13075': 'Quarta vertebra lombare (L4)', 'FMA13076': 'Quinta vertebra lombare (L5)',
}

# o = origini, i = inserzioni (id dei reperi); via = True se l'inserzione successiva si raggiunge tramite la precedente
M = [
 dict(id='psoas', n='Grande psoas', o=['l1', 'l3', 'l5'], i=['piccolo_troc'], ot='corpi e processi trasversi da T12 a L5', it="piccolo trocantere, con l'iliaco (ileopsoas)", a="flessione dell'anca; a femore fisso flette il tronco", nv='rami anteriori di L1–L3 (plesso lombare)'),
 dict(id='iliaco', n='Iliaco', o=['fossa_iliaca'], i=['piccolo_troc'], ot='fossa iliaca', it='piccolo trocantere, con lo psoas (ileopsoas)', a="flessione dell'anca", nv='nervo femorale (L2–L4)'),
 dict(id='gmax', n='Gluteo massimo', o=['glutea_max', 'sacro_post'], i=['tub_glutea', 'gerdy'], ot="ala iliaca dietro la linea glutea posteriore, faccia dorsale di sacro e coccige, legamento sacrotuberoso", it="tuberosità glutea (fibre profonde) e tratto ileotibiale, che arriva al tubercolo di Gerdy", a="estensione ed extrarotazione dell'anca", nv='nervo gluteo inferiore (L5–S2)'),
 dict(id='gmed', n='Gluteo medio', o=['glutea_med'], i=['gt'], ot="faccia glutea dell'ileo, tra linea glutea anteriore e posteriore", it='faccia laterale del grande trocantere', a="abduzione dell'anca; stabilizza il bacino nell'appoggio su un piede", nv='nervo gluteo superiore (L4–S1)'),
 dict(id='gmin', n='Gluteo piccolo', o=['glutea_min'], i=['gt'], ot="faccia glutea dell'ileo, tra linea glutea anteriore e inferiore", it='faccia anteriore del grande trocantere', a="abduzione e intrarotazione dell'anca", nv='nervo gluteo superiore (L4–S1)'),
 dict(id='tfl', n='Tensore della fascia lata', o=['tfl'], i=['gerdy'], ot='SIAS e tratto anteriore del labbro esterno della cresta iliaca', it='tratto ileotibiale, fino al tubercolo di Gerdy', a="flessione, abduzione e intrarotazione dell'anca; tende il tratto ileotibiale", nv='nervo gluteo superiore (L4–S1)'),
 dict(id='pirif', n='Piriforme', o=['sacro_ant'], i=['gt_apice'], ot='faccia pelvica del sacro (S2–S4)', it='apice del grande trocantere', a="extrarotazione dell'anca estesa; abduzione ad anca flessa", nv='nervo del piriforme (S1–S2)'),
 dict(id='sart', n='Sartorio', o=['sias'], i=['zampa_oca'], ot='spina iliaca antero-superiore (SIAS)', it="faccia mediale della tibia prossimale (zampa d'oca)", a="flessione, abduzione ed extrarotazione dell'anca; flessione del ginocchio", nv='nervo femorale (L2–L3)'),
 dict(id='rf', n='Retto femorale', o=['siai'], i=['rotula_base', 'tub_tibiale'], ot="spina iliaca antero-inferiore (capo diretto) e solco sopra l'acetabolo (capo riflesso)", it='base della rotula e, tramite il legamento rotuleo, tuberosità tibiale', a="flessione dell'anca ed estensione del ginocchio", nv='nervo femorale (L2–L4)'),
 dict(id='addl', n='Adduttore lungo', o=['pube_corpo'], i=['linea_aspra'], ot='corpo del pube, sotto la cresta pubica', it='terzo medio della linea aspra', a="adduzione dell'anca", nv='nervo otturatorio (L2–L4)'),
 dict(id='grac', n='Gracile', o=['ramo_inf'], i=['zampa_oca'], ot='corpo e ramo inferiore del pube', it="faccia mediale della tibia prossimale (zampa d'oca)", a="adduzione dell'anca; flessione e intrarotazione del ginocchio", nv='nervo otturatorio (L2–L3)'),
 dict(id='bfem', n='Bicipite femorale', o=['tuber_post', 'linea_aspra'], i=['testa_fibula'], ot='tuberosità ischiatica (capo lungo) e linea aspra (capo breve)', it='testa della fibula', a="flessione ed extrarotazione del ginocchio; il capo lungo estende l'anca", nv='nervo tibiale (capo lungo) e nervo peroneo comune (capo breve)'),
 dict(id='semit', n='Semitendinoso', o=['tuber_post'], i=['zampa_oca'], ot='tuberosità ischiatica', it="faccia mediale della tibia prossimale (zampa d'oca)", a="flessione e intrarotazione del ginocchio; estensione dell'anca", nv='nervo tibiale (L5–S2)'),
]

landmarks = []
for k, side, bone, p, n in RAW:
    nome, lat, d = L[k]
    landmarks.append(dict(id=k + ('_' + side if side else ''), k=k, side=side, bone=bone, p=p, nrm=n, n=nome, l=lat, d=d))
ids = {l['k'] for l in landmarks}
for m in M:
    for x in m['o'] + m['i']:
        assert x in ids, x
out = dict(version=1, nota="Posizioni e testi preparati dall'AI: da verificare su un atlante.", bones=BONES, landmarks=landmarks, muscles=M)
with open(sys.argv[1], 'w') as f:
    f.write('{\n "version": 1,\n "nota": ' + json.dumps(out['nota'], ensure_ascii=False) + ',\n "bones": ' + json.dumps(BONES, ensure_ascii=False) + ',\n "landmarks": [\n' +
            ',\n'.join('  ' + json.dumps(l, ensure_ascii=False, separators=(',', ':')) for l in landmarks) + '\n ],\n "muscles": [\n' +
            ',\n'.join('  ' + json.dumps(m, ensure_ascii=False, separators=(',', ':')) for m in M) + '\n ]\n}\n')
print(len(landmarks), 'reperi,', len(M), 'muscoli')

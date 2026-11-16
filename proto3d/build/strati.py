# Genera proto3d/strati.json: nomi italiani, colori e gruppi per gli strati (muscoli, encefalo, nervi).
# Le chiavi sono i nomi inglesi di BodyParts3D in minuscolo, senza "right"/"left".
# Testi scritti dall'AI a memoria: da verificare su un atlante.
import json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# nome: (italiano, gruppo, colore, descrizione). Gruppi: cort = corteccia, prof = strutture profonde, tronco = tronco e cervelletto, altro
E = {
 'precentral gyrus': ('Giro precentrale', 'cort', '#ef8f78', "Corteccia motoria primaria: movimenti volontari del lato opposto del corpo, organizzati secondo l'homunculus motorio."),
 'postcentral gyrus': ('Giro postcentrale', 'cort', '#e8b94f', "Corteccia somatosensitiva primaria: tatto, propriocezione, dolore e temperatura dal lato opposto del corpo."),
 'superior frontal gyrus': ('Giro frontale superiore', 'cort', '#f6c1b3', "Lobo frontale. Comprende l'area motoria supplementare: pianificazione dei movimenti."),
 'middle frontal gyrus': ('Giro frontale medio', 'cort', '#f2a694', "Lobo frontale. Comprende la corteccia prefrontale dorsolaterale (funzioni esecutive) e i campi oculari frontali."),
 'inferior frontal gyrus': ('Giro frontale inferiore', 'cort', '#e0568c', "Lobo frontale. Nell'emisfero dominante (di solito il sinistro) contiene l'area di Broca: produzione del linguaggio. Una lesione dà afasia non fluente."),
 'orbital gyrus': ('Giri orbitari', 'cort', '#f9d5cb', "Faccia inferiore del lobo frontale: comportamento sociale, decisioni, controllo degli impulsi."),
 'superior parietal lobule': ('Lobulo parietale superiore', 'cort', '#f2d58a', "Lobo parietale: integrazione somatosensitiva e orientamento del corpo nello spazio."),
 'supramarginal gyrus': ('Giro sopramarginale', 'cort', '#ecc66a', "Lobulo parietale inferiore: elaborazione fonologica e prassie."),
 'angular gyrus': ('Giro angolare', 'cort', '#e0b24a', "Lobulo parietale inferiore: lettura, scrittura e calcolo nell'emisfero dominante."),
 'occipital lobe': ('Lobo occipitale', 'cort', '#a9d3f0', "Elaborazione della visione; la corteccia visiva primaria è attorno alla scissura calcarina. Una lesione dà emianopsia omonima controlaterale."),
 'anterior part of superior temporal gyrus': ('Giro temporale superiore (parte anteriore)', 'cort', '#b9e0b0', "Lobo temporale: contiene la corteccia uditiva primaria (giri di Heschl)."),
 'posterior part of superior temporal gyrus': ('Giro temporale superiore (parte posteriore)', 'cort', '#9b5de5', "Nell'emisfero dominante contiene l'area di Wernicke: comprensione del linguaggio. Una lesione dà afasia fluente."),
 'middle temporal gyrus': ('Giro temporale medio', 'cort', '#a3d69a', "Lobo temporale: elaborazione del significato delle parole e del movimento visivo."),
 'inferior temporal gyrus': ('Giro temporale inferiore', 'cort', '#8cc983', "Lobo temporale: riconoscimento visivo degli oggetti."),
 'fusiform gyrus': ('Giro fusiforme', 'cort', '#7dbb75', "Faccia inferiore del lobo temporale: riconoscimento dei volti."),
 'parahippocampal gyrus': ('Giro paraippocampale', 'cort', '#c7a6e8', "Attorno all'ippocampo: memoria e riconoscimento dei luoghi."),
 'cingulate gyrus': ('Giro del cingolo', 'cort', '#d7b9ec', "Sopra il corpo calloso, sulla faccia mediale: fa parte del sistema limbico (emozioni, attenzione, dolore)."),
 'insula': ('Insula', 'cort', '#f0a8c0', "Corteccia nascosta in fondo al solco laterale: gusto, sensibilità viscerale, consapevolezza del corpo."),
 'white matter of cerebral hemisphere': ("Sostanza bianca dell'emisfero", 'cort', '#f3efe6', "Fasci di fibre mieliniche che collegano le aree della corteccia tra loro e con le strutture profonde."),
 'corpus callosum': ('Corpo calloso', 'prof', '#c9a66b', "Grande commissura di sostanza bianca che collega i due emisferi."),
 'fornix of forebrain': ('Fornice', 'prof', '#b08d57', "Fascio che collega l'ippocampo ai corpi mammillari: circuito della memoria."),
 'commissure of fornix of forebrain': ('Commissura del fornice', 'prof', '#b08d57', "Fibre che collegano i due fornici."),
 'thalamus': ('Talamo', 'prof', '#f0a8c0', "Stazione di smistamento: quasi tutte le vie sensitive (tranne l'olfatto) passano di qui prima di arrivare alla corteccia."),
 'hypothalamus': ('Ipotalamo', 'prof', '#f28b82', "Regola omeostasi, temperatura, fame, sete, ritmi circadiani e sistema endocrino tramite l'ipofisi."),
 'caudate nucleus': ('Nucleo caudato', 'prof', '#f5a623', "Nucleo della base (con il putamen forma lo striato): controllo del movimento e apprendimento di abitudini."),
 'putamen': ('Putamen', 'prof', '#e07b39', "Nucleo della base, parte dello striato: controllo del movimento."),
 'globus pallidus': ('Globo pallido', 'prof', '#c75a22', "Nucleo della base: principale via di uscita dei nuclei della base verso il talamo."),
 'amygdala': ('Amigdala', 'prof', '#c0392b', "Nel lobo temporale mediale: paura, emozioni e memoria emotiva."),
 'hippocampus': ('Ippocampo', 'prof', '#8e6bbf', "Nel lobo temporale mediale: formazione di nuovi ricordi. È colpito precocemente nella malattia di Alzheimer."),
 'internal capsule': ('Capsula interna', 'prof', '#e4dcc6', "Fascio di sostanza bianca tra talamo e nuclei della base: vi passano le vie motorie e sensitive. Un piccolo ictus qui dà emiparesi controlaterale."),
 'lateral ventricle': ('Ventricolo laterale', 'prof', '#9fd3e8', "Cavità di ciascun emisfero, piena di liquido cefalorachidiano."),
 'third ventricle': ('Terzo ventricolo', 'prof', '#7fc4de', "Cavità mediana tra i due talami."),
 'cerebral aqueduct': ('Acquedotto cerebrale (di Silvio)', 'prof', '#5fb3d3', "Canale nel mesencefalo che collega terzo e quarto ventricolo. La sua ostruzione causa idrocefalo."),
 'fourth ventricle': ('Quarto ventricolo', 'prof', '#5fb3d3', "Cavità tra tronco encefalico e cervelletto."),
 'choroid plexus of cerebral hemisphere': ('Plesso corioideo', 'prof', '#d86a8a', "Produce il liquido cefalorachidiano."),
 'stria medullaris of thalamus': ('Stria midollare del talamo', 'prof', '#b8a07a', "Fascio di fibre sul margine del talamo, diretto all'abenula."),
 'pineal body': ('Epifisi (ghiandola pineale)', 'prof', '#7a5cc2', "Ghiandola endocrina che produce melatonina, legata al ritmo sonno-veglia."),
 'pituitary gland': ('Ipofisi', 'prof', '#f5a623', "Ghiandola endocrina nella sella turcica. Adenoipofisi: GH, prolattina, ACTH, TSH, FSH, LH. Neuroipofisi: ossitocina e ADH."),
 'anterior commissure': ('Commissura anteriore', 'prof', '#b89a5e', "Fascio che collega i due lobi temporali e le vie olfattive, davanti alle colonne del fornice."),
 'posterior commissure': ('Commissura posteriore', 'prof', '#a88a50', "Fibre che attraversano la linea mediana sopra l'acquedotto: riflesso pupillare consensuale."),
 'habenula': ('Abenula', 'prof', '#9a7fc9', "Piccolo nucleo dell'epitalamo, vicino all'epifisi: collega sistema limbico e mesencefalo."),
 'stria terminalis': ('Stria terminale', 'prof', '#b8a07a', "Fascio che parte dall'amigdala e segue il nucleo caudato fino all'ipotalamo."),
 'lamina terminalis': ('Lamina terminale', 'prof', '#cdbb93', "Sottile parete anteriore del terzo ventricolo."),
 'tuber cinereum': ('Tuber cinereum', 'prof', '#ef9a8f', "Parte dell'ipotalamo da cui pende il peduncolo dell'ipofisi."),
 'midbrain': ('Mesencefalo', 'tronco', '#c8a27a', "Parte superiore del tronco: riflessi visivi e uditivi, nuclei dei nervi III e IV, substantia nigra."),
 'peduncle of midbrain': ('Peduncolo cerebrale', 'tronco', '#b8926a', "Parte anteriore del mesencefalo: vi scendono le vie motorie dalla corteccia."),
 'superior colliculus': ('Collicolo superiore', 'tronco', '#a98860', "Lamina quadrigemina: riflessi visivi e movimenti degli occhi."),
 'inferior colliculus': ('Collicolo inferiore', 'tronco', '#9c7c55', "Lamina quadrigemina: stazione della via uditiva."),
 'brachium of superior colliculus': ('Braccio del collicolo superiore', 'tronco', '#a98860', "Fibre tra collicolo superiore e corpo genicolato laterale."),
 'brachium of inferior colliculus': ('Braccio del collicolo inferiore', 'tronco', '#9c7c55', "Fibre uditive tra collicolo inferiore e corpo genicolato mediale."),
 'pons': ('Ponte', 'tronco', '#b58b62', "Collega cervello, cervelletto e midollo; contiene i nuclei dei nervi da V a VIII."),
 'medulla oblongata': ('Bulbo (midollo allungato)', 'tronco', '#9c7248', "Centri del respiro, del battito e della pressione; nuclei dei nervi IX, X, XII. Qui si incrociano le vie piramidali."),
 'cerebellum': ('Cervelletto', 'tronco', '#c9a0e6', "Coordinazione dei movimenti, equilibrio e apprendimento motorio. Le lesioni danno atassia, di norma dallo stesso lato."),
 'tentorium cerebelli': ('Tentorio del cervelletto', 'altro', '#d9d2c3', "Piega della dura madre che separa il cervelletto dai lobi occipitali."),
}

# nervi e strutture dell'orbita: nome italiano
N = {
 'optic nerve': 'Nervo ottico (II)', 'optic chiasm': 'Chiasma ottico', 'optic tract': 'Tratto ottico', 'trochlear nerve': 'Nervo trocleare (IV)',
 'superior branch of oculomotor nerve': "Ramo superiore del nervo oculomotore (III)", 'inferior branch of oculomotor nerve': "Ramo inferiore del nervo oculomotore (III)",
 'ophthalmic nerve': 'Nervo oftalmico (V1)', 'frontal nerve': 'Nervo frontale', 'supra-orbital nerve': 'Nervo sopraorbitario', 'supratrochlear nerve': 'Nervo sopratrocleare',
 'lacrimal nerve': 'Nervo lacrimale', 'nasociliary nerve': 'Nervo nasociliare', 'infratrochlear nerve': 'Nervo infratrocleare', 'anterior ethmoidal nerve': 'Nervo etmoidale anteriore',
 'posterior ethmoidal nerve': 'Nervo etmoidale posteriore', 'long ciliary nerve': 'Nervo ciliare lungo', 'short ciliary nerve': 'Nervi ciliari brevi', 'ciliary ganglion': 'Ganglio ciliare',
 'communicating branch of nasociliary nerve with ciliary ganglion': 'Ramo comunicante del nasociliare con il ganglio ciliare',
}

# muscoli con scheda (id in reperi.json): il nome della fonte coincide, oppure finisce con " of <nome>" (capi e parti)
CARD = {
 'psoas': ['psoas major'], 'iliaco': ['iliacus'], 'gmax': ['gluteus maximus'], 'gmed': ['gluteus medius'], 'gmin': ['gluteus minimus'], 'tfl': ['tensor fasciae latae'],
 'pirif': ['piriformis'], 'sart': ['sartorius'], 'rf': ['rectus femoris'], 'addl': ['adductor longus'], 'grac': ['gracilis'], 'bfem': ['biceps femoris'], 'semit': ['semitendinosus'],
 'delt': ['deltoid'], 'sovra': ['supraspinatus'], 'sotto': ['infraspinatus muscle'], 'prot': ['teres minor'], 'sscap': ['subscapularis'], 'grot': ['teres major'],
 'gpett': ['pectoralis major'], 'ppett': ['pectoralis minor'], 'trap': ['trapezius'], 'elev': ['levator scapulae'], 'romb': ['rhomboid major', 'rhomboid minor'], 'dent': ['serratus anterior'],
 'bic': ['biceps brachii'], 'brac': ['brachialis'], 'tric': ['triceps brachii'], 'brrad': ['brachioradialis'], 'pron': ['pronator teres'], 'frc': ['flexor carpi radialis'],
 'fuc': ['flexor carpi ulnaris'], 'erlc': ['extensor carpi radialis longus'], 'erbc': ['extensor carpi radialis brevis'], 'euc': ['extensor carpi ulnaris'],
 'vlat': ['vastus lateralis'], 'vmed': ['vastus medialis'], 'vint': ['vastus intermedius'], 'semim': ['semimembranosus'], 'addg': ['adductor magnus'], 'pett': ['pectineus'],
 'tibant': ['tibialis anterior'], 'tibpost': ['tibialis posterior'], 'gastr': ['gastrocnemius'], 'soleo': ['soleus'], 'perl': ['fibularis longus'], 'perb': ['fibularis brevis'],
 'scm': ['sternocleidomastoid'], 'scal': ['scalenus anterior', 'scalenus medius'], 'splen': ['splenius capitis'],
}
# altri muscoli: nome italiano (dove manca, il prototipo mostra il nome latino della fonte)
MI = {
 'adductor brevis': 'Adduttore breve', 'adductor minimus': 'Adduttore minimo', 'obturator externus': 'Otturatore esterno', 'obturator internus': 'Otturatore interno',
 'gemellus superior': 'Gemello superiore', 'gemellus inferior': 'Gemello inferiore', 'quadratus femoris': 'Quadrato del femore', 'popliteus': 'Popliteo', 'plantaris': 'Plantare',
 'fibularis tertius': 'Peroneo terzo', 'extensor digitorum longus': 'Estensore lungo delle dita', 'extensor hallucis longus': "Estensore lungo dell'alluce",
 'flexor digitorum longus': 'Flessore lungo delle dita', 'flexor hallucis longus': "Flessore lungo dell'alluce", 'extensor hallucis brevis': "Estensore breve dell'alluce",
 'flexor digitorum brevis': 'Flessore breve delle dita', 'abductor hallucis': "Abduttore dell'alluce", 'flexor accessorius': 'Quadrato della pianta', 'calcaneal tendon': "Tendine d'Achille",
 'coracobrachialis': 'Coracobrachiale', 'anconeus': 'Anconeo', 'supinator': 'Supinatore', 'pronator quadratus': 'Pronatore quadrato', 'palmaris longus': 'Palmare lungo',
 'flexor digitorum superficialis': 'Flessore superficiale delle dita', 'flexor digitorum profundus': 'Flessore profondo delle dita', 'flexor pollicis longus': 'Flessore lungo del pollice',
 'extensor digitorum': 'Estensore delle dita', 'extensor digiti minimi': 'Estensore del mignolo', 'extensor indicis': "Estensore dell'indice", 'extensor pollicis longus': 'Estensore lungo del pollice',
 'extensor pollicis brevis': 'Estensore breve del pollice', 'abductor pollicis longus': 'Abduttore lungo del pollice', 'abductor pollicis brevis': 'Abduttore breve del pollice',
 'flexor pollicis brevis': 'Flessore breve del pollice', 'opponens pollicis': 'Opponente del pollice', 'subclavius': 'Succlavio', 'external oblique': "Obliquo esterno dell'addome",
 'diaphragm': 'Diaframma', 'external intercostal muscle': 'Intercostali esterni', 'internal intercostal muscle': 'Intercostali interni', 'innermost intercostal muscle': 'Intercostali intimi',
 'serratus posterior superior': 'Dentato posteriore superiore', 'serratus posterior inferior': 'Dentato posteriore inferiore', 'iliocostalis lumborum': 'Ileocostale dei lombi',
 'iliocostalis thoracis': 'Ileocostale del torace', 'iliocostalis cervicis': 'Ileocostale del collo', 'longissimus thoracis': 'Lunghissimo del torace', 'longissimus cervicis': 'Lunghissimo del collo',
 'longissimus capitis': 'Lunghissimo della testa', 'spinalis thoracis': 'Spinale del torace', 'semispinalis capitis': 'Semispinale della testa', 'semispinalis cervicis': 'Semispinale del collo',
 'semispinalis thoracis': 'Semispinale del torace', 'splenius cervicis': 'Splenio del collo', 'scalenus posterior': 'Scaleno posteriore', 'longus capitis': 'Lungo della testa',
 'platysma': 'Platisma', 'digastric': 'Digastrico', 'mylohyoid': 'Miloioideo', 'geniohyoid': 'Genioioideo', 'stylohyoid': 'Stiloioideo', 'sternohyoid': 'Sternoioideo',
 'sternothyroid': 'Sternotiroideo', 'thyrohyoid': 'Tiroioideo', 'omohyoid': 'Omoioideo', 'coccygeus': 'Coccigeo', 'iliococcygeus': 'Ileococcigeo', 'pubococcygeus': 'Pubococcigeo', 'puborectalis': 'Puborettale', 'external anal sphincter': "Sfintere esterno dell'ano", 'transversus thoracis': 'Trasverso del torace',
 'rectus capitis posterior major': 'Grande retto posteriore della testa', 'rectus capitis posterior minor': 'Piccolo retto posteriore della testa',
 'obliquus capitis superior': 'Obliquo superiore della testa', 'obliquus capitis inferior': 'Obliquo inferiore della testa',
 'superior rectus': "Retto superiore dell'occhio", 'inferior rectus': "Retto inferiore dell'occhio", 'medial rectus': "Retto mediale dell'occhio", 'lateral rectus': "Retto laterale dell'occhio",
 'superior oblique': "Obliquo superiore dell'occhio", 'inferior oblique': "Obliquo inferiore dell'occhio", 'levator palpebrae superioris': 'Elevatore della palpebra superiore',
}
PARTI = {'clavicular part': 'parte clavicolare', 'acromial part': 'parte acromiale', 'spinal part': 'parte spinale', 'sternocostal part': 'parte sternocostale', 'abdominal part': 'parte addominale',
         'descending part': 'parte discendente', 'transverse part': 'parte trasversa', 'ascending part': 'parte ascendente', 'long head': 'capo lungo', 'short head': 'capo breve',
         'lateral head': 'capo laterale', 'medial head': 'capo mediale', 'humeral head': 'capo omerale', 'ulnar head': 'capo ulnare'}

reperi = json.load(open(sys.argv[1]))
nome_scheda = {m['id']: m['n'] for m in reperi['muscles']}
out = dict(version=1, encefalo={k: dict(n=v[0], g=v[1], c=v[2], d=v[3]) for k, v in E.items()}, nervi={k: dict(n=v) for k, v in N.items()},
           muscoli=dict(schede=CARD, nomi=MI, parti=PARTI, nomiSchede=nome_scheda),
           gruppi=dict(cort='Corteccia e sostanza bianca', prof='Strutture profonde e ventricoli', tronco='Tronco encefalico e cervelletto', altro='Meningi'))
for mid in CARD: assert mid in nome_scheda, mid
json.dump(out, open(sys.argv[2], 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(E), 'strutture encefalo,', len(N), 'nervi,', len(CARD), 'muscoli con scheda,', len(MI), 'altri nomi')

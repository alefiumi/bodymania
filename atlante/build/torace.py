# Apparato cardiovascolare (cuore e vasi sanguigni) e apparato respiratorio (polmoni e vie aeree): descrizioni (scritte dall'AI,
# da verificare su un atlante) e nomi italiani corretti. Le usa descrizioni.py (chiave desc di dati.json) e, per il 2D,
# contenuti_2d.py (moduli cuore e polmoni). Le stesse regole di organo() stanno in atlante.js (organOf) e in proietta_2d.mjs.
import re

CUORE_G = {'Heart', 'Right ventricle', 'Left ventricle', 'Aortic valve', 'Pulmonary valve', 'Right atrioventricular valve',
           'Arteries of heart', 'Left coronary artery', 'Right coronary artery', 'Anterior interventricular artery', 'Cardiac veins', 'Coronary sinus'}
GRANDI = {'Ascending aorta', 'Aortic arch', 'Thoracic aorta', 'Brachiocephalic trunk', 'Left common carotid artery', 'Left subclavian artery',
          'Superior vena cava', 'Inferior vena cava (thoracic part)', 'Left brachiocephalic vein', 'Right brachiocephalic vein', 'Azygos vein'}
PGRANDI = {'Pulmonary trunk', 'Bifurcation of pulmonary trunk', 'Left pulmonary artery', 'Right pulmonary artery',
           'Left superior pulmonary vein', 'Left inferior pulmonary vein', 'Right superior pulmonary vein', 'Right inferior pulmonary vein'}
VALVOLE_G = {'Aortic valve', 'Pulmonary valve', 'Right atrioventricular valve'}
VENA = re.compile(r'vein|venous|vena|sinus|plexus', re.I)

def organo(base, layer, g):
    """parte di uno dei due apparati: cuore, valvole, coronarie, grandi (vasi della base del cuore), pgrandi (tronco, arterie e vene
    polmonari principali), vpolm (loro rami nei polmoni), arterie e vene (del resto del corpo), polmoni, vie, pleura; altrimenti None"""
    if base.startswith('?'): return None
    if layer == 'vasi':
        if g in VALVOLE_G or 'papillary' in base: return 'valvole'
        if g == 'Heart': return 'cuore'
        if g in CUORE_G or base in ('Coronary sinus', 'Left coronary artery', 'Right coronary artery'): return 'coronarie'
        if base in GRANDI: return 'grandi'
        if base in PGRANDI: return 'pgrandi'
        if re.search(r'of (left|right) lung|lobar artery', base): return 'vpolm'
        return 'vene' if VENA.search(base + ' ' + g) else 'arterie'
    if layer == 'visceri':
        if base == 'Pleura': return 'pleura'
        if g in ('Left lung', 'Right lung'): return 'polmoni'
        if base == 'Trachea' or 'bronch' in base.lower(): return 'vie'
    return None

# testo dei vasi del corpo che non ne hanno uno scritto: da dove nasce l'arteria o dove sbocca la vena, secondo la gerarchia della
# fonte (Z-Anatomy/TA2), non scritto dall'AI
NON_VASO = {'Systemic arteries', 'Systemic veins', 'Pulmonary arteries', 'Pulmonary veins', 'Arteries of heart', 'Cardiac veins', 'Heart',
            'Cerebral arterial circle', 'Dural venous sinuses', 'Tributaries of hepatic portal vein', 'Orbital veins', 'Basilar venous plexus'}
def vaso(base, g, it, vena):
    if not g or g in NON_VASO or not re.search(r'arter|aorta|trunk|arch|vein|venous|vena|sinus|plexus|network|anastomosis', g, re.I): return None
    n = it(g); n = n[:1].lower() + n[1:]
    kind = 'Seno venoso della dura madre, sbocca in' if re.search(r'sinus', base, re.I) else 'Vena, affluente di' if vena else 'Arteria, ramo di'
    return f"{kind}: {n}." + ' Dalla gerarchia dei vasi della fonte (Terminologia Anatomica).'

# nomi italiani: la traduzione di TA2 ha alcuni errori proprio qui
NOMI = {
    'Right superior pulmonary vein': 'Vena polmonare superiore destra',
    'Septal leaflet of right atrioventricular valve': 'Lembo settale della valvola tricuspide',
    'Inferior leaflet of right atrioventricular valve': 'Lembo inferiore (posteriore) della valvola tricuspide',
    'Posterior leaflet of left atrioventricular valve': 'Lembo posteriore della valvola mitrale',
    'Left coronary leaflet': 'Cuspide coronarica sinistra della valvola aortica',
    'Right coronary leaflet': 'Cuspide coronarica destra della valvola aortica',
    'Non-coronary leaflet': 'Cuspide non coronarica della valvola aortica',
    'Septal papillary muscle of right ventricle': 'Muscolo papillare settale del ventricolo destro',
    'Superior lingular artery of left lung': 'Arteria lingulare superiore del polmone sinistro',
    'Inferior lingular artery of left lung': 'Arteria lingulare inferiore del polmone sinistro',
    'Superior basal vein of right lung': 'Vena basale superiore del polmone destro',
    'Apicoposterior vein of left lung': 'Vena apicoposteriore del polmone sinistro',
    "Inferior vein of left ventricle (//Posterior '')": 'Vena posteriore del ventricolo sinistro',
    'Inferior vein of left ventricle': 'Vena posteriore del ventricolo sinistro',
    'Right inferolateral branch of right coronary artery': 'Ramo marginale destro dell\'arteria coronaria destra',
    'Septal branches of anterior interventricular artery': 'Rami settali del ramo interventricolare anteriore',
    '(Anteromedial basal segmental bronchus of left lung)': 'Bronco segmentario basale anteromediale del polmone sinistro (BVII+BVIII)',
}

D = {
 # cuore
 'Right atrium': "Riceve il sangue venoso dalla vena cava superiore, dalla vena cava inferiore e dal seno coronario. Contiene il nodo seno-atriale (pacemaker) e il nodo atrioventricolare; comunica con il ventricolo destro attraverso la valvola tricuspide. Sul setto interatriale c'è la fossa ovale, residuo del forame ovale fetale.",
 'Right ventricle': "Forma la maggior parte della faccia anteriore (sternocostale) del cuore. Spinge il sangue venoso nel tronco polmonare attraverso la valvola polmonare, a bassa pressione: la parete è più sottile del ventricolo sinistro. All'interno: trabecole carnee, muscoli papillari e banda moderatrice.",
 'Left atrium': "La camera più posteriore del cuore, davanti all'esofago (un atrio sinistro dilatato può comprimerlo). Riceve il sangue ossigenato dalle quattro vene polmonari e lo passa al ventricolo sinistro attraverso la valvola mitrale. L'auricola sinistra è la sede tipica dei trombi nella fibrillazione atriale.",
 'Left ventricle': "Forma l'apice del cuore e gran parte della faccia sinistra e diaframmatica. Pompa il sangue nell'aorta attraverso la valvola aortica, ad alta pressione: la parete è circa tre volte più spessa di quella del ventricolo destro. L'itto della punta si palpa al quinto spazio intercostale sinistro sulla linea emiclaveare.",
 # valvole
 'Left coronary leaflet': "Una delle tre cuspidi semilunari della valvola aortica: dal seno aortico sopra di essa nasce l'arteria coronaria sinistra. La valvola aortica si ausculta al secondo spazio intercostale destro, vicino allo sterno.",
 'Right coronary leaflet': "Cuspide semilunare della valvola aortica: dal seno aortico sopra di essa nasce l'arteria coronaria destra.",
 'Non-coronary leaflet': "Cuspide semilunare posteriore della valvola aortica: il suo seno non dà origine a coronarie.",
 'Anterior semilunar leaflet of pulmonary valve': "Una delle tre cuspidi semilunari della valvola polmonare, tra ventricolo destro e tronco polmonare. La valvola polmonare si ausculta al secondo spazio intercostale sinistro, vicino allo sterno.",
 'Left semilunar leaflet of pulmonary valve': "Cuspide semilunare sinistra della valvola polmonare: in diastole si chiude e impedisce il ritorno del sangue nel ventricolo destro.",
 'Right semilunar leaflet of pulmonary valve': "Cuspide semilunare destra della valvola polmonare.",
 'Septal leaflet of right atrioventricular valve': "Lembo della valvola tricuspide (tra atrio e ventricolo destro) attaccato al setto interventricolare; le corde tendinee lo legano ai muscoli papillari. La tricuspide si ausculta al quarto-quinto spazio intercostale, al margine sinistro dello sterno.",
 'Inferior leaflet of right atrioventricular valve': "Lembo inferiore (posteriore) della valvola tricuspide, tenuto dalle corde tendinee dei muscoli papillari inferiore e settale.",
 'Posterior leaflet of left atrioventricular valve': "Lembo posteriore della valvola mitrale (bicuspide), tra atrio e ventricolo sinistro; il lembo anteriore non è nella fonte. È il lembo più spesso coinvolto nel prolasso mitralico. La mitrale si ausculta all'apice, quinto spazio intercostale sinistro sulla linea emiclaveare.",
 'Anterior papillary muscle of right ventricle': "Il muscolo papillare più grande del ventricolo destro: con le corde tendinee tiene i lembi anteriore e posteriore della tricuspide, che in sistole non si ribaltano nell'atrio. Vi arriva la banda moderatrice, con la branca destra del fascio di His.",
 'Inferior papillary muscle of right ventricle': "Muscolo papillare inferiore (posteriore) del ventricolo destro: le sue corde tendinee vanno ai lembi inferiore e settale della tricuspide.",
 'Septal papillary muscle of right ventricle': "Piccolo muscolo papillare (a volte solo corde) che nasce dal setto interventricolare e va al lembo settale della tricuspide.",
 'Inferior papillary muscle of left ventricle': "Muscolo papillare posteromediale del ventricolo sinistro: tiene con le corde tendinee i lembi della mitrale. Ha spesso una sola arteria (dalla coronaria destra o dalla circonflessa): nell'infarto inferiore può rompersi e dare un'insufficienza mitralica acuta.",
 # coronarie
 'Left coronary artery': "Nasce dal seno aortico sinistro e dopo un breve tronco comune si divide in ramo interventricolare anteriore e ramo circonflesso. Irrora la maggior parte del ventricolo sinistro e i due terzi anteriori del setto.",
 'Right coronary artery': "Nasce dal seno aortico destro e corre nel solco coronario (atrioventricolare) destro. Irrora atrio e ventricolo destro e, nella maggior parte delle persone (dominanza destra), il nodo seno-atriale, il nodo atrioventricolare e la parete inferiore con il ramo interventricolare posteriore.",
 'Anterior interventricular artery': "Ramo interventricolare anteriore (discendente anteriore) della coronaria sinistra: scende nel solco interventricolare anteriore verso l'apice. Irrora la parete anteriore del ventricolo sinistro e i due terzi anteriori del setto: la sua occlusione dà l'infarto anteriore.",
 'Circumflex artery of heart': "Ramo circonflesso della coronaria sinistra: gira a sinistra nel solco coronario verso la faccia posteriore. Irrora atrio sinistro e parete laterale del ventricolo sinistro (rami marginali).",
 'Septal branches of anterior interventricular artery': "Rami settali del ramo interventricolare anteriore: penetrano nel setto interventricolare e ne irrorano i due terzi anteriori, con il fascio di His e le sue branche.",
 'Right inferolateral branch of right coronary artery': "Ramo marginale destro della coronaria destra: scende lungo il margine destro (acuto) del cuore e irrora il ventricolo destro.",
 'Coronary sinus': "Grande vena nel solco coronario posteriore che raccoglie quasi tutto il sangue venoso del cuore e si apre nell'atrio destro, vicino alla valvola tricuspide.",
 'Great cardiac vein': "Sale nel solco interventricolare anteriore accanto al ramo interventricolare anteriore, gira a sinistra nel solco coronario e continua nel seno coronario.",
 'Middle cardiac vein': "Sale nel solco interventricolare posteriore, accanto al ramo interventricolare posteriore, e sbocca nel seno coronario.",
 'Inferior vein of left ventricle': "Vena posteriore del ventricolo sinistro: drena la faccia diaframmatica del ventricolo sinistro nel seno coronario.",
 "Inferior vein of left ventricle (//Posterior '')": "Vena posteriore del ventricolo sinistro: drena la faccia diaframmatica del ventricolo sinistro nel seno coronario.",
 # grandi vasi
 'Ascending aorta': "Primo tratto dell'aorta, dalla valvola aortica fino all'arco, dentro il pericardio. Dai seni aortici alla sua base nascono le due arterie coronarie.",
 'Aortic arch': "Arco dell'aorta, dietro il manubrio dello sterno, sopra il bronco principale sinistro e la biforcazione del tronco polmonare. Dà il tronco brachiocefalico, la carotide comune sinistra e la succlavia sinistra; sotto di esso passa il nervo laringeo ricorrente sinistro.",
 'Thoracic aorta': "Aorta discendente toracica: dal livello di T4 scende a sinistra della colonna fino allo iato aortico del diaframma (T12). Dà le arterie intercostali posteriori, bronchiali ed esofagee.",
 'Brachiocephalic trunk': "Primo ramo dell'arco aortico: sale a destra della trachea e dietro l'articolazione sternoclavicolare destra si divide in carotide comune destra e succlavia destra.",
 'Left common carotid artery': "Secondo ramo dell'arco aortico: sale nel collo a sinistra della trachea fino al margine superiore della cartilagine tiroidea, dove si divide in carotide interna ed esterna.",
 'Left subclavian artery': "Terzo ramo dell'arco aortico: passa sopra la prima costa tra gli scaleni anteriore e medio e diventa arteria ascellare. Dà l'arteria vertebrale e la toracica interna.",
 'Superior vena cava': "Nasce dall'unione delle due vene brachiocefaliche dietro la prima cartilagine costale destra e scende nell'atrio destro. Raccoglie il sangue di testa, collo, arti superiori e (con la vena azygos) della parete del torace.",
 'Inferior vena cava (thoracic part)': "Breve tratto toracico della vena cava inferiore: attraversa il diaframma (forame della vena cava, T8) e sbocca subito nell'atrio destro. Porta il sangue di addome, pelvi e arti inferiori.",
 'Left brachiocephalic vein': "Unione della giugulare interna e della succlavia sinistre: attraversa obliquamente il mediastino superiore davanti all'arco aortico e si unisce alla destra nella vena cava superiore. Vi sbocca il dotto toracico.",
 'Right brachiocephalic vein': "Unione della giugulare interna e della succlavia destre: breve e quasi verticale, forma con la sinistra la vena cava superiore.",
 'Azygos vein': "Sale a destra dei corpi vertebrali toracici raccogliendo le vene intercostali posteriori e, a livello di T4, si getta nella vena cava superiore passando sopra il bronco principale destro. Collega i sistemi delle due vene cave.",
 'Pulmonary trunk': "Esce dal ventricolo destro attraverso la valvola polmonare, davanti e a sinistra dell'aorta ascendente, e porta il sangue venoso ai polmoni. È unito all'arco aortico dal legamento arterioso (residuo del dotto arterioso di Botallo).",
 'Bifurcation of pulmonary trunk': "Divisione del tronco polmonare in arteria polmonare destra e sinistra, sotto l'arco aortico, davanti al bronco principale sinistro.",
 'Right pulmonary artery': "Passa orizzontale dietro l'aorta ascendente e la vena cava superiore fino all'ilo del polmone destro, dove si divide nelle arterie lobari superiore, media e inferiore.",
 'Left pulmonary artery': "Più corta della destra: va all'ilo del polmone sinistro passando sopra il bronco principale sinistro e si divide nelle arterie lobari superiore e inferiore.",
 'Right superior pulmonary vein': "Porta il sangue ossigenato dei lobi superiore e medio del polmone destro all'atrio sinistro.",
 'Right inferior pulmonary vein': "Porta il sangue ossigenato del lobo inferiore del polmone destro all'atrio sinistro.",
 'Left superior pulmonary vein': "Porta il sangue ossigenato del lobo superiore del polmone sinistro (lingula compresa) all'atrio sinistro.",
 'Left inferior pulmonary vein': "Porta il sangue ossigenato del lobo inferiore del polmone sinistro all'atrio sinistro.",
 # polmoni
 'Superior lobe of right lung': "Lobo superiore del polmone destro, separato dal medio dalla scissura orizzontale (all'altezza della quarta cartilagine costale) e dall'inferiore dalla scissura obliqua. Segmenti: apicale, posteriore, anteriore. L'apice sale sopra la clavicola.",
 'Middle lobe of right lung': "Lobo medio del polmone destro, tra la scissura orizzontale e la scissura obliqua, nella parte anteriore e bassa. Segmenti: laterale e mediale. Si ausculta davanti, sotto la quarta costa sulla destra.",
 'Inferior lobe of right lung': "Lobo inferiore del polmone destro, sotto la scissura obliqua: occupa la parte posteriore e la base appoggiata sul diaframma. Segmenti: superiore e quattro basali (mediale, anteriore, laterale, posteriore). Si ausculta soprattutto da dietro.",
 'Superior lobe of left lung': "Lobo superiore del polmone sinistro, sopra la scissura obliqua. Ha davanti l'incisura cardiaca e, sotto, la lingula (corrispondente al lobo medio di destra). Segmenti: apicoposteriore, anteriore, lingulare superiore e inferiore.",
 'Inferior lobe of left lung': "Lobo inferiore del polmone sinistro, sotto la scissura obliqua: parte posteriore e base. Segmenti: superiore e basali (anteromediale, laterale, posteriore).",
 'Pleura': "Sierosa che avvolge ciascun polmone: foglietto viscerale aderente al polmone e foglietto parietale sulla parete del torace, sul diaframma e sul mediastino, con in mezzo la cavità pleurica (un velo di liquido). Aria nella cavità: pneumotorace; liquido: versamento pleurico. I recessi costodiaframmatici scendono fino alla decima costa sulla linea ascellare media.",
 # vie aeree
 'Trachea': "Tubo di 16-20 anelli cartilaginei a C, aperti dietro (parete membranosa con il muscolo tracheale, davanti all'esofago). Va dalla cartilagine cricoide (C6) alla carena, dove si divide nei due bronchi principali, all'altezza dell'angolo sternale (T4-T5).",
 'Right main bronchus': "Più corto, più largo e più verticale del sinistro: per questo i corpi estranei inalati finiscono più spesso a destra. Dà subito il bronco lobare superiore e continua come bronco intermedio.",
 'Left main bronchus': "Più lungo e più orizzontale del destro: passa sotto l'arco aortico e davanti all'esofago prima di dividersi nei bronchi lobari superiore e inferiore.",
 'Intermediate bronchus': "Tratto del bronco principale destro tra l'origine del bronco lobare superiore e quella dei bronchi lobari medio e inferiore.",
 'Right superior lobar bronchus': "Nasce dal bronco principale destro sopra l'arteria polmonare (bronco eparterioso) e si divide nei bronchi segmentari apicale, posteriore e anteriore.",
 'Middle lobar bronchus': "Nasce dal bronco intermedio e va al lobo medio, dove si divide nei bronchi segmentari laterale e mediale.",
 'Right inferior lobar bronchus': "Continua il bronco intermedio nel lobo inferiore destro: dà il bronco segmentario superiore e i quattro basali.",
 'Left superior lobar bronchus': "Va al lobo superiore sinistro: si divide in un tronco superiore (apicoposteriore e anteriore) e in un tronco lingulare (lingulare superiore e inferiore).",
 'Left inferior lobar bronchus': "Va al lobo inferiore sinistro: dà il bronco segmentario superiore e i basali.",
}

def serie(b):
    """testi dei bronchi, delle arterie e delle vene segmentarie (nomi regolari)"""
    m = re.match(r'^\(?(.+?) segmental bronchus of (left|right) lung(?: \((B[IVX]+(?:\+B[IVX]+)?)\))?\)?$', b)
    if m:
        seg, lato, sig = m.group(1).lower(), 'sinistro' if m.group(2) == 'left' else 'destro', m.group(3)
        return (f"Bronco segmentario che ventila il segmento {SEG.get(seg, seg)} del polmone {lato}{' (' + sig + ')' if sig else ''}. "
                "I segmenti broncopolmonari hanno ognuno il proprio bronco e la propria arteria: si possono asportare uno per uno.")
    m = re.match(r'^(.+?) (segmental artery|artery) of (left|right) lung$', b)
    if m:
        lato = 'sinistro' if m.group(3) == 'left' else 'destro'
        return f"Ramo dell'arteria polmonare che porta il sangue venoso al segmento {SEG.get(m.group(1).lower(), m.group(1).lower())} del polmone {lato}, accanto al suo bronco segmentario."
    m = re.match(r'^(Superior|Middle|Inferior) lobar artery of (left|right) lung$', b)
    if m:
        lobo = {'Superior': 'superiore', 'Middle': 'medio', 'Inferior': 'inferiore'}[m.group(1)]
        return f"Ramo dell'arteria polmonare {'sinistra' if m.group(2) == 'left' else 'destra'} per il lobo {lobo}, da cui nascono le arterie segmentarie."
    m = re.match(r'^(.+?) vein of (left|right) lung$', b)
    if m:
        return (f"Vena del polmone {'sinistro' if m.group(2) == 'left' else 'destro'}: raccoglie il sangue ossigenato e lo porta a una vena polmonare. "
                "Le vene corrono tra i segmenti, non accanto ai bronchi come le arterie.")
    return None

SEG = {'apical': 'apicale', 'posterior': 'posteriore', 'anterior': 'anteriore', 'apicoposterior': 'apicoposteriore', 'lateral': 'laterale',
       'medial': 'mediale', 'superior': 'superiore', 'superior lingular': 'lingulare superiore', 'inferior lingular': 'lingulare inferiore',
       'anterior basal': 'basale anteriore', 'medial basal': 'basale mediale', 'lateral basal': 'basale laterale', 'posterior basal': 'basale posteriore',
       'anteromedial basal': 'basale anteromediale', 'superior lingular segmental': 'lingulare superiore', 'inferior lingular segmental': 'lingulare inferiore',
       'apical segmental': 'apicale', 'anterior segmental': 'anteriore', 'posterior segmental': 'posteriore', 'lateral segmental': 'laterale',
       'medial segmental': 'mediale', 'superior segmental': 'superiore', 'anterior basal segmental': 'basale anteriore',
       'lateral basal segmental': 'basale laterale', 'medial basal segmental': 'basale mediale', 'posterior basal segmental': 'basale posteriore',
       'superior lingular artery': 'lingulare superiore', 'inferior lingular artery': 'lingulare inferiore', 'superior lingular': 'lingulare superiore'}

# vasi principali del corpo (testi dell'AI, da verificare)
D.update({
 'Abdominal aorta': "Continua l'aorta toracica dallo iato aortico del diaframma (T12) fino alla biforcazione in arterie iliache comuni (L4, all'altezza dell'ombelico). Rami: tripode celiaco, mesenteriche superiore e inferiore, renali, gonadiche, lombari, frenica inferiore.",
 'Coeliac trunk': "Tripode celiaco: primo ramo anteriore dell'aorta addominale (T12). Si divide in arteria gastrica sinistra, splenica ed epatica comune: irrora stomaco, fegato, milza, pancreas e duodeno prossimale.",
 'Superior mesenteric artery': "Nasce dall'aorta addominale sotto il tripode celiaco (L1) e irrora intestino tenue, colon ascendente e due terzi del trasverso. La sua occlusione dà l'ischemia mesenterica acuta.",
 'Inferior mesenteric artery': "Nasce dall'aorta addominale (L3) e irrora l'ultimo terzo del colon trasverso, il discendente, il sigma e il retto superiore.",
 'Right renal artery': "Nasce dall'aorta all'altezza di L1-L2 e passa dietro la vena cava inferiore fino all'ilo del rene destro.",
 'Left renal artery': "Nasce dall'aorta all'altezza di L1-L2 e raggiunge l'ilo del rene sinistro; è più corta della destra.",
 'Right common carotid artery': "Nasce dal tronco brachiocefalico e sale nel collo, nella guaina carotidea con la vena giugulare interna e il nervo vago, fino al margine superiore della cartilagine tiroidea (C4), dove si divide.",
 'Internal carotid artery': "Dalla biforcazione carotidea sale senza rami nel collo ed entra nel cranio dal canale carotideo: dà l'arteria oftalmica, la cerebrale anteriore e la media. Il bulbo carotideo, all'origine, contiene i barocettori.",
 'External carotid artery': "Dalla biforcazione carotidea irrora collo, faccia e cuoio capelluto: tiroidea superiore, linguale, faciale, occipitale, auricolare posteriore, faringea ascendente, mascellare e temporale superficiale.",
 'Right subclavian artery': "Nasce dal tronco brachiocefalico, passa sopra la prima costa tra scaleno anteriore e medio e al margine esterno della prima costa diventa ascellare. Dà vertebrale, toracica interna, tronco tireocervicale e costocervicale.",
 'Vertebral artery': "Primo ramo della succlavia: sale nei forami trasversari da C6 a C1, entra nel cranio dal forame magno e si unisce alla controlaterale nell'arteria basilare.",
 'Basilar artery': "Nasce dall'unione delle due vertebrali sul davanti del ponte; dà le cerebellari e le arterie del ponte e si divide nelle due cerebrali posteriori. Partecipa al poligono di Willis.",
 'Axillary artery': "Continua la succlavia dal margine esterno della prima costa al margine inferiore del grande rotondo, dove diventa brachiale. Il piccolo pettorale la divide in tre parti.",
 'Brachial artery': "Continua l'ascellare nel braccio, lungo il margine mediale del bicipite con il nervo mediano; nella fossa cubitale si divide in radiale e ulnare. Qui si misura la pressione arteriosa.",
 'Radial artery': "Scende nel lato laterale dell'avambraccio; al polso si palpa tra il tendine del flessore radiale del carpo e il radio (polso radiale). Passa nella tabacchiera anatomica e forma l'arcata palmare profonda.",
 'Ulnar artery': "Scende nel lato mediale dell'avambraccio sotto i flessori e al polso passa nel canale di Guyon con il nervo ulnare; forma soprattutto l'arcata palmare superficiale (test di Allen).",
 'Common iliac artery': "Nasce dalla biforcazione dell'aorta (L4) e davanti all'articolazione sacroiliaca si divide in iliaca esterna e interna.",
 'External iliac artery': "Continua l'iliaca comune lungo il margine del grande psoas e passa sotto il legamento inguinale diventando arteria femorale.",
 'Internal iliac artery': "Scende nella pelvi e irrora visceri pelvici, perineo, glutei (arterie glutee superiore e inferiore) e la regione mediale della coscia (otturatoria).",
 'Femoral artery': "Continua l'iliaca esterna sotto il legamento inguinale, a metà tra spina iliaca anteriore superiore e sinfisi pubica (polso femorale), nel triangolo femorale con la vena (mediale) e il nervo (laterale). Passa nel canale degli adduttori e diventa poplitea.",
 'Deep femoral artery': "Il ramo principale della femorale per la coscia: dà le circonflesse femorali mediale e laterale (vascolarizzazione della testa del femore) e le perforanti.",
 'Popliteal artery': "Continua la femorale dallo iato degli adduttori nella fossa poplitea, l'elemento più profondo, appoggiata al femore e alla capsula del ginocchio; sotto il popliteo si divide in tibiale anteriore e posteriore.",
 'Anterior tibial artery': "Passa sopra la membrana interossea nella loggia anteriore della gamba con il nervo peroneo profondo e alla caviglia continua come arteria dorsale del piede.",
 'Posterior tibial artery': "Scende nella loggia posteriore profonda della gamba; dietro il malleolo mediale (polso tibiale posteriore) entra nel tunnel tarsale e si divide nelle plantari mediale e laterale.",
 'Dorsalis pedis artery': "Continua la tibiale anteriore sul dorso del piede, lateralmente al tendine dell'estensore lungo dell'alluce, dove si palpa il polso pedidio.",
 'Fibular artery': "Ramo della tibiale posteriore che scende vicino alla fibula, nella loggia posteriore profonda; irrora i muscoli peronieri e la fibula.",
 'Internal jugular vein': "Raccoglie il sangue dell'encefalo (continua il seno sigmoideo al forame giugulare) e di faccia e collo; scende nella guaina carotidea e si unisce alla succlavia nella vena brachiocefalica. Si usa per i cateteri venosi centrali.",
 'External jugular vein': "Vena superficiale del collo che scende sopra lo sternocleidomastoideo e sbocca nella succlavia; si vede turgida nello scompenso destro.",
 'Right subclavian vein': "Continua la vena ascellare sopra la prima costa, davanti allo scaleno anteriore, e si unisce alla giugulare interna nella vena brachiocefalica.",
 'Left subclavian vein': "Continua la vena ascellare sopra la prima costa, davanti allo scaleno anteriore; alla confluenza con la giugulare interna sinistra sbocca il dotto toracico.",
 'Cephalic vein': "Vena superficiale del lato laterale dell'arto superiore: sale nel solco deltoideo-pettorale e sbocca nella vena ascellare.",
 'Basilic vein': "Vena superficiale del lato mediale dell'arto superiore: a metà braccio diventa profonda e con le vene brachiali forma la vena ascellare.",
 'Median cubital vein': "Collega cefalica e basilica davanti al gomito: è la vena più usata per i prelievi.",
 'Great saphenous vein': "La vena più lunga del corpo: dal davanti del malleolo mediale sale lungo il lato mediale di gamba e coscia e sbocca nella femorale (crosse safeno-femorale) sotto il legamento inguinale. Si usa per i bypass coronarici; le sue valvole insufficienti danno le varici.",
 'Small saphenous vein': "Dietro il malleolo laterale sale lungo il polpaccio e sbocca nella vena poplitea.",
 'Femoral vein': "Accompagna l'arteria femorale (le sta medialmente nel triangolo femorale) e sotto il legamento inguinale diventa iliaca esterna. Sede frequente di trombosi venosa profonda.",
 'Popliteal vein': "Nella fossa poplitea, tra l'arteria (profonda) e il nervo tibiale (superficiale); riceve la piccola safena.",
 'Inferior vena cava (abdominal part)': "Nasce dall'unione delle iliache comuni (L5) e sale a destra dell'aorta raccogliendo vene lombari, renali, gonadica destra ed epatiche, fino al diaframma.",
 'Hepatic portal vein': "Nasce dietro il collo del pancreas dall'unione della mesenterica superiore e della splenica e porta al fegato il sangue di intestino, stomaco, milza e pancreas. Nella cirrosi la sua pressione sale (ipertensione portale, varici esofagee).",
 'Anterior communicating artery': "Breve arteria che unisce le due cerebrali anteriori davanti al chiasma ottico, chiudendo in avanti il poligono di Willis. È la sede più frequente degli aneurismi cerebrali.",
 'Branch to angular gyrus': "Ramo terminale della cerebrale media per il giro angolare del lobo parietale (lettura e scrittura nell'emisfero dominante).",
 'Median sacral artery': "Piccola arteria impari che nasce dalla biforcazione dell'aorta e scende sulla faccia anteriore del sacro e del coccige.",
 'Sigmoid sinus': "Seno venoso della dura madre a forma di S: continua il seno trasverso, scava un solco sulla rocca del temporale e al forame giugulare diventa vena giugulare interna.",
 'Inferior petrosal sinus': "Seno venoso della dura madre lungo la sutura tra rocca petrosa e osso occipitale: porta il sangue del seno cavernoso alla vena giugulare interna.",
 'Anterior intercavernous sinus': "Seno che unisce davanti all'ipofisi i due seni cavernosi.",
 'Posterior intercavernous sinus': "Seno che unisce dietro l'ipofisi i due seni cavernosi.",
 'Superior ophthalmic vein': "Raccoglie il sangue dell'orbita e sbocca nel seno cavernoso attraverso la fessura orbitaria superiore; comunica con la vena angolare della faccia.",
 'Inferior ophthalmic vein': "Vena del pavimento dell'orbita: sbocca nella vena oftalmica superiore o nel seno cavernoso e comunica con il plesso pterigoideo.",
 'Splenic vein': "Esce dall'ilo della milza, corre dietro il pancreas e dietro il collo del pancreas si unisce alla mesenterica superiore formando la vena porta; riceve la mesenterica inferiore.",
 'Superior mesenteric vein': "Raccoglie il sangue di intestino tenue, colon destro e trasverso; dietro il collo del pancreas si unisce alla vena splenica nella vena porta.",
 'Common iliac vein': "Unione delle vene iliache esterna e interna; le due iliache comuni formano la vena cava inferiore a L5. La sinistra passa sotto l'arteria iliaca comune destra.",
})

def desc(b):
    return D.get(b) or serie(b)

# ---------------------------------------------------------------- modulo 2D "Cuore e polmoni"
# gruppi (id, membri come regex sul nome inglese, testi). q = funzione per il gioco Funzione → struttura. Testi dell'AI: da verificare.
GRUPPI_CUORE = [
 ('cuore-destro', r'^Right (atrium|ventricle)$', {'n': 'Cuore destro', 'l': 'Cor dextrum', 'r': 'Cuore', 'col': '#9bbbeb',
   'q': 'Riceve il sangue venoso dal corpo e lo spinge verso i polmoni',
   'f': "Atrio e ventricolo destro: ricevono il sangue venoso dalle vene cave e dal seno coronario e lo spingono nel tronco polmonare (piccola circolazione).",
   'k': "Lo scompenso destro dà turgore delle giugulari, fegato ingrossato ed edemi alle caviglie."}),
 ('cuore-sinistro', r'^Left (atrium|ventricle)$', {'n': 'Cuore sinistro', 'l': 'Cor sinistrum', 'r': 'Cuore', 'col': '#ec9f97',
   'q': 'Riceve il sangue ossigenato dai polmoni e lo spinge nell\'aorta',
   'f': "Atrio e ventricolo sinistro: ricevono il sangue ossigenato dalle vene polmonari e lo spingono nell'aorta (grande circolazione), ad alta pressione.",
   'k': "Lo scompenso sinistro fa ristagnare il sangue nei polmoni: dispnea, ortopnea, edema polmonare."}),
 ('coronarie', r'coronary artery|interventricular artery|Circumflex artery|inferolateral branch', {'n': 'Arterie coronarie', 'l': 'Arteriae coronariae', 'r': 'Cuore', 'col': '#d9483b',
   'q': 'Portano sangue ossigenato al muscolo cardiaco',
   'f': "Coronaria destra e sinistra (con ramo interventricolare anteriore e circonflesso): nascono dai seni aortici e irrorano il miocardio, soprattutto in diastole.",
   'k': "L'occlusione di una coronaria provoca l'infarto del miocardio nel territorio che irrora."}),
 ('vene-cuore', r'Coronary sinus|cardiac vein|vein of left ventricle', {'n': 'Vene del cuore', 'l': 'Venae cordis', 'r': 'Cuore', 'col': '#4a7fd4',
   'q': 'Riportano all\'atrio destro il sangue venoso del miocardio',
   'f': "Vena cardiaca magna, media e posteriore del ventricolo sinistro confluiscono nel seno coronario, che sbocca nell'atrio destro.",
   'k': "Il seno coronario si usa per far passare l'elettrocatetere del ventricolo sinistro nella resincronizzazione cardiaca."}),
 ('aorta', r'aorta|Aortic arch|Brachiocephalic trunk|Left common carotid|Left subclavian artery', {'n': 'Aorta e suoi rami', 'l': 'Aorta', 'r': 'Grandi vasi', 'col': '#d9483b',
   'q': 'Distribuisce il sangue ossigenato a tutto il corpo',
   'f': "Aorta ascendente, arco (con tronco brachiocefalico, carotide comune sinistra e succlavia sinistra) e aorta toracica discendente.",
   'k': "Aneurisma e dissezione dell'aorta toracica: dolore toracico lacerante irradiato al dorso."}),
 ('vene-cave', r'vena cava|brachiocephalic vein|Azygos', {'n': 'Vene cave e azygos', 'l': 'Venae cavae', 'r': 'Grandi vasi', 'col': '#4a7fd4',
   'q': 'Riportano il sangue venoso del corpo all\'atrio destro',
   'f': "Vena cava superiore (dalle vene brachiocefaliche, con la vena azygos) e vena cava inferiore: portano all'atrio destro il sangue venoso di tutto il corpo.",
   'k': "Un tumore del polmone o del mediastino può comprimere la cava superiore: gonfiore di viso e braccia, vene del collo turgide."}),
 ('arterie-polmonari', r'Pulmonary trunk|pulmonary trunk|^(Left|Right) pulmonary artery$', {'n': 'Arterie polmonari', 'l': 'Arteriae pulmonales', 'r': 'Piccola circolazione', 'col': '#4a7fd4',
   'q': 'Portano ai polmoni il sangue povero di ossigeno',
   'f': "Tronco polmonare e arterie polmonari destra e sinistra: portano il sangue venoso del ventricolo destro ai polmoni (i loro rami sono nel modulo Polmoni).",
   'k': "L'embolia polmonare è l'ostruzione di queste arterie, di solito da un trombo partito dalle vene delle gambe."}),
 ('vene-polmonari', r'^(Left|Right) (superior|inferior) pulmonary vein$', {'n': 'Vene polmonari', 'l': 'Venae pulmonales', 'r': 'Piccola circolazione', 'col': '#d9483b',
   'q': 'Portano all\'atrio sinistro il sangue ossigenato',
   'f': "Quattro vene polmonari (due per lato) che raccolgono il sangue ossigenato dei polmoni e lo portano all'atrio sinistro.",
   'k': "Lo sbocco delle vene polmonari nell'atrio sinistro è il punto da cui partono gli impulsi della fibrillazione atriale: lì si fa l'ablazione."}),
]

# vasi del resto del corpo, per regione (la regione viene dalla posizione: proietta_2d.mjs)
REGIONI = {'testa': ('testa e collo', 'Capitis et colli'), 'arto-sup': ('arto superiore', 'Membri superioris'),
           'tronco': ('torace, addome e pelvi', 'Trunci'), 'arto-inf': ('arto inferiore', 'Membri inferioris')}
TESTI_REG = {
 'arterie-testa': ("Portano il sangue all'encefalo, alla faccia e al collo", "Carotidi comuni, interne ed esterne con i loro rami, arterie vertebrali e basilare, poligono di Willis e arterie cerebrali.", "Una stenosi della carotide interna può dare attacchi ischemici transitori e ictus."),
 'arterie-arto-sup': ("Portano il sangue al braccio e alla mano", "Succlavia, ascellare, brachiale, radiale e ulnare con le arcate palmari.", "Il polso radiale si palpa al polso, lateralmente; la pressione si misura sulla brachiale."),
 'arterie-tronco': ("Portano il sangue alla parete del tronco e agli organi di addome e pelvi", "Rami dell'aorta toracica e addominale: intercostali, tripode celiaco, mesenteriche, renali, iliache e loro rami.", "L'aneurisma dell'aorta addominale si palpa come una massa pulsante sopra l'ombelico."),
 'arterie-arto-inf': ("Portano il sangue alla coscia, alla gamba e al piede", "Femorale, femorale profonda, poplitea, tibiali anteriore e posteriore, peroniera, dorsale del piede e arcata plantare.", "Nell'arteriopatia periferica i polsi pedidio e tibiale posteriore si indeboliscono o scompaiono."),
 'vene-testa': ("Riportano al cuore il sangue di encefalo, faccia e collo", "Seni venosi della dura madre, giugulari interna ed esterna, vene della faccia e del collo.", "Le vene della faccia comunicano con il seno cavernoso: un'infezione del naso può arrivarci."),
 'vene-arto-sup': ("Riportano al cuore il sangue di braccio e mano", "Vene profonde (radiali, ulnari, brachiali, ascellare, succlavia) e superficiali (cefalica, basilica, mediana del gomito).", "La vena mediana del gomito è quella dei prelievi."),
 'vene-tronco': ("Riportano al cuore il sangue di tronco e visceri", "Vena cava inferiore con le sue affluenti, vena porta con mesenteriche e splenica, vene iliache, sistema azygos.", "Nella cirrosi il sangue della vena porta trova vie alternative: varici esofagee e caput medusae."),
 'vene-arto-inf': ("Riportano al cuore il sangue di coscia, gamba e piede", "Vene profonde (femorale, poplitea, tibiali) e superficiali (grande e piccola safena).", "La trombosi venosa profonda colpisce queste vene; da qui partono gli emboli polmonari."),
}
for _k, (_q, _f, _kk) in TESTI_REG.items():
    _tipo, _reg = _k.split('-', 1)
    GRUPPI_CUORE.append((_k, None, {'n': ('Arterie ' if _tipo == 'arterie' else 'Vene ') + {'testa': 'della testa e del collo', 'arto-sup': "dell'arto superiore", 'tronco': 'del tronco', 'arto-inf': "dell'arto inferiore"}[_reg],
                                    'l': ('Arteriae ' if _tipo == 'arterie' else 'Venae ') + REGIONI[_reg][1].lower(), 'r': 'Vasi del corpo',
                                    'col': '#d9483b' if _tipo == 'arterie' else '#4a7fd4', 'q': _q, 'f': _f, 'k': _kk}))

GRUPPI_POLMONI = [
 ('polmone-destro', r'lobe of right lung', {'n': 'Polmone destro', 'l': 'Pulmo dexter', 'r': 'Polmoni', 'col': '#f4b6c2',
   'q': 'Organo degli scambi respiratori diviso in tre lobi',
   'f': "Tre lobi (superiore, medio, inferiore) separati dalla scissura orizzontale e da quella obliqua; dieci segmenti broncopolmonari.",
   'k': "La polmonite ab ingestis colpisce più spesso il polmone destro, per il bronco principale più verticale."}),
 ('polmone-sinistro', r'lobe of left lung', {'n': 'Polmone sinistro', 'l': 'Pulmo sinister', 'r': 'Polmoni', 'col': '#a9cdee',
   'q': 'Organo degli scambi respiratori diviso in due lobi, con la lingula',
   'f': "Due lobi (superiore con la lingula, inferiore) separati dalla scissura obliqua; davanti c'è l'incisura cardiaca, dove poggia il cuore.",
   'k': "Il polmone sinistro è più piccolo del destro perché il cuore occupa parte dello spazio a sinistra."}),
 ('vie-aeree', r'Trachea|bronch', {'n': 'Trachea e bronchi', 'l': 'Arbor bronchialis', 'r': 'Vie aeree', 'col': '#e9dfc4',
   'q': 'Conducono l\'aria dalla laringe fino agli alveoli',
   'f': "Trachea, bronchi principali, lobari e segmentari: le vie aeree inferiori, con anelli di cartilagine e mucosa con ciglia che spingono il muco verso l'alto.",
   'k': "Nell'asma i bronchi si restringono per la contrazione della muscolatura liscia e l'infiammazione della mucosa."}),

 ('rami-arterie-polmonari', r'lobar artery|artery of (left|right) lung|Pulmonary trunk|pulmonary trunk|pulmonary artery', {'n': 'Arterie polmonari e loro rami', 'l': 'Arteriae pulmonales', 'r': 'Vasi polmonari', 'col': '#4a7fd4',
   'q': 'Seguono i bronchi e portano il sangue venoso ai segmenti',
   'f': "Tronco e arterie polmonari con i rami lobari e segmentari: ogni segmento broncopolmonare ha la sua arteria, accanto al suo bronco.",
   'k': "Nell'embolia polmonare il trombo si ferma in queste arterie: più è piccolo, più va lontano nei rami segmentari."}),
 ('rami-vene-polmonari', r'pulmonary vein|vein of (left|right) lung', {'n': 'Vene polmonari e loro rami', 'l': 'Venae pulmonales', 'r': 'Vasi polmonari', 'col': '#d9483b',
   'q': 'Raccolgono il sangue ossigenato tra i segmenti',
   'f': "Vene dei segmenti che corrono tra un segmento e l'altro e confluiscono nelle quattro vene polmonari verso l'atrio sinistro.",
   'k': "Le vene intersegmentali sono la guida del chirurgo per separare un segmento dall'altro."}),
]
# casi clinici del modulo (risposta: un gruppo o una struttura); scritti dall'AI, da verificare
CASI_CUORE = [
 {'id': 't1', 'clues': ["Uomo di 58 anni, fumatore: dolore al petto oppressivo da 40 minuti, irradiato al braccio sinistro.",
                        "L'ECG mostra il sopraslivellamento del tratto ST nelle derivazioni anteriori (V1-V4).",
                        "È occluso il ramo che scende nel solco interventricolare anteriore."],
  'a': 'Ramo interventricolare anteriore', 'opts': ['Ramo interventricolare anteriore', 'Arteria coronaria destra', 'Ramo circonflesso', 'Seno coronario'],
  'bid': 'c.anterior-interventricular-artery', 'r': "È l'infarto anteriore: il ramo interventricolare anteriore (discendente anteriore) irrora la parete anteriore del ventricolo sinistro e i due terzi anteriori del setto."},
 {'id': 't4', 'clues': ["Donna di 45 anni dopo un lungo viaggio in aereo: dispnea improvvisa, dolore toracico e tachicardia.",
                        "Ha un polpaccio gonfio e dolente da qualche giorno.",
                        "Un trombo è arrivato nei vasi che portano il sangue dal cuore destro ai polmoni."],
  'a': 'Arterie polmonari', 'opts': ['Arterie polmonari', 'Vene polmonari', 'Arterie coronarie', 'Aorta e suoi rami'],
  'bid': 'arterie-polmonari', 'r': "È un'embolia polmonare: il trombo parte dalle vene profonde della gamba, attraversa il cuore destro e si ferma nelle arterie polmonari."},
 {'id': 't5', 'clues': ["Uomo di 66 anni con fibrillazione atriale non trattata: improvvisa paralisi del braccio destro e difficoltà a parlare.",
                        "Nella fibrillazione la contrazione di una camera è inefficace e il sangue ristagna.",
                        "Il trombo si è formato nell'auricola della camera che riceve le vene polmonari."],
  'a': 'Atrio sinistro', 'opts': ['Atrio sinistro', 'Atrio destro', 'Ventricolo destro', 'Ventricolo sinistro'],
  'bid': 'c.left-atrium', 'r': "Il trombo dell'auricola sinistra passa nel ventricolo sinistro e nell'aorta e può raggiungere le arterie del cervello (ictus cardioembolico)."},
 {'id': 't6', 'clues': ["Uomo di 50 anni con dolore toracico lacerante, irradiato tra le scapole.",
                        "La pressione è diversa tra il braccio destro e il sinistro.",
                        "Si è lacerata la parete del grande vaso che esce dal ventricolo sinistro."],
  'a': 'Aorta e suoi rami', 'opts': ['Aorta e suoi rami', 'Arterie polmonari', 'Vene cave e azygos', 'Arterie coronarie'],
  'bid': 'aorta', 'r': "È una dissezione aortica: il sangue entra nella parete dell'aorta e può chiudere l'origine dei suoi rami (per questo cambia la pressione tra le braccia)."},
 {'id': 't7', 'clues': ["Donna di 72 anni con caviglie gonfie, fegato ingrossato e vene del collo turgide.",
                        "Ha una lunga storia di bronchite cronica ostruttiva (BPCO).",
                        "Si è sfiancato il ventricolo che pompa contro la resistenza dei polmoni."],
  'a': 'Ventricolo destro', 'opts': ['Ventricolo destro', 'Ventricolo sinistro', 'Atrio sinistro', 'Aorta ascendente'],
  'bid': 'c.right-ventricle', 'r': "È il cuore polmonare: la malattia dei polmoni alza la pressione nelle arterie polmonari e il ventricolo destro si scompensa."},

]

# casi del modulo Polmoni
CASI_POLMONI = [
 {'id': 't2', 'clues': ["Bambino di 3 anni: tosse improvvisa mentre mangiava arachidi, poi respiro sibilante.",
                        "Alla radiografia un polmone è iperespanso per un effetto valvola.",
                        "Il corpo estraneo è finito nel bronco più corto, largo e verticale."],
  'a': 'Bronco principale destro', 'opts': ['Bronco principale destro', 'Bronco principale sinistro', 'Trachea', 'Bronco lobare superiore sinistro'],
  'bid': 'p.right-main-bronchus', 'r': "Il bronco principale destro è più verticale e largo del sinistro: i corpi estranei inalati ci finiscono più spesso."},
 {'id': 't3', 'clues': ["Donna di 70 anni con febbre e tosse: all'auscultazione crepitii davanti, sotto la quarta costa a destra.",
                        "La radiografia di lato mostra un'opacità tra la scissura orizzontale e quella obliqua.",
                        "È colpito il lobo che c'è solo a destra."],
  'a': 'Lobo medio del polmone destro', 'opts': ['Lobo medio del polmone destro', 'Lobo superiore del polmone destro', 'Lobo inferiore del polmone sinistro', 'Lobo superiore del polmone sinistro'],
  'bid': 'p.middle-lobe-of-right-lung', 'r': "Il lobo medio sta tra scissura orizzontale e obliqua, davanti: si ausculta sulla parete anteriore destra."},
 {'id': 't8', 'clues': ["Uomo di 62 anni, forte fumatore: dolore alla spalla e al braccio destro, lungo il lato ulnare.",
                        "Ha la palpebra destra abbassata e la pupilla destra piccola (sindrome di Horner).",
                        "Il tumore sta all'apice di un polmone, sopra la clavicola, vicino al plesso brachiale e alla catena simpatica."],
  'a': 'Lobo superiore del polmone destro', 'opts': ['Lobo superiore del polmone destro', 'Lobo medio del polmone destro', 'Lobo inferiore del polmone destro', 'Lobo inferiore del polmone sinistro'],
  'bid': 'p.superior-lobe-of-right-lung', 'r': "È un tumore di Pancoast: all'apice del lobo superiore infiltra il plesso brachiale (C8-T1) e il ganglio stellato del simpatico."},
 {'id': 't9', 'clues': ["Anziano allettato dopo un ictus, nutrito con difficoltà: febbre e tosse.",
                        "Ha inalato del cibo stando sdraiato sulla schiena.",
                        "Da supini il primo segmento in basso e dietro è quello in cima al lobo inferiore destro."],
  'a': 'Bronco segmentario superiore del polmone destro (BVI)', 'opts': ['Bronco segmentario superiore del polmone destro (BVI)', 'Bronco lobare medio', 'Bronco segmentario apicale del polmone destro (BI)', 'Bronco principale sinistro'],
  'bid': 'p.superior-segmental-bronchus-of-right-lung-bvi', 'r': "Da supini il materiale inalato scende nel bronco segmentario superiore del lobo inferiore (BVI), il più posteriore: polmonite ab ingestis. Da seduti va invece nei segmenti basali."},
]

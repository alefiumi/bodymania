# Testi per il resto dello scheletro: reperi (L2), muscoli (M2) e nomi italiani delle ossa.
# Scritti dall'AI a memoria: da verificare su un atlante.
import re

# id: (nome, nome latino, descrizione)
L2 = {
 # --- scapola ---
 'acromion': ('Acromion', 'Acromion', "Estremità laterale della spina della scapola, palpabile sopra la spalla. Si articola con la clavicola. Origine delle fibre medie del deltoide; inserzione del trapezio."),
 'coracoide': ('Processo coracoideo', 'Processus coracoideus', "Sporgenza a uncino rivolta in avanti. Origine del capo breve del bicipite e del coracobrachiale; inserzione del piccolo pettorale."),
 'ang_inf': ('Angolo inferiore della scapola', 'Angulus inferior scapulae', "Punta inferiore della scapola, circa all'altezza di T7. Repere palpabile."),
 'ang_sup': ('Angolo superiore della scapola', 'Angulus superior scapulae', "Angolo supero-mediale. Inserzione dell'elevatore della scapola."),
 'spina_scap': ('Spina della scapola', 'Spina scapulae', "Cresta sulla faccia posteriore, che separa fossa sovraspinata e infraspinata e termina nell'acromion. Origine del deltoide posteriore; inserzione del trapezio."),
 'fossa_sovrasp': ('Fossa sovraspinata', 'Fossa supraspinata', "Sopra la spina della scapola. Origine del sovraspinato."),
 'fossa_infrasp': ('Fossa infraspinata', 'Fossa infraspinata', "Sotto la spina della scapola. Origine del sottospinato."),
 'marg_med_scap': ('Margine mediale della scapola', 'Margo medialis scapulae', "Margine rivolto alla colonna. Inserzione dei romboidi."),
 'ang_inf_dors': ("Faccia dorsale dell'angolo inferiore", 'Angulus inferior scapulae', "Zona ovale sulla faccia posteriore, presso l'angolo inferiore. Origine del grande rotondo."),
 'fossa_sottoscap': ('Fossa sottoscapolare', 'Fossa subscapularis', "Faccia anteriore (costale) della scapola. Origine del sottoscapolare."),
 'glenoide': ('Cavità glenoidea', 'Cavitas glenoidalis', "Superficie articolare per la testa dell'omero (articolazione gleno-omerale)."),
 'tub_sopraglen': ('Tubercolo sopraglenoideo', 'Tuberculum supraglenoidale', "Sopra la cavità glenoidea. Origine del capo lungo del bicipite brachiale."),
 'tub_infraglen': ('Tubercolo infraglenoideo', 'Tuberculum infraglenoidale', "Sotto la cavità glenoidea. Origine del capo lungo del tricipite brachiale."),
 'marg_lat_scap': ('Margine laterale della scapola', 'Margo lateralis scapulae', "Margine rivolto all'ascella, faccia posteriore. Origine del piccolo rotondo."),
 'marg_med_ant': ('Margine mediale della scapola (faccia anteriore)', 'Margo medialis scapulae', "Lato costale del margine mediale. Inserzione del dentato anteriore."),
 # --- clavicola ---
 'clav_stern': ('Estremità sternale della clavicola', 'Extremitas sternalis', "Si articola con il manubrio dello sterno (articolazione sternoclavicolare)."),
 'clav_acrom': ('Estremità acromiale della clavicola', 'Extremitas acromialis', "Si articola con l'acromion (articolazione acromioclavicolare)."),
 'clav_med_ant': ('Clavicola, metà mediale', 'Clavicula', "Origine del capo clavicolare del grande pettorale (faccia anteriore) e del capo clavicolare dello sternocleidomastoideo (faccia superiore)."),
 'clav_lat_ant': ('Clavicola, terzo laterale (margine anteriore)', 'Clavicula', "Origine delle fibre anteriori del deltoide."),
 'clav_lat_post': ('Clavicola, terzo laterale (margine posteriore)', 'Clavicula', "Inserzione delle fibre superiori del trapezio."),
 # --- omero ---
 'testa_omero': ("Testa dell'omero", 'Caput humeri', "Si articola con la cavità glenoidea della scapola."),
 'tub_magg': ('Tubercolo maggiore (grande tuberosità)', 'Tuberculum majus', "Sporgenza laterale dell'omero prossimale. Inserzione di sovraspinato, sottospinato e piccolo rotondo, dall'alto in basso."),
 'tub_min': ('Tubercolo minore (piccola tuberosità)', 'Tuberculum minus', "Sporgenza anteriore dell'omero prossimale. Inserzione del sottoscapolare."),
 'cresta_tub_magg': ('Cresta del tubercolo maggiore', 'Crista tuberculi majoris', "Labbro laterale del solco intertubercolare. Inserzione del grande pettorale."),
 'cresta_tub_min': ('Cresta del tubercolo minore', 'Crista tuberculi minoris', "Labbro mediale del solco intertubercolare. Inserzione del grande rotondo; il gran dorsale si inserisce sul fondo del solco."),
 'tub_deltoidea': ('Tuberosità deltoidea', 'Tuberositas deltoidea', "Rilievo sulla faccia laterale, a metà della diafisi. Inserzione del deltoide."),
 'epic_med': ("Epicondilo mediale dell'omero", 'Epicondylus medialis humeri', "Sporgenza mediale del gomito (epitroclea), palpabile. Origine comune dei flessori dell'avambraccio e del pronatore rotondo. Dietro passa il nervo ulnare."),
 'epic_lat': ("Epicondilo laterale dell'omero", 'Epicondylus lateralis humeri', "Sporgenza laterale del gomito. Origine comune degli estensori dell'avambraccio."),
 'cresta_sopracond': ('Cresta sopracondiloidea laterale', 'Crista supracondylaris lateralis', "Margine laterale dell'omero distale, sopra l'epicondilo. Origine del brachioradiale e dell'estensore radiale lungo del carpo."),
 'omero_ant_dist': ("Faccia anteriore dell'omero (metà distale)", 'Facies anterior humeri', "Origine del brachiale."),
 'omero_post': ("Faccia posteriore dell'omero", 'Facies posterior humeri', "Origine dei capi laterale e mediale del tricipite, sopra e sotto il solco del nervo radiale."),
 # --- avambraccio ---
 'olecrano': ('Olecrano', 'Olecranon', "Estremità prossimale dell'ulna: è la punta del gomito. Inserzione del tricipite brachiale."),
 'proc_coronoideo': ("Processo coronoideo dell'ulna", 'Processus coronoideus ulnae', "Sporgenza anteriore dell'ulna prossimale. Origine del capo ulnare del pronatore rotondo."),
 'tub_ulnare': ('Tuberosità ulnare', 'Tuberositas ulnae', "Sotto il processo coronoideo. Inserzione del brachiale."),
 'stiloide_ulna': ("Processo stiloideo dell'ulna", 'Processus styloideus ulnae', "Estremità distale dell'ulna, dal lato del mignolo."),
 'testa_radio': ('Testa del radio', 'Caput radii', "Estremità prossimale del radio. Ruota nell'incisura radiale dell'ulna durante la prono-supinazione."),
 'tub_radiale': ('Tuberosità radiale', 'Tuberositas radii', "Sotto il collo del radio, dal lato mediale. Inserzione del bicipite brachiale."),
 'stiloide_radio': ('Processo stiloideo del radio', 'Processus styloideus radii', "Estremità distale del radio, dal lato del pollice. Inserzione del brachioradiale (alla base)."),
 'radio_lat_medio': ('Faccia laterale del radio (terzo medio)', 'Facies lateralis radii', "Inserzione del pronatore rotondo."),
 # --- mano ---
 'pisiforme': ('Pisiforme', 'Os pisiforme', "Piccolo osso sesamoide nel tendine del flessore ulnare del carpo, palpabile alla base del palmo dal lato del mignolo."),
 'scafoide_tub': ('Scafoide (tubercolo)', 'Tuberculum ossis scaphoidei', "Sporgenza palmare dello scafoide, dal lato del pollice. Lo scafoide è l'osso del carpo che si frattura più spesso."),
 'trapezio': ('Trapezio', 'Os trapezium', "Osso della fila distale del carpo; si articola con il primo metacarpale (articolazione a sella del pollice)."),
 'uncino_uncinato': ("Uncinato (uncino)", 'Hamulus ossis hamati', "Sporgenza palmare dell'uncinato. Vi arriva parte del flessore ulnare del carpo tramite il legamento piso-uncinato."),
 'capitato': ('Capitato', 'Os capitatum', "L'osso più grande del carpo, al centro della fila distale."),
 'semilunare': ('Semilunare', 'Os lunatum', "Osso della fila prossimale del carpo, tra scafoide e piramidale."),
 'base_mc1': ('Base del primo metacarpale', 'Basis ossis metacarpi I', "Si articola con il trapezio. Inserzione dell'abduttore lungo del pollice."),
 'base_mc2': ('Base del secondo metacarpale (palmare)', 'Basis ossis metacarpi II', "Inserzione del flessore radiale del carpo."),
 'base_mc3': ('Base del terzo metacarpale (palmare)', 'Basis ossis metacarpi III', "Riceve una parte del tendine del flessore radiale del carpo."),
 'base_mc5': ('Base del quinto metacarpale (palmare)', 'Basis ossis metacarpi V', "Vi arriva il flessore ulnare del carpo tramite il legamento piso-metacarpale."),
 'base_mc2_dors': ('Base del secondo metacarpale (dorsale)', 'Basis ossis metacarpi II', "Inserzione dell'estensore radiale lungo del carpo."),
 'base_mc3_dors': ('Base del terzo metacarpale (dorsale)', 'Basis ossis metacarpi III', "Inserzione dell'estensore radiale breve del carpo."),
 'base_mc5_dors': ('Base del quinto metacarpale (dorsale)', 'Basis ossis metacarpi V', "Inserzione dell'estensore ulnare del carpo."),
 # --- femore e bacino (aggiunte) ---
 'cond_med_post': ('Condilo mediale del femore (faccia posteriore)', 'Condylus medialis femoris', "Sopra il condilo, dietro. Origine del capo mediale del gastrocnemio."),
 'cond_lat_post': ('Condilo laterale del femore (faccia posteriore)', 'Condylus lateralis femoris', "Sopra il condilo, dietro. Origine del capo laterale del gastrocnemio."),
 'femore_ant': ('Faccia anteriore del femore', 'Facies anterior femoris', "Origine del vasto intermedio."),
 'femore_lat_prox': ('Femore prossimale, lato laterale', 'Labium laterale lineae asperae', "Sotto il grande trocantere e lungo il labbro laterale della linea aspra. Origine del vasto laterale."),
 'femore_med': ('Femore, lato mediale', 'Labium mediale lineae asperae', "Linea intertrocanterica e labbro mediale della linea aspra. Origine del vasto mediale."),
 'tub_adduttorio': ('Tubercolo adduttorio', 'Tuberculum adductorium', "Sopra l'epicondilo mediale del femore. Inserzione della parte ischiocondiloidea dell'adduttore grande."),
 'linea_pettinea': ('Linea pettinea del femore', 'Linea pectinea', "Sotto il piccolo trocantere, sulla faccia posteriore. Inserzione del pettineo."),
 'pettine_pube': ('Pettine del pube', 'Pecten ossis pubis', "Cresta sul ramo superiore del pube. Origine del pettineo."),
 'ramo_ischio': ("Ramo dell'ischio", 'Ramus ossis ischii', "Si continua con il ramo inferiore del pube. Origine dell'adduttore grande."),
 'cresta_post': ('Cresta iliaca (tratto posteriore)', 'Crista iliaca', "Origine del quadrato dei lombi e, tramite la fascia toracolombare, del gran dorsale."),
 # --- gamba e piede ---
 'tibia_cond_med_post': ('Condilo mediale della tibia (faccia posteriore)', 'Condylus medialis tibiae', "Inserzione del semimembranoso."),
 'malleolo_med': ('Malleolo mediale', 'Malleolus medialis', "Estremità distale della tibia, palpabile all'interno della caviglia."),
 'tibia_lat_prox': ('Faccia laterale della tibia (metà prossimale)', 'Facies lateralis tibiae', "Origine del tibiale anteriore, insieme al condilo laterale."),
 'tibia_post': ('Faccia posteriore della tibia', 'Facies posterior tibiae', "Qui passa la linea del soleo. Origine del soleo e, più in basso, del tibiale posteriore."),
 'malleolo_lat': ('Malleolo laterale', 'Malleolus lateralis', "Estremità distale della fibula, palpabile all'esterno della caviglia; scende più in basso del malleolo mediale."),
 'fibula_lat_prox': ('Faccia laterale della fibula (metà prossimale)', 'Facies lateralis fibulae', "Origine del peroneo lungo, insieme alla testa della fibula."),
 'fibula_lat_dist': ('Faccia laterale della fibula (metà distale)', 'Facies lateralis fibulae', "Origine del peroneo breve."),
 'fibula_post': ('Faccia posteriore della fibula (prossimale)', 'Facies posterior fibulae', "Origine del soleo; più medialmente del tibiale posteriore."),
 'tub_calcagno': ('Tuberosità calcaneare', 'Tuber calcanei', "Parte posteriore del calcagno. Inserzione del tendine d'Achille (gastrocnemio e soleo)."),
 'tub_navicolare': ('Tuberosità del navicolare', 'Tuberositas ossis navicularis', "Sporgenza mediale del navicolare, palpabile. Inserzione principale del tibiale posteriore."),
 'cuneiforme_med': ('Cuneiforme mediale', 'Os cuneiforme mediale', "Inserzione del tibiale anteriore (faccia mediale e plantare) e, dal lato plantare, del peroneo lungo."),
 'base_mt1': ('Base del primo metatarsale', 'Basis ossis metatarsi I', "Inserzione del tibiale anteriore e del peroneo lungo."),
 'base_mt5': ('Tuberosità del quinto metatarsale', 'Tuberositas ossis metatarsi V', "Sporgenza laterale alla base del quinto metatarsale, palpabile. Inserzione del peroneo breve."),
 'cuboide': ('Cuboide', 'Os cuboideum', "Osso laterale del tarso, davanti al calcagno. Sotto passa il tendine del peroneo lungo."),
 'talo': ('Talo (astragalo)', 'Talus', "Si articola con tibia e fibula nella caviglia. Non ha inserzioni muscolari."),
 'testa_mt1': ('Testa del primo metatarsale', 'Caput ossis metatarsi I', "Appoggio anteriore mediale del piede; sotto si trovano i due sesamoidi."),
 # --- tronco ---
 'incisura_giugulare': ('Incisura giugulare', 'Incisura jugularis', "Margine superiore del manubrio dello sterno, palpabile alla base del collo."),
 'angolo_sternale': ('Angolo sternale (di Louis)', 'Angulus sterni', "Giunzione tra manubrio e corpo dello sterno. Corrisponde alla seconda costa."),
 'corpo_sterno': ('Corpo dello sterno', 'Corpus sterni', "Origine della parte sternocostale del grande pettorale."),
 'xifoide': ('Processo xifoideo', 'Processus xiphoideus', "Estremità inferiore dello sterno. Inserzione del retto dell'addome, insieme alle cartilagini costali V–VII."),
 'manubrio_lat': ('Manubrio dello sterno', 'Manubrium sterni', "Faccia anteriore. Origine del capo sternale dello sternocleidomastoideo."),
 'costa1': ('Prima costa', 'Costa I', "Inserzione degli scaleni anteriore e medio."),
 'costa4_ant': ('Coste III–V (estremità anteriore)', 'Costae III–V', "Origine del piccolo pettorale. Il punto è sulla quarta costa."),
 'costa6_lat': ('Coste I–IX (faccia laterale)', 'Costae I–IX', "Origine del dentato anteriore, con digitazioni su ogni costa. Il punto è sulla sesta."),
 'costa12': ('Dodicesima costa', 'Costa XII', "Costa fluttuante. Inserzione del quadrato dei lombi."),
 'spin_c2': ("Processo spinoso dell'epistrofeo (C2)", 'Processus spinosus axis', "Primo processo spinoso palpabile sotto l'occipite."),
 'spin_c7': ('Processo spinoso di C7', 'Vertebra prominens', "Vertebra prominente: il processo spinoso più sporgente alla base del collo."),
 'spin_t3': ('Processo spinoso di T3', 'Processus spinosus T3', "Circa all'altezza della radice della spina della scapola."),
 'spin_t7': ('Processo spinoso di T7', 'Processus spinosus T7', "Circa all'altezza dell'angolo inferiore della scapola."),
 'spin_t12': ('Processo spinoso di T12', 'Processus spinosus T12', "Ultima vertebra toracica."),
 'spin_l3': ('Processo spinoso di L3', 'Processus spinosus L3', "Tratto lombare medio."),
 'trasv_atlante': ("Processo trasverso dell'atlante (C1)", 'Processus transversus atlantis', "Origine dell'elevatore della scapola (processi trasversi C1–C4)."),
 'trasv_c4': ('Processo trasverso di C4', 'Processus transversus C4', "I processi trasversi cervicali danno origine agli scaleni e all'elevatore della scapola."),
 'trasv_l3': ('Processo trasverso di L3', 'Processus costalis L3', "I processi trasversi (costiformi) lombari ricevono il quadrato dei lombi."),
 'dente': ("Dente dell'epistrofeo", 'Dens axis', "Perno attorno a cui ruota l'atlante nella rotazione del capo."),
 # --- testa e collo ---
 'mastoide': ('Processo mastoideo', 'Processus mastoideus', "Sporgenza dell'osso temporale dietro l'orecchio, palpabile. Inserzione dello sternocleidomastoideo e dello splenio del capo."),
 'arco_zigomatico': ('Arco zigomatico', 'Arcus zygomaticus', "Ponte osseo tra osso zigomatico e temporale. Origine del massetere."),
 'zigomatico': ('Osso zigomatico', 'Os zygomaticum', "Forma lo zigomo. Con l'arco zigomatico dà origine al massetere."),
 'squama_temporale': ('Fossa temporale', 'Fossa temporalis', "Sulla squama del temporale e sulle ossa vicine. Origine del muscolo temporale."),
 'parietale_linea_temp': ('Linea temporale inferiore', 'Linea temporalis inferior', "Sul parietale: limite superiore dell'origine del muscolo temporale."),
 'angolo_mandibola': ('Angolo della mandibola', 'Angulus mandibulae', "Tra corpo e ramo della mandibola. Sulla faccia laterale si inserisce il massetere."),
 'ramo_mandibola': ('Ramo della mandibola (faccia laterale)', 'Ramus mandibulae', "Inserzione del massetere."),
 'coronoide_mand': ('Processo coronoideo della mandibola', 'Processus coronoideus mandibulae', "Sporgenza anteriore del ramo. Inserzione del muscolo temporale."),
 'condilo_mand': ('Condilo della mandibola', 'Processus condylaris', "Si articola con l'osso temporale nell'articolazione temporo-mandibolare (ATM)."),
 'mento': ('Protuberanza mentale', 'Protuberantia mentalis', "Sporgenza mediana del mento."),
 'ioide': ('Osso ioide (corpo)', 'Os hyoideum', "Osso a ferro di cavallo nel collo, non articolato con altre ossa. Vi si attaccano i muscoli sopraioidei e sottoioidei."),
 'prot_occipitale': ('Protuberanza occipitale esterna', 'Protuberantia occipitalis externa', "Rilievo mediano dell'occipite, palpabile. Origine delle fibre superiori del trapezio."),
 'linea_nucale': ('Linea nucale superiore', 'Linea nuchalis superior', "Cresta trasversale dell'occipitale. Vi si attaccano trapezio e sternocleidomastoideo."),
}

# seg (facoltativo) = coppie [da, a] da disegnare; senza seg: ogni origine verso la prima inserzione, poi le inserzioni in catena
M2 = [
 # --- spalla e braccio ---
 dict(id='delt', n='Deltoide', o=['clav_lat_ant', 'acromion', 'spina_scap'], i=['tub_deltoidea'], ot='terzo laterale della clavicola, acromion e spina della scapola', it='tuberosità deltoidea', a="abduzione della spalla; le fibre anteriori flettono e intraruotano, le posteriori estendono ed extraruotano", nv='nervo ascellare (C5–C6)'),
 dict(id='sovra', n='Sovraspinato', o=['fossa_sovrasp'], i=['tub_magg'], ot='fossa sovraspinata', it='tubercolo maggiore (faccetta superiore)', a="avvia l'abduzione e centra la testa dell'omero (cuffia dei rotatori)", nv='nervo soprascapolare (C5–C6)'),
 dict(id='sotto', n='Sottospinato', o=['fossa_infrasp'], i=['tub_magg'], ot='fossa infraspinata', it='tubercolo maggiore (faccetta media)', a='extrarotazione della spalla (cuffia dei rotatori)', nv='nervo soprascapolare (C5–C6)'),
 dict(id='prot', n='Piccolo rotondo', o=['marg_lat_scap'], i=['tub_magg'], ot='margine laterale della scapola (faccia posteriore)', it='tubercolo maggiore (faccetta inferiore)', a='extrarotazione della spalla (cuffia dei rotatori)', nv='nervo ascellare (C5–C6)'),
 dict(id='sscap', n='Sottoscapolare', o=['fossa_sottoscap'], i=['tub_min'], ot='fossa sottoscapolare', it='tubercolo minore', a='intrarotazione della spalla (cuffia dei rotatori)', nv='nervi sottoscapolari (C5–C6)'),
 dict(id='grot', n='Grande rotondo', o=['ang_inf_dors'], i=['cresta_tub_min'], ot="faccia dorsale dell'angolo inferiore della scapola", it='cresta del tubercolo minore', a='intrarotazione, adduzione ed estensione della spalla', nv='nervo sottoscapolare inferiore (C5–C6)'),
 dict(id='gdors', n='Gran dorsale', o=['spin_t7', 'spin_l3', 'cresta_post'], i=['cresta_tub_min'], ot='processi spinosi da T7 a L5 e sacro (fascia toracolombare), cresta iliaca, ultime coste', it='fondo del solco intertubercolare (qui indicato dalla cresta del tubercolo minore)', a='estensione, adduzione e intrarotazione della spalla', nv='nervo toracodorsale (C6–C8)'),
 dict(id='gpett', n='Grande pettorale', o=['clav_med_ant', 'corpo_sterno'], i=['cresta_tub_magg'], ot='metà mediale della clavicola, sterno e cartilagini costali I–VI', it='cresta del tubercolo maggiore', a='adduzione e intrarotazione della spalla; la parte clavicolare flette', nv='nervi pettorali laterale e mediale (C5–T1)'),
 dict(id='ppett', n='Piccolo pettorale', o=['costa4_ant'], i=['coracoide'], ot='coste III–V', it='processo coracoideo', a='abbassa e porta in avanti la scapola', nv='nervo pettorale mediale (C8–T1)'),
 dict(id='trap', n='Trapezio', o=['prot_occipitale', 'spin_c7', 'spin_t7'], i=['clav_lat_post', 'acromion', 'spina_scap'], seg=[['prot_occipitale', 'clav_lat_post'], ['spin_c7', 'acromion'], ['spin_t7', 'spina_scap']], ot='protuberanza occipitale esterna, legamento nucale, processi spinosi da C7 a T12', it='terzo laterale della clavicola, acromion e spina della scapola', a="le fibre superiori elevano la scapola, le medie la adducono, le inferiori la abbassano; insieme la ruotano verso l'alto", nv='nervo accessorio (XI) e rami C3–C4'),
 dict(id='elev', n='Elevatore della scapola', o=['trasv_atlante', 'trasv_c4'], i=['ang_sup'], ot='processi trasversi di C1–C4', it='angolo superiore della scapola', a='elevazione della scapola; inclinazione del collo dallo stesso lato', nv='nervo dorsale della scapola (C5) e rami C3–C4'),
 dict(id='romb', n='Romboidi', o=['spin_c7', 'spin_t3'], i=['marg_med_scap'], ot='processi spinosi di C7–T1 (piccolo romboide) e T2–T5 (grande romboide)', it='margine mediale della scapola', a='adduzione ed elevazione della scapola', nv='nervo dorsale della scapola (C4–C5)'),
 dict(id='dent', n='Dentato anteriore', o=['costa6_lat'], i=['marg_med_ant'], ot='faccia laterale delle coste I–IX', it='margine mediale della scapola, faccia anteriore', a='porta in avanti la scapola e la tiene contro il torace; la ruota per alzare il braccio oltre 90°', nv='nervo toracico lungo (C5–C7)'),
 dict(id='bic', n='Bicipite brachiale', o=['tub_sopraglen', 'coracoide'], i=['tub_radiale'], ot='tubercolo sopraglenoideo (capo lungo) e processo coracoideo (capo breve)', it='tuberosità radiale', a="flessione del gomito e supinazione dell'avambraccio", nv='nervo muscolocutaneo (C5–C6)'),
 dict(id='brac', n='Brachiale', o=['omero_ant_dist'], i=['tub_ulnare'], ot="metà distale della faccia anteriore dell'omero", it='tuberosità ulnare', a='flessione del gomito', nv='nervo muscolocutaneo (C5–C6)'),
 dict(id='tric', n='Tricipite brachiale', o=['tub_infraglen', 'omero_post'], i=['olecrano'], ot="tubercolo infraglenoideo (capo lungo) e faccia posteriore dell'omero (capi laterale e mediale)", it='olecrano', a='estensione del gomito; il capo lungo estende anche la spalla', nv='nervo radiale (C6–C8)'),
 # --- avambraccio ---
 dict(id='brrad', n='Brachioradiale', o=['cresta_sopracond'], i=['stiloide_radio'], ot='cresta sopracondiloidea laterale', it='base del processo stiloideo del radio', a="flessione del gomito, soprattutto ad avambraccio in posizione intermedia", nv='nervo radiale (C5–C6)'),
 dict(id='pron', n='Pronatore rotondo', o=['epic_med', 'proc_coronoideo'], i=['radio_lat_medio'], ot="epicondilo mediale (capo omerale) e processo coronoideo dell'ulna (capo ulnare)", it='terzo medio della faccia laterale del radio', a="pronazione dell'avambraccio; flessione del gomito", nv='nervo mediano (C6–C7)'),
 dict(id='frc', n='Flessore radiale del carpo', o=['epic_med'], i=['base_mc2'], ot='epicondilo mediale', it='base del secondo metacarpale (e in parte del terzo)', a='flessione e deviazione radiale del polso', nv='nervo mediano (C6–C7)'),
 dict(id='fuc', n='Flessore ulnare del carpo', o=['epic_med', 'olecrano'], i=['pisiforme', 'uncino_uncinato', 'base_mc5'], seg=[['epic_med', 'pisiforme'], ['olecrano', 'pisiforme'], ['pisiforme', 'uncino_uncinato'], ['pisiforme', 'base_mc5']], ot="epicondilo mediale (capo omerale), olecrano e margine posteriore dell'ulna (capo ulnare)", it="pisiforme, poi uncinato e base del quinto metacarpale tramite legamenti", a='flessione e deviazione ulnare del polso', nv='nervo ulnare (C7–T1)'),
 dict(id='erlc', n='Estensore radiale lungo del carpo', o=['cresta_sopracond'], i=['base_mc2_dors'], ot='cresta sopracondiloidea laterale', it='base del secondo metacarpale, faccia dorsale', a='estensione e deviazione radiale del polso', nv='nervo radiale (C6–C7)'),
 dict(id='erbc', n='Estensore radiale breve del carpo', o=['epic_lat'], i=['base_mc3_dors'], ot='epicondilo laterale', it='base del terzo metacarpale, faccia dorsale', a='estensione del polso', nv='nervo radiale, ramo profondo (C7–C8)'),
 dict(id='euc', n='Estensore ulnare del carpo', o=['epic_lat'], i=['base_mc5_dors'], ot="epicondilo laterale (e margine posteriore dell'ulna)", it='base del quinto metacarpale, faccia dorsale', a='estensione e deviazione ulnare del polso', nv='nervo radiale, ramo profondo (C7–C8)'),
 # --- coscia ---
 dict(id='vlat', n='Vasto laterale', o=['femore_lat_prox'], i=['rotula_base', 'tub_tibiale'], ot='grande trocantere e labbro laterale della linea aspra', it='base della rotula e, tramite il legamento rotuleo, tuberosità tibiale', a='estensione del ginocchio', nv='nervo femorale (L2–L4)'),
 dict(id='vmed', n='Vasto mediale', o=['femore_med'], i=['rotula_base', 'tub_tibiale'], ot='linea intertrocanterica e labbro mediale della linea aspra', it='base e margine mediale della rotula, poi tuberosità tibiale', a='estensione del ginocchio; stabilizza la rotula medialmente', nv='nervo femorale (L2–L4)'),
 dict(id='vint', n='Vasto intermedio', o=['femore_ant'], i=['rotula_base', 'tub_tibiale'], ot='facce anteriore e laterale del femore', it='base della rotula, poi tuberosità tibiale', a='estensione del ginocchio', nv='nervo femorale (L2–L4)'),
 dict(id='semim', n='Semimembranoso', o=['tuber_post'], i=['tibia_cond_med_post'], ot='tuberosità ischiatica', it='faccia posteriore del condilo mediale della tibia', a="flessione e intrarotazione del ginocchio; estensione dell'anca", nv='nervo tibiale (L5–S2)'),
 dict(id='addg', n='Adduttore grande', o=['ramo_ischio', 'tuber_post'], i=['linea_aspra', 'tub_adduttorio'], seg=[['ramo_ischio', 'linea_aspra'], ['tuber_post', 'tub_adduttorio']], ot="ramo ischio-pubico (parte adduttoria) e tuberosità ischiatica (parte ischiocondiloidea)", it='linea aspra e tubercolo adduttorio', a="adduzione dell'anca; la parte ischiocondiloidea estende l'anca", nv='nervo otturatorio (L2–L4) e nervo tibiale (L4)'),
 dict(id='pett', n='Pettineo', o=['pettine_pube'], i=['linea_pettinea'], ot='pettine del pube', it='linea pettinea del femore', a="adduzione e flessione dell'anca", nv='nervo femorale (L2–L3), a volte nervo otturatorio'),
 # --- gamba ---
 dict(id='tibant', n='Tibiale anteriore', o=['tibia_lat_prox'], i=['cuneiforme_med', 'base_mt1'], seg=[['tibia_lat_prox', 'cuneiforme_med'], ['tibia_lat_prox', 'base_mt1']], ot='condilo laterale e metà prossimale della faccia laterale della tibia, membrana interossea', it='cuneiforme mediale e base del primo metatarsale', a='dorsiflessione e inversione del piede', nv='nervo peroneo profondo (L4–L5)'),
 dict(id='tibpost', n='Tibiale posteriore', o=['tibia_post', 'fibula_post'], i=['tub_navicolare'], ot='faccia posteriore di tibia e fibula, membrana interossea', it='tuberosità del navicolare (con espansioni a cuneiformi e metatarsali)', a="inversione e flessione plantare del piede; sostiene l'arco mediale", nv='nervo tibiale (L4–L5)'),
 dict(id='gastr', n='Gastrocnemio', o=['cond_med_post', 'cond_lat_post'], i=['tub_calcagno'], ot='faccia posteriore del femore sopra i condili mediale e laterale', it="tuberosità calcaneare, tramite il tendine d'Achille", a='flessione plantare della caviglia; flessione del ginocchio', nv='nervo tibiale (S1–S2)'),
 dict(id='soleo', n='Soleo', o=['fibula_post', 'tibia_post'], i=['tub_calcagno'], ot='testa e faccia posteriore della fibula, linea del soleo della tibia', it="tuberosità calcaneare, tramite il tendine d'Achille", a='flessione plantare della caviglia', nv='nervo tibiale (S1–S2)'),
 dict(id='perl', n='Peroneo lungo', o=['fibula_lat_prox'], i=['base_mt1'], ot='testa e metà prossimale della faccia laterale della fibula', it='base del primo metatarsale e cuneiforme mediale, dopo aver attraversato la pianta del piede', a='eversione e flessione plantare del piede; sostiene gli archi plantari', nv='nervo peroneo superficiale (L5–S1)'),
 dict(id='perb', n='Peroneo breve', o=['fibula_lat_dist'], i=['base_mt5'], ot='metà distale della faccia laterale della fibula', it='tuberosità del quinto metatarsale', a='eversione e flessione plantare del piede', nv='nervo peroneo superficiale (L5–S1)'),
 # --- tronco ---
 dict(id='retto', n="Retto dell'addome", o=['pube'], i=['xifoide'], ot='cresta pubica e sinfisi pubica', it='processo xifoideo e cartilagini costali V–VII', a='flessione del tronco; comprime i visceri addominali', nv='nervi intercostali T7–T12'),
 dict(id='qlomb', n='Quadrato dei lombi', o=['cresta_post'], i=['costa12', 'trasv_l3'], seg=[['cresta_post', 'costa12'], ['cresta_post', 'trasv_l3']], ot='tratto posteriore della cresta iliaca e legamento ileolombare', it='dodicesima costa e processi trasversi di L1–L4', a="inclinazione laterale del tronco; fissa la dodicesima costa nell'inspirazione", nv='nervo sottocostale (T12) e rami L1–L4'),
 # --- collo e testa ---
 dict(id='scm', n='Sternocleidomastoideo', o=['manubrio_lat', 'clav_med_ant'], i=['mastoide'], ot='manubrio dello sterno (capo sternale) e terzo mediale della clavicola (capo clavicolare)', it='processo mastoideo e linea nucale superiore', a='da un lato: inclinazione dallo stesso lato e rotazione dal lato opposto; insieme: flessione del collo', nv='nervo accessorio (XI) e rami C2–C3'),
 dict(id='scal', n='Scaleni anteriore e medio', o=['trasv_c4'], i=['costa1'], ot='processi trasversi cervicali (C3–C6 anteriore, C2–C7 medio)', it='prima costa', a='inclinazione laterale del collo; sollevano la prima costa (inspirazione)', nv='rami anteriori dei nervi cervicali'),
 dict(id='splen', n='Splenio del capo', o=['spin_c7', 'spin_t3'], i=['mastoide'], ot='legamento nucale e processi spinosi da C7 a T3', it='processo mastoideo e linea nucale superiore', a='estensione del capo; rotazione dallo stesso lato', nv='rami posteriori dei nervi cervicali'),
 dict(id='mass', n='Massetere', o=['zigomatico', 'arco_zigomatico'], i=['angolo_mandibola'], ot='osso zigomatico e arco zigomatico', it='angolo e faccia laterale del ramo della mandibola', a='chiusura della bocca (elevazione della mandibola)', nv='nervo masseterino, dal mandibolare (V3)'),
 dict(id='temp', n='Temporale', o=['squama_temporale', 'parietale_linea_temp'], i=['coronoide_mand'], ot='fossa temporale, fino alla linea temporale inferiore', it='processo coronoideo della mandibola', a='chiusura della bocca; le fibre posteriori tirano indietro la mandibola', nv='nervi temporali profondi, dal mandibolare (V3)'),
]

# ---------- nomi italiani delle ossa ----------
ORD = {'first': ('Primo', 'Prima', 'I', 1), 'second': ('Secondo', 'Seconda', 'II', 2), 'third': ('Terzo', 'Terza', 'III', 3), 'fourth': ('Quarto', 'Quarta', 'IV', 4),
       'fifth': ('Quinto', 'Quinta', 'V', 5), 'sixth': ('Sesto', 'Sesta', 'VI', 6), 'seventh': ('Settimo', 'Settima', 'VII', 7), 'eighth': ('Ottavo', 'Ottava', 'VIII', 8),
       'ninth': ('Nono', 'Nona', 'IX', 9), 'tenth': ('Decimo', 'Decima', 'X', 10), 'eleventh': ('Undicesimo', 'Undicesima', 'XI', 11), 'twelfth': ('Dodicesimo', 'Dodicesima', 'XII', 12)}
SIMPLE = {  # nome inglese senza lato -> (nome italiano, genere)
 'femur': ('Femore', 'm'), 'humerus': ('Omero', 'm'), 'clavicle': ('Clavicola', 'f'), 'radius': ('Radio', 'm'), 'ulna': ('Ulna', 'f'), 'tibia': ('Tibia', 'f'),
 'fibula': ('Fibula (perone)', 'f'), 'patella': ('Rotula', 'f'), 'scapula': ('Scapola', 'f'), 'hip bone': ("Osso dell'anca", 'm'),
 'scaphoid': ('Scafoide', 'm'), 'lunate': ('Semilunare', 'm'), 'triquetral': ('Piramidale', 'm'), 'pisiform': ('Pisiforme', 'm'), 'trapezium': ('Trapezio', 'm'),
 'trapezoid': ('Trapezoide', 'm'), 'capitate': ('Capitato', 'm'), 'hamate': ('Uncinato', 'm'),
 'talus': ('Talo (astragalo)', 'm'), 'calcaneus': ('Calcagno', 'm'), 'navicular bone of foot': ('Navicolare del piede', 'm'), 'medial cuneiform bone': ('Cuneiforme mediale', 'm'),
 'intermediate cuneiform bone': ('Cuneiforme intermedio', 'm'), 'lateral cuneiform bone': ('Cuneiforme laterale', 'm'), 'cuboid bone': ('Cuboide', 'm'),
 'sesamoid bone of foot': ('Ossa sesamoidi del piede', 'p'),
 'parietal bone': ('Osso parietale', 'm'), 'temporal bone': ('Osso temporale', 'm'), 'nasal bone': ('Osso nasale', 'm'), 'maxilla': ('Mascellare', 'm'),
 'lacrimal bone': ('Osso lacrimale', 'm'), 'palatine bone': ('Osso palatino', 'm'), 'zygomatic bone': ('Osso zigomatico', 'm'), 'inferior nasal concha': ('Cornetto nasale inferiore', 'm'),
 'frontal bone': ('Osso frontale', ''), 'occipital bone': ('Osso occipitale', ''), 'sphenoid bone': ('Sfenoide', ''), 'ethmoid': ('Etmoide', ''), 'vomer': ('Vomere', ''),
 'mandible': ('Mandibola', ''), 'hyoid bone': ('Osso ioide', ''), 'sacrum': ('Sacro (con coccige)', ''), 'atlas': ('Atlante (C1)', ''), 'axis': ('Epistrofeo (C2)', ''),
 'manubrium': ('Manubrio dello sterno', ''), 'body of sternum': ('Corpo dello sterno', ''), 'xiphoid process': ('Processo xifoideo', ''),
}
FINGER = {'thumb': 'del pollice', 'index finger': "dell'indice", 'middle finger': 'del medio', 'ring finger': "dell'anulare", 'little finger': 'del mignolo',
          'big toe': "dell'alluce", 'second toe': 'del secondo dito del piede', 'third toe': 'del terzo dito del piede', 'fourth toe': 'del quarto dito del piede', 'little toe': 'del quinto dito del piede'}
PHAL = {'proximal': 'prossimale', 'middle': 'media', 'distal': 'distale'}
LATO = {'m': {'right': 'destro', 'left': 'sinistro'}, 'f': {'right': 'destra', 'left': 'sinistra'}, 'p': {'right': 'destro', 'left': 'sinistro'}}

def bone_it(en):
    """Nome italiano di una parte del modello a partire dal nome inglese di BodyParts3D."""
    m = re.search(r'\b(right|left)\b', en)
    side = m.group(1) if m else ''
    base = re.sub(r'\s+', ' ', re.sub(r'\b(right|left)\b', '', en)).strip()
    def lato(g): return (' ' + LATO[g][side]) if side and g in LATO else ''
    if base in SIMPLE:
        n, g = SIMPLE[base]
        if g == 'p': return n + (', piede ' + LATO['m'][side] if side else '')
        return n + lato(g)
    m = re.fullmatch(r'(\w+) rib', base)
    if m: o = ORD[m.group(1)]; return f'{o[1]} costa{lato("f")}'
    m = re.fullmatch(r'(\w+) costal cartilage', base)
    if m: o = ORD[m.group(1)]; return f'{o[1]} cartilagine costale{lato("f")}'
    if base == 'costal cartilage': return 'Cartilagine costale' + lato('f')
    m = re.fullmatch(r'(\w+) (cervical|thoracic|lumbar) vertebra', base)
    if m:
        o = ORD[m.group(1)]; reg = {'cervical': ('cervicale', 'C'), 'thoracic': ('toracica', 'T'), 'lumbar': ('lombare', 'L')}[m.group(2)]
        return f'{o[1]} vertebra {reg[0]} ({reg[1]}{o[3]})'
    m = re.fullmatch(r'(\w+) (metacarpal|metatarsal) bone', base)
    if m: o = ORD[m.group(1)]; return f'{o[0]} {"metacarpale" if m.group(2) == "metacarpal" else "metatarsale"}{lato("m")}'
    m = re.fullmatch(r'(proximal|middle|distal) phalanx of (.+)', base)
    if m: return f'Falange {PHAL[m.group(1)]} {FINGER[m.group(2)]}{lato("m")}'
    return en  # non previsto: resta il nome della fonte

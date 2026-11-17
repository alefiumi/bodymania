-- BodyMania: testo del badge "Esploratore 3D" (sul modello 3D ora ci sono otto sfide; ne bastano quattro diverse).
-- Si applica dopo gli altri file: SQL Editor → incolla → Run. Facoltativo: cambia solo la descrizione.
update public.badge_classes
  set description = 'Gioca quattro sfide diverse sul modello 3D', criteria = 'Gioca quattro sfide diverse sul modello 3D'
  where id = 'd3tutti';

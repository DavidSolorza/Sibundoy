-- Agregar Vereda San Agustín al catálogo de sectores
insert into sectores (nombre, lat_base, lng_base) values
  ('Vereda San Agustín', 1.1900, -76.9100)
on conflict (nombre) do nothing;

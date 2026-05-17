-- ============================================================
-- Migración: Agregar columna menores_hogar a asociadas
-- ============================================================

alter table asociadas
  add column if not exists menores_hogar integer default 0 check (menores_hogar >= 0);

comment on column asociadas.menores_hogar is 'Cantidad de menores de edad en el hogar';

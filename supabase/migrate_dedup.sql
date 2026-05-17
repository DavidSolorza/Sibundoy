-- ============================================================
-- AgroMap — Data integrity & deduplication
 - Previene duplicados a nivel de base de datos
-- ============================================================

-- 1. Evitar mismo nombre en el mismo sector
alter table asociadas add constraint uq_asociadas_nombre_sector unique (nombre, sector_id);

-- 2. Índice único parcial para teléfono no nulo
create unique index if not exists uq_asociadas_telefono on asociadas(telefono) where telefono is not null;

-- 3. Índice para búsqueda rápida de duplicados por coordenadas
create index if not exists idx_asociadas_coords_dedup on asociadas(lat, lng) where lat is not null and lng is not null;

-- 4. Realtime (ejecutar después de haber limpiado duplicados existentes)
-- alter table public.asociadas replica identity full;
-- alter publication supabase_realtime add table public.asociadas;
-- alter publication supabase_realtime add table public.visitas;

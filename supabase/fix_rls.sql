-- ============================================================
-- Fix: Permitir escritura con anon key (público)
-- La app usa una anon key (sb_publishable_...) por lo que
-- auth.role() = 'authenticated' NO funciona.
-- ============================================================

-- Opción A: Deshabilitar RLS completamente (más simple)
alter table sectores disable row level security;
alter table asociadas disable row level security;
alter table visitas disable row level security;

-- Opción B (alternativa): Políticas para anon
-- Comenta las líneas de arriba y descomenta estas si prefieres mantener RLS:
--
-- drop policy if exists "Asociadas insertable por autenticados" on asociadas;
-- drop policy if exists "Asociadas actualizable por autenticados" on asociadas;
-- drop policy if exists "Asociadas eliminable por autenticados" on asociadas;
-- drop policy if exists "Visitas insertable por autenticados" on visitas;
-- drop policy if exists "Visitas actualizable por autenticados" on visitas;
-- drop policy if exists "Visitas eliminable por autenticados" on visitas;
--
-- create policy "Asociadas insertable público"
--   on asociadas for insert with check (true);
-- create policy "Asociadas actualizable público"
--   on asociadas for update using (true);
-- create policy "Asociadas eliminable público"
--   on asociadas for delete using (true);
-- create policy "Visitas insertable público"
--   on visitas for insert with check (true);
-- create policy "Visitas actualizable público"
--   on visitas for update using (true);
-- create policy "Visitas eliminable público"
--   on visitas for delete using (true);

-- ============================================================
-- Migración: Reemplazar tipo_persona por estado civil
-- Cambia el enum de ('madre cabeza de hogar', 'Adulto mayor', 'viuda')
-- a ('Casada', 'Madre Cabeza De Hogar', 'Viuda', 'Separada')
-- ============================================================

-- 1. Crear el nuevo enum
create type estado_civil as enum ('Casada', 'Madre Cabeza De Hogar', 'Viuda', 'Separada');

-- 2. Migrar datos existentes
-- Mapeo: 'madre cabeza de hogar' → 'Madre Cabeza De Hogar'
--        'Adulto mayor'          → 'Casada' (valor por defecto)
--        'viuda'                 → 'Viuda'
alter table asociadas
  alter column tipo_persona type estado_civil
  using (
    case
      when tipo_persona::text = 'madre cabeza de hogar' then 'Madre Cabeza De Hogar'::estado_civil
      when tipo_persona::text = 'viuda' then 'Viuda'::estado_civil
      else 'Casada'::estado_civil
    end
  );

-- 3. Eliminar el tipo anterior
drop type tipo_persona;

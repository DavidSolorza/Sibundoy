-- Migración: Añadir columna fotos a la tabla asociadas
ALTER TABLE asociadas ADD COLUMN IF NOT EXISTS fotos text[] DEFAULT '{}';

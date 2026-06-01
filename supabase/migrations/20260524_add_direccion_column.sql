-- Migración de Supabase: Agregar la columna de dirección a la tabla applications
-- Proyecto: JobStack
-- Fecha: 2026-05-24

-- Agregar la columna 'direccion' a la tabla applications
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS direccion VARCHAR(255);

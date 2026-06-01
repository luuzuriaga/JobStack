-- Migración de Supabase: Agregar columnas de valoración, tags y última actualización
-- Proyecto: JobStack
-- Fecha: 2026-05-24

ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS rating INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS tags TEXT,
ADD COLUMN IF NOT EXISTS ultima_actualizacion DATE;

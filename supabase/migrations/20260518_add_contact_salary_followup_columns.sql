-- Migración de Supabase: Agregar columnas de contacto, salario y seguimiento
-- Proyecto: JobStack
-- Fecha: 2026-05-18 (Segunda migración)

-- Agregar las tres nuevas columnas a la tabla applications
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS contacto_info VARCHAR(255),
ADD COLUMN IF NOT EXISTS salario_rango VARCHAR(100),
ADD COLUMN IF NOT EXISTS fecha_seguimiento DATE;

-- Crear índices para mejorar búsquedas
CREATE INDEX IF NOT EXISTS idx_applications_fecha_seguimiento ON public.applications(fecha_seguimiento);

-- Migración de Supabase: Creación de la Tabla de Portales (portales)
-- Proyecto: JobStack
-- Fecha: 2026-06-09

CREATE TABLE IF NOT EXISTS public.portales (
    -- Clave primaria auto-generada
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Metadatos de creación
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    
    -- Relación obligatoria con el usuario autenticado (para privacidad)
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Nombre de la empresa o portal (ej. "Google", "LinkedIn", "Interbank")
    company_name VARCHAR(255) NOT NULL,
    
    -- Rubro de la empresa (ej. "Tecnología", "Banca", "Retail")
    rubro VARCHAR(255),
    
    -- Link del portal
    link TEXT,
    
    -- Correo con el que se registró en el portal
    correo_registro VARCHAR(255),
    
    -- Fecha de registro
    fecha DATE DEFAULT CURRENT_DATE NOT NULL
);

-- Habilitar la seguridad a nivel de fila (Row Level Security - RLS)
ALTER TABLE public.portales ENABLE ROW LEVEL SECURITY;

-- Definir políticas RLS para control granular

-- A) Política de Lectura (Select): Un usuario solo puede leer sus propias filas
CREATE POLICY "Select personal: los usuarios pueden leer sus propios portales"
    ON public.portales FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- B) Política de Inserción (Insert): Los usuarios pueden insertar filas vinculadas a su propio user_id
CREATE POLICY "Insert personal: los usuarios pueden crear sus propios portales"
    ON public.portales FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- C) Política de Actualización (Update): Un usuario solo puede actualizar sus propias filas
CREATE POLICY "Update personal: los usuarios pueden actualizar sus propios portales"
    ON public.portales FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- D) Política de Eliminación (Delete): Un usuario solo puede borrar sus propias filas
CREATE POLICY "Delete personal: los usuarios pueden eliminar sus propios portales"
    ON public.portales FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Crear índice para optimizar consultas por usuario
CREATE INDEX IF NOT EXISTS idx_portales_user_id ON public.portales(user_id);

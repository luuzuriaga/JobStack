-- Migración de Supabase: Creación de la Tabla de Postulaciones (applications)
-- Proyecto: JobStack
-- Fecha: 2026-05-18

-- 1. Crear la tabla de aplicaciones
CREATE TABLE IF NOT EXISTS public.applications (
    -- Clave primaria auto-generada
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Metadatos de creación
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    
    -- Relación obligatoria con el usuario autenticado (para privacidad)
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Fecha de la postulación
    fecha_registro DATE DEFAULT CURRENT_DATE NOT NULL,
    
    -- Detalles del puesto
    job_title VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    vacancy_url TEXT,
    portal VARCHAR(100),
    
    -- Tipo de modalidad (restringido a: presencial, hibrido, remoto)
    tipo VARCHAR(50) NOT NULL CONSTRAINT check_tipo CHECK (tipo IN ('presencial', 'hibrido', 'remoto')),
    
    -- Ubicación física del puesto (por defecto "Peru")
    ubicacion VARCHAR(100) DEFAULT 'Peru' NOT NULL,
    
    -- Perfil del aplicante (restringido a: Butcamp, Universidad)
    perfil VARCHAR(50) NOT NULL CONSTRAINT check_perfil CHECK (perfil IN ('Butcamp', 'Universidad')),
    
    -- Estado de la postulación (restringido a: Sin empezar, Listo)
    postulacion_estado VARCHAR(50) DEFAULT 'Sin empezar' NOT NULL CONSTRAINT check_postulacion_estado CHECK (postulacion_estado IN ('Sin empezar', 'Listo')),
    
    -- Estado en el embudo (restringido a: Postulado, En revisión, Entrevista, Prueba Técnica, Rechazado, Oferta, Cerrado, cerrado)
    estado_funnel VARCHAR(50) DEFAULT 'Postulado' NOT NULL CONSTRAINT check_estado_funnel CHECK (estado_funnel IN ('en espera', 'no continua', 'entrevista_screening', 'entrevista_tecnica', 'oferta', 'Postulado', 'En revisión', 'Entrevista', 'Prueba Técnica', 'Rechazado', 'Oferta', 'Cerrado', 'cerrado')),
    
    -- Notas adicionales
    notas_texto TEXT,
    
    -- Documentos o enlaces de pruebas
    prueba_psicometrica_url TEXT,
    prueba_tecnica_url TEXT
);

-- 2. Habilitar la seguridad a nivel de fila (Row Level Security - RLS)
-- Esto garantiza que ningún usuario pueda ver o modificar postulaciones de otros usuarios.
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- 3. Definir políticas RLS para control granular

-- A) Política de Lectura (Select): Un usuario solo puede leer sus propias filas
CREATE POLICY "Select personal: los usuarios pueden leer sus propias postulaciones"
    ON public.applications FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- B) Política de Inserción (Insert): Los usuarios pueden insertar filas vinculadas a su propio user_id
CREATE POLICY "Insert personal: los usuarios pueden crear sus propias postulaciones"
    ON public.applications FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- C) Política de Actualización (Update): Un usuario solo puede actualizar sus propias filas
CREATE POLICY "Update personal: los usuarios pueden actualizar sus propias postulaciones"
    ON public.applications FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- D) Política de Eliminación (Delete): Un usuario solo puede borrar sus propias filas
CREATE POLICY "Delete personal: los usuarios pueden eliminar sus propias postulaciones"
    ON public.applications FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 4. Crear índice para optimizar consultas por usuario
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);

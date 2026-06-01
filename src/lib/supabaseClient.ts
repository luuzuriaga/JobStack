import { createClient } from '@supabase/supabase-js';

// Leer variables de entorno de Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validar que las variables existan para prevenir fallos silenciosos
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY no están configuradas.\n' +
    'Por favor, crea un archivo `.env` en la raíz del proyecto basándote en `.env.example` y añade tus credenciales de Supabase.'
  );
}

// Inicializar el cliente (usar cadenas vacías como fallback para evitar que el compilador falle, pero advirtiendo arriba)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);

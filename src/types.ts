// Tipos e Interfaces de TypeScript para JobStack (Esquema Limpio)

// Tipos restrictivos para los enums del modelo
export type TipoModalidad = 'presencial' | 'hibrido' | 'remoto';
export type PerfilAplicante = 'Butcamp' | 'Universidad';
export type PostulacionEstado = 'Sin empezar' | 'Listo';
export type EstadoFunnel = 'en espera' | 'no continua' | 'entrevista_screening' | 'entrevista_tecnica' | 'oferta' | 'cerrado' | 'Cerrado' | 'Postulado' | 'En revisión' | 'Entrevista' | 'Prueba Técnica' | 'Rechazado' | 'Oferta';

export interface Empresa {
  id_empresa: number;
  nombre: string;
  sitio_web?: string | null;
  user_id: string;
}

export interface Estado {
  id_estado: number;
  nombre_estado: string;
}

export interface Postulacion {
  id_postulacion: number;
  id_empresa: number;
  id_estado: number;
  puesto?: string;
  fecha_postulacion: string;
  plataforma?: string | null;
  url_vacante?: string | null;
  salario_rango?: string | null;
  contacto_info?: string | null;
  fecha_seguimiento?: string | null;
  accion_seguimiento?: string | null;
  notas?: string | null;
  modalidad?: string | null;
  user_id: string;
  
  // Relaciones expandidas (Supabase joins)
  empresas?: Empresa;
  estados?: Estado;
}

// Para retrocompatibilidad o simplificación en el frontend
// Para retrocompatibilidad o simplificación en el frontend
export interface Application {
  id: string;
  id_postulacion?: number;
  id_empresa?: number;
  id_estado?: number;
  user_id: string;
  
  // Campos principales
  puesto?: string;
  job_title?: string;
  company_name?: string;
  
  // Campos de date/seguimiento
  fecha_postulacion?: string;
  fecha_registro?: string;
  created_at?: string;
  
  // Campos de modalidad y ubicación
  tipo?: TipoModalidad;
  modalidad?: string;
  ubicacion?: string;
  
  // Campos de perfil y estado
  perfil?: PerfilAplicante;
  postulacion_estado?: PostulacionEstado;
  estado_funnel?: EstadoFunnel;
  
  // URLs y contactos
  vacancy_url?: string | null;
  url_vacante?: string | null;
  portal?: string | null;
  plataforma?: string | null;
  contacto_info?: string | null;
  
  // Salarios y seguimiento
  salario_rango?: string | null;
  fecha_seguimiento?: string | null;
  accion_seguimiento?: string | null;
  
  // Notas
  notas?: string | null;
  notas_texto?: string;
  
  // Flags especiales de Indeed/Coach
  cv_visto?: boolean;
  vacante_activa?: boolean;
  empresa_sla?: string | null;

  // Nuevas columnas del formulario premium
  rating?: number;
  tags?: string;
  ultima_actualizacion?: string;
  
  // Relaciones expandidas (Supabase joins)
  empresas?: Empresa;
  estados?: Estado;
}


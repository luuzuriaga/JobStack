import React from 'react';
import type { TipoModalidad, PerfilAplicante, PostulacionEstado, EstadoFunnel } from '../../types';

interface BadgeProps {
  variant: 'tipo' | 'perfil' | 'postulacion' | 'funnel';
  value: TipoModalidad | PerfilAplicante | PostulacionEstado | EstadoFunnel;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant, value, className = '' }) => {
  // Mapeo de estilos según la variante y valor
  let styleClasses = 'bg-slate-800 text-slate-300 border-slate-700';

  if (variant === 'tipo') {
    switch (value as TipoModalidad) {
      case 'remoto':
        styleClasses = 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
        break;
      case 'hibrido':
        styleClasses = 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
        break;
      case 'presencial':
        styleClasses = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
        break;
    }
  } else if (variant === 'perfil') {
    switch (value as PerfilAplicante) {
      case 'Butcamp':
        styleClasses = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
        break;
      case 'Universidad':
        styleClasses = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
        break;
    }
  } else if (variant === 'postulacion') {
    switch (value as PostulacionEstado) {
      case 'Sin empezar':
        styleClasses = 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
        break;
      case 'Listo':
        styleClasses = 'bg-green-500/10 text-green-400 border border-green-500/20';
        break;
    }
  } else if (variant === 'funnel') {
    const lowerVal = String(value).toLowerCase();
    if (lowerVal === 'en espera' || lowerVal === 'en revisión' || lowerVal === 'en revision' || lowerVal.includes('revis')) {
      styleClasses = 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
    } else if (lowerVal === 'no continua' || lowerVal === 'rechazado' || lowerVal === 'cerrado') {
      styleClasses = 'bg-red-500/10 text-red-400 border border-red-500/20';
    } else if (
      lowerVal === 'entrevista_screening' ||
      lowerVal === 'entrevista' ||
      lowerVal === 'screening' ||
      lowerVal === 'entrevista_tecnica' ||
      lowerVal === 'prueba técnica' ||
      lowerVal === 'prueba tecnica'
    ) {
      styleClasses = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    } else if (lowerVal === 'oferta') {
      styleClasses = 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10 animate-pulse';
    }
  }

  // Traducciones amigables para mostrar en pantalla
  const getLabel = (val: string) => {
    switch (val) {
      case 'remoto': return 'Remoto';
      case 'hibrido': return 'Híbrido';
      case 'presencial': return 'Presencial';
      case 'en espera': return 'En Espera';
      case 'en revisión':
      case 'en revision':
      case 'En revisión': return 'En Revisión';
      case 'no continua': return 'No Continúa';
      case 'entrevista_screening': return 'Screening';
      case 'entrevista_tecnica': return 'Entrevista Técnica';
      case 'oferta': return '¡Oferta! 🎉';
      case 'cerrado': return 'Cerrado';
      default: return val;
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider select-none ${styleClasses} ${className}`}
    >
      {getLabel(value)}
    </span>
  );
};

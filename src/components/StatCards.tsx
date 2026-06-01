import React from 'react';
import type { Application } from '../types';
import { Briefcase, CalendarClock, Trophy, Percent, Coins } from 'lucide-react';

interface StatCardsProps {
  applications: Application[];
}

export const StatCards: React.FC<StatCardsProps> = ({ applications }) => {
  // Calcular métricas
  const totalApps = applications.length;
  
  const activeInterviews = applications.filter(app => {
    const lower = (app.estado_funnel || '').toLowerCase();
    return ['entrevista_screening', 'entrevista_tecnica', 'en revisión', 'en revision', 'entrevista', 'prueba técnica', 'prueba tecnica', 'screening'].includes(lower) || lower.includes('revis');
  }).length;

  const offers = applications.filter(app => {
    const lower = (app.estado_funnel || '').toLowerCase();
    return lower.includes('oferta');
  }).length;

  // Tasa de conversión a entrevista u oferta (porcentaje de postulaciones que avanzaron más allá de "en espera" o "Postulado")
  const advancedApps = applications.filter(app => {
    const lower = (app.estado_funnel || '').toLowerCase();
    return !['en espera', 'postulado', 'cerrado', 'rechazado', 'no continua'].includes(lower);
  }).length;
  const conversionRate = totalApps > 0 ? Math.round((advancedApps / totalApps) * 100) : 0;

  // Calcular monto promedio
  const amounts = applications
    .map(app => {
      const match = app.notas_texto?.match(/💰 Monto:\s*([0-9.,]+)/);
      return match ? parseFloat(match[1].replace(/,/g, '')) : null;
    })
    .filter((val): val is number => val !== null);
    
  const avgAmount = amounts.length > 0 ? Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length) : 0;
  const formattedAvgAmount = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(avgAmount);

  // Configuración de tarjetas
  const stats = [
    {
      title: 'Postulaciones Totales',
      value: totalApps,
      subtext: 'Vacantes registradas',
      icon: Briefcase,
      colorClass: 'text-sky-400',
      bgColor: 'bg-sky-500/10',
      glowColor: 'shadow-sky-500/5',
      borderColor: 'group-hover:border-sky-500/30'
    },
    {
      title: 'Entrevistas Activas',
      value: activeInterviews,
      subtext: 'Screening y Técnicas',
      icon: CalendarClock,
      colorClass: 'text-violet-400',
      bgColor: 'bg-violet-500/10',
      glowColor: 'shadow-violet-500/5',
      borderColor: 'group-hover:border-violet-500/30'
    },
    {
      title: 'Ofertas Recibidas',
      value: offers,
      subtext: '¡Felicidades! 🎉',
      icon: Trophy,
      colorClass: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      glowColor: 'shadow-emerald-500/5',
      borderColor: 'group-hover:border-emerald-500/30'
    },
    {
      title: 'Tasa de Progreso',
      value: `${conversionRate}%`,
      subtext: 'Avanzaron de "En Espera"',
      icon: Percent,
      colorClass: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      glowColor: 'shadow-cyan-500/5',
      borderColor: 'group-hover:border-cyan-500/30'
    },
    {
      title: 'Monto Promedio',
      value: formattedAvgAmount,
      subtext: 'De vacantes con monto',
      icon: Coins,
      colorClass: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      glowColor: 'shadow-amber-500/5',
      borderColor: 'group-hover:border-amber-500/30'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6">
      {stats.map((stat, idx) => {
        const IconComponent = stat.icon;
        return (
          <div
            key={idx}
            className={`group relative glass-panel rounded-2xl p-4 sm:p-6 flex items-center justify-between overflow-hidden transition-all duration-300 hover:bg-slate-900/80 hover:-translate-y-0.5 shadow-lg ${stat.glowColor} border border-slate-800/80 ${stat.borderColor}`}
          >
            {/* Subtle glow effect behind the card */}
            <div className={`absolute -right-12 -bottom-12 w-28 h-28 ${stat.bgColor} rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity`} />
            
            <div className="space-y-2 relative z-10">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                {stat.title}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white tracking-tight">
                  {stat.value}
                </span>
              </div>
              <span className="text-xs text-slate-500 block">
                {stat.subtext}
              </span>
            </div>

            <div className={`relative z-10 w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center border border-slate-800 transition-transform duration-300 group-hover:scale-105 shadow-inner`}>
              <IconComponent className={`w-5 h-5 ${stat.colorClass}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

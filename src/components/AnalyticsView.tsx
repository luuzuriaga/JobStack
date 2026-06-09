import React, { useMemo } from 'react';
import type { Application } from '../types';
import { 
  ArrowLeft, BarChart2, Briefcase, Building, CalendarClock, 
  CheckCircle2, Percent, ShieldAlert, Sparkles, Star, Target, 
  TrendingUp, Trophy
} from 'lucide-react';

interface AnalyticsViewProps {
  applications: Application[];
  onNavigate: (view: 'home' | 'table' | 'kanban' | 'calendar' | 'analytics') => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ applications, onNavigate }) => {
  const totalApps = applications.length;

  // 1. Estadísticas de Fases Funnel (Embudo)
  const funnelCounts = useMemo(() => {
    const counts = {
      'Postulado': 0,
      'En revisión': 0,
      'Prueba Técnica': 0,
      'Entrevista': 0,
      'Oferta': 0,
      'Cerrado/Rechazado': 0
    };

    applications.forEach(app => {
      const stage = app.estado_funnel || 'Postulado';
      const lower = stage.toLowerCase();
      if (lower === 'postulado' || lower === 'en espera') counts['Postulado']++;
      else if (lower === 'en revisión' || lower === 'en revision' || lower === 'screening' || lower === 'entrevista_screening' || lower.includes('revis')) counts['En revisión']++;
      else if (lower === 'prueba técnica' || lower === 'prueba tecnica') counts['Prueba Técnica']++;
      else if (lower === 'entrevista' || lower === 'entrevista_tecnica') counts['Entrevista']++;
      else if (lower === 'oferta') counts['Oferta']++;
      else counts['Cerrado/Rechazado']++;
    });

    return counts;
  }, [applications]);

  // Calcular embudo de conversión acumulado (cuántos pasaron por cada etapa)
  const funnelCumulative = useMemo(() => {
    const c = {
      applied: totalApps, // Todos aplicaron
      reviewed: totalApps - funnelCounts['Postulado'], // Pasaron de postulado
      tested: totalApps - funnelCounts['Postulado'] - funnelCounts['En revisión'], // Llegaron a pruebas/entrevistas
      interviewed: funnelCounts['Entrevista'] + funnelCounts['Oferta'] + funnelCounts['Cerrado/Rechazado'] * 0.4, // Estimado de entrevistados
      offers: funnelCounts['Oferta']
    };

    // Asegurar coherencia matemática
    c.interviewed = Math.min(c.interviewed, c.tested);
    c.offers = Math.min(c.offers, c.interviewed);

    // Ajustar si no hay datos
    return {
      applied: Math.max(0, Math.round(c.applied)),
      reviewed: Math.max(0, Math.round(c.reviewed)),
      tested: Math.max(0, Math.round(c.tested)),
      interviewed: Math.max(0, Math.round(c.interviewed)),
      offers: Math.max(0, Math.round(c.offers))
    };
  }, [totalApps, funnelCounts]);

  // 2. Distribución de Portales de Búsqueda
  const portalStats = useMemo(() => {
    const portals: Record<string, number> = {};
    applications.forEach(app => {
      const p = app.portal || app.plataforma || 'Otros';
      const normalized = p.trim() === '' ? 'Otros' : p;
      portals[normalized] = (portals[normalized] || 0) + 1;
    });

    return Object.entries(portals)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalApps > 0 ? Math.round((count / totalApps) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [applications, totalApps]);

  // 3. Distribución de Modalidades (Remoto, Híbrido, Presencial)
  const modalityStats = useMemo(() => {
    const counts = { remoto: 0, hibrido: 0, presencial: 0 };
    applications.forEach(app => {
      const type = (app.modalidad as any) || (app.tipo as any) || '';
      const lower = type.toLowerCase();
      if (lower.includes('remot') || lower === 'remoto') counts.remoto++;
      else if (lower.includes('hibrid') || lower.includes('híbrid') || lower === 'hibrido') counts.hibrido++;
      else if (lower.includes('presenc') || lower === 'presencial') counts.presencial++;
      else counts.remoto++; // default fallback
    });

    return [
      { name: 'Remoto', count: counts.remoto, color: 'bg-sky-400', textColor: 'text-sky-400', border: 'border-sky-500/20' },
      { name: 'Híbrido', count: counts.hibrido, color: 'bg-purple-400', textColor: 'text-purple-400', border: 'border-purple-500/20' },
      { name: 'Presencial', count: counts.presencial, color: 'bg-amber-400', textColor: 'text-amber-400', border: 'border-amber-500/20' }
    ].map(m => ({
      ...m,
      percentage: totalApps > 0 ? Math.round((m.count / totalApps) * 100) : 0
    }));
  }, [applications, totalApps]);



  // 5. Tasa de respuesta (CV visto y Vacante activa)
  const responseStats = useMemo(() => {
    const cvVistos = applications.filter(a => a.cv_visto).length;
    const activas = applications.filter(a => a.vacante_activa !== false).length;

    return {
      cvVistoRate: totalApps > 0 ? Math.round((cvVistos / totalApps) * 100) : 0,
      activeRate: totalApps > 0 ? Math.round((activas / totalApps) * 100) : 0,
      cvVistos,
      activas
    };
  }, [applications, totalApps]);

  // 6. Postulaciones mejor valoradas (Rating)
  const topRatedApps = useMemo(() => {
    return [...applications]
      .filter(a => a.rating && a.rating >= 4)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 3);
  }, [applications]);

  // Calcular Tasa de Progreso Real (porcentaje que pasó de Postulado/En Espera)
  const progressRate = totalApps > 0 
    ? Math.round(((totalApps - funnelCounts['Postulado']) / totalApps) * 100) 
    : 0;

  return (
    <div className="space-y-8 animate-fade-in relative z-10 font-sans select-none">
      
      {/* Orbes decorativos del fondo */}
      <div className="absolute top-10 right-20 w-[450px] h-[450px] bg-violet-600/5 rounded-full blur-3xl pointer-events-none animate-glow-pulse" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-3xl pointer-events-none animate-glow-pulse" style={{ animationDelay: '2.5s' }} />

      {/* Cabecera Premium */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-[0.5px] border-slate-900/35 pb-5">
        <div>
          <button 
            onClick={() => onNavigate('home')}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 mb-2 transition-all focus:outline-none group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> Volver al Inicio
          </button>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Panel de Analíticas
            <span className="text-[10px] uppercase font-extrabold tracking-widest bg-violet-500/10 text-violet-400 px-2 py-1 rounded-md border border-violet-500/15 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-violet-400" /> Métricas Pro
            </span>
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Visualización estadística de tu embudo de conversión y rendimiento en búsquedas laborales.
          </p>
        </div>

        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-violet-950/20 to-indigo-950/20 border border-violet-900/35 hover:border-violet-500/40 text-violet-200 hover:text-white transition-all rounded-xl text-xs font-bold uppercase tracking-wider focus:outline-none shadow-sm shadow-violet-500/5 active:scale-[0.98]"
        >
          Ir al Dashboard Principal
        </button>
      </div>

      {/* Grid Superior de KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* KPI 1: Total Postulaciones */}
        <div className="group relative glass-panel rounded-2xl p-5 sm:p-6 flex items-center justify-between overflow-hidden hover:bg-slate-900/80 transition-all duration-300 hover:-translate-y-0.5 shadow-xl border border-slate-800/80">
          <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity" />
          <div className="space-y-2 relative z-10">
            <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Registradas</span>
            <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{totalApps}</span>
            <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">Postulaciones Totales</span>
          </div>
          <div className="relative z-10 w-11 h-11 rounded-lg bg-sky-500/10 flex items-center justify-center border border-sky-500/20 shadow-inner">
            <Briefcase className="w-5 h-5 text-sky-400" />
          </div>
        </div>

        {/* KPI 2: Tasa de Progreso */}
        <div className="group relative glass-panel rounded-2xl p-5 sm:p-6 flex items-center justify-between overflow-hidden hover:bg-slate-900/80 transition-all duration-300 hover:-translate-y-0.5 shadow-xl border border-slate-800/80">
          <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity" />
          <div className="space-y-2 relative z-10">
            <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Progreso Real</span>
            <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{progressRate}%</span>
            <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">Tasa de avance</span>
          </div>
          <div className="relative z-10 w-11 h-11 rounded-lg bg-violet-500/10 flex items-center justify-center border border-violet-500/20 shadow-inner">
            <Percent className="w-5 h-5 text-violet-400" />
          </div>
        </div>

        {/* KPI 3: Vistas de CV */}
        <div className="group relative glass-panel rounded-2xl p-5 sm:p-6 flex items-center justify-between overflow-hidden hover:bg-slate-900/80 transition-all duration-300 hover:-translate-y-0.5 shadow-xl border border-slate-800/80">
          <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity" />
          <div className="space-y-2 relative z-10">
            <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Feedback CV</span>
            <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{responseStats.cvVistoRate}%</span>
            <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">{responseStats.cvVistos} visualizaciones</span>
          </div>
          <div className="relative z-10 w-11 h-11 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-inner">
            <Target className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        {/* KPI 4: Vacantes Activas */}
        <div className="group relative glass-panel rounded-2xl p-5 sm:p-6 flex items-center justify-between overflow-hidden hover:bg-slate-900/80 transition-all duration-300 hover:-translate-y-0.5 shadow-xl border border-slate-800/80">
          <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity" />
          <div className="space-y-2 relative z-10">
            <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Tasa Activa</span>
            <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{responseStats.activeRate}%</span>
            <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">{responseStats.activas} activas en total</span>
          </div>
          <div className="relative z-10 w-11 h-11 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-inner">
            <TrendingUp className="w-5 h-5 text-amber-400" />
          </div>
        </div>

      </div>

      {/* Sección del Embudo de Conversión (Interactive Funnel Graph) */}
      <section className="glass-panel rounded-3xl p-6 border border-slate-850 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-900 pb-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-violet-400" /> Embudo de Conversión Acumulado
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Porcentaje de retención y progresión de tus aplicaciones a lo largo de las fases funnel.
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800/80 px-3 py-1.5 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase text-slate-300 tracking-wider">Flujo Activo</span>
          </div>
        </div>

        {totalApps === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 opacity-60">
            <ShieldAlert className="w-10 h-10 text-slate-550" />
            <p className="text-sm font-semibold text-slate-400">Sin datos de postulaciones suficientes.</p>
            <p className="text-xs text-slate-500">Registra vacantes para iniciar el modelado del embudo.</p>
          </div>
        ) : (
          <div className="space-y-5 max-w-4xl mx-auto py-2">
            {[
              { label: '1. Postuladas (Aplicadas)', key: 'applied', val: funnelCumulative.applied, pct: 100, color: 'from-sky-600 to-indigo-650', text: 'Total de CVs enviados' },
              { label: '2. En revisión (Fase Inicial)', key: 'reviewed', val: funnelCumulative.reviewed, pct: totalApps > 0 ? Math.round((funnelCumulative.reviewed / totalApps) * 100) : 0, color: 'from-amber-600 to-yellow-500', text: 'CVs validados o contactados' },
              { label: '3. Evaluadas (Pruebas Técnicas)', key: 'tested', val: funnelCumulative.tested, pct: totalApps > 0 ? Math.round((funnelCumulative.tested / totalApps) * 100) : 0, color: 'from-indigo-600 to-violet-650', text: 'Llegaron a pruebas o hackerrank' },
              { label: '4. Seleccionadas (Entrevistas)', key: 'interviewed', val: funnelCumulative.interviewed, pct: totalApps > 0 ? Math.round((funnelCumulative.interviewed / totalApps) * 100) : 0, color: 'from-emerald-600 to-teal-500', text: 'Entrevistados con HR o Tech' },
              { label: '5. Ganadas (Ofertas Laborales)', key: 'offers', val: funnelCumulative.offers, pct: totalApps > 0 ? Math.round((funnelCumulative.offers / totalApps) * 100) : 0, color: 'from-emerald-500 to-green-400 shadow-lg shadow-emerald-500/10 animate-pulse', text: '¡Ofertas finales recibidas! 🎉' }
            ].map((stage, idx) => {
              return (
                <div key={idx} className="relative space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-200 block truncate pr-2">{stage.label}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-450 text-[10px] hidden sm:inline">{stage.text}</span>
                      <span className="text-white font-bold bg-slate-900 border border-slate-800/80 px-2.5 py-0.5 rounded-lg">
                        {stage.val} ({stage.pct}%)
                      </span>
                    </div>
                  </div>
                  
                  {/* Barra de progreso premium */}
                  <div className="w-full h-7 bg-slate-950 border border-slate-900 rounded-xl overflow-hidden relative shadow-inner p-[1px]">
                    <div 
                      className={`h-full rounded-lg bg-gradient-to-r ${stage.color} transition-all duration-1000 flex items-center justify-end px-3`}
                      style={{ width: `${stage.pct}%` }}
                    >
                      {stage.pct >= 15 && (
                        <span className="text-[10px] font-black text-white tracking-widest drop-shadow-md">
                          {stage.pct}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Grid de Secciones de Distribución */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Distribución por Portales */}
        <div className="glass-panel rounded-3xl p-5 border border-slate-850 shadow-xl flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-white border-b border-slate-900 pb-3 mb-4 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-sky-400" /> Distribución de Portales
            </h4>
            
            {totalApps === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-10">Sin datos de portales</p>
            ) : (
              <div className="space-y-4">
                {portalStats.map((portal, idx) => {
                  let portalColor = 'bg-slate-500';
                  if (portal.name.toLowerCase().includes('linke')) portalColor = 'bg-sky-500';
                  else if (portal.name.toLowerCase().includes('inde')) portalColor = 'bg-emerald-500';
                  else if (portal.name.toLowerCase().includes('compu')) portalColor = 'bg-amber-500';
                  else if (portal.name.toLowerCase().includes('intern')) portalColor = 'bg-purple-500';

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-slate-300 flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${portalColor}`} />
                          {portal.name}
                        </span>
                        <span className="text-slate-450 font-bold">{portal.count} ({portal.percentage}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${portalColor}`} style={{ width: `${portal.percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modalidades de Trabajo */}
        <div className="glass-panel rounded-3xl p-5 border border-slate-850 shadow-xl flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-white border-b border-slate-900 pb-3 mb-4 flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-purple-400" /> Modalidad de Vacantes
            </h4>
            
            {totalApps === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-10">Sin datos de modalidades</p>
            ) : (
              <div className="space-y-4">
                {modalityStats.map((mod, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className={`flex items-center gap-1.5 font-bold ${mod.textColor}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${mod.color}`} />
                        {mod.name}
                      </span>
                      <span className="text-slate-400 font-bold">{mod.count} ({mod.percentage}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${mod.color}`} style={{ width: `${mod.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Fila Inferior: Postulaciones Destacadas */}
      <section className="glass-panel rounded-3xl p-6 border border-slate-850 shadow-2xl relative overflow-hidden">
        <h3 className="text-lg font-bold text-white border-b border-slate-900 pb-4 mb-4 flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400/20" /> Postulaciones con Mayor Valoración
        </h3>
        
        {topRatedApps.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-6 text-center">No has valorado postulaciones con 4 o 5 estrellas todavía.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topRatedApps.map((app) => {
              const val = app.rating || 0;
              const normalizedStage = app.estado_funnel || 'Postulado';
              let stageColor = 'border-slate-800 text-slate-400';
              if (normalizedStage.toLowerCase().includes('entrev') || normalizedStage.toLowerCase().includes('tecnica') || normalizedStage.toLowerCase().includes('técnica')) {
                stageColor = 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400';
              } else if (normalizedStage.toLowerCase().includes('revis')) {
                stageColor = 'border-amber-500/20 bg-amber-500/5 text-amber-400';
              } else if (normalizedStage.toLowerCase().includes('ofer')) {
                stageColor = 'border-emerald-500/35 bg-emerald-500/10 text-emerald-350 animate-pulse';
              }

              return (
                <div key={app.id} className="p-4 bg-slate-950/50 border border-slate-900 hover:border-slate-800 transition-colors rounded-2xl flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded border ${stageColor}`}>
                        {normalizedStage}
                      </span>
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3 h-3 ${star <= val ? 'fill-amber-400 text-amber-400' : 'text-slate-800'}`}
                          />
                        ))}
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-white line-clamp-1">{app.puesto || app.job_title}</h4>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold mt-1">
                      <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{app.company_name}</span>
                    </div>
                  </div>

                  {app.salario_rango && (
                    <div className="text-[10px] font-extrabold text-slate-400 bg-slate-900/60 border border-slate-900 px-2 py-1 rounded-xl self-start">
                      💰 {app.salario_rango}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
};

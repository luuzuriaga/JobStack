import React, { useState, useEffect, useMemo } from 'react';
import { 
  Briefcase, Calendar, Layout, BarChart3, Plus, FileSpreadsheet, ArrowRight, 
  Globe, Award, Sparkles, Lightbulb, Bell, ChevronLeft, ChevronRight, 
  CheckCircle2, ShieldCheck, Target, Clock
} from 'lucide-react';
import type { Application, Portal } from '../types';

interface HomeViewProps {
  onNavigate: (view: 'table' | 'kanban' | 'calendar' | 'analytics' | 'portales') => void;
  onOpenAddModal: () => void;
  onOpenImportModal: () => void;
  applications: Application[];
  portales: Portal[];
  userEmail: string | null;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  onOpenAddModal,
  onOpenImportModal,
  applications,
  portales = [],
  userEmail
}) => {
  // 1. Dynamic Greeting based on current time
  const greeting = useMemo(() => {
    const hours = new Date().getHours();
    if (hours < 12) return '¡Buenos días';
    if (hours < 19) return '¡Buenas tardes';
    return '¡Buenas noches';
  }, []);

  // 2. Quick indicators calculations
  const totalApps = applications.length;
  const activeApps = applications.filter(app => 
    ['en espera', 'entrevista_screening', 'entrevista_tecnica', 'Postulado', 'En revisión', 'Entrevista', 'Prueba Técnica'].includes(app.estado_funnel || '')
  ).length;
  const offers = applications.filter(app => 
    ['oferta', 'Oferta', '¡Oferta! 🎉'].includes(app.estado_funnel || '')
  ).length;

  const upcomingEventsCount = applications.filter(app => {
    if (!app.fecha_seguimiento) return false;
    const todayStr = new Date().toISOString().split('T')[0];
    return app.fecha_seguimiento >= todayStr;
  }).length;

  // 3. Gamified Candidate Progress Score
  const candidateScore = useMemo(() => {
    let score = 0;
    score += totalApps * 4; // 4 pts per application
    score += portales.length * 6; // 6 pts per portal registry
    
    // Extra points for advanced stages
    const advanced = applications.filter(app => {
      const stage = (app.estado_funnel || '').toLowerCase();
      return stage.includes('entrev') || stage.includes('tecn') || stage.includes('revis') || stage.includes('prueb');
    }).length;
    score += advanced * 8;

    // Extra points for offers
    const offerCount = applications.filter(app => {
      const stage = (app.estado_funnel || '').toLowerCase();
      return stage.includes('ofert');
    }).length;
    score += offerCount * 30;

    return Math.min(100, score);
  }, [applications, totalApps, portales.length]);

  const candidateLevel = useMemo(() => {
    if (candidateScore <= 25) {
      return { 
        title: 'Iniciando Búsqueda 🚀', 
        desc: 'Sigue registrando vacantes y configurando tus portales de empleo.',
        color: 'from-sky-500 to-indigo-500',
        textColor: 'text-sky-400'
      };
    }
    if (candidateScore <= 50) {
      return { 
        title: 'Postulante Activo ⚡', 
        desc: '¡Buen ritmo! Estás alimentando tu embudo de manera constante.',
        color: 'from-indigo-500 to-violet-500',
        textColor: 'text-indigo-400'
      };
    }
    if (candidateScore <= 75) {
      return { 
        title: 'Candidato Avanzado 🌟', 
        desc: 'Tienes procesos en revisión y entrevistas en tu agenda. ¡Mantén el foco!',
        color: 'from-violet-500 to-fuchsia-500',
        textColor: 'text-violet-400'
      };
    }
    return { 
      title: 'Líder de Procesos 🏆', 
      desc: 'Nivel óptimo. Estás en la fase final de entrevistas o recibiendo ofertas.',
      color: 'from-emerald-500 to-teal-500',
      textColor: 'text-emerald-400'
    };
  }, [candidateScore]);

  // Next recommended action
  const recommendedAction = useMemo(() => {
    if (portales.length < 3) return 'Registra más portales corporativos para diversificar tus búsquedas.';
    if (totalApps < 5) return 'Agrega más postulaciones para mantener activo tu embudo de conversión.';
    const pendingFollowups = applications.filter(app => !app.fecha_seguimiento && ['Postulado', 'En revisión', 'Entrevista'].includes(app.estado_funnel || ''));
    if (pendingFollowups.length > 0) return 'Configura fechas de próximo paso para dar seguimiento a tus candidaturas.';
    return 'Revisa tu Tablero Kanban para actualizar los estados de tus entrevistas.';
  }, [portales.length, totalApps, applications]);

  // 4. Upcoming events / reminders list
  const upcomingReminders = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return [...applications]
      .filter(app => app.fecha_seguimiento && app.fecha_seguimiento >= todayStr)
      .sort((a, b) => (a.fecha_seguimiento || '').localeCompare(b.fecha_seguimiento || ''))
      .slice(0, 3)
      .map(app => ({
        id: app.id,
        fecha: app.fecha_seguimiento!,
        puesto: app.puesto || app.job_title || 'Puesto vacante',
        empresa: app.company_name,
        accion: app.accion_seguimiento || 'Seguimiento general'
      }));
  }, [applications]);

  // 5. Tips Carousel
  const tips = [
    "Optimiza tu CV para sistemas ATS: Adapta las palabras clave de tu experiencia usando términos exactos del anuncio de la vacante.",
    "En entrevistas técnicas, explica tu proceso de pensamiento en voz alta. Los evaluadores aprecian cómo resuelves problemas tanto como el código final.",
    "Realiza un seguimiento educado por correo a los reclutadores entre 5 y 7 días hábiles después de tu entrevista si no has recibido noticias.",
    "Prepara al menos 3 preguntas inteligentes sobre el producto o la cultura del equipo para hacer al final de cada entrevista laboral.",
    "Mantén tu perfil de LinkedIn actualizado: Asegúrate de tener un título profesional enfocado y redactar tus logros utilizando datos medibles."
  ];
  const [currentTipIdx, setCurrentTipIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIdx(prev => (prev + 1) % tips.length);
    }, 12000);
    return () => clearInterval(interval);
  }, [tips.length]);

  const handleNextTip = () => setCurrentTipIdx(prev => (prev + 1) % tips.length);
  const handlePrevTip = () => setCurrentTipIdx(prev => (prev - 1 + tips.length) % tips.length);

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year.substring(2)}`;
    }
    return dateStr;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* 1. HERO BANNER PREMIUM */}
      <div className="relative overflow-hidden glass-panel rounded-3xl p-6 sm:p-9 border border-slate-900/60 shadow-2xl">
        {/* Glowing overlay */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl pointer-events-none animate-glow-pulse" />
        <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none animate-glow-pulse" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-400 uppercase tracking-widest bg-violet-500/10 px-3.5 py-2 rounded-xl border border-violet-500/15">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" /> Panel de Control
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-none">
              {greeting}, {userEmail?.split('@')[0] || 'Profesional'}! 👋
            </h1>
            <p className="text-slate-400 text-sm sm:text-md leading-relaxed">
              Tu búsqueda de empleo centralizada y estructurada. Organiza tus postulaciones, monitorea tus entrevistas y haz crecer tu tasa de éxito profesional.
            </p>
            
            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <button
                onClick={onOpenAddModal}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-violet-500/20 active:scale-[0.98] transition-all"
              >
                <Plus className="w-4 h-4" /> Registrar Postulación
              </button>
              <button
                onClick={onOpenImportModal}
                className="flex items-center gap-2 px-5 py-3 border border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900/80 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-all active:scale-[0.98]"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Importar CSV
              </button>
            </div>
          </div>

          {/* Quick Statistics Bar inside Hero Banner */}
          <div className="bg-slate-950/60 border border-slate-900/80 rounded-2xl p-5 md:w-80 shrink-0 grid grid-cols-2 gap-4 shadow-inner">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">Total Procesos</span>
              <span className="text-2xl font-black text-white">{totalApps}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">Entrevistas Activas</span>
              <span className="text-2xl font-black text-violet-400">{activeApps}</span>
            </div>
            <div className="space-y-1 border-t border-slate-900 pt-3">
              <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">Ofertas</span>
              <span className="text-2xl font-black text-emerald-400">{offers}</span>
            </div>
            <div className="space-y-1 border-t border-slate-900 pt-3">
              <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">Portales</span>
              <span className="text-2xl font-black text-sky-400">{portales.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. GRID DE ACCESOS DIRECTOS ANIMADOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        
        {/* Card: Tabla */}
        <div 
          onClick={() => onNavigate('table')}
          className="group cursor-pointer glass-panel rounded-2xl p-6 border border-slate-800/80 hover:border-violet-500/30 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-[0_12px_30px_rgba(139,92,246,0.05)] flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-11 h-11 rounded-xl bg-violet-500/10 flex items-center justify-center border border-slate-800/80 group-hover:border-violet-500/20 group-hover:scale-105 transition-all">
                <Briefcase className="w-5 h-5 text-violet-400" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-650 group-hover:text-violet-400 transform group-hover:translate-x-1.5 transition-all" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-violet-300 transition-colors">Lista de Procesos</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">Ver, filtrar y editar todas tus candidaturas en una tabla dinámica.</p>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-900 flex justify-between text-[11px] text-slate-500 font-semibold">
            <span>Total: <span className="text-white">{totalApps}</span></span>
            <span>Activas: <span className="text-violet-450">{activeApps}</span></span>
          </div>
        </div>

        {/* Card: Kanban */}
        <div 
          onClick={() => onNavigate('kanban')}
          className="group cursor-pointer glass-panel rounded-2xl p-6 border border-slate-800/80 hover:border-indigo-500/30 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-[0_12px_30px_rgba(99,102,241,0.05)] flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-11 h-11 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-slate-800/80 group-hover:border-indigo-500/20 group-hover:scale-105 transition-all">
                <Layout className="w-5 h-5 text-indigo-400" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-650 group-hover:text-indigo-400 transform group-hover:translate-x-1.5 transition-all" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">Tablero Kanban</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">Organiza tus postulaciones de forma visual arrastrando tarjetas por fase.</p>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-900 text-[11px] text-slate-550 font-semibold flex justify-between">
            <span>Gestión Visual</span>
            <span className="text-indigo-400">{totalApps} procesos</span>
          </div>
        </div>

        {/* Card: Calendario */}
        <div 
          onClick={() => onNavigate('calendar')}
          className="group cursor-pointer glass-panel rounded-2xl p-6 border border-slate-800/80 hover:border-emerald-500/30 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-[0_12px_30px_rgba(16,185,129,0.05)] flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-slate-800/80 group-hover:border-emerald-500/20 group-hover:scale-105 transition-all">
                <Calendar className="w-5 h-5 text-emerald-400" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-650 group-hover:text-emerald-400 transform group-hover:translate-x-1.5 transition-all" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">Calendario</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">Agenda tus entrevistas técnicas y haz seguimiento de tus fechas límite.</p>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-900 text-[11px] text-slate-550 font-semibold flex justify-between">
            <span>Eventos pendientes</span>
            <span className="text-emerald-400">{upcomingEventsCount} programados</span>
          </div>
        </div>

        {/* Card: Analíticas */}
        <div 
          onClick={() => onNavigate('analytics')}
          className="group cursor-pointer glass-panel rounded-2xl p-6 border border-slate-800/80 hover:border-amber-500/30 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-[0_12px_30px_rgba(245,158,11,0.05)] flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center border border-slate-800/80 group-hover:border-amber-500/20 group-hover:scale-105 transition-all">
                <BarChart3 className="w-5 h-5 text-amber-400" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-650 group-hover:text-amber-400 transform group-hover:translate-x-1.5 transition-all" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">Analíticas</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">Estadísticas completas de tu embudo de conversión y rendimiento.</p>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-900 text-[11px] font-bold text-amber-400 uppercase tracking-widest">
            <span>Ver Métricas Pro 📊</span>
          </div>
        </div>

        {/* Card: Portales */}
        <div 
          onClick={() => onNavigate('portales')}
          className="group cursor-pointer glass-panel rounded-2xl p-6 border border-slate-800/80 hover:border-sky-500/30 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-[0_12px_30px_rgba(14,165,233,0.05)] flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-11 h-11 rounded-xl bg-sky-500/10 flex items-center justify-center border border-slate-800/80 group-hover:border-sky-500/20 group-hover:scale-105 transition-all">
                <Globe className="w-5 h-5 text-sky-400" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-650 group-hover:text-sky-400 transform group-hover:translate-x-1.5 transition-all" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors">Portales de Empleo</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">Directorio de bolsas de trabajo y portales corporativos de registro.</p>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-900 text-[11px] text-slate-550 font-semibold flex justify-between">
            <span>Registrados</span>
            <span className="text-sky-450">{portales.length} portales</span>
          </div>
        </div>

      </div>

      {/* 3. SECCION INTERACTIVA: GAMIFICACION, REMINDER Y TIPS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* A. CARD DE GAMIFICACIÓN: NIVEL DE CANDIDATO */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800/80 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-12 -bottom-12 w-28 h-28 bg-violet-600/5 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500" />
          
          <div className="space-y-4">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <Award className="w-4.5 h-4.5 text-violet-400" /> Tu Nivel de Búsqueda
            </h3>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-semibold">Puntuación de Actividad</span>
                <span className="text-white font-extrabold">{candidateScore} / 100 XP</span>
              </div>
              
              {/* Progress bar */}
              <div className="w-full h-2.5 bg-slate-950 border border-slate-900 rounded-full overflow-hidden p-[1px]">
                <div 
                  className={`h-full rounded-full bg-gradient-to-r ${candidateLevel.color} transition-all duration-1000`}
                  style={{ width: `${candidateScore}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <span className={`text-sm font-black tracking-tight ${candidateLevel.textColor}`}>
                {candidateLevel.title}
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                {candidateLevel.desc}
              </p>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-900 text-[11.5px] bg-slate-950/45 p-3 rounded-xl border border-slate-900/60">
            <span className="font-bold text-slate-400 block mb-0.5 uppercase tracking-wider text-[9px]">Siguiente acción recomendada:</span>
            <p className="text-slate-300 font-medium leading-relaxed">{recommendedAction}</p>
          </div>
        </div>

        {/* B. CARD DE RECORDATORIOS Y PRÓXIMOS EVENTOS */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800/80 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-12 -bottom-12 w-28 h-28 bg-emerald-600/5 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500" />
          
          <div>
            <h3 className="text-md font-bold text-white flex items-center gap-2 mb-4">
              <Bell className="w-4.5 h-4.5 text-emerald-400" /> Próximos Seguimientos
            </h3>
            
            {upcomingReminders.length === 0 ? (
              <div className="py-8 text-center flex flex-col items-center justify-center gap-2.5 opacity-65">
                <Clock className="w-8 h-8 text-slate-550" />
                <p className="text-xs text-slate-350 font-bold">¡Todo al día!</p>
                <p className="text-[10px] text-slate-500 max-w-[200px]">No tienes seguimientos o entrevistas pendientes para hoy.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingReminders.map((reminder, idx) => (
                  <div key={reminder.id} className="p-3 bg-slate-950/45 border border-slate-900/60 rounded-xl hover:border-slate-800 transition-colors flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-black text-emerald-400">{idx + 1}</span>
                    </div>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-xs font-black text-white truncate">{reminder.empresa}</span>
                        <span className="text-[9px] font-extrabold text-emerald-400 shrink-0 bg-emerald-500/5 border border-emerald-500/15 px-1.5 py-0.5 rounded">
                          {formatDate(reminder.fecha)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 font-bold truncate">{reminder.puesto}</p>
                      <p className="text-[10.5px] text-slate-500 truncate leading-none">{reminder.accion}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button 
            onClick={() => onNavigate('calendar')}
            className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors self-start mt-4 flex items-center gap-1 focus:outline-none"
          >
            Ver agenda completa <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* C. CARD DE CONSEJO DEL DÍA / COACH CAROUSEL */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800/80 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-12 -bottom-12 w-28 h-28 bg-amber-600/5 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500" />
          
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-bold text-white flex items-center gap-2">
                <Lightbulb className="w-4.5 h-4.5 text-amber-400" /> Consejos del Coach
              </h3>
              
              {/* Pagination controls */}
              <div className="flex items-center gap-1">
                <button 
                  onClick={handlePrevTip}
                  className="p-1 rounded bg-slate-950 border border-slate-900 hover:border-slate-800 text-slate-400 hover:text-white transition-all focus:outline-none"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={handleNextTip}
                  className="p-1 rounded bg-slate-950 border border-slate-900 hover:border-slate-800 text-slate-400 hover:text-white transition-all focus:outline-none"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="bg-slate-950/45 p-4 rounded-xl border border-slate-900/60 min-h-[110px] flex items-center shadow-inner transition-all duration-300">
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed italic">
                "{tips[currentTipIdx]}"
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-500 mt-4">
            <span>Consejo {currentTipIdx + 1} de {tips.length}</span>
            <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Buenas prácticas</span>
          </div>
        </div>

      </div>
    </div>
  );
};

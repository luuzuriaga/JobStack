import React, { useState, useMemo } from 'react';
import type { Application } from '../types';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Sparkles, Building, 
  ExternalLink, Edit2, Info, ArrowLeft, Filter, AlertCircle, Clock,
  Plus, CheckCircle, ArrowRight, Bookmark, X, PlusCircle, Link, Briefcase, Eye
} from 'lucide-react';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';

interface CalendarViewProps {
  applications: Application[];
  onRefresh: () => void;
  onEdit: (app: Application) => void;
  userId: string;
  onNavigate: (view: 'home' | 'table' | 'kanban' | 'calendar' | 'analytics') => void;
}

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAYS_ES_SUNDAY_FIRST = ['Dom', 'Lun', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];

// Mapeo dinámico y consistente de Fases Funnel a clases de Tailwind (Fondo, Borde, Texto, Dot)
const FUNNEL_STYLES: Record<string, { badge: string; sidebarDot: string; text: string; border: string }> = {
  'Postulado': {
    badge: 'border border-violet-500/40 bg-violet-500/25 text-violet-200 hover:bg-violet-500/35 hover:text-violet-100 transition-all font-extrabold',
    sidebarDot: 'bg-violet-500',
    text: 'text-violet-400',
    border: 'border-violet-500 bg-violet-600/15 text-violet-400'
  },
  'En revisión': {
    badge: 'border border-amber-500/45 bg-amber-500/25 text-amber-200 hover:bg-amber-500/35 hover:text-amber-100 transition-all font-extrabold',
    sidebarDot: 'bg-amber-500',
    text: 'text-amber-400',
    border: 'border-amber-500 bg-amber-600/15 text-amber-400'
  },
  'Prueba Técnica': {
    badge: 'border border-emerald-500/45 bg-emerald-500/25 text-emerald-200 hover:bg-emerald-500/35 hover:text-emerald-100 transition-all font-extrabold',
    sidebarDot: 'bg-emerald-500',
    text: 'text-emerald-400',
    border: 'border-emerald-500 bg-emerald-600/15 text-emerald-400'
  },
  'Entrevista': {
    badge: 'border border-emerald-500/45 bg-emerald-500/25 text-emerald-200 hover:bg-emerald-500/35 hover:text-emerald-100 transition-all font-extrabold',
    sidebarDot: 'bg-emerald-500',
    text: 'text-emerald-400',
    border: 'border-emerald-500 bg-emerald-600/15 text-emerald-400'
  },
  'Oferta': {
    badge: 'border border-emerald-500/50 bg-emerald-500/30 text-emerald-100 font-black tracking-wide hover:bg-emerald-500/40 hover:text-white shadow-md shadow-emerald-500/10 transition-all animate-pulse',
    sidebarDot: 'bg-emerald-400 animate-pulse',
    text: 'text-emerald-400',
    border: 'border-emerald-500/50 bg-emerald-600/20 text-emerald-350'
  },
  'Cerrado/Rechazado': {
    badge: 'border border-rose-500/45 bg-rose-500/25 text-rose-200 hover:bg-rose-500/35 hover:text-rose-100 transition-all font-extrabold',
    sidebarDot: 'bg-rose-500',
    text: 'text-rose-450',
    border: 'border-rose-500 bg-rose-650/15 text-rose-450'
  }
};


// Formatear fechas en formato DD/MM/AA
const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '';
  const dateOnly = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0];
  const parts = dateOnly.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    const shortYear = year.substring(2);
    return `${day}/${month}/${shortYear}`;
  }
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });
};

export const CalendarView: React.FC<CalendarViewProps> = ({
  applications,
  onRefresh,
  onEdit,
  userId,
  onNavigate
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  // Fecha seleccionada para ver detalles
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDayStr, setSelectedDayStr] = useState<string | null>(null);
  
  // Filtros de eventos por plataforma y etapa
  const [selectedPortals, setSelectedPortals] = useState<string[]>(['LinkedIn', 'Indeed', 'Computrabajo', 'Bolsa Interna', 'Otros']);
  const [selectedStages, setSelectedStages] = useState<string[]>(['Postulado', 'En revisión', 'Entrevista', 'Prueba Técnica', 'Oferta', 'Cerrado/Rechazado']);
  
  // Filtros de tipo de evento para evitar ReferenceError y añadir más interactividad
  const [showApplied, setShowApplied] = useState(true);
  const [showFollowups, setShowFollowups] = useState(true);

  // Año y mes activos
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Función para obtener solo la parte YYYY-MM-DD de una fecha
  const getOnlyDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0];
  };

  // Determinar portal de empleo simplificado
  const getPortalLabel = (app: Application): string => {
    const portal = app.portal || app.plataforma || '';
    const lower = portal.toLowerCase();
    if (lower.includes('linkedin')) return 'LinkedIn';
    if (lower.includes('indeed')) return 'Indeed';
    if (lower.includes('computrabajo')) return 'Computrabajo';
    if (lower.includes('interna') || lower.includes('bolsa')) return 'Bolsa Interna';
    return 'Otros';
  };

  // Determinar etapa simplificada del funnel para filtros y mapeos
  const getStageLabel = (app: Application): string => {
    const stage = app.estado_funnel || '';
    const lower = stage.toLowerCase();
    if (lower === 'postulado' || lower === 'en espera') return 'Postulado';
    if (lower === 'en revisión' || lower === 'en revision' || lower === 'screening' || lower === 'entrevista_screening' || lower.includes('revis')) return 'En revisión';
    if (lower === 'prueba técnica' || lower === 'prueba tecnica') return 'Prueba Técnica';
    if (lower === 'entrevista' || lower === 'entrevista_tecnica') return 'Entrevista';
    if (lower === 'oferta') return 'Oferta';
    return 'Cerrado/Rechazado';
  };

  // Mapear todas las postulaciones en eventos asociados a fechas
  const eventsByDate = useMemo(() => {
    const map: Record<string, { type: 'postulacion' | 'seguimiento'; app: Application }[]> = {};

    applications.forEach((app) => {
      const portal = getPortalLabel(app);
      const stage = getStageLabel(app);
      
      // Filtrar postulaciones/eventos según los checkboxes activos de la barra lateral
      if (!selectedPortals.includes(portal)) return;
      if (!selectedStages.includes(stage)) return;

      // 1. Evento de Postulación
      const datePost = getOnlyDate(app.fecha_postulacion || app.fecha_registro);
      if (datePost) {
        if (!map[datePost]) map[datePost] = [];
        map[datePost].push({ type: 'postulacion', app });
      }

      // 2. Evento de Seguimiento / Próximo Paso (Entrevistas/Pruebas)
      const dateSeg = getOnlyDate(app.fecha_seguimiento);
      if (dateSeg) {
        if (!map[dateSeg]) map[dateSeg] = [];
        map[dateSeg].push({ type: 'seguimiento', app });
      }
    });

    return map;
  }, [applications, selectedPortals, selectedStages]);

  // Generar la grilla de días (42 celdas con SUNDAY como primer día)
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const firstDayOfWeek = firstDayOfMonth.getDay(); 

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const grid = [];

    // Relleno del mes anterior
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const prevDay = daysInPrevMonth - i;
      const prevMonthDate = new Date(year, month - 1, prevDay);
      const dateStr = prevMonthDate.toISOString().split('T')[0];
      grid.push({
        dayNumber: prevDay,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr
      });
    }

    // Mes actual
    for (let i = 1; i <= daysInMonth; i++) {
      const currentMonthDate = new Date(year, month, i);
      const yyyy = currentMonthDate.getFullYear();
      const mm = String(currentMonthDate.getMonth() + 1).padStart(2, '0');
      const dd = String(currentMonthDate.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      grid.push({
        dayNumber: i,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr
      });
    }

    // Relleno del mes siguiente
    const remainingCells = 42 - grid.length;
    for (let i = 1; i <= remainingCells; i++) {
      const nextMonthDate = new Date(year, month + 1, i);
      const dateStr = nextMonthDate.toISOString().split('T')[0];
      grid.push({
        dayNumber: i,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr
      });
    }

    return grid;
  }, [year, month, todayStr]);

  // Generar la grilla del Mini Calendario de la izquierda
  const miniCalendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const grid = [];

    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      grid.push({ dayNumber: daysInPrevMonth - i, isCurrentMonth: false, dateStr: new Date(year, month - 1, daysInPrevMonth - i).toISOString().split('T')[0] });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const yyyy = year;
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(i).padStart(2, '0');
      grid.push({ dayNumber: i, isCurrentMonth: true, dateStr: `${yyyy}-${mm}-${dd}` });
    }

    const remaining = 42 - grid.length;
    for (let i = 1; i <= remaining; i++) {
      grid.push({ dayNumber: i, isCurrentMonth: false, dateStr: new Date(year, month + 1, i).toISOString().split('T')[0] });
    }

    return grid;
  }, [year, month]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleGoToToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDayStr(todayStr);
  };

  const activeDayEvents = useMemo(() => {
    if (!selectedDayStr) return [];
    return eventsByDate[selectedDayStr] || [];
  }, [selectedDayStr, eventsByDate]);

  const activeDayFormatted = useMemo(() => {
    if (!selectedDayStr) return '';
    const parts = selectedDayStr.split('-');
    if (parts.length !== 3) return selectedDayStr;
    const [yyyy, mm, dd] = parts;
    const dateObj = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
    const dayName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][dateObj.getDay()];
    const monthName = MONTHS_ES[dateObj.getMonth()];
    return `${dayName}, ${parseInt(dd)} de ${monthName} de ${yyyy}`;
  }, [selectedDayStr]);

  const togglePortal = (portal: string) => {
    if (selectedPortals.includes(portal)) {
      setSelectedPortals(selectedPortals.filter(p => p !== portal));
    } else {
      setSelectedPortals([...selectedPortals, portal]);
    }
  };

  const toggleStage = (stage: string) => {
    if (selectedStages.includes(stage)) {
      setSelectedStages(selectedStages.filter(s => s !== stage));
    } else {
      setSelectedStages([...selectedStages, stage]);
    }
  };

  // Estilo premium para las píldoras de evento basado en el funnel de JobStack
  const getEventBadgeStyle = (ev: { type: 'postulacion' | 'seguimiento'; app: Application }) => {
    const stage = ev.app.estado_funnel || 'Postulado';
    const action = ev.app.accion_seguimiento || '';
    const lower = stage.toLowerCase();
    const lowerAction = action.toLowerCase();
    
    // Si es un evento de seguimiento, priorizar palabras clave como "entrevista" o "prueba técnica"
    if (ev.type === 'seguimiento') {
      if (lowerAction.includes('entrevista') || lowerAction.includes('screening') || lowerAction.includes('llamada') || lowerAction.includes('reunion') || lowerAction.includes('reunión')) {
        return FUNNEL_STYLES['Entrevista'].badge;
      }
      if (lowerAction.includes('prueba') || lowerAction.includes('técnica') || lowerAction.includes('tecnica') || lowerAction.includes('test') || lowerAction.includes('hackerrank') || lowerAction.includes('codility')) {
        return FUNNEL_STYLES['Prueba Técnica'].badge;
      }
      if (lowerAction.includes('oferta') || lowerAction.includes('propuesta') || lowerAction.includes('contrato')) {
        return FUNNEL_STYLES['Oferta'].badge;
      }
    }

    // De lo contrario, mapear dinámicamente al estado correspondiente normalizado
    const normalized = getStageLabel(ev.app);
    const style = FUNNEL_STYLES[normalized];
    return style ? style.badge : FUNNEL_STYLES['Postulado'].badge;
  };

  return (
    <div className="flex bg-slate-950/40 backdrop-blur-md text-slate-100 w-full min-h-[750px] overflow-hidden select-none font-sans border-[0.5px] border-slate-800/35 rounded-3xl relative z-10 shadow-2xl">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 10px;
        }
      `}</style>

      {/* Decorative Orbs inside Calendar */}
      <div className="absolute top-20 right-10 w-[400px] h-[400px] bg-violet-600/5 rounded-full blur-3xl pointer-events-none animate-glow-pulse" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none animate-glow-pulse" style={{ animationDelay: '2s' }} />

      {/* 1. SIDEBAR IZQUIERDA (Estilo Glassmorphism Pro - Mismo que Kanban) */}
      <aside className="w-[245px] bg-slate-950/60 backdrop-blur-md border-r-[0.5px] border-slate-900/30 flex flex-col shrink-0 overflow-y-auto custom-scrollbar select-none relative z-10">
        
        {/* Sidebar Header / Profile */}
        <div className="p-4.5 flex items-center gap-3 border-b-[0.5px] border-slate-900/25 bg-slate-900/10">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center shadow-md shadow-violet-500/10 border border-violet-400/10 shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-extrabold text-white tracking-wider block uppercase -mb-0.5">JobStack</span>
            <span className="text-[10px] text-slate-450 font-semibold uppercase tracking-widest">Calendario</span>
          </div>
        </div>

        {/* Mini Calendar Section */}
        <div className="p-4 border-b-[0.5px] border-slate-900/25">
          <div className="flex justify-between items-center mb-3.5 px-0.5">
            <span className="text-[11px] font-extrabold text-slate-200 tracking-wide uppercase">
              {MONTHS_ES[month]} {year}
            </span>
            <div className="flex gap-1 bg-slate-950/40 p-0.5 rounded-lg border border-slate-850">
              <button onClick={handlePrevMonth} className="text-slate-450 hover:text-white p-1 rounded-md hover:bg-slate-900 transition-all focus:outline-none">
                <ChevronLeft className="w-3 h-3" />
              </button>
              <button onClick={handleNextMonth} className="text-slate-450 hover:text-white p-1 rounded-md hover:bg-slate-900 transition-all focus:outline-none">
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div 
            style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}
            className="text-center text-[9px] font-black text-slate-500 mb-2 uppercase tracking-widest"
          >
            {DAYS_ES_SUNDAY_FIRST.map(d => (
              <span key={d}>{d.slice(0, 2)}</span>
            ))}
          </div>
          
          <div 
            style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}
            className="text-center text-[10.5px] gap-y-1 font-medium text-slate-300"
          >
            {miniCalendarDays.map((cell, idx) => {
              const isTodayCell = cell.dateStr === todayStr;
              const hasEventsOnCell = eventsByDate[cell.dateStr]?.length > 0;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentDate(new Date(cell.dateStr));
                    setSelectedDayStr(cell.dateStr);
                  }}
                  className={`w-6 h-6 flex items-center justify-center rounded-lg mx-auto transition-all focus:outline-none relative text-xs font-semibold ${
                    !cell.isCurrentMonth ? 'text-slate-650' : 'text-slate-200'
                  } ${
                    isTodayCell 
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-extrabold shadow-md shadow-violet-500/25 border border-violet-400/20' 
                      : 'hover:bg-slate-800/40 hover:text-white'
                  }`}
                >
                  {cell.dayNumber}
                  {hasEventsOnCell && !isTodayCell && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-violet-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation / Filter Sections */}
        <nav className="flex-1 space-y-5 p-3.5">
          
          {/* Programación Section */}
          <div className="space-y-1">
            <button 
              onClick={() => onNavigate('calendar')}
              className="w-full flex items-center gap-3 bg-slate-900/60 text-white border-l-4 border-violet-500 px-3 py-2 transition-all hover:bg-slate-900/90 rounded-r-xl cursor-pointer text-left focus:outline-none shadow-sm"
            >
              <CalendarIcon className="w-4 h-4 text-violet-400" />
              <span className="text-xs font-bold flex-1">Calendario Principal</span>
              <Eye className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
            </button>
          </div>

          {/* Mostrar Eventos Section */}
          <div className="space-y-2">
            <div className="px-1 py-0.5">
              <span className="text-[9.5px] font-black text-slate-500 uppercase tracking-widest">Ver Eventos</span>
            </div>
            <button
              onClick={() => setShowApplied(!showApplied)}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-900/30 text-slate-350 hover:text-white transition-all rounded-xl cursor-pointer text-left focus:outline-none"
            >
              <div className={`w-3.5 h-3.5 border border-slate-850 rounded-md shrink-0 flex items-center justify-center bg-slate-950 transition-all ${
                showApplied ? 'border-violet-500 bg-violet-650/15' : ''
              }`}>
                {showApplied && (
                  <span className="text-[9px] text-violet-400 font-black">✓</span>
                )}
              </div>
              <span className="text-xs font-semibold truncate flex-1">📬 Postulaciones</span>
            </button>
            <button
              onClick={() => setShowFollowups(!showFollowups)}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-900/30 text-slate-350 hover:text-white transition-all rounded-xl cursor-pointer text-left focus:outline-none"
            >
              <div className={`w-3.5 h-3.5 border border-slate-850 rounded-md shrink-0 flex items-center justify-center bg-slate-950 transition-all ${
                showFollowups ? 'border-violet-500 bg-violet-650/15' : ''
              }`}>
                {showFollowups && (
                  <span className="text-[9px] text-violet-400 font-black">✓</span>
                )}
              </div>
              <span className="text-xs font-semibold truncate flex-1">📞 Entrevistas / Seg.</span>
            </button>
          </div>

          {/* Calendar Portals Accounts */}
          <div className="space-y-2">
            <div className="px-1 py-0.5 flex items-center justify-between">
              <span className="text-[9.5px] font-black text-slate-500 uppercase tracking-widest">Portales</span>
            </div>

            {[
              { name: 'LinkedIn', color: 'bg-sky-400' },
              { name: 'Indeed', color: 'bg-emerald-400' },
              { name: 'Computrabajo', color: 'bg-amber-400' },
              { name: 'Bolsa Interna', color: 'bg-purple-400' },
              { name: 'Otros', color: 'bg-slate-400' }
            ].map(portal => (
              <button
                key={portal.name}
                onClick={() => togglePortal(portal.name)}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-900/30 text-slate-350 hover:text-white transition-all rounded-xl cursor-pointer text-left focus:outline-none"
              >
                <div className={`w-3.5 h-3.5 rounded-md shrink-0 border border-slate-800 bg-slate-950 flex items-center justify-center transition-all ${
                  selectedPortals.includes(portal.name) ? 'border-violet-500 bg-violet-600/10' : ''
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${portal.color}`} />
                </div>
                <span className="text-xs font-semibold truncate flex-1">{portal.name}</span>
              </button>
            ))}
          </div>

          {/* Databases / Funnel Stages */}
          <div className="space-y-2">
            <div className="px-1 py-0.5">
              <span className="text-[9.5px] font-black text-slate-500 uppercase tracking-widest">Fases Funnel</span>
            </div>
            
            {Object.keys(FUNNEL_STYLES).map(stageKey => {
              const stage = FUNNEL_STYLES[stageKey];
              const isSelected = selectedStages.includes(stageKey);
              return (
                <button
                  key={stageKey}
                  onClick={() => toggleStage(stageKey)}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-900/30 text-slate-350 hover:text-white transition-all rounded-xl cursor-pointer text-left focus:outline-none"
                >
                  <div className={`w-3.5 h-3.5 border rounded-md shrink-0 flex items-center justify-center bg-slate-950 transition-all ${
                    isSelected ? stage.border : 'border-slate-800'
                  }`}>
                    {isSelected ? (
                      <span className="text-[9px] font-black">✓</span>
                    ) : (
                      <span className={`w-1.5 h-1.5 rounded-full ${stage.sidebarDot}`} />
                    )}
                  </div>
                  <span className="text-xs font-semibold truncate flex-1">{stageKey}</span>
                </button>
              );
            })}
          </div>

        </nav>

        {/* Footer Actions */}
        <div className="mt-auto border-t-[0.5px] border-slate-900/25 p-3 bg-slate-950/40">
          <button 
            onClick={() => onNavigate('home')}
            className="w-full flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-violet-950/15 to-indigo-950/15 border border-violet-900/35 hover:border-violet-500/40 text-violet-200 hover:text-white transition-all rounded-xl cursor-pointer text-left focus:outline-none shadow-sm shadow-violet-500/5 hover:shadow-violet-500/10 group active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4 text-violet-400 group-hover:-translate-x-0.5 transition-transform shrink-0" />
            <span className="text-[10.5px] font-extrabold uppercase tracking-widest">Volver al Inicio</span>
          </button>
        </div>

      </aside>

      {/* 2. CALENDARIO PRINCIPAL (Derecha) */}
      <main className="flex-1 flex flex-col bg-slate-950 relative overflow-hidden relative z-10">
        
        {/* TopAppBar */}
        <header className="flex justify-between items-center w-full px-6 py-4 bg-slate-950 border-b-[0.5px] border-slate-900/30 shrink-0 select-none relative z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-extrabold text-white tracking-tight font-sans bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              {MONTHS_ES[month]} <span className="text-slate-500 font-normal ml-1">{year}</span>
            </h1>
            <div className="flex items-center bg-slate-900/30 rounded-xl p-0.5 border border-slate-850 shadow-inner">
              <button className="text-violet-400 bg-slate-900 border border-slate-800 rounded-lg px-4 py-1.5 text-xs font-bold shadow-sm">Mes</button>
              <button 
                onClick={handleGoToToday}
                className="text-slate-450 px-4 py-1.5 text-xs font-bold hover:text-white transition-colors focus:outline-none"
              >
                Hoy
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-900/30 border border-slate-850 rounded-xl px-2.5 py-1.5 gap-2.5 shadow-inner">
              <button onClick={handleGoToToday} className="text-slate-400 hover:text-white transition-colors focus:outline-none">
                <span className="text-xs font-extrabold">Ir a hoy</span>
              </button>
              <div className="w-[1px] h-3.5 bg-slate-800 mx-0.5"></div>
              <button onClick={handlePrevMonth} className="text-slate-400 hover:text-white transition-colors focus:outline-none">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={handleNextMonth} className="text-slate-400 hover:text-white transition-colors focus:outline-none">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Calendar Month View */}
        <div className="flex-1 flex flex-col overflow-hidden w-full relative z-10">
          
          {/* Day Labels (Dom, Lun, Mar, Mié, Jue, Vie, Sáb) */}
          <div 
            style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}
            className="border-b-[0.5px] border-slate-900/25 bg-slate-950/20 shrink-0 select-none"
          >
            {DAYS_ES_SUNDAY_FIRST.map((day) => (
              <div 
                key={day} 
                className="py-3 text-center text-xs font-bold uppercase tracking-widest text-slate-500 font-sans"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Grid Container (Replicando gap-1 px y fondo de bordes sutiles slate-900, sin plomo) */}
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)',
              gridTemplateRows: 'repeat(6, 1fr)',
              gap: '1px',
              backgroundColor: '#162238' // Líneas divisoras azul-slate oscuro, delgadas pero perceptibles y elegantes
            }}
            className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950/20 min-h-[500px]"
          >
            {calendarDays.map((cell, idx) => {
              const dayEvents = eventsByDate[cell.dateStr] || [];
              const filteredDayEvents = dayEvents.filter(ev => {
                if (ev.type === 'postulacion' && !showApplied) return false;
                if (ev.type === 'seguimiento' && !showFollowups) return false;
                return true;
              });

              const isToday = cell.dateStr === todayStr;
              const hasEvents = filteredDayEvents.length > 0;

              return (
                <div
                  key={`${cell.dateStr}-${idx}`}
                  onClick={() => {
                    if (hasEvents) {
                      setSelectedDayStr(cell.dateStr);
                    }
                  }}
                  className={`min-h-[105px] h-full p-2.5 flex flex-col justify-between transition-all duration-350 group relative overflow-hidden ${
                    cell.isCurrentMonth 
                      ? 'bg-slate-950/70 hover:bg-slate-900/10' 
                      : 'bg-[#03060f]/45 text-slate-700'
                  } ${
                    isToday 
                      ? 'ring-1 ring-inset ring-violet-500/50 bg-violet-650/10 shadow-lg shadow-violet-500/5' 
                      : ''
                  } ${
                    hasEvents ? 'cursor-pointer hover:bg-slate-900/25' : 'cursor-default'
                  }`}
                >
                  
                  {/* Número de Día y Nombre del mes en el día 1 */}
                  <div className="flex justify-between items-center select-none w-full shrink-0">
                    {cell.dayNumber === 1 && cell.isCurrentMonth ? (
                      <span className="text-[9px] font-black uppercase text-violet-400/80 bg-violet-500/5 border border-violet-500/10 px-1.5 py-0.5 rounded">
                        {MONTHS_ES[month].slice(0, 3)}
                      </span>
                    ) : (
                      <span />
                    )}

                    {isToday ? (
                      <span className="bg-gradient-to-r from-violet-600 to-indigo-650 text-white w-6 h-6 flex items-center justify-center rounded-lg ml-auto text-xs font-black font-sans shadow-lg shadow-violet-500/20 border border-violet-400/20">
                        {cell.dayNumber}
                      </span>
                    ) : (
                      <span className={`text-xs font-bold leading-none w-6 h-6 flex items-center justify-center rounded-lg ${
                        cell.isCurrentMonth ? 'text-slate-350' : 'text-slate-750'
                      }`}>
                        {cell.dayNumber}
                      </span>
                    )}
                  </div>

                  {/* Listado de Eventos (Estructura de Bloque Estilo Obsidian / Notion) */}
                  <div className="flex-grow flex flex-col gap-1.5 justify-start w-full overflow-hidden mt-2 text-[9.5px]">
                    {filteredDayEvents.slice(0, 2).map((ev, evIdx) => {
                      const isPost = ev.type === 'postulacion';
                      const customBadgeClass = getEventBadgeStyle(ev);

                      return (
                        <div
                          key={evIdx}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(ev.app);
                          }}
                          className={`group/item text-[9px] font-bold px-2 py-1.5 rounded-lg w-full flex items-center justify-between transition-all duration-200 cursor-pointer overflow-hidden ${customBadgeClass} hover:brightness-110 hover:scale-[1.01]`}
                          title={`Haz clic para editar esta postulación (${ev.app.company_name})`}
                        >
                          <span className="truncate flex-grow pr-1 font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
                            {isPost ? '📬' : '📞'} {ev.app.company_name} - {ev.app.puesto || ev.app.job_title}
                          </span>
                          <Edit2 className="w-3 h-3 opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0 ml-1" />
                        </div>
                      );
                    })}
                  </div>

                  {/* +X Más (Siempre empujado al final de la celda) */}
                  {filteredDayEvents.length > 2 ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDayStr(cell.dateStr);
                      }}
                      className="text-[9px] text-[#ddb7ff] hover:text-[#f0dbff] font-extrabold uppercase tracking-wider text-left pl-1.5 mt-1 shrink-0 hover:underline focus:outline-none"
                    >
                      + {filteredDayEvents.length - 2} más
                    </button>
                  ) : (
                    // Elemento espaciador invisible para mantener el alto de fila idéntico
                    <div className="h-4 mt-1 shrink-0" />
                  )}

                </div>
              );
            })}
          </div>

        </div>

      </main>

      {/* Modal de Detalle de Eventos para el día seleccionado */}
      <Modal
        isOpen={selectedDayStr !== null}
        onClose={() => setSelectedDayStr(null)}
        title="Eventos del Día"
        maxWidthClass="max-w-lg animate-fade-in"
      >
        {selectedDayStr && (
          <div className="space-y-4 font-sans text-slate-100">
            
            {/* Header del modal con la fecha elegante */}
            <div className="border-b border-slate-900 pb-3 mb-1">
              <span className="text-[9px] uppercase font-black tracking-widest text-violet-400 bg-violet-500/10 px-2.5 py-0.5 rounded-md border border-violet-500/20">
                Detalle del Día
              </span>
              <h4 className="text-sm font-bold text-white mt-1.5">
                {activeDayFormatted}
              </h4>
            </div>

            {/* Listado de eventos del día en tarjetas Pro */}
            <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
              {activeDayEvents.map((ev, idx) => {
                const app = ev.app;
                const isPost = ev.type === 'postulacion';

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all duration-300 hover:border-slate-800 ${
                      isPost 
                        ? 'bg-sky-550/5 border-sky-500/10 text-slate-300' 
                        : 'bg-purple-550/5 border-purple-500/10 text-slate-350'
                    }`}
                  >
                    
                    {/* Fila superior con tags */}
                    <div className="flex items-center justify-between gap-1.5 mb-2.5">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md border tracking-wider ${
                        isPost 
                          ? 'bg-sky-500/15 border-sky-500/35 text-sky-400' 
                          : 'bg-purple-500/20 border-purple-500/35 text-purple-400'
                      }`}>
                        {isPost ? '📬 Aplicación' : '📞 Entrevista / Paso'}
                      </span>
                      
                      <Badge variant="tipo" value={(app.modalidad as any) || (app.tipo as any) || 'remoto'} className="scale-[0.8] origin-right" />
                    </div>

                    {/* Cargo / Job title */}
                    <h5 className="text-sm font-bold text-white truncate" title={app.puesto || app.job_title}>
                      {app.puesto || app.job_title}
                    </h5>

                    {/* Empresa */}
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold mt-1">
                      <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{app.company_name}</span>
                    </div>

                    {/* Acciones de seguimiento si aplica */}
                    {!isPost && app.accion_seguimiento && (
                      <div className="bg-slate-950/60 border border-slate-900 p-2.5 rounded-xl mt-3 text-[10.5px] text-slate-300 leading-normal flex items-start gap-1.5 shadow-inner">
                        <Bookmark className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-extrabold text-[8px] uppercase tracking-wider text-amber-400 block mb-0.5">Acción Requerida:</span>
                          <p className="line-clamp-2">{app.accion_seguimiento}</p>
                        </div>
                      </div>
                    )}

                    {/* Botones */}
                    <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-900/60">
                      {app.vacancy_url && (
                        <a
                          href={app.vacancy_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-slate-450 hover:text-white hover:bg-slate-900/60 transition-colors"
                          title="Ver Oferta"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      
                      <button
                        onClick={() => {
                          setSelectedDayStr(null);
                          onEdit(app);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-violet-400 hover:text-white border border-slate-800 hover:border-slate-700 bg-slate-950/50 hover:bg-slate-900 rounded-xl transition-all"
                      >
                        <Edit2 className="w-3 h-3 text-slate-450" />
                        Editar
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Botón cerrar */}
            <div className="pt-3 border-t border-slate-900 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDayStr(null)}
                className="px-4 py-2 rounded-xl text-slate-450 hover:text-white border border-slate-800 bg-slate-900/50 hover:bg-slate-900/70 text-xs font-bold uppercase tracking-wider transition-all"
              >
                Cerrar
              </button>
            </div>

          </div>
        )}
      </Modal>

    </div>
  );
};

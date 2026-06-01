import React from 'react';
import { Briefcase, Calendar, Layout, BarChart3, Plus, FileSpreadsheet, ArrowRight } from 'lucide-react';
import type { Application } from '../types';

interface HomeViewProps {
  onNavigate: (view: 'table' | 'kanban' | 'calendar' | 'analytics') => void;
  onOpenAddModal: () => void;
  onOpenImportModal: () => void;
  applications: Application[];
  userEmail: string | null;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  onOpenAddModal,
  onOpenImportModal,
  applications,
  userEmail
}) => {
  // Calcular algunas métricas rápidas
  const totalApps = applications.length;
  const activeApps = applications.filter(app => 
    ['en espera', 'entrevista_screening', 'entrevista_tecnica', 'Postulado', 'En revisión', 'Entrevista', 'Prueba Técnica'].includes(app.estado_funnel || '')
  ).length;
  const offers = applications.filter(app => 
    ['oferta', 'Oferta', '¡Oferta! 🎉'].includes(app.estado_funnel || '')
  ).length;

  const upcomingEvents = applications.filter(app => {
    if (!app.fecha_seguimiento) return false;
    const todayStr = new Date().toISOString().split('T')[0];
    return app.fecha_seguimiento >= todayStr;
  }).length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Banner de Bienvenida */}
      <div className="relative overflow-hidden glass-panel rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-800/80 shadow-2xl">
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute -left-20 -bottom-20 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 space-y-4">
          <span className="text-xs font-bold text-violet-400 uppercase tracking-wider bg-violet-500/10 px-3 py-1.5 rounded-full">
            Panel de Inicio
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            ¡Hola de nuevo, {userEmail?.split('@')[0] || 'Profesional'}! 👋
          </h1>
          <p className="text-slate-400 text-sm sm:text-lg max-w-2xl">
            Listo para dar el siguiente paso en tu carrera? Aquí tienes el resumen de tu búsqueda y acceso a todas tus herramientas.
          </p>
          
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-2.5 px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl text-sm font-bold text-white shadow-lg shadow-violet-500/20 active:scale-[0.98] transition-all"
            >
              <Plus className="w-4 h-4 animate-pulse" />
              Nuevo
            </button>
            <button
              onClick={onOpenImportModal}
              className="flex items-center gap-2.5 px-6 sm:px-8 py-2.5 sm:py-3 border border-slate-700 hover:border-slate-600 bg-slate-900/50 hover:bg-slate-900/80 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98]"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Importar CSV
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Accesos Directos */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Acceso a Tabla */}
        <div 
          onClick={() => onNavigate('table')}
          className="group cursor-pointer glass-panel rounded-2xl p-6 border border-slate-800/80 hover:border-violet-500/30 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-violet-500/5"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center border border-slate-800 group-hover:border-violet-500/20 transition-all">
              <Briefcase className="w-5 h-5 text-violet-400" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-violet-400 transform group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors">Lista de Postulaciones</h3>
          <p className="text-sm text-slate-400 mt-1">Ver, filtrar y editar todos tus procesos en una tabla dinámica.</p>
          <div className="mt-4 pt-4 border-t border-slate-850 flex justify-between text-xs text-slate-500">
            <span>Total: <span className="text-white font-semibold">{totalApps}</span></span>
            <span>Activas: <span className="text-violet-400 font-semibold">{activeApps}</span></span>
          </div>
        </div>

        {/* Acceso a Kanban */}
        <div 
          onClick={() => onNavigate('kanban')}
          className="group cursor-pointer glass-panel rounded-2xl p-6 border border-slate-800/80 hover:border-indigo-500/30 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-indigo-500/5"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-slate-800 group-hover:border-indigo-500/20 transition-all">
              <Layout className="w-5 h-5 text-indigo-400" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 transform group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">Tablero Kanban</h3>
          <p className="text-sm text-slate-400 mt-1">Arrastra y suelta tus postulaciones a través de las fases del embudo.</p>
          <div className="mt-4 pt-4 border-t border-slate-850 text-xs text-slate-500 flex justify-between">
            <span>Control visual</span>
            <span className="text-indigo-400 font-semibold">{totalApps} {totalApps === 1 ? 'proceso' : 'procesos'}</span>
          </div>
        </div>

        {/* Acceso a Calendario */}
        <div 
          onClick={() => onNavigate('calendar')}
          className="group cursor-pointer glass-panel rounded-2xl p-6 border border-slate-800/80 hover:border-emerald-500/30 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-emerald-500/5"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-slate-800 group-hover:border-emerald-500/20 transition-all">
              <Calendar className="w-5 h-5 text-emerald-400" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 transform group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">Calendario</h3>
          <p className="text-sm text-slate-400 mt-1">Agenda tus entrevistas y haz seguimiento de tus fechas límite.</p>
          <div className="mt-4 pt-4 border-t border-slate-850 text-xs text-slate-500 flex justify-between">
            <span>Seguimiento de citas</span>
            <span className="text-emerald-400 font-semibold">{upcomingEvents} {upcomingEvents === 1 ? 'evento' : 'eventos'}</span>
          </div>
        </div>

        {/* Acceso a Analíticas */}
        <div 
          onClick={() => onNavigate('analytics')}
          className="group cursor-pointer glass-panel rounded-2xl p-6 border border-slate-800/80 hover:border-amber-500/30 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-amber-500/5"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-slate-800 group-hover:border-amber-500/20 transition-all">
              <BarChart3 className="w-5 h-5 text-amber-400" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-amber-400 transform group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">Analíticas</h3>
          <p className="text-sm text-slate-400 mt-1">Gráficos de conversión y rendimiento de tus portales de empleo.</p>
          <div className="mt-4 pt-4 border-t border-slate-850 flex justify-between text-xs text-slate-500">
            <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px]">Ver Reporte 📊</span>
          </div>
        </div>

      </div>

      {/* Otras Cosas Más (Sección de Consejos o Recordatorios) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Recordatorios rápidos */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-800/80">
          <h3 className="text-lg font-bold text-white mb-4">Consejo del Día para tu Búsqueda</h3>
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-850">
            <p className="text-slate-300 text-sm leading-relaxed">
              "Recuerda hacer seguimiento a las empresas 5 días hábiles después de tu última entrevista si no has recibido respuesta. El interés proactivo demuestra compromiso."
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Basado en mejores prácticas de reclutamiento.</span>
          </div>
        </div>

        {/* Columna Derecha: Estado del software */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800/80">
          <h3 className="text-lg font-bold text-white mb-4">Estado del Sistema</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Base de Datos</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" /> Conectado
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Modo de Cuenta</span>
              <span className="text-violet-400 font-semibold">Cuenta Real</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Versión del Software</span>
              <span className="text-slate-500">MVP 1.2 (Premium)</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

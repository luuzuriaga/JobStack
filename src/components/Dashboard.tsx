import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Application, EstadoFunnel, TipoModalidad } from '../types';
import { StatCards } from './StatCards';
import { JobTable } from './JobTable';
import { KanbanBoard } from './KanbanBoard';
import { CalendarView } from './CalendarView';
import { HomeView } from './HomeView';
import { AnalyticsView } from './AnalyticsView';
import { Modal } from './ui/Modal';
import { JobModal } from './JobModal';
import { CsvImportModal } from './CsvImportModal';
import { LogOut, Plus, Search, Filter, RefreshCw, Sparkles, SlidersHorizontal, Loader2, FileSpreadsheet, Trash2, ArrowLeft, Download, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface DashboardProps {
  user: {
    id: string;
    email?: string;
  };
  onSignOutDemo: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onSignOutDemo }) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de Filtros y Búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFunnel, setFilterFunnel] = useState<string>('todos');

  // Estados del Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Estados de Selección y Borrado en Lote
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  
  const getInitialView = (): 'home' | 'table' | 'kanban' | 'calendar' | 'analytics' => {
    const path = window.location.pathname;
    if (path === '/lista') return 'table';
    if (path === '/kanban') return 'kanban';
    if (path === '/calendario') return 'calendar';
    if (path === '/metricas') return 'analytics';
    return 'home';
  };

  const [currentView, setCurrentView] = useState<'home' | 'table' | 'kanban' | 'calendar' | 'analytics'>(getInitialView());

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/lista') setCurrentView('table');
      else if (path === '/kanban') setCurrentView('kanban');
      else if (path === '/calendario') setCurrentView('calendar');
      else if (path === '/metricas') setCurrentView('analytics');
      else setCurrentView('home');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (view: 'home' | 'table' | 'kanban' | 'calendar' | 'analytics') => {
    let path = '/';
    if (view === 'table') path = '/lista';
    else if (view === 'kanban') path = '/kanban';
    else if (view === 'calendar') path = '/calendario';
    else if (view === 'analytics') path = '/metricas';
    
    window.history.pushState({}, '', path);
    setCurrentView(view);
  };

  // Prefiltrado inicial de datos hermosos para el Modo Demo
  const getInitialDemoData = (): Application[] => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const daysAgo3 = new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0];
    const daysAgo5 = new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0];

    const initialApps: Application[] = [
      {
        id: 'demo-app-1',
        created_at: new Date().toISOString(),
        user_id: 'demo-user-id',
        fecha_registro: today,
        fecha_postulacion: today,
        job_title: 'Desarrollador React Senior',
        puesto: 'Desarrollador React Senior',
        company_name: 'Globant',
        vacancy_url: 'https://globant.com/careers',
        portal: 'LinkedIn',
        tipo: 'remoto',
        ubicacion: 'Remoto / Perú',
        perfil: 'Butcamp',
        postulacion_estado: 'Listo',
        estado_funnel: 'Prueba Técnica',
        salario_rango: '$4k - $5k USD',
        contacto_info: 'Maria Silva (HR)',
        accion_seguimiento: 'Resolver prueba técnica de Hooks',
        fecha_seguimiento: today,
        ultima_actualizacion: today,
        rating: 4,
        tags: 'remoto,react,senior,globant',
        notas_texto: 'Fase técnica programada para mañana. Repasar hooks avanzados, patrones de diseño de React y optimizaciones de renderizado.',
        notas: 'Fase técnica programada para mañana. Repasar hooks avanzados, patrones de diseño de React y optimizaciones de renderizado.',
        cv_visto: true,
        vacante_activa: true,
        empresa_sla: '72h'
      },
      {
        id: 'demo-app-2',
        created_at: new Date().toISOString(),
        user_id: 'demo-user-id',
        fecha_registro: yesterday,
        fecha_postulacion: yesterday,
        job_title: 'Fullstack Developer (Node/React)',
        puesto: 'Fullstack Developer (Node/React)',
        company_name: 'Belcorp',
        vacancy_url: 'https://belcorp.biz/careers',
        portal: 'Indeed',
        tipo: 'hibrido',
        ubicacion: 'Lima, Perú',
        perfil: 'Universidad',
        postulacion_estado: 'Listo',
        estado_funnel: 'En revisión',
        salario_rango: 'S/. 8,000 - S/. 10,000',
        contacto_info: 'Juan Perez (Tech Lead)',
        accion_seguimiento: 'Esperar feedback de CV',
        fecha_seguimiento: '',
        ultima_actualizacion: yesterday,
        rating: 3,
        tags: 'hibrido,node,react,lima',
        notas_texto: 'CV enviado. Esperando respuesta para screening inicial.',
        notas: 'CV enviado. Esperando respuesta para screening inicial.',
        cv_visto: false,
        vacante_activa: true,
        empresa_sla: '2 semanas'
      },
      {
        id: 'demo-app-3',
        created_at: new Date().toISOString(),
        user_id: 'demo-user-id',
        fecha_registro: daysAgo3,
        fecha_postulacion: daysAgo3,
        job_title: 'Frontend Engineer',
        puesto: 'Frontend Engineer',
        company_name: 'Mercado Libre',
        vacancy_url: 'https://careers.mercadolibre.com',
        portal: 'Computrabajo',
        tipo: 'remoto',
        ubicacion: 'Remoto / Perú',
        perfil: 'Universidad',
        postulacion_estado: 'Listo',
        estado_funnel: 'Oferta',
        salario_rango: '$5k - $6.5k USD',
        contacto_info: 'Recruiting Team Meli',
        accion_seguimiento: 'Firmar carta oferta',
        fecha_seguimiento: today,
        ultima_actualizacion: today,
        rating: 5,
        tags: 'remoto,oferta,meli,frontend',
        notas_texto: '¡OFERTA RECIBIDA! 🌟 Revisando los términos contractuales y el paquete de compensación antes de firmar.',
        notas: '¡OFERTA RECIBIDA! 🌟 Revisando los términos contractuales y el paquete de compensación antes de firmar.',
        cv_visto: true,
        vacante_activa: true,
        empresa_sla: 'Listo'
      },
      {
        id: 'demo-app-4',
        created_at: new Date().toISOString(),
        user_id: 'demo-user-id',
        fecha_registro: daysAgo5,
        fecha_postulacion: daysAgo5,
        job_title: 'Software Developer',
        puesto: 'Software Developer',
        company_name: 'Interbank',
        vacancy_url: '',
        portal: 'Bolsa Interna',
        tipo: 'presencial',
        ubicacion: 'San Isidro, Lima',
        perfil: 'Butcamp',
        postulacion_estado: 'Listo',
        estado_funnel: 'Rechazado',
        salario_rango: 'S/. 6,000',
        contacto_info: 'Bolsa de Trabajo',
        accion_seguimiento: '',
        fecha_seguimiento: '',
        ultima_actualizacion: daysAgo5,
        rating: 2,
        tags: 'presencial,interbank,lima',
        notas_texto: 'Decidieron avanzar con otro perfil que contaba con más experiencia en Kubernetes. Buen feedback en la parte técnica.',
        notas: 'Decidieron avanzar con otro perfil que contaba con más experiencia en Kubernetes. Buen feedback en la parte técnica.',
        cv_visto: true,
        vacante_activa: false,
        empresa_sla: 'Cerrado'
      }
    ];
    
    localStorage.setItem('jobstack_demo_applications', JSON.stringify(initialApps));
    return initialApps;
  };

  // Fetch de postulaciones de la base de datos o LocalStorage
  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      if (user.id === 'demo-user-id') {
        const localData = localStorage.getItem('jobstack_demo_applications');
        if (localData) {
          const parsed = JSON.parse(localData);
          setApplications(parsed.map((item: any) => ({
            ...item,
            id: String(item.id || item.id_postulacion || Math.random().toString(36).substring(2, 9))
          })));
        } else {
          setApplications(getInitialDemoData());
        }
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', user.id)
        .order('fecha_registro', { ascending: false });

      if (error) throw error;
      
      // Los datos ya vienen en el formato correcto desde la BD
      const mappedData = (data || []).map((item: any) => ({
        ...item,
        id: String(item.id)
      }));

      setApplications(mappedData);
    } catch (err) {
      console.error('Error cargando postulaciones:', err);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleSignOut = () => {
    setShowSignOutConfirm(true);
  };

  const executeSignOut = async () => {
    if (user.id === 'demo-user-id') {
      onSignOutDemo();
      return;
    }
    await supabase.auth.signOut();
  };

  const handleOpenAddModal = () => {
    setEditingApplication(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (app: Application) => {
    setEditingApplication(app);
    setIsModalOpen(true);
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setShowBulkDeleteConfirm(true);
  };

  const executeBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      if (user.id === 'demo-user-id') {
        const localData = localStorage.getItem('jobstack_demo_applications');
        let apps: any[] = localData ? JSON.parse(localData) : [];
        apps = apps.filter(app => !selectedIds.includes(app.id));
        localStorage.setItem('jobstack_demo_applications', JSON.stringify(apps));
        setSelectedIds([]);
        setIsSelectionMode(false);
        fetchApplications();
        return;
      }

      const { error } = await supabase
        .from('applications')
        .delete()
        .in('id', selectedIds);

      if (error) throw error;
      setSelectedIds([]);
      setIsSelectionMode(false);
      fetchApplications();
    } catch (err) {
      console.error('Error al borrar en lote:', err);
      alert('Ocurrió un error al intentar eliminar las postulaciones.');
    } finally {
      setIsBulkDeleting(false);
      setShowBulkDeleteConfirm(false);
    }
  };

  // Filtrar postulaciones en memoria para interactividad instantánea
  const filteredApplications = applications.filter((app) => {
    const matchesSearch = 
      (app.puesto && app.puesto.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (app.company_name && app.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (app.portal && app.portal.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFunnel = filterFunnel === 'todos' || app.estado_funnel === filterFunnel;

    return matchesSearch && matchesFunnel;
  });

  const handleExportToExcel = () => {
    if (filteredApplications.length === 0) {
      alert('No hay postulaciones para exportar.');
      return;
    }

    const headers = [
      'Fecha',
      'Empresa',
      'Puesto',
      'Modalidad',
      'Estado',
      'Salario',
      'Contacto',
      'Próximo Paso',
      'Fecha Próximo Paso',
      'Link',
      'Valoración',
      'Tags',
      'Ubicación',
      'Notas',
      'Última Actualización'
    ];

    const data = filteredApplications.map(app => ({
      'Fecha': app.fecha_postulacion || app.fecha_registro || app.created_at?.split('T')[0] || '',
      'Empresa': app.company_name || '',
      'Puesto': app.puesto || app.job_title || '',
      'Modalidad': app.tipo || app.modalidad || 'remoto',
      'Estado': app.estado_funnel || 'Postulado',
      'Salario': app.salario_rango || '',
      'Contacto': app.contacto_info || '',
      'Próximo Paso': app.accion_seguimiento || '',
      'Fecha Próximo Paso': app.fecha_seguimiento || '',
      'Link': app.vacancy_url || app.url_vacante || '',
      'Valoración': app.rating || 0,
      'Tags': app.tags || '',
      'Ubicación': app.ubicacion || '',
      'Notas': app.notas || app.notas_texto || '',
      'Última Actualización': app.ultima_actualizacion || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Postulaciones');

    // Auto-ajustar ancho de las columnas
    const objectMaxWidth: number[] = [];
    headers.forEach((header) => {
      objectMaxWidth.push(header.length + 4);
    });
    
    data.forEach((row: any) => {
      headers.forEach((header, i) => {
        const val = row[header];
        const valLength = val ? String(val).length : 0;
        if (valLength + 2 > objectMaxWidth[i]) {
          objectMaxWidth[i] = valLength + 2;
        }
      });
    });

    worksheet['!cols'] = objectMaxWidth.map(w => ({ wch: Math.min(50, w) }));

    XLSX.writeFile(workbook, `jobstack_postulaciones_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative pb-16">
      
      {/* Decorative Orbs */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-3xl pointer-events-none animate-glow-pulse" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none animate-glow-pulse" style={{ animationDelay: '2s' }} />

      {/* Header Fijo Premium */}
      <header className="sticky top-0 z-30 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-900 shadow-md">
        <div className="max-w-[98%] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2.5 hover:opacity-90 active:scale-[0.98] transition-all focus:outline-none text-left cursor-pointer group"
            title="Refrescar página"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center shadow-md shadow-violet-500/10 border border-violet-400/10 group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <span className="text-md font-bold tracking-tight text-white block">JobStack</span>
              <span className="text-[10px] text-slate-400 block -mt-1 font-medium uppercase tracking-wider">Funnel Tracker</span>
            </div>
          </button>

          {/* User & Sign Out */}
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-xs text-slate-400 font-medium">
              Usuario: <span className="text-slate-200 font-semibold">{user.email}</span>
            </span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-800 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-900/60 hover:border-slate-700 transition-all font-semibold"
            >
              <LogOut className="w-3.5 h-3.5" />
              Cerrar Sesión
            </button>
          </div>

        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-[98%] mx-auto px-4 sm:px-6 lg:px-8 pt-8 w-full space-y-8">
        {currentView === 'home' && (
          <HomeView 
            onNavigate={handleNavigate}
            onOpenAddModal={handleOpenAddModal}
            onOpenImportModal={() => setIsImportOpen(true)}
            applications={applications}
            userEmail={user.email || null}
          />
        )}

        {currentView === 'table' && (
          <>
            {/* Banner de Presentación */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <button 
                    onClick={() => handleNavigate('home')}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 mb-2"
                  >
                    <ArrowLeft className="w-3 h-3" /> Volver al Inicio
                  </button>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                    Panel de Control
                  </h2>
                  <p className="text-slate-400 text-sm mt-1 hidden sm:block">
                    Visualiza, filtra y actualiza el embudo de tus postulaciones laborales en tiempo real.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={fetchApplications}
                  className="p-2.5 border border-slate-850 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-all"
                  title="Refrescar datos"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-violet-400' : ''}`} />
                </button>

                {applications.length > 0 && (
                  <button
                    onClick={() => {
                      if (!isSelectionMode) {
                        setIsSelectionMode(true);
                      } else if (selectedIds.length > 0) {
                        handleBulkDelete();
                      } else {
                        setIsSelectionMode(false);
                      }
                    }}
                    disabled={isBulkDeleting}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50 ${
                      isSelectionMode 
                        ? selectedIds.length > 0
                          ? 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300'
                          : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300'
                        : 'border border-slate-800 hover:border-slate-700 bg-slate-900/30 hover:bg-slate-900/60 text-slate-350 hover:text-white'
                    }`}
                    title={isSelectionMode ? (selectedIds.length > 0 ? "Eliminar seleccionados" : "Cancelar selección") : "Seleccionar para borrar"}
                  >
                    {isBulkDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">
                      {!isSelectionMode 
                        ? 'Borrar' 
                        : selectedIds.length > 0 
                          ? `Borrar (${selectedIds.length})` 
                          : 'Cancelar'
                      }
                    </span>
                  </button>
                )}

                <button
                  onClick={() => setIsImportOpen(true)}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 border border-slate-800 hover:border-slate-700 bg-slate-900/30 hover:bg-slate-900/60 rounded-xl text-sm font-semibold text-slate-355 hover:text-white transition-all active:scale-[0.98]"
                >
                  <FileSpreadsheet className="w-4 h-4 text-violet-400" />
                  <span className="hidden sm:inline">Importar CSV</span>
                  <span className="sm:hidden">CSV</span>
                </button>

                <button
                  onClick={handleExportToExcel}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 border border-slate-800 hover:border-slate-700 bg-slate-900/30 hover:bg-slate-900/60 rounded-xl text-sm font-semibold text-slate-355 hover:text-white transition-all active:scale-[0.98]"
                  title="Exportar lista actual a Excel"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline">Exportar Excel</span>
                  <span className="sm:hidden">Excel</span>
                </button>

                <button
                  onClick={handleOpenAddModal}
                  className="flex items-center gap-2.5 px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl text-sm font-bold text-white shadow-lg shadow-violet-500/10 active:scale-[0.98] transition-all ml-auto"
                >
                  <Plus className="w-4 h-4 animate-pulse" />
                  Nuevo
                </button>
              </div>
            </div>

            {/* Tarjetas de Indicadores */}
            <StatCards applications={applications} />

            {/* Barra de Filtros y Búsqueda */}
            <div className="glass-panel rounded-2xl p-4 border border-slate-800/80 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              
              {/* Campo de búsqueda */}
              <div className="flex-1 relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Search className="w-4.5 h-4.5" />
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-850 rounded-xl pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1.5 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm"
                  placeholder="Buscar por puesto, empresa, portal..."
                />
              </div>

              {/* Filtros Dropdown */}
              <div className="flex flex-wrap items-center gap-3">
                
                {/* Filtro por estado del funnel */}
                <div className="flex items-center gap-2 bg-slate-950/40 border border-slate-850 px-3 py-1.5 rounded-xl">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Embudo:</label>
                  <select
                    value={filterFunnel}
                    onChange={(e) => setFilterFunnel(e.target.value as any)}
                    className="bg-transparent text-white text-xs focus:outline-none cursor-pointer pr-1"
                  >
                    <option value="todos" className="bg-slate-950 text-slate-300">Todos</option>
                    <option value="Postulado" className="bg-slate-950 text-slate-300">Postulado</option>
                    <option value="En revisión" className="bg-slate-950 text-slate-300">En revisión</option>
                    <option value="Entrevista" className="bg-slate-950 text-slate-300">Entrevista</option>
                    <option value="Prueba Técnica" className="bg-slate-950 text-slate-300">Prueba Técnica</option>
                    <option value="Rechazado" className="bg-slate-950 text-slate-300">Rechazado</option>
                    <option value="Oferta" className="bg-slate-950 text-slate-300">Oferta</option>
                    <option value="Cerrado" className="bg-slate-950 text-slate-300">Cerrado</option>
                  </select>
                </div>

              </div>
            </div>

            {/* Tabla Notion-style */}
            {loading && applications.length === 0 ? (
              <div className="w-full h-64 flex flex-col items-center justify-center gap-3 glass-panel rounded-2xl border border-slate-800">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                <span className="text-slate-400 text-sm font-medium">Sincronizando con Supabase...</span>
              </div>
            ) : (
              <JobTable
                applications={filteredApplications}
                onRefresh={fetchApplications}
                onEdit={handleOpenEditModal}
                userId={user.id}
                selectedIds={selectedIds}
                onSelectedIdsChange={setSelectedIds}
                onBulkDelete={handleBulkDelete}
                isBulkDeleting={isBulkDeleting}
                isSelectionMode={isSelectionMode}
              />
            )}
          </>
        )} 

        {currentView === 'kanban' && (
          <KanbanBoard
            applications={filteredApplications}
            onRefresh={fetchApplications}
            onEdit={handleOpenEditModal}
            userId={user.id}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'calendar' && (
          <CalendarView
            applications={filteredApplications}
            onRefresh={fetchApplications}
            onEdit={handleOpenEditModal}
            userId={user.id}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'analytics' && (
          <AnalyticsView
            applications={applications}
            onNavigate={handleNavigate}
          />
        )}

      </main>

      {/* Modal Añadir / Editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingApplication ? 'Editar Postulación Laboral' : 'Registrar Nueva Postulación'}
        maxWidthClass="max-w-2xl animate-fade-in"
        scrollable={false}
      >
        <JobModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchApplications}
          userId={user.id}
          applicationToEdit={editingApplication}
        />
      </Modal>

      {/* Modal Importar CSV */}
      <CsvImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onRefresh={fetchApplications}
        userId={user.id}
      />

      {/* Modal de Confirmación de Borrado en Lote */}
      <Modal
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        title="Confirmar Eliminación en Bloque"
        maxWidthClass="max-w-[360px]"
      >
        <div className="space-y-4 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/5">
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div className="space-y-1">
            <p className="text-slate-250 text-sm font-semibold leading-normal">
              ¿Eliminar las <span className="text-white font-extrabold">{selectedIds.length}</span> postulaciones seleccionadas?
            </p>
            <p className="text-xs text-slate-500 font-medium">
              Esta acción no se puede deshacer.
            </p>
          </div>

          <div className="flex w-full gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowBulkDeleteConfirm(false)}
              className="flex-1 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white border border-slate-800 hover:border-slate-750 bg-slate-900/40 hover:bg-slate-900/60 text-xs font-bold uppercase tracking-wider transition-all"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={executeBulkDelete}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-500/10 hover:shadow-red-500/20 active:scale-[0.98] border border-red-500/20 transition-all"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Confirmación de Cerrar Sesión */}
      <Modal
        isOpen={showSignOutConfirm}
        onClose={() => setShowSignOutConfirm(false)}
        title="Cerrar Sesión"
        maxWidthClass="max-w-[360px]"
      >
        <div className="space-y-4 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-violet-500/10 border border-violet-500/30 text-violet-400 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/5">
            <LogOut className="w-5 h-5" />
          </div>

          <div className="space-y-1">
            <p className="text-slate-350 text-sm leading-relaxed font-medium">
              ¿Estás seguro de que deseas cerrar sesión?
            </p>
            <p className="text-xs text-slate-500">
              Tendrás que volver a ingresar tus credenciales para acceder a tu JobStack.
            </p>
          </div>

          <div className="flex w-full gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowSignOutConfirm(false)}
              className="flex-1 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white border border-slate-800 hover:border-slate-750 bg-slate-900/40 hover:bg-slate-900/60 text-xs font-bold uppercase tracking-wider transition-all"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                executeSignOut();
                setShowSignOutConfirm(false);
              }}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-violet-500/10 hover:shadow-violet-500/20 active:scale-[0.98] border border-violet-500/20 transition-all"
            >
              Salir
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Application, Portal } from '../types';
import { 
  ArrowLeft, Search, Plus, Edit2, Trash2, ExternalLink, Calendar, 
  Globe, Briefcase, CalendarClock, ShieldAlert, Sparkles, Loader2, Link2, Building, Star, AlertTriangle, Mail
} from 'lucide-react';
import { Modal } from './ui/Modal';

interface PortalesViewProps {
  applications: Application[];
  portales: Portal[];
  onSavePortal: (portal: Omit<Portal, 'id' | 'created_at' | 'user_id'> & { id?: string }) => Promise<{ success: boolean; error?: string }>;
  onDeletePortal: (id: string) => Promise<boolean>;
  onNavigate: (view: 'home' | 'table' | 'kanban' | 'calendar' | 'analytics' | 'portales') => void;
  loading: boolean;
}

export const PortalesView: React.FC<PortalesViewProps> = ({
  applications,
  portales,
  onSavePortal,
  onDeletePortal,
  onNavigate,
  loading
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPortal, setEditingPortal] = useState<Portal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Portal | null>(null);
  
  // Form states
  const [companyName, setCompanyName] = useState('');
  const [rubro, setRubro] = useState('');
  const [link, setLink] = useState('');
  const [correoRegistro, setCorreoRegistro] = useState('');
  const [fecha, setFecha] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Autocomplete suggestions states
  const [showSuggestions, setShowSuggestions] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Drag-to-Scroll table states
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close autocomplete on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get combined unique companies from job applications AND portals
  const allCompanies = useMemo(() => {
    const companySet = new Set<string>();
    
    // Add companies from applications
    applications.forEach(app => {
      const name = app.company_name || app.puesto; // Fallback to company_name
      if (name && name.trim()) {
        companySet.add(name.trim());
      }
    });

    // Add companies from portals
    portales.forEach(p => {
      if (p.company_name && p.company_name.trim()) {
        companySet.add(p.company_name.trim());
      }
    });

    return Array.from(companySet).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  }, [applications, portales]);

  // Filtered companies for autocomplete based on input
  const filteredSuggestions = useMemo(() => {
    if (!companyName.trim()) return allCompanies.slice(0, 10); // Show first 10 when empty
    const lowerInput = companyName.toLowerCase();
    return allCompanies.filter(c => c.toLowerCase().includes(lowerInput));
  }, [companyName, allCompanies]);

  // Handle opening modal for new portal
  const handleOpenAddModal = () => {
    setEditingPortal(null);
    setCompanyName('');
    setRubro('');
    setLink('');
    setCorreoRegistro('');
    setFecha(getLocalDateString());
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  // Handle opening modal for editing
  const handleOpenEditModal = (portal: Portal) => {
    setEditingPortal(portal);
    setCompanyName(portal.company_name);
    setRubro(portal.rubro || '');
    setLink(portal.link || '');
    setCorreoRegistro(portal.correo_registro || '');
    setFecha(portal.fecha);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setErrorMsg('El nombre de la empresa o portal es obligatorio.');
      return;
    }

    setFormLoading(true);
    setErrorMsg(null);

    const result = await onSavePortal({
      id: editingPortal?.id,
      company_name: companyName.trim(),
      rubro: rubro.trim() || null,
      link: link.trim() || null,
      correo_registro: correoRegistro.trim() || null,
      fecha: fecha || getLocalDateString()
    });

    setFormLoading(false);
    if (result.success) {
      setIsModalOpen(false);
    } else {
      setErrorMsg(result.error || 'Ocurrió un error al intentar guardar el portal.');
    }
  };

  // Handle execute delete
  const executeDelete = async () => {
    if (!deleteTarget) return;
    const success = await onDeletePortal(deleteTarget.id);
    if (success) {
      setDeleteTarget(null);
    } else {
      alert('Error al intentar eliminar el portal.');
    }
  };

  // Filter portales list based on search term
  const filteredPortales = useMemo(() => {
    return portales.filter(p => {
      const matchSearch = 
        p.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.rubro && p.rubro.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchSearch;
    });
  }, [portales, searchTerm]);

  // Statistics calculations
  const totalPortales = portales.length;
  
  const portalesLastMonth = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return portales.filter(p => {
      const portalDate = new Date(p.fecha);
      return portalDate >= thirtyDaysAgo;
    }).length;
  }, [portales]);

  const rubroPrincipal = useMemo(() => {
    if (portales.length === 0) return 'Ninguno';
    const counts: Record<string, number> = {};
    portales.forEach(p => {
      if (p.rubro) {
        counts[p.rubro] = (counts[p.rubro] || 0) + 1;
      }
    });
    const entries = Object.entries(counts);
    if (entries.length === 0) return 'Sin rubro';
    entries.sort((a, b) => b[1] - a[1]);
    return `${entries[0][0]} (${entries[0][1]} ${entries[0][1] === 1 ? 'portal' : 'portales'})`;
  }, [portales]);

  // Drag-to-scroll logic
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('button') || 
      target.closest('a') || 
      target.closest('input') || 
      target.closest('select') ||
      target.closest('svg')
    ) {
      return;
    }
    setIsMouseDown(true);
    if (containerRef.current) {
      setStartX(e.pageX - containerRef.current.offsetLeft);
      setScrollLeft(containerRef.current.scrollLeft);
    }
  };

  const handleMouseLeave = () => setIsMouseDown(false);
  const handleMouseUp = () => setIsMouseDown(false);
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const dateOnly = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0];
    const parts = dateOnly.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year.substring(2)}`;
    }
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  return (
    <div className="space-y-8 animate-fade-in relative z-10 font-sans select-none pb-12">
      {/* Background decoration */}
      <div className="absolute top-10 right-20 w-[450px] h-[450px] bg-violet-600/5 rounded-full blur-3xl pointer-events-none animate-glow-pulse" />

      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-[0.5px] border-slate-900/35 pb-5">
        <div>
          <button 
            onClick={() => onNavigate('home')}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 mb-2 transition-all focus:outline-none group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> Volver al Inicio
          </button>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Registro de Portales
            <span className="text-[10px] uppercase font-extrabold tracking-widest bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md border border-emerald-500/15 flex items-center gap-1">
              <Globe className="w-3 h-3 text-emerald-400" /> Directorio
            </span>
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Gestiona los sitios de empleo, bolsas de trabajo corporativas y plataformas donde has creado perfiles.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2.5 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white transition-all rounded-xl text-xs font-bold uppercase tracking-wider focus:outline-none shadow-lg shadow-violet-500/10 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" /> Registrar Portal
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* KPI 1: Total Portales */}
        <div className="group relative glass-panel rounded-2xl p-6 flex items-center justify-between overflow-hidden hover:bg-slate-900/80 transition-all duration-300 shadow-xl border border-slate-800/80">
          <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl opacity-40 group-hover:opacity-60" />
          <div className="space-y-2 relative z-10">
            <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Registrados</span>
            <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{totalPortales}</span>
            <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">Portales de Empleo</span>
          </div>
          <div className="relative z-10 w-11 h-11 rounded-lg bg-sky-500/10 flex items-center justify-center border border-sky-500/20 shadow-inner">
            <Globe className="w-5 h-5 text-sky-400" />
          </div>
        </div>

        {/* KPI 2: Recientes */}
        <div className="group relative glass-panel rounded-2xl p-6 flex items-center justify-between overflow-hidden hover:bg-slate-900/80 transition-all duration-300 shadow-xl border border-slate-800/80">
          <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl opacity-40 group-hover:opacity-60" />
          <div className="space-y-2 relative z-10">
            <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Recientes</span>
            <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{portalesLastMonth}</span>
            <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">Creados últ. 30 días</span>
          </div>
          <div className="relative z-10 w-11 h-11 rounded-lg bg-violet-500/10 flex items-center justify-center border border-violet-500/20 shadow-inner">
            <CalendarClock className="w-5 h-5 text-violet-400" />
          </div>
        </div>

        {/* KPI 3: Rubro Principal */}
        <div className="group relative glass-panel rounded-2xl p-6 flex items-center justify-between overflow-hidden hover:bg-slate-900/80 transition-all duration-300 shadow-xl border border-slate-800/80">
          <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl opacity-40 group-hover:opacity-60" />
          <div className="space-y-2 relative z-10">
            <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Rubro Predominante</span>
            <span className="text-lg sm:text-xl font-extrabold text-white tracking-tight line-clamp-1 py-1.5">{rubroPrincipal}</span>
            <span className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">Especialización de empresas</span>
          </div>
          <div className="relative z-10 w-11 h-11 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-inner">
            <Briefcase className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

      </div>

      {/* Buscador */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800/80 flex flex-col md:flex-row items-center gap-3">
        <div className="flex-1 relative w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-550">
            <Search className="w-4.5 h-4.5" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/70 border border-slate-850 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-1.5 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm font-medium"
            placeholder="Buscar por empresa, portal, rubro..."
          />
        </div>
      </div>

      {/* Listado / Tabla */}
      <div className="w-full overflow-hidden glass-panel rounded-2xl border border-slate-800/80 shadow-2xl shadow-slate-950/20">
        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            height: 8px;
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(15, 23, 42, 0.4);
            border-radius: 9999px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(139, 92, 246, 0.5);
            border-radius: 9999px;
            border: 1px solid rgba(139, 92, 246, 0.2);
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(139, 92, 246, 0.75);
          }
          .dragging-active {
            user-select: none !important;
            cursor: grabbing !important;
          }
        `}</style>

        {loading ? (
          <div className="w-full h-64 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            <span className="text-slate-400 text-sm font-medium">Cargando portales...</span>
          </div>
        ) : (
          <div 
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className={`overflow-x-auto overflow-y-auto max-h-[calc(100vh-380px)] min-h-[250px] custom-scrollbar cursor-grab active:cursor-grabbing transition-all ${isMouseDown ? 'dragging-active' : ''}`}
          >
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-sm border-b border-slate-900">
                <tr className="border-b border-slate-800 bg-slate-900/40">
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 w-10 text-center">#</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Empresa / Portal</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Correo Registrado</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Rubro de la Empresa</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Link del Portal</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Fecha de Registro</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {filteredPortales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">
                      No se encontraron portales registrados. ¡Crea uno nuevo arriba! 🚀
                    </td>
                  </tr>
                ) : (
                  filteredPortales.map((portal, idx) => (
                    <tr key={portal.id} className="hover:bg-slate-900/20 transition-all duration-200 group">
                      
                      {/* Número */}
                      <td className="px-5 py-4 w-10 text-center text-xs font-medium text-slate-500">
                        {idx + 1}
                      </td>

                      {/* Empresa */}
                      <td className="px-6 py-4 whitespace-nowrap text-white text-sm font-bold truncate max-w-[180px]" title={portal.company_name}>
                        {portal.company_name}
                      </td>

                      {/* Correo Registrado */}
                      <td className="px-6 py-4 whitespace-nowrap text-slate-350 text-sm font-semibold truncate max-w-[150px]" title={portal.correo_registro || ''}>
                        {portal.correo_registro ? (
                          <span className="flex items-center gap-1.5 text-slate-350">
                            <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            {portal.correo_registro}
                          </span>
                        ) : (
                          <span className="text-slate-650 italic text-xs">Sin correo</span>
                        )}
                      </td>

                      {/* Rubro */}
                      <td className="px-6 py-4 whitespace-nowrap text-slate-300 text-sm">
                        {portal.rubro ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/15">
                            {portal.rubro}
                          </span>
                        ) : (
                          <span className="text-slate-650 italic text-xs">Sin rubro</span>
                        )}
                      </td>

                      {/* Link */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {portal.link ? (
                          <a
                            href={portal.link.startsWith('http') ? portal.link : `https://${portal.link}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-violet-400 hover:text-violet-300 flex items-center gap-1 font-semibold transition-colors text-xs"
                          >
                            Ir al portal <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="text-slate-650 italic text-xs">Sin link</span>
                        )}
                      </td>

                      {/* Fecha */}
                      <td className="px-6 py-4 whitespace-nowrap text-slate-400 text-xs font-medium">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {formatDate(portal.fecha)}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2.5">
                          
                          {/* Editar */}
                          <button
                            onClick={() => handleOpenEditModal(portal)}
                            className="p-1.5 rounded-lg border border-transparent text-slate-400 hover:text-white hover:border-slate-800 hover:bg-slate-900/40 transition-all focus:outline-none"
                            title="Editar portal"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Eliminar */}
                          <button
                            onClick={() => setDeleteTarget(portal)}
                            className="p-1.5 rounded-lg border border-transparent text-slate-400 hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/5 transition-all focus:outline-none"
                            title="Eliminar portal"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Agregar / Editar Portal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPortal ? 'Editar Registro de Portal' : 'Registrar Cuenta en Portal'}
        maxWidthClass="max-w-md"
        scrollable={false}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm animate-slide-up">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Autocomplete Company Name */}
          <div ref={autocompleteRef} className="relative">
            <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Empresa / Portal *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                <Building className="w-4.5 h-4.5" />
              </span>
              <input
                type="text"
                value={companyName}
                onChange={(e) => {
                  setCompanyName(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                required
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-1.5 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm font-semibold"
                placeholder="ej. LinkedIn, Google, Computrabajo"
              />
            </div>

            {/* Floating Suggestions List */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 mt-1.5 bg-slate-900/98 backdrop-blur-xl border border-slate-800 rounded-xl max-h-48 overflow-y-auto z-50 shadow-2xl custom-scrollbar py-1">
                <div className="px-3 py-1 text-[10px] text-slate-500 font-extrabold uppercase tracking-wider border-b border-slate-800/50 mb-1">
                  Sugerencias (Historial y Empresas)
                </div>
                {filteredSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setCompanyName(suggestion);
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-300 hover:text-white hover:bg-violet-600/20 transition-all font-medium flex items-center gap-2"
                  >
                    <Building className="w-3.5 h-3.5 text-slate-500" />
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Correo Registro */}
          <div>
            <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Correo de Registro</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                <Mail className="w-4.5 h-4.5" />
              </span>
              <input
                type="email"
                value={correoRegistro}
                onChange={(e) => setCorreoRegistro(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-1.5 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm font-semibold"
                placeholder="ej. mi_correo@ejemplo.com"
              />
            </div>
          </div>

          {/* Rubro */}
          <div>
            <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Rubro de la Empresa</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                <Briefcase className="w-4.5 h-4.5" />
              </span>
              <input
                type="text"
                value={rubro}
                onChange={(e) => setRubro(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-1.5 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm font-semibold"
                placeholder="ej. Tecnología, Banca, Retail"
              />
            </div>
          </div>

          {/* Link */}
          <div>
            <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Link del Portal / Perfil</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                <Link2 className="w-4.5 h-4.5" />
              </span>
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-1.5 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm font-semibold"
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Fecha de Registro</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                <Calendar className="w-4.5 h-4.5" />
              </span>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white focus:outline-none focus:ring-1.5 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm font-semibold cursor-pointer"
              />
            </div>
          </div>

          {/* Acciones del Formulario */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-800 hover:border-slate-750 text-slate-400 hover:text-white bg-slate-950/30 hover:bg-slate-900/60 text-xs font-bold uppercase tracking-wider transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-violet-500/10 active:scale-[0.98] border border-violet-500/20 transition-all flex items-center justify-center gap-1.5"
            >
              {formLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Confirmar Borrado */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Confirmar Eliminación"
        maxWidthClass="max-w-[360px]"
      >
        {deleteTarget && (
          <div className="space-y-4 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/5">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <p className="text-slate-250 text-sm font-semibold leading-normal">
                ¿Eliminar portal de <span className="text-white font-bold">{deleteTarget.company_name}</span>?
              </p>
              <p className="text-xs text-slate-500 font-medium">
                Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="flex w-full gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white border border-slate-800 hover:border-slate-750 bg-slate-900/40 hover:bg-slate-900/60 text-xs font-bold uppercase tracking-wider transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-500/10 active:scale-[0.98] border border-red-500/20 transition-all"
              >
                Eliminar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Application } from '../types';
import { Badge } from './ui/Badge';
import { Edit2, Trash2, ExternalLink, Calendar, ChevronDown, ChevronUp, Loader2, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Modal } from './ui/Modal';

interface JobTableProps {
  applications: Application[];
  onRefresh: () => void;
  onEdit: (app: Application) => void;
  userId: string;
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
  onBulkDelete: () => void;
  isBulkDeleting?: boolean;
  isSelectionMode?: boolean;
}

export const JobTable: React.FC<JobTableProps> = ({
  applications,
  onRefresh,
  onEdit,
  userId,
  selectedIds,
  onSelectedIdsChange,
  onBulkDelete,
  isBulkDeleting = false,
  isSelectionMode = false
}) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [localFunnels, setLocalFunnels] = useState<Record<string, string>>({});
  const [sortField, setSortField] = useState<'fecha' | 'empresa' | 'puesto' | 'estado' | 'actualizacion'>('fecha');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const itemsPerPage = 10;
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; jobTitle: string; company: string } | null>(null);

  // Estados y referencias para arrastrar horizontalmente la tabla con el mouse (Drag-to-Scroll)
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Evitar arrastre si se hace clic en botones, inputs, selects, enlaces o iconos
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

  const handleMouseLeave = () => {
    setIsMouseDown(false);
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Velocidad del desplazamiento
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  // Ordenar postulaciones en memoria por campo seleccionado (ascendente o descendente)
  const sortedApplications = [...applications].sort((a, b) => {
    let valA: any = '';
    let valB: any = '';

    if (sortField === 'fecha') {
      const dateA = a.fecha_postulacion ? new Date(a.fecha_postulacion).getTime() : 0;
      const dateB = b.fecha_postulacion ? new Date(b.fecha_postulacion).getTime() : 0;
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    } else if (sortField === 'actualizacion') {
      const dateA = a.ultima_actualizacion ? new Date(a.ultima_actualizacion).getTime() : 0;
      const dateB = b.ultima_actualizacion ? new Date(b.ultima_actualizacion).getTime() : 0;
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    } else if (sortField === 'empresa') {
      valA = (a.company_name || '').toLowerCase();
      valB = (b.company_name || '').toLowerCase();
    } else if (sortField === 'puesto') {
      valA = (a.puesto || a.job_title || '').toLowerCase();
      valB = (b.puesto || b.job_title || '').toLowerCase();
    } else if (sortField === 'estado') {
      valA = (a.estado_funnel || '').toLowerCase();
      valB = (b.estado_funnel || '').toLowerCase();
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Limpiar estados locales cuando cambian las postulaciones (llega data fresca)
  useEffect(() => {
    setLocalFunnels({});
  }, [applications]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      onSelectedIdsChange(applications.map(app => app.id));
    } else {
      onSelectedIdsChange([]);
    }
  };

  const handleSelectRow = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectedIdsChange(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      onSelectedIdsChange([...selectedIds, id]);
    }
  };

  // Formatear fechas en formato DD/MM/AA
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'N/A';
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

  // Renderizar las estrellas de valoración
  const renderStars = (rating: number | undefined | null) => {
    const val = rating || 0;
    return (
      <div className="flex items-center gap-0.5 text-amber-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${star <= val ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`}
          />
        ))}
      </div>
    );
  };

  // Renderizar tags inline en formato de badges
  const renderTags = (tagsStr: string | null | undefined) => {
    if (!tagsStr) return <span className="text-slate-600 text-xs italic">Sin tags</span>;
    const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);
    if (tags.length === 0) return <span className="text-slate-600 text-xs italic">Sin tags</span>;
    return (
      <div className="flex flex-wrap gap-1 max-w-[150px]">
        {tags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20 whitespace-nowrap"
          >
            {tag}
          </span>
        ))}
      </div>
    );
  };

  // Manejar el cambio de ordenamiento por cabecera
  const handleSort = (field: 'fecha' | 'empresa' | 'puesto' | 'estado' | 'actualizacion') => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      if (field === 'fecha' || field === 'actualizacion') {
        setSortOrder('desc');
      } else {
        setSortOrder('asc');
      }
    }
  };

  // Renderizar cabecera ordenable premium
  const renderSortHeader = (label: string, field: 'fecha' | 'empresa' | 'puesto' | 'estado' | 'actualizacion') => {
    const isActive = sortField === field;
    return (
      <th
        className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 cursor-pointer select-none hover:text-white hover:bg-slate-900/40 transition-colors"
        onClick={() => handleSort(field)}
        title={`Ordenar por ${label}`}
      >
        <div className="flex items-center gap-1.5">
          <span>{label}</span>
          <div className="flex items-center shrink-0">
            {isActive ? (
              sortOrder === 'asc' ? (
                <ChevronUp className="w-3.5 h-3.5 text-violet-400 shrink-0" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-violet-400 shrink-0" />
              )
            ) : (
              <div className="flex flex-col -space-y-1 opacity-20 hover:opacity-100 transition-opacity">
                <ChevronUp className="w-2.5 h-2.5" />
                <ChevronDown className="w-2.5 h-2.5" />
              </div>
            )}
          </div>
        </div>
      </th>
    );
  };

  // Actualización rápida en la base de datos (inline)
  const handleInlineUpdate = async (
    id: string,
    field: 'estado_funnel' | 'cv_visto' | 'vacante_activa' | 'ubicacion',
    value: any
  ) => {
    setUpdatingId(id);
    try {
      if (userId === 'demo-user-id') {
        const localData = localStorage.getItem('jobstack_demo_applications');
        let apps: any[] = localData ? JSON.parse(localData) : [];
        apps = apps.map(app => app.id === id ? { ...app, [field]: value } : app);
        localStorage.setItem('jobstack_demo_applications', JSON.stringify(apps));
        onRefresh();
        setUpdatingId(null);
        return;
      }

      const { data, error } = await supabase
        .from('applications')
        .update({ [field]: value })
        .eq('id', id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        const currentApp = applications.find(a => a.id === id);
        if (currentApp && field === 'estado_funnel') {
          setLocalFunnels({ ...localFunnels, [id]: currentApp.estado_funnel || '' });
        }
        alert('No se pudo actualizar. Es posible que el registro no te pertenezca o no exista.');
        setUpdatingId(null);
        return;
      }

      onRefresh();
    } catch (err) {
      console.error('Error al actualizar inline:', err);
      alert('No se pudo actualizar el estado. Revisa tu conexión.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Borrar postulación con confirmación
  const handleDelete = (id: string, jobTitle: string, company: string) => {
    setDeleteTarget({ id, jobTitle, company });
  };

  const executeDelete = async (id: string) => {
    try {
      if (userId === 'demo-user-id') {
        const localData = localStorage.getItem('jobstack_demo_applications');
        let apps: any[] = localData ? JSON.parse(localData) : [];
        apps = apps.filter(app => app.id !== id);
        localStorage.setItem('jobstack_demo_applications', JSON.stringify(apps));
        onRefresh();
        return;
      }

      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      onRefresh();
    } catch (err) {
      console.error('Error al borrar:', err);
      alert('Ocurrió un error al intentar eliminar.');
    }
  };

  // Determinar color de fondo dinámico para el dropdown de estado_funnel
  const getFunnelSelectStyle = (val: string) => {
    const lower = val.toLowerCase();
    switch (lower) {
      case 'en espera':
      case 'en revisión':
      case 'en revision':
        return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
      case 'no continua':
      case 'rechazado':
      case 'cerrado':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'entrevista_screening':
      case 'entrevista':
      case 'screening':
      case 'entrevista_tecnica':
      case 'prueba técnica':
      case 'prueba tecnica':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'oferta':
        return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };





  return (
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

      {/* Contenedor de Scroll Horizontal y Vertical con Arrastre y Headers Pinned */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className={`overflow-x-auto overflow-y-auto max-h-[calc(100vh-420px)] min-h-[300px] custom-scrollbar cursor-grab active:cursor-grabbing transition-all ${isMouseDown ? 'dragging-active' : ''}`}
      >
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-sm shadow-md border-b border-slate-900">
            <tr className="border-b border-slate-800 bg-slate-900/40">
              {isSelectionMode && (
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={applications.length > 0 && selectedIds.length === applications.length}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = selectedIds.length > 0 && selectedIds.length < applications.length;
                      }
                    }}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-violet-600 focus:ring-violet-500 focus:ring-offset-slate-950 accent-violet-600 cursor-pointer"
                  />
                </th>
              )}
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 w-8 text-center">#</th>
              {renderSortHeader('Fecha', 'fecha')}
              {renderSortHeader('Empresa', 'empresa')}
              {renderSortHeader('Puesto', 'puesto')}
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Modalidad</th>
              {renderSortHeader('Estado', 'estado')}
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Salario</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Contacto</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Próximo Paso</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Link</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-center">★</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Tags</th>
              {renderSortHeader('Última Act.', 'actualizacion')}
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-900">
            {applications.length === 0 ? (
              <tr>
                <td colSpan={isSelectionMode ? 14 : 13} className="px-6 py-12 text-center text-slate-500 font-medium">
                  No se encontraron registros de postulaciones. ¡Agrega una nueva arriba! 🚀
                </td>
              </tr>
            ) : (
              sortedApplications.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((app, index) => {
                const rowNumber = ((currentPage - 1) * itemsPerPage) + index + 1;
                const isClosed = !app.vacante_activa || 
                  app.estado_funnel?.toLowerCase() === 'cerrado' || 
                  app.estado_funnel?.toLowerCase() === 'rechazado' || 
                  app.estado_funnel?.toLowerCase() === 'no continua';

                return (
                  <React.Fragment key={app.id || index}>
                    {/* Fila Principal */}
                    <tr className={`hover:bg-slate-900/20 transition-all duration-200 group ${isClosed ? 'opacity-40 grayscale-[40%] bg-slate-900/5' : ''}`}>

                      {/* Checkbox de Selección */}
                      {isSelectionMode && (
                        <td className="px-6 py-4 w-12 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(app.id)}
                            onChange={() => handleSelectRow(app.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-violet-600 focus:ring-violet-500 focus:ring-offset-slate-950 accent-violet-600 cursor-pointer"
                          />
                        </td>
                      )}

                      {/* Número de Item */}
                      <td className="px-4 py-4 w-8 text-center text-xs font-medium text-slate-500">
                        {rowNumber}
                      </td>

                      {/* Fecha */}
                      <td className="px-6 py-4 whitespace-nowrap text-slate-350 text-sm">
                        <span className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(app.fecha_postulacion)}
                        </span>
                      </td>

                      {/* Empresa */}
                      <td className="px-6 py-4 whitespace-nowrap text-slate-300 text-sm font-semibold truncate max-w-[140px]" title={app.company_name}>
                        {app.company_name}
                      </td>

                      {/* Puesto */}
                      <td className="px-6 py-4 whitespace-nowrap text-white text-sm font-bold truncate max-w-[180px]" title={app.puesto || app.job_title}>
                        {app.puesto || app.job_title}
                      </td>

                      {/* Modalidad */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="tipo" value={(app.modalidad as any) || (app.tipo as any) || 'remoto'} />
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getFunnelSelectStyle(app.estado_funnel || '')}`}>
                          {app.estado_funnel}
                        </span>
                      </td>

                      {/* Salario */}
                      <td className="px-6 py-4 whitespace-nowrap text-slate-300 text-sm font-medium">
                        {app.salario_rango || <span className="text-slate-650 italic">N/A</span>}
                      </td>

                      {/* Contacto */}
                      <td className="px-6 py-4 whitespace-nowrap text-slate-400 text-sm">
                        {app.contacto_info || <span className="text-slate-650 italic">Sin Contacto</span>}
                      </td>

                      {/* Próximo Paso (Combina acción y fecha de seguimiento) */}
                      <td className="px-6 py-4 text-sm">
                        {app.accion_seguimiento || app.fecha_seguimiento ? (
                          <div className="flex flex-col">
                            {app.accion_seguimiento && (
                              <span className="text-slate-200 text-xs font-semibold truncate max-w-[150px]" title={app.accion_seguimiento}>
                                {app.accion_seguimiento}
                              </span>
                            )}
                            {app.fecha_seguimiento && (
                              <span className="text-amber-400 text-[10px] font-bold mt-0.5">{formatDate(app.fecha_seguimiento)}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-650 italic text-xs">N/A</span>
                        )}
                      </td>

                      {/* Link */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {app.vacancy_url ? (
                          <a
                            href={app.vacancy_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-violet-400 hover:text-violet-300 flex items-center gap-1 font-semibold transition-colors text-xs"
                          >
                            Link <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="text-slate-650 italic text-xs">Sin Link</span>
                        )}
                      </td>

                      {/* ★ Valoración */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderStars(app.rating)}
                      </td>

                      {/* Tags */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderTags(app.tags)}
                      </td>

                      {/* Última Actualización */}
                      <td className="px-6 py-4 whitespace-nowrap text-slate-350 text-xs font-medium">
                        {formatDate(app.ultima_actualizacion)}
                      </td>

                {/* Acciones */ }
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2.5">






                    {/* Editar */}
                    <button
                      onClick={() => onEdit(app)}
                      className="p-1.5 rounded-lg border border-transparent text-slate-400 hover:text-white hover:border-slate-800 hover:bg-slate-900/40 transition-all"
                      title="Editar postulación"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Borrar */}
                    <button
                      onClick={() => handleDelete(app.id, app.job_title || app.puesto || '', app.company_name || '')}
                      className="p-1.5 rounded-lg border border-transparent text-slate-400 hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/5 transition-all"
                      title="Eliminar postulación"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
                    </tr>

        </React.Fragment>
        );
              })
            )}
      </tbody>
    </table>
      </div >

  {/* Paginación */ }
{
  applications.length > itemsPerPage && (() => {
    const totalPages = Math.ceil(applications.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-900 bg-slate-950/20">
        <div className="text-xs text-slate-500 font-medium">
          <span className="hidden sm:inline">Mostrando </span><span className="text-slate-300">{indexOfFirstItem + 1}</span>-<span className="text-slate-300">{Math.min(indexOfLastItem, applications.length)}</span> de <span className="text-slate-300">{applications.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-2 border border-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-xs text-slate-400 font-semibold">
            Página <span className="text-white">{currentPage}</span> de {totalPages}
          </div>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-2 border border-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  })()
}

{/* Barra Flotante de Acciones en Lote (SaaS-style Floating Action Bar) */ }
{
  selectedIds.length > 0 && (
    <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 sm:gap-4 bg-slate-950/95 backdrop-blur-md border border-violet-500/30 px-4 sm:px-6 py-3 sm:py-3.5 rounded-2xl shadow-2xl shadow-violet-500/10 animate-slide-up">
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center text-[11px] text-white font-bold animate-pulse">
          {selectedIds.length}
        </span>
        <span className="text-xs text-slate-200 font-semibold tracking-wide">
          {selectedIds.length === 1 ? 'Seleccionado' : 'Seleccionados'}
        </span>
      </div>

      <div className="w-[1px] h-5 bg-slate-800" />

      <div className="flex items-center gap-2">
        <button
          onClick={() => onSelectedIdsChange([])}
          className="text-xs text-slate-400 hover:text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-900/60 transition-colors"
        >
          Cancelar
        </button>

        <button
          onClick={onBulkDelete}
          disabled={isBulkDeleting}
          className="flex items-center gap-1.5 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 hover:text-red-300 font-bold text-xs px-4 py-1.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {isBulkDeleting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Eliminando...
            </>
          ) : (
            <>
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar Selección
            </>
          )}
        </button>
      </div>
    </div>
  )
}

      {/* Modal de Confirmación de Borrado Premium */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Confirmar Eliminación"
        maxWidthClass="max-w-[360px]"
      >
        {deleteTarget && (
          <div className="space-y-4 flex flex-col items-center text-center">


            <div className="space-y-1">
              <p className="text-slate-250 text-sm font-semibold leading-normal">
                ¿Eliminar <span className="text-white font-bold">{deleteTarget.jobTitle}</span>?
              </p>
            </div>

            {/* Buttons */}
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
                onClick={() => {
                  executeDelete(deleteTarget.id);
                  setDeleteTarget(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-500/10 hover:shadow-red-500/20 active:scale-[0.98] border border-red-500/20 transition-all"
              >
                Eliminar
              </button>
            </div>
          </div>
        )}
      </Modal>


    </div >
  );
};

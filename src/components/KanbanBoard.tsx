import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Application, EstadoFunnel } from '../types';
import { Badge } from './ui/Badge';
import { 
  Building, Calendar, Edit2, Trash2, ExternalLink, Star, 
  ChevronRight, Loader2, Sparkles, AlertTriangle, ArrowLeft,
  MoveRight, CheckCircle2, RefreshCw, Plus
} from 'lucide-react';
import { Modal } from './ui/Modal';

interface KanbanBoardProps {
  applications: Application[];
  onRefresh: () => void;
  onEdit: (app: Application) => void;
  userId: string;
  onNavigate: (view: 'home' | 'table' | 'kanban' | 'calendar' | 'analytics') => void;
}

const COLUMNS: { key: EstadoFunnel; label: string; color: string; dotColor: string }[] = [
  { key: 'Postulado', label: 'Postulado', color: 'border-slate-800/80 bg-slate-900/10 text-slate-400', dotColor: 'bg-slate-400' },
  { key: 'En revisión', label: 'En Revisión', color: 'border-yellow-500/20 bg-yellow-500/5 text-yellow-400', dotColor: 'bg-yellow-500' },
  { key: 'Prueba Técnica', label: 'Prueba Técnica', color: 'border-indigo-500/20 bg-indigo-500/5 text-indigo-400', dotColor: 'bg-indigo-400' },
  { key: 'Entrevista', label: 'Entrevista', color: 'border-sky-500/20 bg-sky-500/5 text-sky-400', dotColor: 'bg-sky-500' },
  { key: 'Oferta', label: 'Oferta', color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-sm shadow-emerald-500/5 animate-pulse', dotColor: 'bg-emerald-400' },
  { key: 'Rechazado', label: 'Rechazado', color: 'border-red-500/20 bg-red-500/5 text-red-400', dotColor: 'bg-red-400' },
  { key: 'Cerrado', label: 'Cerrado', color: 'border-slate-700/40 bg-slate-800/10 text-slate-500', dotColor: 'bg-slate-650' }
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  applications,
  onRefresh,
  onEdit,
  userId,
  onNavigate
}) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; jobTitle: string; company: string } | null>(null);
  const [localApps, setLocalApps] = useState<Application[] | null>(null);

  // Usar aplicaciones locales para actualizaciones optimistas instantáneas
  const displayApps = localApps || applications;

  // Normalizar los estados del funnel de la base de datos
  const getNormalizedColumn = (status: string | undefined | null): EstadoFunnel => {
    if (!status) return 'Postulado';
    const lower = status.toLowerCase();
    if (lower === 'postulado' || lower === 'en espera') return 'Postulado';
    if (lower === 'en revisión' || lower === 'en revision' || lower === 'screening' || lower === 'entrevista_screening') return 'En revisión';
    if (lower === 'prueba técnica' || lower === 'prueba tecnica') return 'Prueba Técnica';
    if (lower === 'entrevista' || lower === 'entrevista_tecnica') return 'Entrevista';
    if (lower === 'oferta') return 'Oferta';
    if (lower === 'rechazado' || lower === 'no continua') return 'Rechazado';
    if (lower === 'cerrado') return 'Cerrado';
    return 'Postulado';
  };

  // Formatear fechas en formato DD/MM/AA
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '';
    const dateOnly = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0];
    const parts = dateOnly.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year.substring(2)}`;
    }
    return dateStr;
  };

  // Renderizar las estrellas
  const renderStars = (rating: number | undefined | null) => {
    const val = rating || 0;
    if (val === 0) return null;
    return (
      <div className="flex items-center gap-0.5 text-amber-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${star <= val ? 'fill-amber-400 text-amber-400' : 'text-slate-800'}`}
          />
        ))}
      </div>
    );
  };

  // Actualizar el estado del funnel (Supabase o LocalStorage)
  const updateFunnelState = async (appId: string, newFunnel: EstadoFunnel) => {
    setUpdatingId(appId);
    
    // Guardar estado actual para revertir en caso de error
    const previousApps = [...applications];

    // Actualización optimista instantánea
    const updatedApps = displayApps.map(app => 
      app.id === appId ? { ...app, estado_funnel: newFunnel, ultima_actualizacion: new Date().toISOString().split('T')[0] } : app
    );
    setLocalApps(updatedApps);

    try {
      if (userId === 'demo-user-id') {
        const localData = localStorage.getItem('jobstack_demo_applications');
        let apps: any[] = localData ? JSON.parse(localData) : [];
        apps = apps.map(app => 
          app.id === appId ? { 
            ...app, 
            estado_funnel: newFunnel, 
            estado: newFunnel,
            ultima_actualizacion: new Date().toISOString().split('T')[0] 
          } : app
        );
        localStorage.setItem('jobstack_demo_applications', JSON.stringify(apps));
        
        // Simular un pequeño retraso de red de 200ms para una experiencia visual premium
        await new Promise(resolve => setTimeout(resolve, 250));
        
        onRefresh();
        setLocalApps(null);
        setUpdatingId(null);
        return;
      }

      const { data, error } = await supabase
        .from('applications')
        .update({ 
          estado_funnel: newFunnel,
          estado: newFunnel,
          ultima_actualizacion: new Date().toISOString().split('T')[0]
        })
        .eq('id', appId)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('No se encontró el registro o no tienes permisos.');
      }

      onRefresh();
      setLocalApps(null);
    } catch (err) {
      console.error('Error al mover tarjeta:', err);
      alert('Error al actualizar el estado en Supabase. Revirtiendo cambio...');
      setLocalApps(previousApps);
    } finally {
      setUpdatingId(null);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, appId: string) => {
    setDraggedAppId(appId);
    e.dataTransfer.setData('text/plain', appId);
    // Efecto visual premium al arrastrar
    e.dataTransfer.effectAllowed = 'move';
    const dragImg = e.currentTarget as HTMLElement;
    dragImg.style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const dragImg = e.currentTarget as HTMLElement;
    dragImg.style.opacity = '1';
    setDraggedAppId(null);
    setHoveredColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    if (hoveredColumn !== columnKey) {
      setHoveredColumn(columnKey);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetColumn: EstadoFunnel) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData('text/plain') || draggedAppId;
    setHoveredColumn(null);
    
    if (appId) {
      const app = displayApps.find(a => a.id === appId);
      const currentCol = getNormalizedColumn(app?.estado_funnel);
      
      // Solo actualizar si la columna destino es diferente
      if (currentCol !== targetColumn) {
        await updateFunnelState(appId, targetColumn);
      }
    }
  };

  // Eliminación rápida
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
      console.error('Error al eliminar:', err);
      alert('Ocurrió un error al intentar eliminar.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative z-10">
      
      {/* Botón Volver y Título */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button 
            onClick={() => onNavigate('home')}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 mb-2 transition-colors focus:outline-none"
          >
            <ArrowLeft className="w-3 h-3" /> Volver al Inicio
          </button>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Tablero Kanban
            <span className="text-[10px] uppercase font-bold tracking-widest bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-md border border-indigo-500/15">
              Drag & Drop
            </span>
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Arrastra y suelta tus postulaciones para cambiar su estado visualmente.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 border border-slate-800 hover:border-slate-700 bg-slate-900/30 hover:bg-slate-900/60 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-all focus:outline-none self-start sm:self-center"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Actualizar Tablero
        </button>
      </div>

      {/* Grid del Tablero Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 overflow-x-auto pb-4 select-none min-h-[500px]">
        
        {COLUMNS.map((column) => {
          const colApps = displayApps.filter(
            (app) => getNormalizedColumn(app.estado_funnel) === column.key
          );
          const isOver = hoveredColumn === column.key;

          return (
            <div
              key={column.key}
              onDragOver={(e) => handleDragOver(e, column.key)}
              onDragLeave={() => setHoveredColumn(null)}
              onDrop={(e) => handleDrop(e, column.key)}
              className={`flex flex-col rounded-2xl border transition-all duration-300 min-w-[240px] max-w-[280px] xl:max-w-none w-full ${
                isOver 
                  ? 'border-violet-500/40 bg-violet-600/5 shadow-lg shadow-violet-500/5 translate-y-[-2px]' 
                  : 'border-slate-900 bg-slate-950/20'
              }`}
            >
              {/* Header de la Columna */}
              <div className="p-3.5 border-b border-slate-900 flex items-center justify-between bg-slate-950/40 rounded-t-2xl">
                <div className="flex items-center gap-2 truncate">
                  <span className={`w-1.5 h-1.5 rounded-full ${column.dotColor}`} />
                  <span className="text-xs font-bold text-slate-200 tracking-wide truncate">
                    {column.label}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md">
                  {colApps.length}
                </span>
              </div>

              {/* Lista de Tarjetas */}
              <div 
                className={`p-2.5 flex-1 flex flex-col gap-3 min-h-[350px] overflow-y-auto max-h-[60vh] custom-scrollbar rounded-b-2xl ${
                  colApps.length === 0 ? 'justify-center items-center text-center opacity-45' : ''
                }`}
              >
                {colApps.length === 0 ? (
                  <div className="p-4 space-y-1">
                    <p className="text-[10px] text-slate-550 italic font-semibold">Vacío</p>
                    <p className="text-[9px] text-slate-600">Arrastra aquí</p>
                  </div>
                ) : (
                  colApps.map((app) => {
                    const isClosed = !app.vacante_activa || 
                      app.estado_funnel?.toLowerCase() === 'cerrado' || 
                      app.estado_funnel?.toLowerCase() === 'rechazado' || 
                      app.estado_funnel?.toLowerCase() === 'no continua';

                    const isUpdating = updatingId === app.id;

                    return (
                      <div
                        key={app.id}
                        draggable={!isUpdating}
                        onDragStart={(e) => handleDragStart(e, app.id)}
                        onDragEnd={handleDragEnd}
                        className={`group relative glass-panel p-4 rounded-xl border border-slate-850 hover:border-violet-500/30 hover:shadow-md hover:shadow-violet-500/5 cursor-grab active:cursor-grabbing transition-all duration-200 ${
                          isClosed ? 'opacity-45 grayscale-[20%]' : ''
                        } ${isUpdating ? 'pointer-events-none opacity-50' : ''}`}
                      >
                        {/* Overlay de Carga en Tarjeta */}
                        {isUpdating && (
                          <div className="absolute inset-0 bg-slate-950/70 rounded-xl flex items-center justify-center z-10 backdrop-blur-[1px]">
                            <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                          </div>
                        )}

                        {/* Top Metadata */}
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <span className="text-[9px] text-slate-500 font-semibold flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" />
                            {formatDate(app.fecha_postulacion)}
                          </span>
                          
                          {/* Rating estrellas */}
                          {renderStars(app.rating)}
                        </div>

                        {/* Puesto */}
                        <h4 className="text-xs font-bold text-white leading-normal tracking-tight group-hover:text-violet-300 transition-colors line-clamp-1">
                          {app.puesto || app.job_title}
                        </h4>

                        {/* Empresa */}
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold mt-0.5 truncate">
                          <Building className="w-3 h-3 text-slate-500 flex-shrink-0" />
                          <span className="truncate">{app.company_name}</span>
                        </div>

                        {/* Modalidad Badge y Salario */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-900">
                          <Badge variant="tipo" value={(app.modalidad as any) || (app.tipo as any) || 'remoto'} className="scale-[0.85] origin-left -my-1" />
                          
                          {app.salario_rango && (
                            <span className="text-[9px] font-bold text-slate-400 bg-slate-900 border border-slate-800/80 px-1.5 py-0.5 rounded">
                              {app.salario_rango}
                            </span>
                          )}
                        </div>

                        {/* Tags list */}
                        {app.tags && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {app.tags.split(',').slice(0, 3).map(tag => (
                              <span key={tag} className="text-[8px] font-extrabold text-violet-400/80 uppercase px-1 rounded bg-violet-500/5 border border-violet-500/10">
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Acciones en hover */}
                        <div className="flex items-center justify-between gap-2 mt-4 pt-2 border-t border-slate-900 opacity-0 group-hover:opacity-100 transition-opacity">
                          
                          {/* Move mobile select */}
                          <select
                            value={column.key}
                            onChange={(e) => updateFunnelState(app.id, e.target.value as EstadoFunnel)}
                            className="bg-slate-900 text-slate-300 text-[9px] font-bold border border-slate-800 rounded px-1 py-0.5 focus:outline-none cursor-pointer max-w-[100px]"
                            title="Mover de columna"
                          >
                            {COLUMNS.map(col => (
                              <option key={col.key} value={col.key}>{col.label}</option>
                            ))}
                          </select>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1">
                            {app.vacancy_url && (
                              <a
                                href={app.vacancy_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                                title="Ver vacante"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            <button
                              onClick={() => onEdit(app)}
                              className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ id: app.id, jobTitle: app.puesto || app.job_title || '', company: app.company_name || '' })}
                              className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Borrar"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>

            </div>
          );
        })}

      </div>

      {/* Modal de Confirmación de Borrado */}
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
                ¿Eliminar <span className="text-white font-bold">{deleteTarget.jobTitle}</span>?
              </p>
              <p className="text-xs text-slate-500">Esta acción no se puede deshacer.</p>
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

    </div>
  );
};

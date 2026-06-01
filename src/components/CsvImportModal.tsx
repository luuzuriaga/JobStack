import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { TipoModalidad, PerfilAplicante, PostulacionEstado, EstadoFunnel } from '../types';
import { Modal } from './ui/Modal';
import { UploadCloud, FileSpreadsheet, AlertTriangle, CheckCircle2, Loader2, Sparkles, HelpCircle } from 'lucide-react';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  userId: string;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ isOpen, onClose, onRefresh, userId }) => {
  const [dragActive, setDragActive] = useState(false);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadCsvTemplate = () => {
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
    const sampleRow = [
      new Date().toISOString().split('T')[0],
      'Google',
      'React Developer',
      'remoto',
      'Postulado',
      '5000 USD',
      'John Doe (john@recruiter.com)',
      'Llamada de screening',
      new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      'https://careers.google.com/jobs/example',
      '5',
      'React,TypeScript,Premium',
      'California, USA',
      'Ejemplo de notas: Importante repasar algoritmos.',
      new Date().toISOString().split('T')[0]
    ];
    const csvContent = '\uFEFF' + [headers.join(','), sampleRow.map(v => `"${v}"`).join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'jobstack_plantilla.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parser robusto de CSV nativo que maneja comillas y saltos de línea correctamente
  const parseCSV = (text: string): string[][] => {
    const lines: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let inQuotes = false;

    // Auto-detectar separador (, o ;)
    const firstLine = text.split('\n')[0];
    const separator = firstLine.split(';').length > firstLine.split(',').length ? ';' : ',';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (inQuotes) {
        if (char === '"') {
          if (nextChar === '"') {
            cell += '"';
            i++; // Saltar comilla doble escapada
          } else {
            inQuotes = false;
          }
        } else {
          cell += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === separator) {
          row.push(cell.trim());
          cell = '';
        } else if (char === '\r' || char === '\n') {
          row.push(cell.trim());
          if (row.some(c => c !== '')) {
            lines.push(row);
          }
          row = [];
          cell = '';
          if (char === '\r' && nextChar === '\n') {
            i++; // Saltar salto de línea compuesto Windows (\r\n)
          }
        } else {
          cell += char;
        }
      }
    }

    if (cell !== '' || row.length > 0) {
      row.push(cell.trim());
      if (row.some(c => c !== '')) {
        lines.push(row);
      }
    }

    return lines;
  };

  // Mapeador inteligente de cabeceras en español e inglés
  const processCSVData = (rawLines: string[][]) => {
    if (rawLines.length < 2) {
      setError('El archivo CSV debe contener al menos un encabezado y una fila de datos.');
      return;
    }

    const headers = rawLines[0].map(h => 
      h.toLowerCase()
       .trim()
       .normalize("NFD")
       .replace(/[\u0300-\u036f]/g, "")
    );
    const dataLines = rawLines.slice(1);

    // Buscar índices por coincidencia aproximada de palabras clave
    const getIndex = (keys: string[]) => {
      return headers.findIndex(header => 
        keys.some(key => header.includes(key))
      );
    };

    const idxJobTitle = getIndex(['job_title', 'title', 'job', 'puesto', 'cargo', 'vacante', 'position']);
    const idxCompany = getIndex(['company', 'empresa', 'compañia', 'employer', 'firma']);
    const idxUrl = getIndex(['url', 'link', 'enlace', 'anuncio', 'href', 'atw-jobinfo-jobtitle href', 'vacante_url', 'job_url', 'portal_url', 'enlace a la vacante']);
    const idxPortal = getIndex(['portal', 'plataforma', 'fuente', 'source', 'web']);
    const idxTipo = getIndex(['tipo', 'modalidad', 'tipo_modalidad', 'mode', 'workplace', 'atw-jobinfo-companylocation 2']);
    const idxPerfil = getIndex(['perfil', 'aplicante', 'estudio', 'butcamp', 'universidad']);
    const idxFecha = getIndex(['fecha', 'date', 'created_at', 'postulado', 'registro', 'css-15qcmw0']);
    const idxLugar = getIndex(['lugar', 'ubicacion', 'ubicaion', 'ubicasion', 'location', 'city', 'pais', 'address']);
    const idxActiva = getIndex(['activa', 'active', 'estado_vacante']);
    const idxEstadoFunnel = getIndex(['estado_funnel', 'estado funnel', 'funnel', 'estado', 'status_funnel']);

    // Nuevas columnas requeridas
    const idxContacto = getIndex(['contacto', 'reclutador', 'contact', 'recruiter', 'contacto / reclutador', 'contact_name']);
    const idxSalario = getIndex(['salario', 'salary', 'salario (rango)', 'salary_range', 'rango_salarial']);
    const idxSeguimiento = getIndex(['seguimiento', 'follow_up', 'próximo seguimiento', 'next_follow_up', 'next_followup', 'próximo paso']);
    const idxRating = getIndex(['rating', 'valoracion', 'valoración', 'estrellas', 'stars', 'evaluacion', 'evaluación']);
    const idxTags = getIndex(['tags', 'etiquetas', 'tag', 'labels']);
    const idxUltimaAct = getIndex(['ultima_actualizacion', 'última actualización', 'actualizacion', 'actualizado', 'last_update', 'updated_at']);
    
    // Columnas especiales del coach / Indeed scraping
    const idxCvVisto = getIndex(['statustag', 'status-tag', 'visto', 'opened', 'viewed']);
    const idxSla = getIndex(['metadata', 'sla', 'responde', 'response']);
    const idxWarning = getIndex(['warning', 'closed', 'caduco', 'cerro', 'caducada', 'cerrada', '15qcmw0']);
    const idxNotas = getIndex(['notas', 'comentarios', 'comentario', 'notes', 'comment', 'bitacora', 'bitácora', 'historial', 'log', 'logs']);

    if (idxJobTitle === -1 || idxCompany === -1) {
      setError('No se pudieron identificar las columnas requeridas: "Puesto" (Job Title) y "Empresa" (Company). Asegúrate de tener estas columnas en el archivo.');
      return;
    }

    // Fecha actual para valores predeterminados (formato YYYY-MM-DD) en hora local
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const parseFlexibleDate = (dateStr: string): string => {
      const todayDate = new Date();
      const lower = dateStr.toLowerCase();
      
      const formatDateLocal = (date: Date): string => {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      };
      
      // "hace X días" o "X days ago"
      const daysAgoMatch = lower.match(/(\d+)\s*(días|dia|day|days)/);
      if (daysAgoMatch) {
        const days = parseInt(daysAgoMatch[1], 10);
        const targetDate = new Date(todayDate);
        targetDate.setDate(todayDate.getDate() - days);
        return formatDateLocal(targetDate);
      }
      
      // "hace X semanas" o "X weeks ago"
      const weeksAgoMatch = lower.match(/(\d+)\s*(semanas|semana|week|weeks)/);
      if (weeksAgoMatch) {
        const weeks = parseInt(weeksAgoMatch[1], 10);
        const targetDate = new Date(todayDate);
        targetDate.setDate(todayDate.getDate() - (weeks * 7));
        return formatDateLocal(targetDate);
      }
      
      // Formato DD/MM/YY o DD/MM/YYYY (con guiones o barras)
      const ddmmyyyyMatch = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
      if (ddmmyyyyMatch) {
        const day = parseInt(ddmmyyyyMatch[1], 10);
        const month = parseInt(ddmmyyyyMatch[2], 10) - 1;
        let year = parseInt(ddmmyyyyMatch[3], 10);
        if (year < 100) {
          year += 2000; // Convertir año de 2 dígitos (ej. 26) a 4 dígitos (ej. 2026)
        }
        const parsedDate = new Date(year, month, day);
        if (!isNaN(parsedDate.getTime())) {
          return formatDateLocal(parsedDate);
        }
      }
      
      // Intento estándar
      const standardParsed = new Date(dateStr);
      if (!isNaN(standardParsed.getTime())) {
        return formatDateLocal(standardParsed);
      }
      
      return today; // Fallback
    };

    const mapped = dataLines.map((row, index) => {
      const getVal = (idx: number) => idx !== -1 && idx < row.length ? row[idx] : '';
      
      const rawTitle = getVal(idxJobTitle);
      const rawCompany = getVal(idxCompany);
      
      if (!rawTitle || !rawCompany) return null; // Ignorar filas incompletas

      const vacancyUrl = getVal(idxUrl);
      
      // Autodetectar portal según la URL si no viene especificado
      let portal = getVal(idxPortal);
      if (!portal && vacancyUrl) {
        const lowerUrl = vacancyUrl.toLowerCase();
        if (lowerUrl.includes('linkedin.com')) portal = 'LinkedIn';
        else if (lowerUrl.includes('indeed.com')) portal = 'Indeed';
        else if (lowerUrl.includes('computrabajo')) portal = 'Computrabajo';
        else if (lowerUrl.includes('getonbrd')) portal = 'Getonbrd';
        else portal = 'Otro';
      } else if (!portal) {
        portal = 'Indeed'; // Default si viene vacío
      }

      // Validar tipo (modalidad) restrictivo
      const rawTipo = getVal(idxTipo);
      const lowerTipo = rawTipo.toLowerCase();
      let tipo: TipoModalidad = 'presencial'; // Por defecto presencial si no dice remoto
      
      if (lowerTipo.includes('remote') || lowerTipo.includes('remoto')) {
        tipo = 'remoto';
      } else if (lowerTipo.includes('hibrido') || lowerTipo.includes('hybrid')) {
        tipo = 'hibrido';
      }

      // Validar perfil restrictivo (Butcamp o Universidad)
      let perfil: PerfilAplicante = 'Butcamp';
      const rawPerfil = getVal(idxPerfil).toLowerCase();
      if (rawPerfil.includes('universidad') || rawPerfil.includes('university') || rawPerfil.includes('u')) perfil = 'Universidad';

      // Validar formato de fecha YYYY-MM-DD
      let fecha_registro = today;
      const rawFecha = getVal(idxFecha);
      if (rawFecha) {
        fecha_registro = parseFlexibleDate(rawFecha);
      }

      // Procesar columnas inteligentes de Indeed
      const rawVisto = idxCvVisto !== -1 ? getVal(idxCvVisto).toLowerCase() : '';
      const cv_visto = rawVisto.includes('vista') || rawVisto.includes('viewed') || rawVisto.includes('abierto');

      const empresa_sla = idxSla !== -1 ? getVal(idxSla) : null;

      const rawWarning = idxWarning !== -1 ? getVal(idxWarning).toLowerCase() : '';
      let vacante_activa = !(
        rawWarning.includes('cerró') || 
        rawWarning.includes('caducó') || 
        rawWarning.includes('closed') || 
        rawWarning.includes('expired') ||
        rawWarning.includes('caducada') ||
        rawWarning.includes('cerrada')
      );
      
      // Verificación extra para columna explícita de activa/estado
      if (idxActiva !== -1) {
        const rawActiva = getVal(idxActiva).toLowerCase();
        if (rawActiva === 'no' || rawActiva === 'false' || rawActiva.includes('caduco') || rawActiva.includes('cerro')) {
          vacante_activa = false;
        } else if (rawActiva === 'si' || rawActiva === 'true' || rawActiva === 'sí' || rawActiva === 'activa') {
          vacante_activa = true;
        }
      }

      const rawLugar = idxLugar !== -1 ? getVal(idxLugar) : '';
      let ubicacion = rawLugar || 'Peru';
      
      // Si no hay columna de lugar pero la de tipo tiene un lugar (porque no es remoto)
      if (!rawLugar && tipo === 'presencial' && rawTipo) {
        ubicacion = rawTipo;
      }

      const csvNotas = idxNotas !== -1 ? getVal(idxNotas).trim() : '';
      let notas_texto = csvNotas || (empresa_sla 
        ? `SLA: ${empresa_sla}. Importado de Indeed.` 
        : `Importado de forma masiva desde CSV. Fila original #${index + 2}.`);
      
      if (!csvNotas && tipo === 'presencial' && ubicacion !== 'Peru') {
        notas_texto += `\n📍 Ubicación Presencial: ${ubicacion}`;
      }
      
      // Extraer nuevas columnas
      const contacto_info = idxContacto !== -1 ? getVal(idxContacto) : null;
      const salario_rango = idxSalario !== -1 ? getVal(idxSalario) : null;
      const fecha_seguimiento = idxSeguimiento !== -1 ? getVal(idxSeguimiento) : null;
      
      const rawRating = idxRating !== -1 ? getVal(idxRating) : '';
      const rating = parseInt(rawRating, 10) || 0;
      const tags = idxTags !== -1 ? getVal(idxTags) : null;
      const ultima_actualizacion = idxUltimaAct !== -1 ? parseFlexibleDate(getVal(idxUltimaAct)) : today;

      let estado_funnel = 'Postulado';
      if (idxEstadoFunnel !== -1) {
        const rawEst = getVal(idxEstadoFunnel).trim();
        if (rawEst) {
          const lowerEst = rawEst.toLowerCase();
          if (lowerEst === 'en espera' || lowerEst === 'postulado') {
            estado_funnel = 'Postulado';
          } else if (lowerEst === 'no continua' || lowerEst === 'rechazado') {
            estado_funnel = 'Rechazado';
          } else if (lowerEst === 'entrevista_screening' || lowerEst === 'en revisión' || lowerEst === 'en revision') {
            estado_funnel = 'En revisión';
          } else if (lowerEst === 'entrevista' || lowerEst === 'entrevistas') {
            estado_funnel = 'Entrevista';
          } else if (lowerEst === 'entrevista_tecnica' || lowerEst === 'prueba técnica' || lowerEst === 'prueba tecnica' || lowerEst === 'prueba') {
            estado_funnel = 'Prueba Técnica';
          } else if (lowerEst === 'oferta') {
            estado_funnel = 'Oferta';
          } else if (lowerEst === 'cerrado' || lowerEst === 'cerrada' || lowerEst === 'closed') {
            estado_funnel = 'Cerrado';
          } else {
            estado_funnel = rawEst.charAt(0).toUpperCase() + rawEst.slice(1);
          }
        }
      } else if (!vacante_activa) {
        estado_funnel = 'Rechazado';
      }

      return {
        // Campos principales (mapeados al esquema de la BD)
        job_title: rawTitle.substring(0, 255),
        company_name: rawCompany.substring(0, 255),
        puesto: rawTitle.substring(0, 255), // Duplicado para compatibilidad con tabla
        
        // URLs y contactos
        vacancy_url: vacancyUrl || null,
        portal: portal.substring(0, 100) || null,
        
        // Modalidad y ubicación
        tipo,
        modalidad: tipo, // Duplicado para compatibilidad con tabla (tipo/modalidad)
        ubicacion: ubicacion.substring(0, 100),
        
        // Perfil y estados
        perfil,
        postulacion_estado: 'Listo' as PostulacionEstado,
        estado_funnel,
        estado: estado_funnel,
        
        // Fechas
        fecha_registro,
        fecha_postulacion: fecha_registro, // Duplicado para compatibilidad con tabla
        
        // Notas (Unificados notas y notas_texto para compatibilidad total)
        notas: notas_texto,
        notas_texto,
        
        // Nuevos campos
        contacto_info: contacto_info ? contacto_info.substring(0, 255) : null,
        salario_rango: salario_rango ? salario_rango.substring(0, 100) : null,
        fecha_seguimiento: fecha_seguimiento ? parseFlexibleDate(fecha_seguimiento) : null,
        ultima_actualizacion: ultima_actualizacion || today,
        rating: Math.min(5, Math.max(0, rating)),
        tags: tags || null,
        
        // Flags especiales
        cv_visto,
        vacante_activa,
        empresa_sla: empresa_sla ? empresa_sla.substring(0, 150) : null
      };
    }).filter(Boolean);

    // Deduplicar dentro del CSV (dejar solo uno por cada par puesto-empresa)
    const seen = new Set<string>();
    const uniqueMapped = mapped.filter((row: any) => {
      if (!row) return false;
      const key = `${row.job_title.toLowerCase().trim()}|${row.company_name.toLowerCase().trim()}`;
      if (seen.has(key)) {
        return false; // Duplicado en el CSV, omitir
      }
      seen.add(key);
      return true;
    });

    if (uniqueMapped.length === 0) {
      setError('No se encontraron registros válidos de postulaciones en el archivo (se requieren filas con Puesto y Empresa válidas).');
    } else {
      setParsedRows(uniqueMapped);
      setError(null);
    }
  };

  const handleFile = (file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Solo se admiten archivos en formato CSV (.csv).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const rawLines = parseCSV(text);
        processCSVData(rawLines);
      } catch (err) {
        setError('Error al procesar el archivo CSV. Comprueba que el formato de codificación sea UTF-8.');
        console.error(err);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  // Manejo de drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Guardado masivo en la base de datos de Supabase
  const handleImportSubmit = async () => {
    if (parsedRows.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      if (userId === 'demo-user-id') {
        const localData = localStorage.getItem('jobstack_demo_applications');
        let apps: any[] = localData ? JSON.parse(localData) : [];

        // Crear un set de claves existentes en la BD local
        const existingKeys = new Set(
          apps.map(app => 
            `${app.job_title.toLowerCase().trim()}|${app.company_name.toLowerCase().trim()}`
          )
        );

        // Filtrar las filas del CSV que ya existen en localStorage
        const finalRowsToInsert = parsedRows.map(row => ({
          ...row,
          id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
          created_at: new Date().toISOString(),
          user_id: userId
        })).filter(row => {
          const key = `${row.job_title.toLowerCase().trim()}|${row.company_name.toLowerCase().trim()}`;
          return !existingKeys.has(key);
        });

        if (finalRowsToInsert.length === 0) {
          setError('Todas las postulaciones de este archivo ya se encuentran registradas en tu embudo.');
          setLoading(false);
          return;
        }

        // Insertar en local storage (al principio de la lista)
        apps = [...finalRowsToInsert, ...apps];
        localStorage.setItem('jobstack_demo_applications', JSON.stringify(apps));

        setSuccessCount(finalRowsToInsert.length);
        onRefresh();
        setTimeout(() => {
          handleReset();
          onClose();
        }, 2500);
        return;
      }

      // 1. Obtener el user_id del usuario autenticado actual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('No se pudo identificar al usuario autenticado.');

      // 2. Asociar el user_id a cada fila
      const rowsWithUserId = parsedRows.map(row => ({
        ...row,
        user_id: user.id
      }));

      // 3. Consultar las postulaciones existentes en base de datos para este usuario
      const { data: existingApps, error: fetchError } = await supabase
        .from('applications')
        .select('job_title, company_name')
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;

      // Crear un Set de claves existentes en la BD (formato puesto|empresa)
      const existingKeys = new Set(
        (existingApps || []).map(app => 
          `${app.job_title.toLowerCase().trim()}|${app.company_name.toLowerCase().trim()}`
        )
      );

      // Filtrar las filas del CSV que ya existen en la base de datos
      const finalRowsToInsert = rowsWithUserId.filter(row => {
        const key = `${row.job_title.toLowerCase().trim()}|${row.company_name.toLowerCase().trim()}`;
        return !existingKeys.has(key);
      });

      if (finalRowsToInsert.length === 0) {
        setError('Todas las postulaciones de este archivo ya se encuentran registradas en tu embudo.');
        setLoading(false);
        return;
      }

      // 4. Insertar las filas únicas en Supabase en una sola consulta
      const { error: insertError } = await supabase
        .from('applications')
        .insert(finalRowsToInsert);

      if (insertError) throw insertError;

      // 5. Éxito
      setSuccessCount(finalRowsToInsert.length);
      onRefresh();
      
      // Cerrar tras 2.5 segundos para dar feedback visual de éxito
      setTimeout(() => {
        handleReset();
        onClose();
      }, 2500);

    } catch (err: any) {
      console.error('Error al importar en lote:', err);
      setError(err.message || 'Error de base de datos al realizar la inserción. Revisa el esquema.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setParsedRows([]);
    setError(null);
    setSuccessCount(null);
    setDragActive(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Modal isOpen={isOpen} onClose={loading ? () => {} : onClose} title="Importación Inteligente de CSV">
      <div className="space-y-5">
        
        {/* Estado Exitoso */}
        {successCount !== null ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-3 animate-scale-up">
            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">¡Postulaciones Cargadas!</h3>
            <p className="text-sm text-slate-400 max-w-sm">
              Se han insertado con éxito <strong className="text-emerald-400 font-bold">{successCount}</strong> nuevas vacantes. Las repetidas en el archivo o ya existentes fueron omitidas.
            </p>
          </div>
        ) : (
          <>
            {/* Si no se ha cargado ningún archivo */}
            {parsedRows.length === 0 ? (
              <div className="space-y-4">
                
                {/* Zona de Drop */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group ${
                    dragActive 
                      ? 'border-violet-500 bg-violet-650/5 shadow-inner' 
                      : 'border-slate-800 hover:border-slate-700 bg-slate-900/10 hover:bg-slate-900/30'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleChange}
                    className="hidden"
                  />
                  
                  <div className={`p-4.5 rounded-2xl border transition-all mb-4 ${
                    dragActive
                      ? 'bg-violet-500/10 border-violet-500/30 text-violet-400 scale-110'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-400 group-hover:text-slate-200 group-hover:scale-105'
                  }`}>
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  
                  <h3 className="text-sm font-bold text-white mb-1 tracking-tight">
                    Arrastra tu archivo CSV o haz clic
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs mb-3">
                    Admite archivos delimitados por comas (.csv) exportados de Indeed, LinkedIn u hojas de cálculo.
                  </p>
                  
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadCsvTemplate();
                    }}
                    className="mb-4 px-3.5 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-800 hover:border-slate-750 transition-all shadow-md active:scale-95"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-violet-400 animate-pulse" /> Descargar Plantilla CSV
                  </button>

                  <span className="text-[10px] uppercase font-bold tracking-wider px-3 py-1 bg-slate-900/80 border border-slate-850 rounded-full text-slate-400">
                    Mapeo Automático
                  </span>
                </div>

                {/* Formato Soportado Tips */}
                <div className="bg-slate-950/50 rounded-xl border border-slate-900 p-4 space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-violet-400" /> Formato de Cabeceras Recomendado:
                  </span>
                  
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-900/80 space-y-2">
                    <span className="text-slate-500 block uppercase text-[9px] font-bold">Estructura unificada (mismo orden que tu lista web)</span>
                    <div className="flex flex-wrap gap-1 text-[10px] font-mono">
                      {['Fecha', 'Empresa', 'Puesto', 'Modalidad', 'Estado', 'Salario', 'Contacto', 'Próximo Paso', 'Fecha Próximo Paso', 'Link', 'Valoración', 'Tags', 'Ubicación', 'Notas', 'Última Actualización'].map(h => (
                        <span key={h} className="px-1.5 py-0.5 bg-slate-900 text-slate-350 rounded border border-slate-850">{h}</span>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              // Si ya se ha parseado con éxito
              <div className="space-y-4">
                
                {/* Cabecera del Preview */}
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-violet-500/10 text-violet-400 rounded-lg border border-violet-500/20">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Registros Encontrados</h3>
                      <p className="text-[10px] text-slate-400">Previsualizando las postulaciones listas para importar</p>
                    </div>
                  </div>
                  
                  <span className="px-2.5 py-1 bg-violet-600/20 text-violet-300 border border-violet-500/20 rounded-full font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {parsedRows.length} Únicas en CSV
                  </span>
                </div>

                {/* Tabla de Preview */}
                <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-850 bg-slate-950/40">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-900 bg-slate-950 text-slate-500 font-bold uppercase">
                        <th className="px-4 py-2 w-1/2">Puesto</th>
                        <th className="px-4 py-2">Empresa</th>
                        <th className="px-4 py-2">Modalidad</th>
                        <th className="px-4 py-2">Portal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-slate-300 font-medium">
                      {parsedRows.slice(0, 10).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/10">
                          <td className="px-4 py-2.5 truncate max-w-40 font-bold text-white">{row.job_title}</td>
                          <td className="px-4 py-2.5 truncate max-w-32">{row.company_name}</td>
                          <td className="px-4 py-2.5">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                              row.tipo === 'remoto' 
                                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/15' 
                                : row.tipo === 'hibrido'
                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/15'
                                : 'bg-slate-500/10 text-slate-400 border border-slate-500/15'
                            }`}>
                              {row.tipo}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="px-1.5 py-0.2 bg-slate-900 border border-slate-850 text-slate-400 rounded text-[9px] font-bold uppercase">
                              {row.portal || 'Indeed'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {parsedRows.length > 10 && (
                    <div className="p-2.5 text-center bg-slate-950 text-slate-500 text-[10px] font-bold border-t border-slate-900 uppercase tracking-wider">
                      + {parsedRows.length - 10} filas adicionales no mostradas en la previsualización
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex gap-3 justify-end pt-2">
                  <button
                    onClick={handleReset}
                    disabled={loading}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 bg-slate-900/20 hover:bg-slate-900/40 text-xs font-semibold tracking-wide transition-all disabled:opacity-50"
                  >
                    Cargar otro archivo
                  </button>

                  <button
                    onClick={handleImportSubmit}
                    disabled={loading}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 text-white shadow-lg shadow-violet-500/10 hover:shadow-violet-500/20 hover:from-violet-550 hover:to-indigo-450 border border-violet-400/20 text-xs font-bold tracking-wide flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>GUARDANDO EN SUPABASE...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>CONFIRMAR E IMPORTAR</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            )}
            
            {/* Mensaje de Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs flex items-start gap-2.5 animate-slide-up">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <div className="space-y-0.5">
                  <span className="font-bold">Error de Proceso</span>
                  <p className="text-red-400/80 leading-relaxed font-medium">{error}</p>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </Modal>
  );
};

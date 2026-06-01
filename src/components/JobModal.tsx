import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Application, TipoModalidad } from '../types';
import { Building, Link2, AlertCircle, CheckCircle, Sparkles, Loader2, Star } from 'lucide-react';

// Función para parsear y limpiar el título y compañía de anuncios de empleo
const parseTitleAndCompany = (rawTitle: string, url: string) => {
  let title = rawTitle;
  let company = "";

  const lowerUrl = url.toLowerCase();
  
  title = title.replace(/\s*\|\s*.*$/i, ''); // Remueve "| Portal"
  title = title.replace(/\s*-\s*.*$/i, ''); // Remueve "- Portal" o "- Lugar"
  
  if (lowerUrl.includes('linkedin.com')) {
    if (title.includes(' hiring ')) {
      const parts = title.split(' hiring ');
      company = parts[0];
      title = parts[1];
    } else if (title.includes(' contratando ')) {
      const parts = title.split(' contratando ');
      company = parts[0];
      title = parts[1];
    } else if (title.includes(' at ')) {
      const lastIndex = title.lastIndexOf(' at ');
      company = title.substring(lastIndex + 4);
      title = title.substring(0, lastIndex);
    } else if (title.includes(' en ')) {
      const lastIndex = title.lastIndexOf(' en ');
      company = title.substring(lastIndex + 4);
      title = title.substring(0, lastIndex);
    }
  } else if (lowerUrl.includes('computrabajo.com')) {
    title = title.replace(/^Empleo de\s+/i, '');
    if (title.includes(' en ')) {
      const parts = title.split(' en ');
      title = parts[0];
      company = parts[1];
    }
  } else if (lowerUrl.includes('getonbrd') || lowerUrl.includes('getonboard')) {
    if (title.includes(' en ')) {
      const parts = title.split(' en ');
      title = parts[0];
      company = parts[1];
    }
  } else if (lowerUrl.includes('indeed.com')) {
    const parts = title.split(' - ');
    if (parts.length >= 2) {
      title = parts[0];
      company = parts[1];
    }
  } else {
    if (title.includes(' en ')) {
      const lastIndex = title.lastIndexOf(' en ');
      company = title.substring(lastIndex + 4);
      title = title.substring(0, lastIndex);
    } else if (title.includes(' at ')) {
      const lastIndex = title.lastIndexOf(' at ');
      company = title.substring(lastIndex + 4);
      title = title.substring(0, lastIndex);
    }
  }

  company = company.split(/[\-\|]/)[0].trim();
  title = title.trim();

  return { title, company };
};

const parseFromUrlPath = (url: string) => {
  try {
    const cleanUrl = url.trim();
    const parsedUrl = new URL(cleanUrl);
    const pathname = parsedUrl.pathname;
    const hostname = parsedUrl.hostname.toLowerCase();
    
    let title = "";
    let company = "";

    // 1. LinkedIn: e.g. /jobs/view/desarrollador-react-senior-at-globant-36879890
    if (hostname.includes('linkedin.com')) {
      const match = pathname.match(/\/jobs\/view\/([^\/]+)/) || pathname.match(/\/jobs\/([^\/]+)/);
      if (match && match[1]) {
        let slug = match[1];
        slug = slug.replace(/-\d+$/, ''); // Quitar ID final si son números
        
        if (slug.includes('-at-')) {
          const parts = slug.split('-at-');
          title = parts[0].replace(/-/g, ' ');
          company = parts[1].replace(/-/g, ' ');
        } else if (slug.includes('-en-')) {
          const parts = slug.split('-en-');
          title = parts[0].replace(/-/g, ' ');
          company = parts[1].replace(/-/g, ' ');
        } else {
          title = slug.replace(/-/g, ' ');
        }
      }
    }
    
    // 2. GetOnBoard: e.g. /jobs/programming/desarrollador-react-senior-nombre-empresa
    else if (hostname.includes('getonbrd') || hostname.includes('getonboard')) {
      const parts = pathname.split('/').filter(Boolean);
      if (parts.length >= 1) {
        const slug = parts[parts.length - 1];
        const slugParts = slug.split('-');
        if (slugParts.length >= 2) {
          company = slugParts[slugParts.length - 1].replace(/-/g, ' ');
          title = slugParts.slice(0, slugParts.length - 1).join(' ').replace(/-/g, ' ');
        } else {
          title = slug.replace(/-/g, ' ');
        }
      }
    }
    
    // 3. Computrabajo: e.g. /ofertas-de-trabajo/oferta-de-trabajo-de-desarrollador-react-en-lima-12345
    else if (hostname.includes('computrabajo')) {
      const match = pathname.match(/\/ofertas-de-trabajo\/([^\/]+)/) || pathname.match(/\/oferta-de-trabajo-de-([^\/]+)/);
      if (match && match[1]) {
        let slug = match[1];
        slug = slug.replace(/-\d+$/, ''); 
        slug = slug.replace(/^oferta-de-trabajo-de-/i, '');
        if (slug.includes('-en-')) {
          const parts = slug.split('-en-');
          title = parts[0].replace(/-/g, ' ');
        } else {
          title = slug.replace(/-/g, ' ');
        }
      }
    }

    // 4. Fallback genérico para cualquier sitio: dividir el slug del final de la URL
    if (!title) {
      const parts = pathname.split('/').filter(Boolean);
      if (parts.length > 0) {
        let slug = parts[parts.length - 1];
        slug = slug.replace(/-\d+$/, '').replace(/_\d+$/, '');
        if (slug.includes('-at-')) {
          const partsSlug = slug.split('-at-');
          title = partsSlug[0].replace(/-/g, ' ').replace(/_/g, ' ');
          company = partsSlug[1].replace(/-/g, ' ').replace(/_/g, ' ');
        } else if (slug.includes('-en-')) {
          const partsSlug = slug.split('-en-');
          title = partsSlug[0].replace(/-/g, ' ').replace(/_/g, ' ');
          company = partsSlug[1].replace(/-/g, ' ').replace(/_/g, ' ');
        } else {
          title = slug.replace(/-/g, ' ').replace(/_/g, ' ');
        }
      }
    }

    // Capitalizar palabras
    const capitalize = (str: string) => {
      if (!str) return "";
      return str
        .split(' ')
        .filter(Boolean)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    };

    const isJunkWord = (word: string) => {
      const w = word.trim().toLowerCase();
      const junk = [
        'viewjob', 'view', 'jobs', 'job', 'search', 'rc', 'clk', 'post', 'detail', 
        'details', 'oferta', 'ofertas', 'empleo', 'empleos', 'trabajo', 'trabajos', 
        'show', 'display', 'careers', 'career', 'puesto', 'puestos', 'vacante', 'vacantes',
        'viewjob.php', 'viewjob.html', 'blocked', 'block', 'forbidden', 'denied', 'error'
      ];
      if (junk.includes(w)) return true;
      if (/^\d+$/.test(w)) return true;
      if (w.length > 8 && !w.includes(' ') && /^[a-f0-9]+$/i.test(w)) return true;
      return false;
    };

    const finalTitle = isJunkWord(title) ? "" : title;
    const finalCompany = isJunkWord(company) ? "" : company;

    return {
      title: finalTitle ? capitalize(finalTitle) : "",
      company: finalCompany ? capitalize(finalCompany) : ""
    };
  } catch (e) {
    return { title: "", company: "" };
  }
};

const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface JobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  applicationToEdit?: Application | null;
}

export const JobModal: React.FC<JobModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userId,
  applicationToEdit
}) => {
  // Estados del Formulario
  const [companyName, setCompanyName] = useState('');
  const [puesto, setPuesto] = useState('');
  const [estadoFunnel, setEstadoFunnel] = useState('Postulado');
  const [fechaPostulacion, setFechaPostulacion] = useState('');
  const [salarioRango, setSalarioRango] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [contactoInfo, setContactoInfo] = useState('');
  const [accionSeguimiento, setAccionSeguimiento] = useState('');
  const [fechaSeguimiento, setFechaSeguimiento] = useState('');
  const [vacancyUrl, setVacancyUrl] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [tagsList, setTagsList] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [notas, setNotas] = useState('');
  const [tipo, setTipo] = useState<TipoModalidad>('remoto');
  const [ultimaActualizacion, setUltimaActualizacion] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);

  // Estados del scraping/autocompletado
  const [scrapingLoading, setScrapingLoading] = useState(false);
  const [scrapingSuccess, setScrapingSuccess] = useState(false);

  const handleAutocomplete = async () => {
    if (!vacancyUrl || !vacancyUrl.trim().startsWith('http')) {
      setErrorMsg('Por favor ingresa una URL válida (que comience con http:// o https://) antes de autocompletar.');
      setWarningMsg(null);
      return;
    }

    setScrapingLoading(true);
    setScrapingSuccess(false);
    setErrorMsg(null);
    setWarningMsg(null);

    let extractedTitle = '';
    let extractedCompany = '';
    let usedFallback = false;

    try {
      let htmlString = '';
      let success = false;

      // Lista de proxies de CORS gratuitos con parseadores de datos específicos
      const proxyConfigs = [
        {
          name: 'AllOrigins',
          getUrl: (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
          parse: async (res: Response) => {
            const json = await res.json();
            return json.contents || '';
          }
        },
        {
          name: 'CorsProxy.io',
          getUrl: (url: string) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
          parse: async (res: Response) => {
            return await res.text();
          }
        },
        {
          name: 'CorsProxy.org',
          getUrl: (url: string) => `https://corsproxy.org/?${encodeURIComponent(url)}`,
          parse: async (res: Response) => {
            return await res.text();
          }
        },
        {
          name: 'ThingProxy',
          getUrl: (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`,
          parse: async (res: Response) => {
            return await res.text();
          }
        },
        {
          name: 'CodeTabs',
          getUrl: (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
          parse: async (res: Response) => {
            return await res.text();
          }
        }
      ];

      for (const proxy of proxyConfigs) {
        try {
          const proxyUrl = proxy.getUrl(vacancyUrl.trim());
          const response = await fetch(proxyUrl, { 
            method: 'GET',
            headers: { 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9' }
          });
          
          if (!response.ok) {
            console.warn(`Proxy ${proxy.name} respondió con estado ${response.status}. Probando el siguiente...`);
            continue;
          }

          const parsedContent = await proxy.parse(response);
          if (parsedContent && parsedContent.trim().length > 100) {
            htmlString = parsedContent;
            success = true;
            console.log(`Extracción exitosa usando proxy: ${proxy.name}`);
            break;
          }
        } catch (e) {
          console.warn(`Error al intentar consultar a través de ${proxy.name}:`, e);
        }
      }

      if (success && htmlString) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');

        const isBlockPage = (titleStr: string) => {
          const lower = titleStr.toLowerCase();
          return lower.includes('cloudflare') || 
                 lower.includes('attention required') || 
                 lower.includes('just a moment') || 
                 lower.includes('robot check') || 
                 lower.includes('access denied') ||
                 lower.includes('seguridad') ||
                 lower.includes('blocked') ||
                 lower.includes('block') ||
                 lower.includes('forbidden') ||
                 lower.includes('denied') ||
                 lower.includes('unauthorized') ||
                 lower.includes('unusual traffic') ||
                 lower.includes('security');
        };

        const docTitle = doc.title || '';

        if (!isBlockPage(docTitle)) {
          const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
          
          const findJobPosting = (obj: any): any => {
            if (!obj) return null;
            if (typeof obj === 'object') {
              if (obj['@type'] === 'JobPosting') return obj;
              if (Array.isArray(obj)) {
                for (const item of obj) {
                  const found = findJobPosting(item);
                  if (found) return found;
                }
              }
              if (obj['@graph']) {
                return findJobPosting(obj['@graph']);
              }
            }
            return null;
          };

          for (const script of Array.from(jsonLdScripts)) {
            try {
              const parsedJson = JSON.parse(script.textContent || '');
              const jobPosting = findJobPosting(parsedJson);

              if (jobPosting) {
                if (jobPosting.title) extractedTitle = jobPosting.title;
                if (jobPosting.hiringOrganization) {
                  if (typeof jobPosting.hiringOrganization === 'string') {
                    extractedCompany = jobPosting.hiringOrganization;
                  } else if (jobPosting.hiringOrganization.name) {
                    extractedCompany = jobPosting.hiringOrganization.name;
                  }
                }
                break;
              }
            } catch (e) {
              // Continuar
            }
          }

          const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
                          doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content') ||
                          docTitle;

          if (ogTitle && (!extractedTitle || !extractedCompany)) {
            const parsed = parseTitleAndCompany(ogTitle, vacancyUrl);
            if (!extractedTitle) extractedTitle = parsed.title;
            if (!extractedCompany) extractedCompany = parsed.company;
          }

          // Doble verificación para evitar guardar texto de bloqueo de proxy como puesto o empresa
          if (isBlockPage(extractedTitle)) extractedTitle = "";
          if (isBlockPage(extractedCompany)) extractedCompany = "";
        }
      }
    } catch (err: any) {
      console.warn('Scraping error, trying fallback parser:', err);
    }

    // Si falló el scraping o fue bloqueado, intentamos el parseo directo por la estructura de la URL
    if (!extractedTitle || !extractedCompany) {
      const fallbackParsed = parseFromUrlPath(vacancyUrl);
      if (fallbackParsed.title || fallbackParsed.company) {
        extractedTitle = fallbackParsed.title || extractedTitle;
        extractedCompany = fallbackParsed.company || extractedCompany;
        usedFallback = true;
      }
    }

    if (extractedTitle) setPuesto(extractedTitle.trim());
    if (extractedCompany) setCompanyName(extractedCompany.trim());

    if (extractedTitle || extractedCompany) {
      setScrapingSuccess(true);
      if (usedFallback) {
        setWarningMsg('Nota: Los datos se aproximaron desde la URL ya que la plataforma bloqueó la consulta automática directa.');
        setErrorMsg(null);
      } else {
        setWarningMsg(null);
        setErrorMsg(null);
      }
      setTimeout(() => {
        setScrapingSuccess(false);
      }, 3500);
    } else {
      setWarningMsg(null);
      setErrorMsg('No se pudieron extraer datos automáticos de este enlace. Por favor, rellena los campos manualmente.');
    }

    setScrapingLoading(false);
  };

  // Inicializar o limpiar campos si se abre en modo agregar o editar
  useEffect(() => {
    if (applicationToEdit) {
      setCompanyName(applicationToEdit.company_name || '');
      setPuesto(applicationToEdit.puesto || applicationToEdit.job_title || '');
      setEstadoFunnel(applicationToEdit.estado_funnel || 'Postulado');
      setFechaPostulacion(applicationToEdit.fecha_postulacion || getLocalDateString());
      setSalarioRango(applicationToEdit.salario_rango || '');
      setUbicacion(applicationToEdit.ubicacion || '');
      setContactoInfo(applicationToEdit.contacto_info || '');
      setAccionSeguimiento(applicationToEdit.accion_seguimiento || '');
      setFechaSeguimiento(applicationToEdit.fecha_seguimiento || '');
      setVacancyUrl(applicationToEdit.vacancy_url || applicationToEdit.url_vacante || '');
      setRating(applicationToEdit.rating || 0);
      setTagsList(applicationToEdit.tags ? applicationToEdit.tags.split(',').map(t => t.trim()).filter(Boolean) : []);
      setNotas(applicationToEdit.notas || applicationToEdit.notas_texto || '');
      setTagInput('');
      setTipo(applicationToEdit.tipo || applicationToEdit.modalidad as TipoModalidad || 'remoto');
      setUltimaActualizacion(applicationToEdit.ultima_actualizacion || getLocalDateString());
    } else {
      setCompanyName('');
      setPuesto('');
      setEstadoFunnel('Postulado');
      setFechaPostulacion(getLocalDateString());
      setSalarioRango('');
      setUbicacion('');
      setContactoInfo('');
      setAccionSeguimiento('');
      setFechaSeguimiento('');
      setVacancyUrl('');
      setRating(0);
      setTagsList([]);
      setTagInput('');
      setNotas('');
      setTipo('remoto');
      setUltimaActualizacion(getLocalDateString());
    }
    setErrorMsg(null);
    setWarningMsg(null);
  }, [applicationToEdit, isOpen]);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const cleanTag = tagInput.trim();
      if (cleanTag && !tagsList.includes(cleanTag)) {
        setTagsList([...tagsList, cleanTag]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTagsList(tagsList.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!puesto.trim() || !companyName.trim()) {
      setErrorMsg('El título del puesto y el nombre de la empresa son requeridos.');
      setWarningMsg(null);
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setWarningMsg(null);

    try {
      const payload = {
        user_id: userId,
        company_name: companyName.trim(),
        puesto: puesto.trim(),
        job_title: puesto.trim(),
        estado_funnel: estadoFunnel,
        estado: estadoFunnel,
        fecha_postulacion: fechaPostulacion || null,
        salario_rango: salarioRango.trim() || null,
        ubicacion: ubicacion.trim() || null,
        contacto_info: contactoInfo.trim() || null,
        accion_seguimiento: accionSeguimiento.trim() || null,
        fecha_seguimiento: fechaSeguimiento || null,
        ultima_actualizacion: ultimaActualizacion || getLocalDateString(),
        vacancy_url: vacancyUrl.trim() || null,
        url_vacante: vacancyUrl.trim() || null,
        rating: rating,
        tags: tagsList.join(','),
        notas: notas.trim() || null,
        notas_texto: notas.trim() || null,
        tipo,
        modalidad: tipo,
      };

      if (userId === 'demo-user-id') {
        const localData = localStorage.getItem('jobstack_demo_applications');
        let apps: any[] = localData ? JSON.parse(localData) : [];

        if (applicationToEdit) {
          apps = apps.map(app => 
            app.id === applicationToEdit.id 
              ? { ...app, ...payload } 
              : app
          );
        } else {
          const duplicate = apps.some(app => 
            (app.puesto || '').toLowerCase().trim() === puesto.trim().toLowerCase() &&
            (app.company_name || '').toLowerCase().trim() === companyName.trim().toLowerCase()
          );

          if (duplicate) {
            setErrorMsg('Ya tienes registrada una postulación para este puesto en esta empresa.');
            setLoading(false);
            return;
          }

          const newApp = {
            id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
            created_at: new Date().toISOString(),
            ...payload
          };
          apps.unshift(newApp);
        }

        localStorage.setItem('jobstack_demo_applications', JSON.stringify(apps));
        onSuccess();
        onClose();
        return;
      }

      if (applicationToEdit) {
        // Modo Edición: UPDATE
        const { error } = await supabase
          .from('applications')
          .update(payload)
          .eq('id', applicationToEdit.id);

        if (error) throw error;
      } else {
        // Modo Creación: INSERT
        const { data: existing, error: checkError } = await supabase
          .from('applications')
          .select('id')
          .eq('user_id', userId)
          .eq('company_name', companyName.trim())
          .ilike('puesto', puesto.trim())
          .maybeSingle();

        if (checkError) throw checkError;

        if (existing) {
          setErrorMsg('Ya tienes registrada una postulación para este puesto en esta empresa.');
          setLoading(false);
          return;
        }

        const { error } = await supabase
          .from('applications')
          .insert([payload]);

        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar la postulación.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMsg && (
        <div className="flex items-start gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm animate-slide-up">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {warningMsg && (
        <div className="flex items-start gap-2.5 p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-sm animate-slide-up">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-400" />
          <span>{warningMsg}</span>
        </div>
      )}

      {/* Grid de campos en dos columnas tal y como se ve en la imagen */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        
        {/* Row 1: Empresa * | Puesto * */}
        <div>
          <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Empresa *</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder-slate-650 focus:outline-none focus:ring-1.5 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm"
            placeholder="ej. Google"
          />
        </div>
        <div>
          <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Puesto *</label>
          <input
            type="text"
            value={puesto}
            onChange={(e) => setPuesto(e.target.value)}
            required
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder-slate-655 focus:outline-none focus:ring-1.5 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm"
            placeholder="ej. Frontend Engineer"
          />
        </div>

        {/* Row 2: Estado | Fecha aplicación */}
        <div>
          <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Estado</label>
          <select
            value={estadoFunnel}
            onChange={(e) => setEstadoFunnel(e.target.value)}
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1.5 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm cursor-pointer"
          >
            <option value="Postulado">Postulado</option>
            <option value="En revisión">En revisión</option>
            <option value="Entrevista">Entrevista</option>
            <option value="Prueba Técnica">Prueba Técnica</option>
            <option value="Rechazado">Rechazado</option>
            <option value="Oferta">Oferta</option>
            <option value="Cerrado">Cerrado</option>
          </select>
        </div>
        <div>
          <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Fecha aplicación</label>
          <input
            type="date"
            value={fechaPostulacion}
            onChange={(e) => setFechaPostulacion(e.target.value)}
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:ring-1.5 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm"
          />
        </div>

        {/* Row 3: Salario | Ubicación */}
        <div>
          <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Salario</label>
          <input
            type="text"
            value={salarioRango}
            onChange={(e) => setSalarioRango(e.target.value)}
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder-slate-655 focus:outline-none focus:ring-1.5 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm"
            placeholder="ej. $50k - $70k"
          />
        </div>
        <div>
          <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Ubicación</label>
          <input
            type="text"
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder-slate-655 focus:outline-none focus:ring-1.5 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm"
            placeholder="ej. Remoto / Lima, Perú"
          />
        </div>

        {/* Row 4: Modalidad | Contacto */}
        <div>
          <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Modalidad</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoModalidad)}
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1.5 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm cursor-pointer"
          >
            <option value="remoto">Remoto</option>
            <option value="hibrido">Híbrido</option>
            <option value="presencial">Presencial</option>
          </select>
        </div>
        <div>
          <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Contacto</label>
          <input
            type="text"
            value={contactoInfo}
            onChange={(e) => setContactoInfo(e.target.value)}
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder-slate-655 focus:outline-none focus:ring-1.5 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm"
            placeholder="Nombre, email o canal"
          />
        </div>

        {/* Row 5: Próximo paso | Fecha próximo paso */}
        <div>
          <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Próximo paso</label>
          <input
            type="text"
            value={accionSeguimiento}
            onChange={(e) => setAccionSeguimiento(e.target.value)}
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder-slate-655 focus:outline-none focus:ring-1.5 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm"
            placeholder="ej. Enviar prueba técnica"
          />
        </div>
        <div>
          <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Fecha próximo paso</label>
          <input
            type="date"
            value={fechaSeguimiento}
            onChange={(e) => setFechaSeguimiento(e.target.value)}
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:ring-1.5 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm"
          />
        </div>
        <div>
          <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Última actualización</label>
          <input
            type="date"
            value={ultimaActualizacion}
            onChange={(e) => setUltimaActualizacion(e.target.value)}
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:ring-1.5 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm"
          />
        </div>
      </div>

      {/* Row 6: Link de la vacante */}
      <div className="relative">
        <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5 flex justify-between items-center">
          <span>Link de la vacante</span>
          {vacancyUrl && vacancyUrl.trim().startsWith('http') && (
            <button
              type="button"
              onClick={handleAutocomplete}
              disabled={scrapingLoading}
              className="text-[10px] font-bold text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1 focus:outline-none"
            >
              {scrapingLoading ? (
                <Loader2 className="w-3 h-3 animate-spin text-violet-400" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              <span>Autocompletar puesto y empresa</span>
            </button>
          )}
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-600 pointer-events-none">
            <Link2 className="w-4 h-4" />
          </span>
          <input
            type="url"
            value={vacancyUrl}
            onChange={(e) => {
              setVacancyUrl(e.target.value);
              const lower = e.target.value.toLowerCase();
              if (!lower) return;
            }}
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-white placeholder-slate-655 focus:outline-none focus:ring-1.5 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm"
            placeholder="https://..."
          />
        </div>
      </div>

      {/* Row 7: Evaluación post-entrevista */}
      <div>
        <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Evaluación post-entrevista</label>
        <div className="flex items-center gap-1.5 mt-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="focus:outline-none transition-all duration-150 hover:scale-110 active:scale-95"
            >
              <Star
                className={`w-5 h-5 transition-colors ${
                  star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700 hover:text-slate-500'
                }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <button
              type="button"
              onClick={() => setRating(0)}
              className="text-[10px] text-slate-500 hover:text-slate-400 ml-2 font-semibold"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Row 8: Tags */}
      <div>
        <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Tags</label>
        {tagsList.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2 animate-fade-in">
            {tagsList.map((tag) => (
              <span key={tag} className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-violet-400 hover:text-violet-300 font-bold ml-1 text-[11px] focus:outline-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleAddTag}
          className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder-slate-655 focus:outline-none focus:ring-1.5 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm"
          placeholder="urgente, remoto, referido... Enter para agregar"
        />
      </div>

      {/* Row 9: Notas */}
      <div className="pb-2">
        <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Notas</label>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={3}
          className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder-slate-655 focus:outline-none focus:ring-1.5 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm resize-none"
          placeholder="Añade recordatorios, detalles conversados..."
        />
      </div>

      {/* Botones de acción (Unificados, con gran holgura y sin bordes toscos) */}
      <div className="flex items-center justify-end gap-4 pt-6 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-8 py-3 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900/60 transition-colors text-sm font-bold"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={loading}
          className="px-10 py-3 rounded-xl text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all text-sm font-bold flex items-center gap-2.5 shadow-lg shadow-violet-500/10 active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Guardando...</span>
            </>
          ) : (
            <span>Guardar</span>
          )}
        </button>
      </div>
    </form>
  );
};

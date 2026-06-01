Título de la Misión: Desarrollo del MVP de "JobStack" - Rastreador de Embudo de Postulaciones Laborales
Contexto del Proyecto:
Deseo construir una aplicación web personal para gestionar mi proceso de búsqueda de empleo en el sector tecnológico. La aplicación debe centralizar las postulaciones que realizo en plataformas como LinkedIn, Indeed, Computrabajo, bolsas de trabajo internas, etc. El diseño debe ser minimalista, técnico y altamente funcional.

Tecnologías Requeridas:

Framework Frontend: React (con TypeScript)

UI Library: Tailwind CSS para un diseño limpio.

Base de Datos/Backend: Supabase (PostgreSQL). Debes usar el SDK de Supabase para JavaScript/TypeScript.

Especificaciones Técnicas y de Datos:

1. Modelo de Datos (Esquema de Supabase/PostgreSQL):
Crear una tabla llamada applications con los siguientes campos y restricciones:

id: UUID, clave primaria, generación automática.

created_at: Timestamp con zona horaria, por defecto ahora.

user_id: UUID, referencia a la tabla de autenticación de Supabase (obligatorio para privacidad).

fecha_registro: DATE, por defecto la fecha actual.

job_title: VARCHAR(255), no nulo (ej. "Desarrollador Fullstack").

company_name: VARCHAR(255), no nulo.

vacancy_url: TEXT, opcional (link a la vacante).

portal: VARCHAR(100), opcional (ej. "LinkedIn", "Indeed").

tipo: ENUM o VARCHAR, valores restrictivos: presencial, hibrido, remoto. No nulo.

ubicacion: VARCHAR(100), por defecto "Peru".

perfil: ENUM o VARCHAR, valores restrictivos: Butcamp, Universidad. No nulo.

postulacion_estado: ENUM o VARCHAR, valores restrictivos: Sin empezar, Listo. Por defecto Sin empezar.

estado_funnel: ENUM o VARCHAR, valores restrictivos: en espera, no continua, entrevista_screening, entrevista_tecnica, oferta. Por defecto en espera.

notas_texto: TEXT, opcional.

prueba_psicometrica_url: TEXT, opcional.

prueba_tecnica_url: TEXT, opcional.

2. Funcionalidades del Frontend (MVP):

Autenticación: Implementar un flujo de login simple usando Supabase Auth (email/password) para proteger la ruta de la aplicación.

Vista Principal (Dashboard):

Replicar la estética de tabla ordenada de la imagen de referencia (Notion).

Debe mostrar las postulaciones en una tabla dinámica.

Cada estado (tipo, perfil, postulacion, estado_funnel) debe visualizarse con etiquetas de colores, similar a la referencia.

Ingreso de Datos: Un formulario limpio y modal para añadir una nueva postulación con todos los campos definidos en el modelo de datos.

Actualización de Estado: Permitir editar rápidamente el estado_funnel y postulacion_estado desde la tabla, idealmente mediante un menú desplegable integrado en la fila.

Filtros: Añadir filtros rápidos sobre la tabla por estado_funnel y tipo.

Entregables:

Esquema SQL de la tabla applications listo para ejecutar en Supabase.

Estructura de carpetas del proyecto frontend.

Componentes React/Vue funcionales e integrados con Supabase.

Un archivo README.md con instrucciones precisas para configurar las variables de entorno de Supabase y ejecutar la app localmente.
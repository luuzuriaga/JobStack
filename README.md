# JobStack - Rastreador de Embudo de Postulaciones Laborales 🚀

**JobStack** es una aplicación web personal y técnica diseñada para centralizar, gestionar y optimizar visualmente tu proceso de búsqueda de empleo en el sector tecnológico. Con una estética minimalista, oscura y de alta fidelidad, permite organizar las vacantes a las que postulas a través de múltiples vistas, métricas interactivas y sincronización en tiempo real.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 19 (TypeScript) con Vite.
- **Estilos**: Tailwind CSS v3 con una paleta de colores HSL premium (*Outfit* y *Plus Jakarta Sans* como fuentes principales).
- **Iconos**: Lucide React.
- **Base de Datos / Backend**: Supabase (PostgreSQL) con autenticación integrada.
- **Procesamiento de Archivos**: SheetJS (`xlsx`) para exportación limpia y parser robusto personalizado para importación de CSV.

---

## ✨ Características Destacadas

### 1. Vistas Dinámicas e Interactivas
- 🏠 **Panel de Bienvenida (`HomeView`)**: Resumen de indicadores clave, accesos directos a las vistas, estadísticas rápidas de tu embudo y un desglose amigable de tu actividad.
- 📋 **Tabla Estilo Notion (`JobTable`)**: Una réplica premium de Notion con filas interactivas, edición rápida en línea de estados, valoraciones con estrellas, etiquetas de colores y scroll fluido.
- 🗂️ **Tablero Kanban (`KanbanBoard`)**: Pipeline visual estructurado según las etapas de tu embudo. Permite arrastrar, soltar o mover rápidamente las tarjetas de postulaciones de una columna a otra.
- 📅 **Calendario de Seguimientos (`CalendarView`)**: Visualización mensual integrada de las fechas de postulación y, sobre todo, las fechas de seguimiento y llamadas programadas.
- 📊 **Métricas Avanzadas (`AnalyticsView`)**: Reportes visuales en tiempo real sobre tu proceso, incluyendo distribución por modalidad, portales más exitosos, rangos salariales estimados y tasas de conversión del embudo.
- 🔑 **Administrador de Portales (`PortalesView`)**: Tablero para registrar y consultar las plataformas, empresas o bolsas de trabajo donde te has registrado, el correo utilizado en cada uno, enlaces de acceso rápido y rubros.

### 2. Sincronización y Respaldo de Datos
- 📤 **Exportación a Excel**: Descarga toda tu información filtrada a un archivo `.xlsx` limpio y con columnas autoajustadas en un clic.
- 📥 **Importador Inteligente de CSV**: Sube archivos CSV desde LinkedIn, Indeed o plantillas personalizadas. Cuenta con mapeo automático de cabeceras en español e inglés y prevención de duplicados.
- 💾 **Modo Demo (Offline)**: Permite probar la aplicación al 100% de forma instantánea usando el `LocalStorage` del navegador, sin necesidad de configurar Supabase inicialmente.

---

## 📂 Estructura del Proyecto

```
JobStack/
├── src/
│   ├── assets/              # Recursos gráficos y fuentes
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Badge.tsx            # Etiquetas Notion-style con colores HSL armonizados
│   │   │   └── Modal.tsx            # Modal animado con fondo difuminado (glassmorphism)
│   │   ├── AnalyticsView.tsx        # Métricas, distribución y promedios de sueldos
│   │   ├── Auth.tsx                 # Formulario de autenticación premium (Login/Registro)
│   │   ├── CalendarView.tsx         # Calendario mensual interactivo con alertas
│   │   ├── CsvImportModal.tsx       # Asistente de importación con drag-and-drop y preview
│   │   ├── Dashboard.tsx            # Contenedor principal de la aplicación y enrutamiento interno
│   │   ├── HomeView.tsx             # Panel de bienvenida y accesos rápidos
│   │   ├── JobModal.tsx             # Formulario detallado de creación/edición de postulaciones
│   │   ├── JobTable.tsx             # Tabla dinámica e interactiva con filtros y búsqueda
│   │   ├── KanbanBoard.tsx          # Tablero de columnas por estado del embudo
│   │   ├── PortalesView.tsx         # Gestión de credenciales y accesos de portales
│   │   ├── ResetPassword.tsx        # Flujo de recuperación de contraseñas
│   │   └── StatCards.tsx            # Tarjetas de resumen estadístico del funnel
│   ├── lib/
│   │   └── supabaseClient.ts        # Inicialización del SDK de Supabase con fallbacks de seguridad
│   ├── App.tsx                      # Orquestador principal y observador del estado de autenticación
│   ├── index.css                    # Estilos globales, variables HSL, scrollbars y animaciones
│   ├── main.tsx                     # Punto de entrada de React
│   └── types.ts                     # Definiciones e interfaces de TypeScript
├── supabase/
│   └── migrations/                  # Scripts SQL de base de datos
│       ├── 20260518000000_create_applications.sql
│       ├── 20260518_add_contact_salary_followup_columns.sql
│       ├── 20260524_add_direccion_column.sql
│       ├── 20260524_add_rating_tags_last_update_columns.sql
│       └── 20260609010000_create_portales.sql
├── .env.example                     # Plantilla de variables de entorno
├── tailwind.config.js               # Configuración de Tailwind CSS
├── tsconfig.json                    # Configuración general de TypeScript
└── README.md                        # Guía de instalación y uso (Este archivo)
```

---

## ⚡ Guía de Configuración Paso a Paso

### 1. Clonar el Proyecto y Preparar el Directorio
Clona este repositorio en tu máquina local e ingresa a la carpeta del proyecto en tu terminal.

### 2. Configurar la Base de Datos en Supabase
Para configurar la base de datos de PostgreSQL, puedes ejecutar las migraciones ubicadas en `supabase/migrations/` en orden cronológico en tu panel de control de Supabase:

1. Crea un nuevo proyecto en la [consola de Supabase](https://supabase.com).
2. Dirígete a la sección **SQL Editor** en el panel lateral izquierdo.
3. Abre un editor vacío y ejecuta consecutivamente los siguientes archivos SQL (puedes copiar y pegar el contenido de cada archivo en orden):
   - **`20260518000000_create_applications.sql`**: Crea la tabla de postulaciones principal, restringe los enums y habilita las políticas RLS.
   - **`20260518_add_contact_salary_followup_columns.sql`**: Agrega las columnas para guardar información de contacto (HR), rangos salariales y fecha del próximo seguimiento.
   - **`20260524_add_direccion_column.sql`**: Agrega la columna de dirección física.
   - **`20260524_add_rating_tags_last_update_columns.sql`**: Agrega columnas para rating (estrellas), tags personalizados y última fecha de actualización.
   - **`20260609010000_create_portales.sql`**: Crea la tabla `portales` para el registro de accesos en diferentes plataformas.

*Nota: Alternativamente, si tienes configurado el Supabase CLI localmente, puedes enlazar tu proyecto con `supabase link --project-ref <tu-proyecto-id>` y aplicar los cambios ejecutando `supabase db push`.*

### 3. Configurar la Autenticación
1. En la consola de Supabase, ve a **Authentication** > **Providers** > **Email**.
2. Habilita el proveedor. Para pruebas locales más ágiles, puedes desactivar la opción **Confirm email** (de esta manera, los usuarios podrán registrarse e iniciar sesión de inmediato sin requerir verificación por correo).

### 4. Configurar las Variables de Entorno
1. Crea un archivo `.env` en la raíz de tu proyecto basándote en la plantilla de ejemplo:
   ```bash
   cp .env.example .env
   ```
2. Obtén tus credenciales de Supabase en **Project Settings** > **API**.
3. Reemplaza los valores en tu archivo `.env`:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto-id.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-clave-anonima-publica
   ```

### 5. Instalar y Ejecutar Localmente
1. Instala las dependencias necesarias:
   ```bash
   npm install
   ```
2. Lanza el servidor de desarrollo local:
   ```bash
   npm run dev
   ```
3. Abre en tu navegador la dirección indicada en la terminal (usualmente `http://localhost:5173`).

---

## 📊 Modelo de Datos (Esquema de Supabase)

### Tabla: `applications`
Esta tabla almacena los detalles de cada postulación laboral. Cuenta con Row Level Security (RLS) habilitado para asegurar que los usuarios solo puedan leer, crear o modificar su propio historial.

| Campo | Tipo de Dato | Restricción / Por Defecto |
| :--- | :--- | :--- |
| `id` | `UUID` | Clave Primaria (auto-generada) |
| `created_at` | `TIMESTAMPTZ` | `now()` |
| `user_id` | `UUID` | Relación con `auth.users(id)` |
| `fecha_registro` | `DATE` | `CURRENT_DATE` |
| `job_title` | `VARCHAR(255)` | Requerido |
| `company_name` | `VARCHAR(255)` | Requerido |
| `vacancy_url` | `TEXT` | Opcional |
| `portal` | `VARCHAR(100)` | Opcional |
| `tipo` | `VARCHAR(50)` | `CHECK (tipo IN ('presencial', 'hibrido', 'remoto'))` |
| `ubicacion` | `VARCHAR(100)` | `'Peru'` |
| `perfil` | `VARCHAR(50)` | `CHECK (perfil IN ('Butcamp', 'Universidad'))` |
| `postulacion_estado`| `VARCHAR(50)` | `'Sin empezar' CHECK (IN ('Sin empezar', 'Listo'))` |
| `estado_funnel` | `VARCHAR(50)` | `'Postulado' CHECK (IN ('Postulado', 'En revisión', 'Entrevista', 'Prueba Técnica', 'Rechazado', 'Oferta', 'Cerrado', ...))` |
| `notas_texto` | `TEXT` | Opcional |
| `prueba_psicometrica_url` | `TEXT` | Opcional |
| `prueba_tecnica_url` | `TEXT` | Opcional |
| `contacto_info` | `VARCHAR(255)` | Opcional (Email / Nombre de reclutador) |
| `salario_rango` | `VARCHAR(100)` | Opcional |
| `fecha_seguimiento` | `DATE` | Opcional |
| `direccion` | `VARCHAR(255)` | Opcional |
| `rating` | `INT` | `0` (Estrellas 0-5) |
| `tags` | `TEXT` | Opcional (Separados por comas) |
| `ultima_actualizacion` | `DATE` | Opcional |

### Tabla: `portales`
Esta tabla sirve para gestionar las cuentas y registros que mantienes activos en diversas bolsas y plataformas de empleo.

| Campo | Tipo de Dato | Restricción / Por Defecto |
| :--- | :--- | :--- |
| `id` | `UUID` | Clave Primaria (auto-generada) |
| `created_at` | `TIMESTAMPTZ` | `now()` |
| `user_id` | `UUID` | Relación con `auth.users(id)` |
| `company_name` | `VARCHAR(255)` | Requerido (ej. "LinkedIn") |
| `rubro` | `VARCHAR(255)` | Opcional (ej. "Red Profesional") |
| `link` | `TEXT` | Opcional |
| `correo_registro` | `VARCHAR(255)` | Opcional |
| `fecha` | `DATE` | `CURRENT_DATE` |

---

## 📥 Estructura para Importación CSV
Para importar tus postulaciones de forma masiva, puedes utilizar la plantilla CSV integrada descargable desde la app. La cabecera del archivo CSV debe contener (en cualquier orden, ya que cuenta con mapeo inteligente en inglés y español) las siguientes columnas separadas por comas o punto y coma:

```csv
Fecha,Empresa,Puesto,Modalidad,Estado,Salario,Contacto,Próximo Paso,Fecha Próximo Paso,Link,Valoración,Tags,Ubicación,Notas,Última Actualización
2026-06-09,"Google","React Developer","remoto","Postulado","5000 USD","John Doe (john@recruiter.com)","Llamada de screening","2026-06-11","https://careers.google.com/jobs/example",5,"React,TypeScript,Premium","California, USA","Repasar algoritmos y hooks.","2026-06-09"
```

*Nota: Durante el proceso, el importador de JobStack identificará las columnas por coincidencia aproximada de palabras clave, procesará las fechas flexibles y descartará duplicados de forma inteligente.*

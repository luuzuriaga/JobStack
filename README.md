# JobStack - Rastreador de Embudo de Postulaciones Laborales 🚀

**JobStack** es una aplicación web personal diseñada para centralizar, gestionar y rastrear de forma visual y ágil todo tu proceso de búsqueda de empleo en el sector tecnológico. Permite organizar las vacantes a las que postulas en un dashboard técnico, minimalista y de alta eficiencia.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 19 (TypeScript) con Vite.
- **Estilos**: Tailwind CSS v3 con tipografías premium (*Outfit* y *Plus Jakarta Sans*).
- **Iconos**: Lucide React.
- **Backend / Base de Datos**: Supabase (PostgreSQL) con autenticación integrada.

---

## 📂 Estructura del Proyecto

El proyecto está organizado siguiendo las mejores prácticas de modularidad y escalabilidad:

```
JobStack/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Badge.tsx            # Etiquetas de colores dinámicas (Notion-style)
│   │   │   └── Modal.tsx            # Contenedor de diálogos animados con blur
│   │   ├── Auth.tsx                 # Login y registro estéticamente premium
│   │   ├── Dashboard.tsx            # Contenedor principal y estados de filtros
│   │   ├── JobModal.tsx             # Formulario detallado de añadir/editar vacante
│   │   ├── JobTable.tsx             # Tabla interactiva
│   │   └── StatCards.tsx            # Resumen dinámico del funnel e indicadores
│   ├── lib/
│   │   └── supabaseClient.ts        # Inicialización del SDK de Supabase con fallbacks
│   ├── types.ts                     # Definiciones de tipos en TypeScript
│   ├── App.tsx                      # Orquestador del estado de autenticación
│   ├── index.css                    # Estilos CSS globales, scrollbars y animaciones
│   └── main.tsx                     # Punto de entrada de React
├── .env.example                     # Plantilla de variables de entorno
├── .env                             # Archivo local de variables de entorno (ignorado en git)
├── tailwind.config.js               # Configuración de Tailwind CSS
├── tsconfig.json                    # Configuración de TypeScript
└── README.md                        # Guía de instalación y uso (Este archivo)
```

---

## ⚡ Guía de Configuración Paso a Paso

### 1. Clonar el Proyecto y Preparar el Directorio
Asegúrate de encontrarte en la carpeta raíz del proyecto `JobStack` en tu terminal.

### 2. Configurar la Base de Datos en Supabase
1. Ingresa a tu panel de control en [Supabase Console](https://supabase.com).
2. Crea un nuevo proyecto.
3. Ve a la sección **SQL Editor** en la barra lateral izquierda.
4. Crea una nueva consulta (*New Query*) y ejecuta el código SQL para crear las tablas `empresas`, `estados` y `postulaciones`.
   *(Este código fue proporcionado durante la sesión y crea la estructura limpia de 3 tablas).*

### 3. Habilitar el Proveedor de Autenticación
1. En la consola de Supabase, ve a **Authentication** > **Providers**.
2. Asegúrate de que el proveedor **Email** esté habilitado (con la opción "Confirm email" activa si deseas verificar correos electrónicos, o inactiva para pruebas rápidas).

### 4. Configurar Variables de Entorno
1. En la raíz del proyecto, crea un archivo llamado `.env` basándote en el archivo de ejemplo:
   ```bash
   cp .env.example .env
   ```
2. Obtén tus credenciales de Supabase en la consola del proyecto: **Project Settings** > **API**.
3. Completa los valores en tu archivo `.env`:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto-id.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-llave-anonima-publica
   ```

### 5. Instalar Dependencias y Arrancar la Aplicación
1. Instala todas las dependencias del gestor de paquetes de Node:
   ```bash
   npm install
   ```
2. Arranca el servidor de desarrollo local de Vite:
   ```bash
   npm run dev
   ```
3. Abre tu navegador web en la dirección indicada en la consola (usualmente `http://localhost:5173`).

---

## ✨ Características Destacadas

- **Autenticación Completa**: Inicio de sesión y registro de usuarios directos mediante Supabase Auth.
- **Base de Datos Normalizada**: Estructura limpia de 3 tablas (`empresas`, `estados`, `postulaciones`) para un mejor rendimiento y orden.
- **Campos Específicos Solicitados**:
  - Fecha de Postulación
  - Empresa
  - Puesto
  - Plataforma
  - Estado (Postulado, En revisión, Entrevista, Prueba Técnica, Rechazado, Oferta)
  - Enlace de la vacante
  - Contacto (HR)
  - Salario (Rango)
  - Próximo Seguimiento (Fecha y Acción)
  - Notas
- **Tabla Estilo Notion**: Réplica impecable de las tablas dinámicas de Notion con bordes técnicos limpios y filas con efectos hover.
- **Filtros Dinámicos**: Buscador en tiempo real por texto y filtros rápidos por estado del embudo.

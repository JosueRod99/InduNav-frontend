# InduNav Frontend

Frontend web para InduNav - Sistema de gestión de auditorías y visitas industriales con tours virtuales multiidioma.

## Tecnologías

- **React 18** + **TypeScript**
- **Vite** - Build tool
- **React Router v6** - Routing
- **Zustand** - State management
- **TanStack Query (React Query)** - Data fetching y cache
- **TailwindCSS** - Styling
- **Axios** - HTTP client
- **Leaflet.js** + **React-Leaflet** - Mapas 2D interactivos
- **d3** + **d3-org-chart** - Visualización de organigramas
- **qrcode.react** - Generación de códigos QR
- **React Hot Toast** - Notificaciones
- **Lucide React** - Iconos

## Setup

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto frontend:

```env
VITE_API_URL=http://localhost:3000/api
```

### 3. Iniciar servidor de desarrollo

```bash
npm run dev
```

La app estará corriendo en `http://localhost:5173`

**Nota:** El backend debe estar corriendo en `http://localhost:3000` para que la autenticación funcione.

## Scripts disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Compila la aplicación para producción
- `npm run preview` - Previsualiza el build de producción
- `npm run lint` - Ejecuta el linter

## Estructura del Proyecto

```
frontend/
├── src/
│   ├── api/              # Cliente API y funciones de endpoints
│   │   ├── client.ts     # Instancia de Axios con interceptors
│   │   └── auth.ts       # Funciones API de autenticación
│   ├── components/       # Componentes reutilizables
│   │   ├── ui/          # Componentes UI (Button, Input, etc.)
│   │   └── PrivateRoute.tsx
│   ├── pages/           # Componentes de página
│   │   ├── auth/        # Páginas de autenticación
│   │   │   └── LoginPage.tsx
│   │   └── Dashboard.tsx
│   ├── store/           # Stores de Zustand
│   │   └── authStore.ts
│   ├── types/           # Definiciones TypeScript
│   │   └── index.ts
│   ├── App.tsx          # Componente principal con routing
│   ├── main.tsx         # Punto de entrada
│   └── index.css        # Estilos globales
├── public/              # Assets estáticos
├── index.html           # Template HTML
├── tailwind.config.js   # Configuración TailwindCSS
└── vite.config.ts       # Configuración Vite
```

## Rutas Disponibles

- `/` - Redirige a dashboard (si autenticado) o login
- `/login` - Página de inicio de sesión
- `/dashboard` - Dashboard principal (protegida)

## Funcionalidades Implementadas

### ✅ Core del Sistema
- ✅ Autenticación de usuarios (login/logout)
- ✅ Rutas protegidas con PrivateRoute
- ✅ Estado de autenticación persistente
- ✅ Redirección automática según autenticación
- ✅ Layout principal con sidebar y header
- ✅ Manejo de errores
- ✅ Estados de carga
- ✅ Diseño responsivo
- ✅ Notificaciones con React Hot Toast

### ✅ Gestión de Datos con TanStack Query
- ✅ Cache inteligente de queries
- ✅ Invalidación selectiva de cache
- ✅ Loading/Error states automáticos
- ✅ Mutations con feedback inmediato
- ✅ Background refetching
- ✅ Query keys dinámicas para filtros

### ✅ Módulos Funcionales

#### 1. Organizaciones
- ✅ Listado con tabla profesional
- ✅ CRUD completo (Crear, Leer, Actualizar, Eliminar)
- ✅ Planes: Free, Pro, Enterprise
- ✅ Estados activo/inactivo
- ✅ Slugs únicos generados automáticamente
- ✅ Logos de organización
- ✅ Modal de edición con validación

#### 2. Plantas
- ✅ CRUD completo
- ✅ Filtro por organización
- ✅ Ubicación geográfica
- ✅ Selector de zona horaria (México, USA, Europa)
- ✅ Relación con organizaciones
- ✅ Slugs únicos por organización
- ✅ Estados activo/inactivo

#### 3. Tours
- ✅ CRUD completo
- ✅ Filtro por planta
- ✅ Filtro por visibilidad (público/privado)
- ✅ Tours públicos accesibles sin autenticación
- ✅ Descripción y metadata
- ✅ Slugs únicos por planta
- ✅ Estados activo/inactivo

#### 4. Stops & QR Codes
- ✅ CRUD completo
- ✅ **Soporte multiidioma** (Español/Inglés)
  - Títulos traducidos
  - Descripciones traducidas
  - Audio URLs por idioma
- ✅ **Generación de códigos QR**
  - Visualización en modal
  - Descarga como PNG
  - QR codes únicos por stop
- ✅ Multimedia
  - Imágenes
  - Videos
  - Audios multiidioma
- ✅ Ordenamiento de stops (order_index)
- ✅ Filtro por tour
- ✅ Estados activo/inactivo

### 🎨 Componentes UI Reutilizables
- `Button` - Botones con variantes (primary, outline, etc.)
- `Input` - Campos de entrada con estilos
- `Modal` - Modales con diferentes tamaños
- `Badge` - Insignias de estado (success, error, warning, info)
- `Sidebar` - Navegación lateral
- `Header` - Barra superior con usuario
- `AppLayout` - Layout principal de la app

#### 5. Layout 2D con Leaflet
- ✅ CRUD completo de áreas
- ✅ **Visualización de mapas** con Leaflet.js
  - Soporte para imágenes de planos
  - Zoom y pan interactivo
  - Múltiples pisos (planta baja, pisos 1-3, sótano)
- ✅ **Dibujo de áreas** sobre el plano
  - Modo dibujo con click para puntos
  - Doble click para finalizar polígono
  - Preview en tiempo real
- ✅ **Gestión de áreas**
  - Tipos: General, Producción, Almacén, Oficina, Laboratorio, Restringida
  - Colores personalizables
  - Capacidad y metros cuadrados
  - Sidebar con lista de áreas
- ✅ Selección y edición de áreas
- ✅ Vista por planta y piso
- ✅ Filtros dinámicos

#### 6. Empleados y Organigrama
- ✅ **CRUD completo de empleados**
  - Información personal (nombre, email, teléfono)
  - Información laboral (puesto, departamento, número de empleado)
  - Fecha de contratación
  - Asignación a organización, planta y área
  - Relación jerárquica (reports_to)
  - Estados activo/inactivo
- ✅ **Filtros avanzados**
  - Por organización
  - Por planta
  - Por departamento
  - Búsqueda de texto (nombre, email, número de empleado)
- ✅ **Visualización de Organigrama** con d3-org-chart
  - Visualización jerárquica interactiva
  - Tarjetas personalizadas con información del empleado
  - Controles de zoom (acercar, alejar, ajustar)
  - Diseño responsivo y profesional
  - Colores gradient para mejor presentación
- ✅ **Tabla de empleados**
  - Vista completa con información relevante
  - Columnas: Empleado, #Empleado, Puesto, Departamento, Ubicación, Manager, Estado
  - Acciones rápidas (editar, eliminar)
  - Contador de registros

## Próximos Pasos

- [ ] Gestión de visitas y comentarios
- [ ] Dashboard con analíticas
- [ ] Carga de imágenes y archivos
- [ ] Perfil de usuario
- [ ] Reportes y exportación de datos

## Deploy

### Vercel (Recomendado)

1. Conectar repositorio con Vercel
2. Configurar variables de entorno:
   - `VITE_API_URL`: URL de tu backend en producción
3. Deploy automático en cada push

## Prueba de Login

Una vez que backend y frontend están corriendo:

1. Navega a `http://localhost:5173`
2. Serás redirigido a la página de login
3. Usa las credenciales del usuario seed creado en el backend
4. Al iniciar sesión correctamente, serás redirigido al dashboard


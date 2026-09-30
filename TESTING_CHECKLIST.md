# 📋 Checklist de Revisión y Testing - InduNav Frontend

## 🎯 Propósito
Este documento contiene un checklist exhaustivo de todas las funcionalidades implementadas en el frontend de InduNav. Revisa cada item 1 por 1 para verificar que todo funcione correctamente.

---

## ✅ Estado General
- [ ] Backend corriendo en `http://localhost:3000`
- [ ] Frontend corriendo en `http://localhost:5173`
- [ ] Base de datos configurada y con datos seed
- [ ] Variables de entorno configuradas (`.env` con `VITE_API_URL`)

---

## 🔐 1. AUTENTICACIÓN Y NAVEGACIÓN

### Login
- [ ] Acceder a `http://localhost:5173` redirecciona a `/login`
- [ ] Formulario de login visible
- [ ] Campos: email y password
- [ ] Validación: campos requeridos
- [ ] Login con credenciales correctas funciona
- [ ] Login con credenciales incorrectas muestra error
- [ ] Toast de error visible
- [ ] Redirección a `/dashboard` después de login exitoso
- [ ] Token guardado en localStorage

### Logout
- [ ] Botón de logout visible en Header
- [ ] Click en logout cierra sesión
- [ ] Redirección a `/login` después de logout
- [ ] Token removido de localStorage

### Navegación
- [ ] Sidebar visible en todas las páginas protegidas
- [ ] Header visible con nombre de usuario
- [ ] Links del sidebar:
  - [ ] Dashboard
  - [ ] Organizaciones
  - [ ] Plantas
  - [ ] Tours
  - [ ] Stops & QR
  - [ ] Layout 2D
  - [ ] Empleados
  - [ ] Organigrama
- [ ] Link activo resaltado en sidebar
- [ ] Navegación entre páginas funciona
- [ ] URL actualizada correctamente

### Protección de Rutas
- [ ] Intentar acceder a ruta protegida sin login redirecciona a `/login`
- [ ] Después de login, acceso a todas las rutas protegidas
- [ ] Ruta inexistente redirecciona apropiadamente

---

## 🏢 2. MÓDULO DE ORGANIZACIONES

### Visualización - Lista
- [ ] Acceder a `/organizations`
- [ ] Tabla de organizaciones visible
- [ ] Columnas mostradas:
  - [ ] Logo (placeholder si no tiene)
  - [ ] Nombre
  - [ ] Slug
  - [ ] Plan (badge con color)
  - [ ] Estado (activo/inactivo badge)
  - [ ] Acciones (editar/eliminar)
- [ ] Datos cargados desde API
- [ ] Loading state mientras carga
- [ ] Empty state si no hay organizaciones

### Crear Organización
- [ ] Botón "Nueva Organización" visible
- [ ] Click abre modal
- [ ] Modal título: "Nueva Organización"
- [ ] Campos del formulario:
  - [ ] Nombre (requerido)
  - [ ] Slug (requerido)
  - [ ] Plan (selector: Free/Pro/Enterprise)
  - [ ] Logo URL (opcional)
- [ ] Validación de campos requeridos
- [ ] Crear organización exitosa
- [ ] Toast de éxito visible
- [ ] Modal se cierra
- [ ] Tabla se actualiza automáticamente
- [ ] Nueva organización aparece en lista

### Editar Organización
- [ ] Click en botón editar (lápiz)
- [ ] Modal se abre con datos precargados
- [ ] Modal título: "Editar Organización"
- [ ] Modificar nombre
- [ ] Modificar slug
- [ ] Cambiar plan
- [ ] Cambiar logo URL
- [ ] Guardar cambios exitoso
- [ ] Toast de éxito
- [ ] Modal se cierra
- [ ] Cambios reflejados en tabla

### Eliminar Organización
- [ ] Click en botón eliminar (basura)
- [ ] Confirmación de eliminación aparece
- [ ] Cancelar confirmación no elimina
- [ ] Confirmar eliminación funciona
- [ ] Toast de éxito
- [ ] Organización removida de tabla
- [ ] Error si organización tiene dependencias

### Estados y Validaciones
- [ ] Badge "Activo" en verde
- [ ] Badge "Inactivo" en rojo
- [ ] Badge plan "Free" - color default
- [ ] Badge plan "Pro" - color info
- [ ] Badge plan "Enterprise" - color warning
- [ ] Validación de slug único
- [ ] Manejo de errores de API

---

## 🏭 3. MÓDULO DE PLANTAS

### Visualización - Lista
- [ ] Acceder a `/plants`
- [ ] Tabla de plantas visible
- [ ] Columnas mostradas:
  - [ ] Nombre
  - [ ] Slug
  - [ ] Organización
  - [ ] Ubicación (ciudad, estado, país)
  - [ ] Zona Horaria
  - [ ] Estado (badge)
  - [ ] Acciones
- [ ] Datos cargados correctamente

### Filtros
- [ ] Selector de organización visible arriba
- [ ] "Todas las organizaciones" opción default
- [ ] Seleccionar organización filtra plantas
- [ ] Cambiar organización actualiza tabla
- [ ] Query key cambia con filtro
- [ ] Cache funciona correctamente

### Crear Planta
- [ ] Botón "Nueva Planta" visible
- [ ] Modal se abre
- [ ] Campos del formulario:
  - [ ] Organización (selector, requerido)
  - [ ] Nombre (requerido)
  - [ ] Slug (requerido)
  - [ ] Descripción (opcional)
  - [ ] Ciudad (requerido)
  - [ ] Estado (requerido)
  - [ ] País (requerido)
  - [ ] Zona Horaria (selector con opciones)
- [ ] Selector de zona horaria muestra:
  - [ ] Opciones de México
  - [ ] Opciones de USA
  - [ ] Opciones de Europa
- [ ] Crear planta exitosa
- [ ] Toast de éxito
- [ ] Tabla actualizada

### Editar Planta
- [ ] Click en editar
- [ ] Modal con datos precargados
- [ ] Organización deshabilitada (no editable)
- [ ] Modificar nombre
- [ ] Modificar slug
- [ ] Modificar ubicación
- [ ] Cambiar zona horaria
- [ ] Guardar cambios
- [ ] Toast de éxito
- [ ] Cambios reflejados

### Eliminar Planta
- [ ] Click en eliminar
- [ ] Confirmación aparece
- [ ] Eliminar exitoso
- [ ] Toast de éxito
- [ ] Planta removida

### Estados
- [ ] Icono de ubicación (MapPin) visible
- [ ] Formato de ubicación: "Ciudad, Estado, País"
- [ ] Zona horaria mostrada correctamente
- [ ] Empty state cuando no hay plantas

---

## 🗺️ 4. MÓDULO DE TOURS

### Visualización - Lista
- [ ] Acceder a `/tours`
- [ ] Tabla de tours visible
- [ ] Columnas:
  - [ ] Nombre
  - [ ] Slug
  - [ ] Planta
  - [ ] Visibilidad (badge)
  - [ ] Estado
  - [ ] Acciones

### Filtros Duales
- [ ] Filtro por planta:
  - [ ] "Todas las plantas" default
  - [ ] Listar plantas disponibles
  - [ ] Filtrar por planta funciona
- [ ] Filtro por visibilidad:
  - [ ] "Todos" default
  - [ ] "Público" opción
  - [ ] "Privado" opción
  - [ ] Filtrar funciona
- [ ] Combinar ambos filtros funciona
- [ ] Query keys dinámicas con ambos filtros

### Crear Tour
- [ ] Botón "Nuevo Tour"
- [ ] Modal se abre
- [ ] Campos:
  - [ ] Planta (selector, requerido)
  - [ ] Nombre (requerido)
  - [ ] Slug (requerido)
  - [ ] Descripción (opcional)
  - [ ] Público (checkbox)
- [ ] Checkbox "Público" funciona
- [ ] Crear tour público
- [ ] Crear tour privado
- [ ] Toast de éxito
- [ ] Tour agregado a lista

### Editar Tour
- [ ] Click en editar
- [ ] Datos precargados
- [ ] Planta deshabilitada
- [ ] Modificar nombre
- [ ] Cambiar visibilidad (público/privado)
- [ ] Guardar cambios
- [ ] Cambios reflejados

### Eliminar Tour
- [ ] Eliminar funciona
- [ ] Confirmación aparece
- [ ] Toast de éxito

### Estados
- [ ] Badge "Público" con icono Globe
- [ ] Badge "Privado" con icono EyeOff
- [ ] Colores distintivos en badges
- [ ] Empty state apropiado

---

## 📍 5. MÓDULO DE STOPS & QR CODES

### Visualización - Lista
- [ ] Acceder a `/stops`
- [ ] Tabla de stops visible
- [ ] Columnas:
  - [ ] Nombre (ES)
  - [ ] Tour
  - [ ] Orden
  - [ ] Multimedia (iconos)
  - [ ] QR Code (botón)
  - [ ] Estado
  - [ ] Acciones

### Filtros
- [ ] Filtro por tour funciona
- [ ] "Todos los tours" default
- [ ] Cambiar tour actualiza lista
- [ ] Empty state cuando no hay stops

### Crear Stop - Multiidioma
- [ ] Botón "Nuevo Stop"
- [ ] Modal con tabs de idiomas
- [ ] Tab "Español" activo por default
- [ ] Tab "English" disponible
- [ ] Formulario en tab Español:
  - [ ] Título (requerido)
  - [ ] Descripción (textarea)
  - [ ] URL de Audio
- [ ] Formulario en tab English:
  - [ ] Title (opcional)
  - [ ] Description
  - [ ] Audio URL
- [ ] Campos generales (fuera de tabs):
  - [ ] Tour (selector, requerido)
  - [ ] Orden (number)
  - [ ] URL de Imagen
  - [ ] URL de Video
- [ ] Crear stop solo con español funciona
- [ ] Crear stop bilingüe funciona
- [ ] Toast de éxito

### Editar Stop
- [ ] Click en editar
- [ ] Modal con datos precargados
- [ ] Tour deshabilitado
- [ ] Tabs de idiomas con datos
- [ ] Modificar título ES
- [ ] Modificar título EN
- [ ] Cambiar orden
- [ ] Agregar multimedia
- [ ] Guardar cambios
- [ ] Cambios reflejados

### Códigos QR
- [ ] Botón "Ver QR" en cada stop
- [ ] Click abre modal de QR
- [ ] QR code renderizado correctamente
- [ ] QR code visible (256x256)
- [ ] Código corto mostrado debajo
- [ ] Botón "Descargar QR" visible
- [ ] Click descarga PNG del QR
- [ ] Archivo descargado con nombre único
- [ ] QR funciona al escanearse (si backend está configurado)

### Multimedia
- [ ] Icono de imagen (ImageIcon) si tiene image_url
- [ ] Icono de video (Video) si tiene video_url
- [ ] Icono de audio (Music) si tiene audio_urls
- [ ] Múltiples iconos si tiene varios tipos
- [ ] Tooltips en iconos (opcional)

### Eliminar Stop
- [ ] Eliminar funciona
- [ ] Confirmación
- [ ] Toast de éxito

---

## 🗺️ 6. MÓDULO DE LAYOUT 2D (LEAFLET)

### Acceso y Configuración Inicial
- [ ] Acceder a `/layouts`
- [ ] Selector de planta visible
- [ ] Selector de piso visible (deshabilitado sin planta)
- [ ] Empty state: "Selecciona una planta"

### Selección de Planta y Piso
- [ ] Seleccionar planta activa selector de piso
- [ ] Opciones de piso disponibles:
  - [ ] Planta Baja (0)
  - [ ] Piso 1
  - [ ] Piso 2
  - [ ] Piso 3
  - [ ] Sótano (-1)
- [ ] Cambiar piso actualiza mapa
- [ ] Query keys con plant_id y floor_level

### Visualización del Mapa
- [ ] Mapa Leaflet renderizado
- [ ] Imagen de layout cargada (si existe)
- [ ] Mapa con CRS.Simple
- [ ] Zoom funciona (scroll o botones)
- [ ] Pan funciona (arrastrar)
- [ ] Controles de zoom visibles
- [ ] Sin atribución de Leaflet mostrada

### Áreas en el Mapa
- [ ] Áreas renderizadas como polígonos
- [ ] Colores de áreas correctos
- [ ] Click en área la selecciona
- [ ] Área seleccionada resaltada (borde grueso, mayor opacidad)
- [ ] Hover en área funciona
- [ ] Múltiples áreas visibles simultáneamente

### Sidebar de Áreas
- [ ] Sidebar derecho con lista de áreas
- [ ] Contador de áreas: "(X)"
- [ ] Cada área muestra:
  - [ ] Color indicator (cuadro)
  - [ ] Nombre
  - [ ] Descripción (si tiene)
  - [ ] Tipo (badge)
  - [ ] Capacidad (si tiene)
  - [ ] Metros cuadrados (si tiene)
- [ ] Click en área del sidebar la selecciona en mapa
- [ ] Área seleccionada resaltada en sidebar
- [ ] Scroll funciona si hay muchas áreas

### Modo Dibujo de Áreas
- [ ] Botón "Dibujar Área" visible
- [ ] Click activa modo dibujo
- [ ] Instrucciones visibles en overlay:
  - [ ] "Click para agregar puntos"
  - [ ] "Doble click para finalizar"
  - [ ] "Mínimo 3 puntos"
- [ ] Click en mapa agrega punto
- [ ] Líneas se dibujan entre puntos
- [ ] Preview de polígono visible desde 2 puntos
- [ ] Doble click finaliza polígono
- [ ] Modal de área se abre con coordenadas
- [ ] Botón "Cancelar Dibujo" funciona
- [ ] Cancelar limpia puntos dibujados

### Crear Área Manualmente
- [ ] Botón "Nueva Área" visible
- [ ] Click abre modal sin coordenadas
- [ ] Modal título: "Nueva Área"
- [ ] Campos:
  - [ ] Nombre (requerido)
  - [ ] Descripción
  - [ ] Tipo de Área (selector)
  - [ ] Color (picker)
  - [ ] Capacidad (personas)
  - [ ] Metros Cuadrados
- [ ] Tipos disponibles:
  - [ ] General
  - [ ] Producción
  - [ ] Almacén
  - [ ] Oficina
  - [ ] Laboratorio
  - [ ] Área Restringida
- [ ] Color picker funciona
- [ ] Crear área (si se dibujó) funciona
- [ ] Toast de éxito
- [ ] Área aparece en mapa
- [ ] Área aparece en sidebar

### Editar Área
- [ ] Seleccionar área
- [ ] Botón "Editar" en sidebar
- [ ] Modal con datos precargados
- [ ] Modificar nombre
- [ ] Cambiar tipo
- [ ] Cambiar color
- [ ] Actualizar capacidad
- [ ] Guardar cambios
- [ ] Cambios reflejados inmediatamente en mapa

### Eliminar Área
- [ ] Seleccionar área
- [ ] Botón "Eliminar" en sidebar (rojo)
- [ ] Confirmación aparece
- [ ] Confirmar elimina área
- [ ] Toast de éxito
- [ ] Área removida del mapa
- [ ] Área removida del sidebar

### Estados
- [ ] Empty state si no hay áreas
- [ ] Mensaje: "No hay áreas"
- [ ] Sugerencia: "Dibuja o crea un área"
- [ ] Cursor cambia en modo dibujo
- [ ] Zoom bounds correctos
- [ ] Mapa centrado apropiadamente

---

## 👥 7. MÓDULO DE EMPLEADOS

### Visualización - Tabla
- [ ] Acceder a `/employees`
- [ ] Selector de organización obligatorio
- [ ] Empty state: "Selecciona una organización"
- [ ] Seleccionar organización carga empleados
- [ ] Tabla visible con columnas:
  - [ ] Empleado (nombre + email)
  - [ ] # Empleado (monospace)
  - [ ] Puesto
  - [ ] Departamento (badge)
  - [ ] Ubicación (planta + área)
  - [ ] Manager (nombre)
  - [ ] Estado (badge)
  - [ ] Acciones

### Filtros Múltiples
- [ ] Filtro por planta:
  - [ ] "Todas las plantas" default
  - [ ] Listar plantas de la organización
  - [ ] Filtrar funciona
- [ ] Filtro por departamento:
  - [ ] "Todos los departamentos" default
  - [ ] Departamentos extraídos de empleados
  - [ ] Alfabéticamente ordenados
  - [ ] Filtrar funciona
- [ ] Búsqueda de texto:
  - [ ] Placeholder adecuado
  - [ ] Buscar por nombre funciona
  - [ ] Buscar por email funciona
  - [ ] Buscar por número de empleado funciona
- [ ] Combinar los 4 filtros funciona
- [ ] Query keys dinámicas

### Crear Empleado
- [ ] Botón "Nuevo Empleado" visible
- [ ] Modal se abre
- [ ] Formulario extenso con secciones:

#### Sección: Organización
- [ ] Selector de organización (requerido)
- [ ] Deshabilitado si se abrió desde vista filtrada
- [ ] Listar todas las organizaciones

#### Sección: Información Personal
- [ ] Nombre (requerido)
- [ ] Apellido (requerido)
- [ ] Email (requerido, tipo email)
- [ ] Teléfono (opcional, tipo tel)

#### Sección: Información Laboral
- [ ] Puesto (requerido)
- [ ] Departamento (requerido)
- [ ] Número de Empleado (requerido)
- [ ] Fecha de Contratación (requerido, tipo date)
- [ ] Default: fecha actual

#### Sección: Ubicación
- [ ] Planta (selector, opcional)
  - [ ] Deshabilitado sin organización
  - [ ] Listar plantas de la organización
  - [ ] Cambiar limpia área
- [ ] Área (selector, opcional)
  - [ ] Deshabilitado sin planta
  - [ ] Listar áreas de la planta
  - [ ] Selector dinámico

#### Sección: Jerarquía
- [ ] Reporta a / Manager (selector, opcional)
  - [ ] Deshabilitado sin organización
  - [ ] Listar empleados de la organización
  - [ ] Formato: "Nombre Apellido - Puesto"
  - [ ] Opción "Sin manager (CEO/Director)"
  - [ ] Al editar: excluir empleado actual

#### Validaciones
- [ ] Campos requeridos marcados con *
- [ ] Validación de email
- [ ] Validación de fecha
- [ ] Submit deshabilitado si faltan campos

#### Crear
- [ ] Crear empleado exitoso
- [ ] Toast de éxito
- [ ] Modal se cierra
- [ ] Tabla se actualiza
- [ ] Cache de employees invalidado
- [ ] Cache de orgChart invalidado

### Editar Empleado
- [ ] Click en lápiz
- [ ] Modal con datos precargados
- [ ] Organización deshabilitada (no editable)
- [ ] Planta precargada
- [ ] Área precargada
- [ ] Manager precargado
- [ ] Modificar cualquier campo
- [ ] Manager excluye empleado actual
- [ ] Guardar cambios
- [ ] Toast de éxito
- [ ] Cambios reflejados en tabla

### Eliminar Empleado
- [ ] Click en basura
- [ ] Confirmación con nombre del empleado
- [ ] Cancelar no elimina
- [ ] Confirmar elimina
- [ ] Toast de éxito
- [ ] Empleado removido
- [ ] Ambos caches invalidados

### Visualización de Datos
- [ ] Nombre completo en negrita
- [ ] Email en gris debajo
- [ ] Número de empleado en fuente monospace
- [ ] Departamento con badge azul
- [ ] Ubicación con icono MapPin:
  - [ ] Planta en primera línea
  - [ ] Área en segunda línea (más pequeño)
  - [ ] "Sin asignar" si no tiene
- [ ] Manager muestra nombre completo
- [ ] "-" si no tiene manager
- [ ] Badge "Activo" verde
- [ ] Badge "Inactivo" rojo

### Estados
- [ ] Empty state sin organización
- [ ] Loading state mientras carga
- [ ] Empty state sin empleados
  - [ ] Mensaje apropiado
  - [ ] Botón "Nuevo Empleado"
- [ ] Footer con contador: "Mostrando X de Y empleados"
- [ ] Hover en filas funciona

---

## 🌳 8. MÓDULO DE ORGANIGRAMA

### Acceso
- [ ] Acceder a `/org-chart`
- [ ] Selector de organización visible
- [ ] Empty state: "Selecciona una organización"

### Selección de Organización
- [ ] Selector muestra todas las organizaciones
- [ ] Seleccionar organización carga datos
- [ ] Loading state mientras carga
- [ ] Query key: `['orgChart', organizationId]`

### Visualización del Organigrama
- [ ] d3-org-chart renderizado
- [ ] Estructura jerárquica visible
- [ ] Nodos conectados correctamente
- [ ] Líneas entre nodos (parent-child)

### Tarjetas de Empleados (Nodos)
- [ ] Diseño gradient (purple a blue)
- [ ] Tamaño: 250x120px
- [ ] Bordes redondeados
- [ ] Sombra visible
- [ ] Información mostrada:
  - [ ] Nombre (grande, negrita)
  - [ ] Puesto (mediano)
  - [ ] Departamento (mediano)
  - [ ] Número de empleado (monospace, pequeño)
  - [ ] Ubicación (si tiene):
    - [ ] Separador visual (línea)
    - [ ] Icono 📍
    - [ ] Planta
    - [ ] Área (si tiene)

### Jerarquía
- [ ] CEO/Directores en la cima (sin manager)
- [ ] Empleados debajo de sus managers
- [ ] Múltiples niveles renderizados
- [ ] Siblings al mismo nivel
- [ ] Espaciado apropiado entre nodos:
  - [ ] Margen entre hijos: 50px
  - [ ] Margen entre vecinos: 50px
  - [ ] Margen compacto: 35px

### Controles de Navegación
- [ ] Botones de control visibles:
  - [ ] Acercar (Zoom In)
  - [ ] Alejar (Zoom Out)
  - [ ] Ajustar (Fit)
- [ ] Zoom In aumenta zoom
- [ ] Zoom Out disminuye zoom
- [ ] Fit centra y ajusta todo el organigrama
- [ ] Pan manual funciona (arrastrar)

### Interactividad
- [ ] Scroll para zoom funciona
- [ ] Arrastrar para pan funciona
- [ ] Click en nodo funciona (si se implementó)
- [ ] Animaciones suaves

### Estados
- [ ] Empty state sin organización
- [ ] Loading state mientras carga
- [ ] Empty state sin empleados:
  - [ ] Mensaje: "No hay empleados"
  - [ ] Sugerencia: "Agrega empleados para visualizar el organigrama"
- [ ] Renderizado rápido (< 1 segundo)
- [ ] No glitches visuales

### Actualización de Datos
- [ ] Crear empleado actualiza organigrama
- [ ] Editar jerarquía (reports_to) actualiza organigrama
- [ ] Eliminar empleado actualiza organigrama
- [ ] Cache invalidado correctamente

---

## 🎨 9. COMPONENTES UI REUTILIZABLES

### Button
- [ ] Variante "primary" (azul)
- [ ] Variante "outline" (borde)
- [ ] Variante personalizada (rojo para eliminar)
- [ ] Estado disabled funciona
- [ ] Iconos dentro de botones
- [ ] Gap entre icono y texto
- [ ] Hover effects

### Input
- [ ] Estilos consistentes
- [ ] Focus ring azul
- [ ] Tipos: text, email, tel, number, date, color
- [ ] Placeholder visible
- [ ] Required validation
- [ ] Disabled state

### Modal
- [ ] Tamaños: sm, md, lg, xl
- [ ] Título en header
- [ ] Contenido scrolleable
- [ ] Footer con botones
- [ ] Backdrop oscuro
- [ ] Click en backdrop cierra
- [ ] Tecla Escape cierra
- [ ] Animaciones de apertura/cierre
- [ ] Z-index apropiado

### Badge
- [ ] Variantes de color:
  - [ ] default (azul)
  - [ ] success (verde)
  - [ ] warning (amarillo)
  - [ ] error (rojo)
  - [ ] info (cyan)
- [ ] Padding consistente
- [ ] Bordes redondeados
- [ ] Texto legible

### Sidebar
- [ ] Fija a la izquierda
- [ ] Items de navegación listados
- [ ] Link activo resaltado (fondo azul)
- [ ] Iconos alineados
- [ ] Hover effects
- [ ] Logo en top (opcional)

### Header
- [ ] Fijo en top
- [ ] Nombre de usuario
- [ ] Botón de logout
- [ ] Sombra sutil
- [ ] Responsive

### AppLayout
- [ ] Sidebar + Header + Outlet
- [ ] Layout flex correcto
- [ ] Contenido scrolleable
- [ ] Padding apropiado

---

## 📡 10. INTEGRACIÓN CON TANSTACK QUERY

### Queries
- [ ] useQuery para GET requests
- [ ] Query keys dinámicas por filtros
- [ ] Enabled condicional (cuando se requieren filtros)
- [ ] Loading states mostrados
- [ ] Error states manejados
- [ ] Refetch on window focus deshabilitado
- [ ] Retry: 1 vez
- [ ] Stale time configurado

### Mutations
- [ ] useMutation para POST/PATCH/DELETE
- [ ] onSuccess con toast
- [ ] onError con toast de error
- [ ] invalidateQueries apropiado
- [ ] isPending mostrado (loading)
- [ ] Optimistic updates (opcional)

### Cache
- [ ] Datos cacheados correctamente
- [ ] No requests redundantes
- [ ] Invalidación selectiva funciona
- [ ] Cache compartido entre vistas
- [ ] DevTools de React Query (opcional)

---

## 🔔 11. NOTIFICACIONES (REACT HOT TOAST)

### Toast de Éxito
- [ ] Aparece en top-right
- [ ] Color verde
- [ ] Icono de check
- [ ] Mensaje claro
- [ ] Auto-dismiss (3-5 segundos)

### Toast de Error
- [ ] Color rojo
- [ ] Icono de error
- [ ] Mensaje de error descriptivo
- [ ] Auto-dismiss
- [ ] Stack de múltiples toasts

### Mensajes por Acción
- [ ] "Organización creada exitosamente"
- [ ] "Planta actualizada exitosamente"
- [ ] "Tour eliminado exitosamente"
- [ ] "Stop creado exitosamente"
- [ ] "Área actualizada exitosamente"
- [ ] "Empleado creado exitosamente"
- [ ] "Error al [acción]"

---

## 🎨 12. ESTILOS Y DISEÑO

### TailwindCSS
- [ ] Clases aplicadas correctamente
- [ ] Colores consistentes:
  - [ ] Primario: blue-600
  - [ ] Éxito: green-600
  - [ ] Error: red-600
  - [ ] Warning: yellow-600
- [ ] Spacing consistente (p-4, p-6, etc.)
- [ ] Sombras: shadow, shadow-lg
- [ ] Bordes redondeados: rounded-lg

### Responsive
- [ ] Grid responsive (grid-cols-1 md:grid-cols-2)
- [ ] Tabla scrolleable en móvil
- [ ] Sidebar colapsable (opcional)
- [ ] Modal responsive
- [ ] Touch gestures en mapas

### Iconografía (Lucide React)
- [ ] Iconos consistentes
- [ ] Tamaño: h-4 w-4 o h-5 w-5
- [ ] Colores heredados o especificados
- [ ] Alineación con texto

### Animaciones
- [ ] Hover transitions suaves
- [ ] Modal fade in/out
- [ ] Button scale en click (opcional)
- [ ] Loading spinners (opcional)

---

## 🚀 13. PERFORMANCE

### Bundle Size
- [ ] Build sin errores
- [ ] JS bundle < 700 KB
- [ ] CSS bundle < 40 KB
- [ ] Gzip: JS < 210 KB
- [ ] Warning de chunk size (aceptable)

### Loading Times
- [ ] Página inicial < 2 segundos
- [ ] Navegación entre páginas instantánea
- [ ] Queries rápidas (< 500ms)
- [ ] Mutations rápidas

### Optimizaciones
- [ ] React.memo en componentes pesados (opcional)
- [ ] useMemo para cálculos (opcional)
- [ ] useCallback para funciones (opcional)
- [ ] Code splitting (futuro)
- [ ] Lazy loading (futuro)

---

## 🐛 14. MANEJO DE ERRORES

### Errores de Red
- [ ] API no disponible muestra error
- [ ] Timeout manejado
- [ ] Toast de error mostrado
- [ ] Retry disponible

### Errores de Validación
- [ ] Campos requeridos validados
- [ ] Formato de email validado
- [ ] Números validados
- [ ] Fechas validadas
- [ ] Mensajes claros

### Errores de Backend
- [ ] Código 400: Bad Request manejado
- [ ] Código 401: Unauthorized redirige a login
- [ ] Código 403: Forbidden mensaje
- [ ] Código 404: Not Found mensaje
- [ ] Código 500: Server Error mensaje
- [ ] Mensaje de error del backend mostrado

### Estados de Error
- [ ] Empty states apropiados
- [ ] Mensajes de error descriptivos
- [ ] Sugerencias de acción
- [ ] Fallbacks visuales

---

## 🔍 15. CASOS EDGE

### Datos Vacíos
- [ ] Sin organizaciones
- [ ] Sin plantas
- [ ] Sin tours
- [ ] Sin stops
- [ ] Sin layouts
- [ ] Sin áreas
- [ ] Sin empleados
- [ ] Empty states para todos

### Datos Incompletos
- [ ] Empleado sin planta
- [ ] Empleado sin área
- [ ] Empleado sin manager
- [ ] Stop solo en español
- [ ] Área sin capacidad
- [ ] Tour sin descripción

### Relaciones
- [ ] Eliminar organización con plantas (debe fallar)
- [ ] Eliminar planta con tours (debe fallar)
- [ ] Eliminar tour con stops (debe fallar)
- [ ] Eliminar empleado que es manager (comportamiento)

### Límites
- [ ] Nombre muy largo (truncado o scroll)
- [ ] Muchas organizaciones (paginación futura)
- [ ] Muchos empleados (paginación)
- [ ] Muchas áreas en mapa (performance)
- [ ] Jerarquía muy profunda en organigrama

---

## 🔐 16. SEGURIDAD

### Autenticación
- [ ] Token en headers
- [ ] Token expirado redirige a login
- [ ] Logout limpia token
- [ ] Refresh token (si implementado)

### Autorización
- [ ] Rutas protegidas
- [ ] Sin acceso sin login
- [ ] Permisos por rol (futuro)

### Input Sanitization
- [ ] XSS prevention en inputs
- [ ] SQL injection prevented (backend)
- [ ] CSRF tokens (si aplicable)

---

## 📱 17. COMPATIBILIDAD

### Navegadores
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Opera

### Dispositivos
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

### Sistema Operativo
- [ ] Windows
- [ ] macOS
- [ ] Linux
- [ ] iOS (mobile)
- [ ] Android (mobile)

---

## 📝 18. CALIDAD DE CÓDIGO

### TypeScript
- [ ] Sin errores de tipo
- [ ] Interfaces definidas
- [ ] Types exportados
- [ ] Any usage minimizado

### ESLint
- [ ] Sin errores de lint
- [ ] Warnings aceptables
- [ ] Código formateado

### Estructura
- [ ] Archivos organizados por feature
- [ ] Componentes reutilizables en /components/ui
- [ ] API en /api
- [ ] Tipos en interfaces

### Naming
- [ ] Variables descriptivas
- [ ] Funciones verbosas
- [ ] Componentes PascalCase
- [ ] Archivos consistentes

---

## 📚 19. DOCUMENTACIÓN

### README.md
- [ ] Tecnologías listadas
- [ ] Setup instructions
- [ ] Scripts disponibles
- [ ] Estructura del proyecto
- [ ] Rutas disponibles
- [ ] Funcionalidades implementadas

### Comentarios
- [ ] Secciones importantes comentadas
- [ ] TODOs marcados (si aplica)
- [ ] Lógica compleja explicada

### Tipos
- [ ] Interfaces documentadas
- [ ] Parámetros de funciones claros
- [ ] Return types especificados

---

## ✅ 20. CHECKLIST FINAL DE DESPLIEGUE

### Pre-Deploy
- [ ] Tests pasando (si hay)
- [ ] Build exitoso
- [ ] No console.logs en producción
- [ ] No debuggers
- [ ] ENV variables configuradas

### Deploy
- [ ] Vercel/Netlify configurado
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] ENV variables en plataforma
- [ ] Custom domain (opcional)

### Post-Deploy
- [ ] URL de producción funciona
- [ ] API en producción conectada
- [ ] Todas las features funcionan
- [ ] Performance aceptable
- [ ] SEO básico (opcional)

---

## 📊 RESUMEN DE PROGRESO

### Módulos Implementados: 6/6 (100%)
1. ✅ Autenticación y Navegación
2. ✅ Organizaciones
3. ✅ Plantas
4. ✅ Tours
5. ✅ Stops & QR Codes
6. ✅ Layout 2D (Leaflet)
7. ✅ Empleados y Organigrama

### Total de Archivos Creados: ~45
### Total de Líneas de Código: ~5,500+
### Dependencias Principales: 12
### Componentes UI Reutilizables: 7

---

## 🎯 INSTRUCCIONES DE USO

1. **Imprimir o tener este checklist abierto**
2. **Iniciar backend y frontend**
3. **Ir módulo por módulo**
4. **Marcar cada checkbox conforme pruebes**
5. **Anotar bugs o issues encontrados**
6. **Reportar problemas críticos primero**
7. **Optimizar y mejorar después**

---

## 📝 NOTAS Y BUGS ENCONTRADOS

(Espacio para anotar durante testing)

```
Fecha: _____________________
Tester: ____________________

Bugs Críticos:
1.
2.
3.

Bugs Menores:
1.
2.
3.

Mejoras Sugeridas:
1.
2.
3.

Features Faltantes:
1.
2.
3.
```

---

**Fin del Checklist** ✅

¡Éxito en las pruebas! 🚀

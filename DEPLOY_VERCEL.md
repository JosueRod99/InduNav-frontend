# 🚀 Guía de Deploy a Vercel

## Estado Actual
✅ **Todo listo para deploy!** El proyecto está configurado y los archivos de audio están incluidos.

---

## Opción 1: Deploy con GitHub (Recomendado)

### Paso 1: Subir código a GitHub

1. **Crear repositorio en GitHub**
   - Ve a: https://github.com/new
   - Nombre sugerido: `indunav-demo`
   - Visibilidad: Privado (o Público si quieres compartir)
   - NO inicializar con README (ya lo tienes)

2. **Conectar tu proyecto local a GitHub**
   ```bash
   cd /Users/josuerod/Desktop/InduNav/frontend

   # Si no has inicializado git:
   git init

   # Agregar todos los archivos
   git add .

   # Crear commit inicial
   git commit -m "Initial commit - InduNav demo with audio narration"

   # Conectar con GitHub (reemplaza TU-USUARIO)
   git remote add origin https://github.com/TU-USUARIO/indunav-demo.git

   # Subir código
   git branch -M main
   git push -u origin main
   ```

### Paso 2: Deploy en Vercel

1. **Ir a Vercel**
   - Ve a: https://vercel.com
   - Click en "Sign Up" o "Log In" con GitHub

2. **Importar proyecto**
   - Click en "Add New..." → "Project"
   - Selecciona tu repositorio `indunav-demo`
   - Click en "Import"

3. **Configurar proyecto**
   - **Framework Preset**: Vite (se detecta automáticamente)
   - **Root Directory**: `./` (dejar vacío)
   - **Build Command**: `npm run build` (ya configurado)
   - **Output Directory**: `dist` (ya configurado)
   - **Environment Variables**: NO necesitas agregar nada por ahora

4. **Deploy**
   - Click en "Deploy"
   - Espera 2-3 minutos
   - ¡Listo! Tu URL será algo como: `https://indunav-demo-abc123.vercel.app`

### Paso 3: Configurar Dominio Personalizado

1. **Cambiar nombre del proyecto (URL más amigable)**
   - En el dashboard de Vercel, ve a "Settings"
   - En "General" → "Project Name"
   - Cambia a algo como: `indunav-demo-tour`
   - Tu URL ahora será: `https://indunav-demo-tour.vercel.app`

2. **Agregar dominio personalizado (GRATIS con Vercel)**
   - En "Settings" → "Domains"
   - Agregar: `indunav.vercel.app`
   - Si está disponible, ¡listo! Si no, prueba:
     - `indunav-tour.vercel.app`
     - `indunav-demo.vercel.app`
     - `my-indunav.vercel.app`

3. **Usar tu propio dominio (Opcional)**
   Si tienes un dominio propio (ej: `indunav.com`):
   - En "Settings" → "Domains"
   - Agregar: `demo.indunav.com`
   - Vercel te dará instrucciones de DNS
   - Configurar CNAME en tu proveedor de dominio

---

## Opción 2: Deploy Directo (Sin GitHub)

### Con Vercel CLI

1. **Instalar Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   cd /Users/josuerod/Desktop/InduNav/frontend
   vercel
   ```

4. **Seguir prompts**
   - Set up and deploy? **Y**
   - Which scope? (selecciona tu cuenta)
   - Link to existing project? **N**
   - Project name? **indunav-demo-tour**
   - In which directory? **./ (presiona Enter)**
   - Override settings? **N**

5. **Production Deploy**
   ```bash
   vercel --prod
   ```

---

## Verificar que Todo Funcione

### Checklist Post-Deploy

✅ **Navegación básica**
- [ ] La página de inicio carga correctamente
- [ ] Puedes navegar a `/tour`
- [ ] Puedes ver la lista de tours

✅ **Tour funcional**
- [ ] Puedes entrar a "Tour del Proceso Productivo"
- [ ] Las imágenes cargan correctamente
- [ ] Puedes navegar entre áreas (Siguiente/Anterior)
- [ ] Los tabs funcionan (Resumen, Ubicación, etc.)

✅ **Audio**
- [ ] El reproductor aparece en el header
- [ ] Click en Play reproduce el audio
- [ ] La barra de progreso avanza
- [ ] El contador de tiempo funciona
- [ ] El audio se detiene al cambiar de área
- [ ] El audio se detiene al cambiar de idioma

✅ **Responsive**
- [ ] Se ve bien en desktop
- [ ] Se ve bien en tablet
- [ ] Se ve bien en móvil

---

## Solución de Problemas

### ❌ Error: "Build failed"

**Solución:**
```bash
# Probar build localmente primero
npm run build

# Si falla, revisar errores de TypeScript
npx tsc --noEmit
```

### ❌ Archivos de audio no cargan

**Causa:** Los archivos en `public/` no se subieron a GitHub

**Solución:**
1. Verificar que `/public/audios/` esté en git:
   ```bash
   git status
   git add public/audios/*.mp3
   git commit -m "Add audio files"
   git push
   ```

2. En Vercel, ir a "Deployments" → "Redeploy"

### ❌ Rutas no funcionan (Error 404)

**Causa:** Falta configuración de SPA routing

**Solución:** Ya está incluido en `vercel.json` ✅

### ❌ Variables de entorno faltantes

Para este demo NO necesitas variables de entorno porque estás usando datos hardcodeados.

Si en el futuro necesitas conectar al backend:
1. En Vercel Dashboard → "Settings" → "Environment Variables"
2. Agregar:
   - `VITE_API_URL` = URL de tu backend
   - `VITE_BASE_URL` = URL de tu frontend

---

## Actualizaciones Futuras

### Subir cambios
```bash
# Hacer cambios en tu código
git add .
git commit -m "Descripción de cambios"
git push

# Vercel automáticamente detecta el push y redeploya
```

### Ver logs
- En Vercel Dashboard → "Deployments"
- Click en el deployment más reciente
- Ver logs en tiempo real

### Rollback
- En Vercel Dashboard → "Deployments"
- Encuentra el deployment anterior que funcionaba
- Click en "..." → "Promote to Production"

---

## Dominios Sugeridos (Gratuitos en Vercel)

- `indunav.vercel.app` ⭐ (Primera opción)
- `indunav-tour.vercel.app`
- `indunav-demo.vercel.app`
- `my-indunav.vercel.app`
- `industrial-nav.vercel.app`
- `tour-indunav.vercel.app`

---

## Costos

- **Vercel Hobby (Gratis):**
  - ✅ Dominios `.vercel.app` ilimitados
  - ✅ SSL automático
  - ✅ 100GB bandwidth/mes
  - ✅ Builds ilimitados
  - ✅ Suficiente para demos y proyectos personales

- **Si necesitas más (Pro: $20/mes):**
  - Dominios personalizados ilimitados
  - 1TB bandwidth/mes
  - Analytics avanzados

Para este demo, **Hobby Plan es más que suficiente** ✅

---

## Recursos

- [Vercel Docs](https://vercel.com/docs)
- [Vite + Vercel Guide](https://vercel.com/docs/frameworks/vite)
- [Custom Domains](https://vercel.com/docs/concepts/projects/domains)

---

## Próximos Pasos Después del Deploy

1. **Compartir URL** con clientes/equipo
2. **Agregar más audios** (inglés para todas las áreas)
3. **Conectar backend** cuando esté listo
4. **Analytics** (Vercel Analytics gratis)
5. **SEO** (meta tags, Open Graph)

---

¿Problemas? Revisa los logs en Vercel Dashboard o ejecuta `npm run build` localmente para debugging.

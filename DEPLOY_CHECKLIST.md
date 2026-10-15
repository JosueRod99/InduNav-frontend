# ✅ Checklist Pre-Deploy

## Antes de Subir a Vercel

### 1. Verificar Build Local
```bash
cd /Users/josuerod/Desktop/InduNav/frontend

# Limpiar build anterior
rm -rf dist

# Probar build
npm run build

# Debería ver:
# ✓ built in XXXms
# dist/index.html                   X.XX kB
# dist/assets/index-XXXXX.js        XXX.XX kB
```

**✅ Si el build es exitoso, continúa al paso 2**

---

### 2. Probar Build Localmente
```bash
# Servir build de producción
npm run preview

# Abrir: http://localhost:4173
```

**Probar:**
- [ ] Navegar a `/tour`
- [ ] Entrar a "Tour del Proceso Productivo"
- [ ] Reproducir audio en español
- [ ] Cambiar a inglés (solo en Recepción)
- [ ] Navegar entre áreas

**✅ Si todo funciona, continúa al paso 3**

---

### 3. Verificar Archivos de Audio
```bash
ls -lh public/audios/

# Debes ver 6 archivos:
# proceso-productivo-recepcion-es.mp3  (642K)
# proceso-productivo-recepcion-en.mp3  (560K)
# proceso-productivo-produccion-es.mp3 (600K)
# proceso-productivo-calidad-es.mp3    (578K)
# proceso-productivo-almacen-es.mp3    (609K)
# proceso-productivo-embarque-es.mp3   (551K)
```

**✅ Si están todos, continúa al paso 4**

---

### 4. Verificar Git Status
```bash
git status

# NO deberías ver:
# - node_modules/
# - dist/
# - .env

# SÍ deberías ver (si son nuevos):
# - public/audios/*.mp3
# - vercel.json
# - .env.production
# - DEPLOY_VERCEL.md
```

---

## Deploy a Vercel

### Opción A: Con GitHub (Recomendado)

1. **Crear repositorio privado en GitHub**
2. **Subir código**
   ```bash
   git init
   git add .
   git commit -m "InduNav demo with audio narration"
   git remote add origin https://github.com/TU-USUARIO/indunav-demo.git
   git push -u origin main
   ```

3. **En Vercel:**
   - Importar repositorio
   - Deploy automático
   - Configurar dominio: `indunav.vercel.app`

**Tiempo estimado: 5-10 minutos**

---

### Opción B: Con Vercel CLI (Más rápido)

```bash
# Instalar CLI (solo una vez)
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Production
vercel --prod
```

**Tiempo estimado: 2-3 minutos**

---

## Post-Deploy

### 1. Verificar Deployment
- [ ] URL funciona
- [ ] Audio reproduce
- [ ] No hay errores en consola
- [ ] Responsive funciona

### 2. Configurar Dominio Personalizado
En Vercel Dashboard → Settings → Domains:
- Agregar: `indunav.vercel.app` ⭐
- O: `indunav-tour.vercel.app`
- O: `my-indunav.vercel.app`

### 3. Compartir
```
🎉 Demo Live:
https://indunav.vercel.app

Características:
✅ Tour interactivo con 5 áreas
✅ Narración de audio en español/inglés
✅ Responsive design
✅ FAQs colapsables
✅ 8 tabs informativos por área
```

---

## Solución Rápida de Problemas

### ❌ Build falla localmente
```bash
# Ver errores TypeScript
npx tsc --noEmit

# Limpiar y reinstalar
rm -rf node_modules package-lock.json
npm install
npm run build
```

### ❌ Audios no cargan en producción
```bash
# Verificar que están en git
git ls-files public/audios/

# Si no aparecen:
git add public/audios/*.mp3
git commit -m "Add audio files"
git push
```

### ❌ Página en blanco en Vercel
- Revisar console en DevTools (F12)
- Ver logs en Vercel Dashboard
- Verificar que `vercel.json` existe

---

## Comandos Útiles

```bash
# Build local
npm run build

# Preview local
npm run preview

# Deploy a Vercel (CLI)
vercel --prod

# Ver logs de Vercel
vercel logs

# Ver info del proyecto
vercel inspect
```

---

## Archivos Creados para Deploy

✅ `vercel.json` - Configuración de Vercel
✅ `.env.production` - Variables de entorno (opcional)
✅ `.gitignore` - Actualizado para incluir audios
✅ `DEPLOY_VERCEL.md` - Guía completa
✅ `DEPLOY_CHECKLIST.md` - Este archivo

---

## ¿Todo Listo?

Si completaste todos los checks arriba, estás listo para:

**🚀 Deploy con GitHub:**
Ver instrucciones completas en `DEPLOY_VERCEL.md`

**⚡ Deploy rápido con CLI:**
```bash
vercel --prod
```

---

**Tiempo total estimado: 10 minutos**
**Costo: $0 (Vercel Hobby Plan)**
**Resultado: Demo profesional en línea con dominio .vercel.app**

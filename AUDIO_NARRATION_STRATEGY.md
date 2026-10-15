# Estrategia de Narración de Audio para Tours

## Estado Actual ✅

**Implementado:**
- ✅ Generación automática de texto de narración (nombre + descripción + responsable + seguridad + resumen)
- ✅ Reproductor de audio con Play/Pause, barra de progreso, contador de tiempo
- ✅ Botón de copiar texto al portapapeles
- ✅ Logs en consola con el texto completo para pruebas manuales
- ✅ Arquitectura preparada para reproducir audios reales (cuando existan)
- ✅ Simulador de progreso (por mientras no hay audios reales)

**Por implementar:**
- ⏳ Integración con OpenAI TTS API
- ⏳ Sistema de generación masiva de audios al publicar tour
- ⏳ Almacenamiento de audios en Cloudinary
- ⏳ Campos en DB para guardar URLs de audio

---

## Arquitectura Recomendada

### Fase 1: Pruebas Manuales (ACTUAL)
```
Usuario copia texto → Genera audio manualmente en OpenAI Playground
                   → Descarga MP3
                   → Prueba en navegador
```

**Beneficio**: Probar voces y calidad sin gastar en desarrollo.

### Fase 2: Generación Semi-Automática
```
Admin Panel → Botón "Generar Audio"
          → Backend llama OpenAI API
          → Sube a Cloudinary
          → Guarda URL en DB
          → Frontend reproduce audio real
```

**Beneficio**: Generar audios bajo demanda cuando el contenido esté final.

### Fase 3: Generación Automática (OBJETIVO FINAL)
```
Tour Editor → Usuario hace cambios
          → Guarda como borrador
          → Al hacer click en "Publicar Tour":
              1. Valida contenido completo
              2. Genera textos de narración para todas las áreas
              3. Llama OpenAI API para generar audios (ES + EN)
              4. Sube todos los MP3 a Cloudinary
              5. Actualiza DB con URLs
              6. Marca tour como "Publicado"
          → Frontend consume audios pre-generados (costo = $0)
```

**Beneficio**: Automatización total, costo único por tour.

---

## Costos Estimados (OpenAI TTS)

### Pricing (2026)
- **tts-1**: $15 por 1M caracteres (más rápido, calidad estándar)
- **tts-1-hd**: $30 por 1M caracteres (mejor calidad, RECOMENDADO)

### Ejemplo Real: Tour Industrial con 10 Áreas

| Concepto | Cantidad | Costo |
|----------|----------|-------|
| Palabras por área (promedio) | 500 | - |
| Caracteres por área | ~3,000 | - |
| Total caracteres (10 áreas x 2 idiomas) | 60,000 | - |
| **Costo con tts-1-hd** | - | **$1.80 USD** |
| **Costo con tts-1** | - | **$0.90 USD** |

### Proyección: 50 Tours con 500 Áreas Totales

| Modelo | Costo Total | Costo por Tour |
|--------|-------------|----------------|
| tts-1-hd | $90 USD | $1.80 USD |
| tts-1 | $45 USD | $0.90 USD |

**Conclusión**: Incluso con 500 áreas, el costo total es menos de $100 USD **una sola vez**.

---

## Estructura de Base de Datos

### Agregar a tabla `tours_areas`

```sql
ALTER TABLE tours_areas ADD COLUMN IF NOT EXISTS narration_text_es TEXT;
ALTER TABLE tours_areas ADD COLUMN IF NOT EXISTS narration_text_en TEXT;
ALTER TABLE tours_areas ADD COLUMN IF NOT EXISTS audio_url_es TEXT;
ALTER TABLE tours_areas ADD COLUMN IF NOT EXISTS audio_url_en TEXT;
ALTER TABLE tours_areas ADD COLUMN IF NOT EXISTS audio_generated_at TIMESTAMP;
ALTER TABLE tours_areas ADD COLUMN IF NOT EXISTS audio_duration_seconds INTEGER;
```

### Campos explicados

- **narration_text_es/en**: Texto completo que se envía a OpenAI TTS (se genera automáticamente)
- **audio_url_es/en**: URL de Cloudinary donde está el MP3 generado
- **audio_generated_at**: Timestamp de cuándo se generó (para saber si hay que regenerar)
- **audio_duration_seconds**: Duración real del audio en segundos (para el reproductor)

---

## Implementación Backend

### Endpoint: Generar Audios de un Tour

```typescript
// POST /api/tours/:tourId/generate-audios
import { generateTourAudios } from '../utils/audioGeneration';

router.post('/tours/:tourId/generate-audios', async (req, res) => {
  const { tourId } = req.params;
  const { regenerateAll = false } = req.body;

  try {
    // 1. Obtener todas las áreas del tour
    const areas = await db.query(
      'SELECT id, narration_text_es, narration_text_en FROM tours_areas WHERE tour_id = $1',
      [tourId]
    );

    // 2. Filtrar áreas que necesitan audio
    const areasToGenerate = regenerateAll
      ? areas.rows
      : areas.rows.filter(area => !area.audio_url_es || !area.audio_url_en);

    if (areasToGenerate.length === 0) {
      return res.json({ message: 'Todos los audios ya están generados' });
    }

    // 3. Generar audios
    await generateTourAudios(tourId, areasToGenerate);

    res.json({
      success: true,
      generated: areasToGenerate.length * 2, // ES + EN
      message: 'Audios generados exitosamente'
    });
  } catch (error) {
    console.error('Error generando audios:', error);
    res.status(500).json({ error: 'Error generando audios' });
  }
});
```

### Endpoint: Subir Audio a Cloudinary

```typescript
// POST /api/upload/audio
import { v2 as cloudinary } from 'cloudinary';

router.post('/upload/audio', upload.single('file'), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'video', // Cloudinary maneja audios como 'video'
      folder: 'tour-narrations',
      format: 'mp3',
    });

    res.json({
      url: result.secure_url,
      duration: result.duration, // Cloudinary detecta duración automáticamente
    });
  } catch (error) {
    console.error('Error subiendo audio:', error);
    res.status(500).json({ error: 'Error subiendo audio' });
  }
});
```

---

## Implementación Frontend (Preparada)

### Modificar `tourData.ts`

```typescript
export interface DemoArea {
  id: string;
  name: MultiLangText;
  description: MultiLangText;
  // ... otros campos existentes

  // NUEVOS CAMPOS
  audioFiles?: {
    es: string | null;  // URL de Cloudinary
    en: string | null;
  };
  audioDuration?: number; // segundos
}
```

### Usar en `TourViewerPage.tsx`

```typescript
// Línea 124 (ya preparada en el código)
const savedAudioUrl = currentArea.audioFiles?.[language];
```

**Cuando exista el campo `audioFiles` en los datos:**
- ✅ Reproducirá el audio real de Cloudinary
- ✅ Mostrará la duración real del audio
- ✅ Play/Pause funcionará con el audio real
- ✅ No gastará tokens de OpenAI (reproduce archivo existente)

**Cuando NO exista (estado actual):**
- ✅ Muestra el simulador de progreso
- ✅ Permite copiar el texto para generarlo manualmente

---

## Flujo de Trabajo Recomendado

### Para el Admin/Editor de Tours

1. **Crear/Editar Tour**
   - Agregar áreas
   - Escribir descripciones
   - Asignar responsables
   - Agregar notas de seguridad
   - Guardar como borrador

2. **Preview**
   - Ver cómo se verá el tour
   - Copiar textos de narración con el botón
   - Generar audios de prueba manualmente en OpenAI Playground
   - Validar que suenen bien

3. **Publicar Tour**
   - Click en "Publicar"
   - Backend automáticamente:
     - Genera textos de narración
     - Llama OpenAI API para generar audios
     - Sube MP3s a Cloudinary
     - Guarda URLs en DB
   - Tour queda publicado con audios listos

4. **Modificar Tour Publicado**
   - Al editar área:
     - Marca `audio_regeneration_needed = true`
   - Al volver a publicar:
     - Solo regenera audios de áreas modificadas

---

## Optimizaciones Adicionales

### Cache en Cliente
```typescript
// Precarga del siguiente audio
const nextArea = tour.areas[currentAreaIndex + 1];
if (nextArea?.audioFiles?.[language]) {
  const audio = new Audio(nextArea.audioFiles[language]);
  audio.load(); // Precarga en background
}
```

### Compresión de Audio
- Cloudinary permite transformaciones automáticas
- Reducir bitrate para audios de voz (64kbps es suficiente)
- Ejemplo: `url.replace('/upload/', '/upload/q_auto,br_64k/')`

### Analytics
```typescript
// Trackear qué áreas son más escuchadas
analytics.track('audio_played', {
  tourId,
  areaId,
  language,
  duration: audioDuration,
});
```

---

## Próximos Pasos

### Corto Plazo (esta semana)
- [x] Implementar reproductor de audio en frontend
- [x] Función de generar texto de narración
- [x] Botón de copiar texto
- [ ] Probar voces en OpenAI Playground manualmente
- [ ] Decidir qué voz usar para ES y EN

### Mediano Plazo (próximas 2-4 semanas)
- [ ] Agregar campos a tabla `tours_areas`
- [ ] Crear endpoint `/api/upload/audio`
- [ ] Crear endpoint `/api/tours/:id/generate-audios`
- [ ] Botón "Generar Audios" en admin de tours
- [ ] Probar generación de 1 tour completo

### Largo Plazo (cuando escale)
- [ ] Automatizar generación al publicar tour
- [ ] Panel de analytics de reproducciones
- [ ] Sistema de regeneración inteligente (solo lo modificado)
- [ ] Soporte para más idiomas (PT, FR, etc.)

---

## Recursos

- [OpenAI TTS Documentation](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI TTS Playground](https://platform.openai.com/playground/tts)
- [Cloudinary Audio Upload](https://cloudinary.com/documentation/audio_transformations)
- [Código de utilidades]: `/src/utils/audioGeneration.ts`

---

## Contacto y Soporte

Para dudas sobre implementación, ver:
- Código preparado en `TourViewerPage.tsx` (líneas 118-172)
- Funciones de utilidad en `audioGeneration.ts`
- Este documento para referencia de arquitectura

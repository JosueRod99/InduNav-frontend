# Cómo Probar el Sistema de Narración de Audio

## Estado Actual

✅ **Todo listo para probar!** El reproductor está implementado y el texto de narración se genera automáticamente.

---

## Opción 1: Prueba Rápida (Recomendada)

### Pasos:

1. **Navega a un tour demo**
   - Abre la aplicación
   - Ve a la página de tours
   - Selecciona cualquier tour
   - Entra a una área

2. **Abre la consola del navegador**
   - Chrome/Edge: Presiona `F12` o `Cmd+Option+J` (Mac) / `Ctrl+Shift+J` (Windows)
   - Safari: `Cmd+Option+C`
   - Ve a la pestaña "Console"

3. **Lee el texto de narración**
   - Verás un mensaje como:
   ```
   🎙️ Texto de narración generado para: Producción de Moldeo por Inyección
   📝 Texto completo para enviar a OpenAI TTS:
   Bienvenido a Producción de Moldeo por Inyección. Esta área es...
   ```

4. **Copia el texto con un click**
   - Click en el botón de copiar (📋) en el reproductor
   - El icono cambiará a ✓ por 2 segundos
   - El texto estará en tu portapapeles

5. **Prueba el reproductor (simulación)**
   - Click en Play ▶️
   - Verás el progreso avanzar
   - La barra se llena según el tiempo estimado
   - Click en Pause ⏸ para pausar

---

## Opción 2: Generar Audio Real (Manual)

### Pasos:

1. **Obtén una API key de OpenAI**
   - Ve a: https://platform.openai.com/api-keys
   - Click en "Create new secret key"
   - Copia la key (empieza con `sk-`)
   - Guárdala en lugar seguro

2. **Copia el texto de narración**
   - Usa el botón de copiar en el reproductor
   - O cópialo desde la consola del navegador

3. **Prueba voces en OpenAI Playground**
   - Ve a: https://platform.openai.com/playground/tts
   - Pega el texto en el campo "Text to speech"
   - Selecciona idioma: Spanish
   - Prueba diferentes voces:
     - **nova** (mujer joven, energética) ← RECOMENDADA para español
     - **shimmer** (mujer adulta, cálida)
     - **onyx** (hombre adulto, profesional)
   - Click en "Generate"
   - Escucha el resultado

4. **Descarga el audio**
   - Click en "Download"
   - Guarda el MP3
   - ¡Ya tienes tu primer audio de narración!

**Costo**: ~$0.09 USD por generación (con tts-1-hd)

---

## Opción 3: Generar Audio con Script (Avanzado)

### Requisitos:
- Node.js instalado
- API key de OpenAI

### Pasos:

1. **Instalar dependencia**
   ```bash
   cd /Users/josuerod/Desktop/InduNav/frontend
   npm install -D tsx
   ```

2. **Configurar API key**
   ```bash
   export OPENAI_API_KEY=sk-tu-api-key-aqui
   ```

3. **Editar script**
   - Abre: `scripts/test-audio-generation.ts`
   - Pega el texto copiado en la variable `narrationText`
   - Guarda el archivo

4. **Ejecutar**
   ```bash
   npx tsx scripts/test-audio-generation.ts
   ```

5. **Resultado**
   - El audio se guardará en: `output/test-audio-{timestamp}.mp3`
   - Se mostrará el costo estimado
   - Tamaño del archivo
   - Tiempo de generación

---

## Comparación de Voces (Español)

| Voz | Género | Características | Recomendada Para |
|-----|--------|----------------|------------------|
| **nova** | Mujer | Joven, energética, clara | Tours industriales ✅ |
| **shimmer** | Mujer | Adulta, cálida, profesional | Contextos formales |
| **onyx** | Hombre | Adulto, autoritario, grave | Seguridad/instrucciones |
| **alloy** | Neutral | Balanceada, versátil | Uso general |
| **echo** | Hombre | Adulto, claro, directo | Instrucciones técnicas |
| **fable** | Hombre | Joven, amigable, casual | Tours casuales |

---

## Próximos Pasos

### Una Vez que Decidas la Voz:

1. **Agregar campos a la base de datos**
   ```sql
   ALTER TABLE tours_areas ADD COLUMN audio_url_es TEXT;
   ALTER TABLE tours_areas ADD COLUMN audio_url_en TEXT;
   ALTER TABLE tours_areas ADD COLUMN audio_duration_seconds INTEGER;
   ```

2. **Generar audios de todos los tours**
   - Implementar endpoint backend (ver `AUDIO_NARRATION_STRATEGY.md`)
   - Click en "Generar Audios" desde admin
   - Esperar ~5-10 minutos (dependiendo del número de áreas)

3. **Actualizar datos de demo**
   - Agregar URLs de Cloudinary a `tourData.ts`
   - El reproductor automáticamente usará los audios reales

4. **¡Listo!**
   - Los visitantes podrán escuchar las narraciones
   - Costo = $0 después de generación inicial
   - Calidad profesional

---

## Archivos Importantes

- **Frontend**: `/src/pages/tour/TourViewerPage.tsx` - Reproductor implementado
- **Utilidades**: `/src/utils/audioGeneration.ts` - Funciones para generar audios
- **Script de prueba**: `/scripts/test-audio-generation.ts` - Generar audios localmente
- **Documentación completa**: `/AUDIO_NARRATION_STRATEGY.md` - Estrategia detallada

---

## Preguntas Frecuentes

**P: ¿Cuánto cuesta generar todos los audios?**
R: ~$1.80 USD por cada 10 áreas (español + inglés). Ver cálculo detallado en `AUDIO_NARRATION_STRATEGY.md`

**P: ¿Puedo cambiar de voz después?**
R: Sí, pero tendrás que regenerar todos los audios (~$1.80 USD por cada 10 áreas)

**P: ¿Los audios se generan cada vez que alguien visita el tour?**
R: NO. Se generan una sola vez al publicar el tour y se reutilizan infinitamente.

**P: ¿Qué pasa si edito el contenido de un área?**
R: Solo regeneras el audio de esa área específica (~$0.09 USD)

**P: ¿Funcionará el reproductor sin audios generados?**
R: Sí, mostrará una simulación de progreso. Útil para demos/desarrollo.

**P: ¿Puedo usar otra voz para áreas específicas?**
R: Sí, el sistema soporta diferentes voces por área (modificar script de generación)

---

## Soporte

Si tienes problemas:
1. Verifica que la consola del navegador no muestre errores
2. Revisa que el botón de copiar funcione
3. Verifica que tu API key de OpenAI esté activa
4. Consulta `AUDIO_NARRATION_STRATEGY.md` para detalles técnicos

/**
 * Audio Generation Utilities - OpenAI TTS Integration
 *
 * ESTRATEGIA DE IMPLEMENTACIÓN:
 *
 * 1. GENERACIÓN ÚNICA (Backend - cuando se publica un tour):
 *    - Al publicar/finalizar edición de un tour
 *    - Generar audios para TODAS las áreas en ambos idiomas
 *    - Subir archivos a Cloudinary
 *    - Guardar URLs en la base de datos (campo: audio_url_es, audio_url_en)
 *
 * 2. REPRODUCCIÓN (Frontend - este archivo):
 *    - Leer audio_url del área desde DB
 *    - Reproducir audio pre-generado (NO regenerar)
 *    - Costo = $0 después de generación inicial
 *
 * 3. REGENERACIÓN:
 *    - Solo cuando cambie el contenido del área
 *    - Botón manual "Regenerar audio" en admin
 */

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

interface GenerateAudioOptions {
  text: string;
  language: 'es' | 'en';
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  model?: 'tts-1' | 'tts-1-hd';
}

/**
 * Genera audio usando OpenAI TTS API
 *
 * COSTOS (2026):
 * - tts-1: $15 por 1M caracteres (más rápido, menor calidad)
 * - tts-1-hd: $30 por 1M caracteres (mejor calidad)
 *
 * Ejemplo de costo:
 * - Texto de 500 palabras = ~3,000 caracteres
 * - Con tts-1-hd: $0.09 por generación
 * - 100 áreas x 2 idiomas = 200 audios = $18 USD (una sola vez)
 *
 * @param options - Opciones de generación
 * @returns Blob del audio MP3 generado
 */
export async function generateAudioWithOpenAI(
  options: GenerateAudioOptions
): Promise<Blob> {
  const { text, language, voice, model = 'tts-1-hd' } = options;

  // Seleccionar voz por defecto según idioma
  const defaultVoice = language === 'es' ? 'nova' : 'alloy';

  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        voice: voice || defaultVoice,
        input: text,
        response_format: 'mp3', // Formato compatible con todos los navegadores
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI TTS Error: ${error.error?.message || 'Unknown error'}`);
    }

    const audioBlob = await response.blob();
    return audioBlob;
  } catch (error) {
    console.error('Error generando audio con OpenAI:', error);
    throw error;
  }
}

/**
 * Genera audio y lo sube a Cloudinary
 *
 * FLUJO BACKEND (cuando se publique un tour):
 * 1. Obtener texto de narración de cada área
 * 2. Generar audio con OpenAI
 * 3. Subir a Cloudinary
 * 4. Guardar URL en DB
 *
 * @param areaId - ID del área
 * @param text - Texto de narración
 * @param language - Idioma
 * @returns URL del audio en Cloudinary
 */
export async function generateAndUploadAudio(
  areaId: string,
  text: string,
  language: 'es' | 'en'
): Promise<string> {
  try {
    // 1. Generar audio con OpenAI
    console.log(`🎙️ Generando audio para área ${areaId} (${language})...`);
    const audioBlob = await generateAudioWithOpenAI({ text, language });

    // 2. Convertir a FormData para subir a Cloudinary
    const formData = new FormData();
    const fileName = `tour_area_${areaId}_${language}.mp3`;
    formData.append('file', audioBlob, fileName);

    // 3. Subir a Cloudinary (o tu servicio de almacenamiento)
    console.log(`☁️ Subiendo audio a Cloudinary...`);
    const uploadResponse = await fetch('/api/upload/audio', {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error('Error subiendo audio a Cloudinary');
    }

    const { url } = await uploadResponse.json();
    console.log(`✅ Audio generado y subido: ${url}`);

    return url;
  } catch (error) {
    console.error('Error en generateAndUploadAudio:', error);
    throw error;
  }
}

/**
 * Genera audios para todas las áreas de un tour
 *
 * EJEMPLO DE USO EN BACKEND:
 *
 * POST /api/tours/:tourId/generate-audios
 * {
 *   "regenerateAll": false  // true = regenerar todos, false = solo los que faltan
 * }
 *
 * @param tourId - ID del tour
 * @param areas - Array de áreas con sus textos de narración
 */
export async function generateTourAudios(
  tourId: string,
  areas: Array<{ id: string; narrationTextEs: string; narrationTextEn: string }>
): Promise<void> {
  console.log(`🎬 Generando audios para tour ${tourId}...`);
  console.log(`📊 Total de áreas: ${areas.length}`);
  console.log(`📊 Total de audios a generar: ${areas.length * 2} (ES + EN)`);

  const totalChars = areas.reduce(
    (sum, area) => sum + area.narrationTextEs.length + area.narrationTextEn.length,
    0
  );
  const estimatedCost = (totalChars / 1_000_000) * 30; // $30 por 1M caracteres (tts-1-hd)

  console.log(`💰 Costo estimado: $${estimatedCost.toFixed(2)} USD`);

  // Generar audios en paralelo (máximo 5 a la vez para no saturar la API)
  const batchSize = 5;
  for (let i = 0; i < areas.length; i += batchSize) {
    const batch = areas.slice(i, i + batchSize);

    await Promise.all(
      batch.flatMap((area) => [
        generateAndUploadAudio(area.id, area.narrationTextEs, 'es'),
        generateAndUploadAudio(area.id, area.narrationTextEn, 'en'),
      ])
    );

    console.log(`✅ Procesadas ${Math.min(i + batchSize, areas.length)} de ${areas.length} áreas`);
  }

  console.log(`🎉 Todos los audios generados exitosamente`);
}

/**
 * VOCES RECOMENDADAS POR IDIOMA:
 *
 * Español:
 * - 'nova' - Mujer joven, energética (RECOMENDADO para tours)
 * - 'shimmer' - Mujer adulta, cálida
 * - 'onyx' - Hombre adulto, profesional
 *
 * Inglés:
 * - 'alloy' - Neutral, profesional (RECOMENDADO)
 * - 'echo' - Hombre adulto, autoritario
 * - 'fable' - Hombre joven, amigable
 */

/**
 * ESTRUCTURA DE DATOS RECOMENDADA (DB):
 *
 * tours_areas:
 *   - id
 *   - name
 *   - description
 *   - narration_text_es (texto completo para TTS)
 *   - narration_text_en (texto completo para TTS)
 *   - audio_url_es (URL de Cloudinary)
 *   - audio_url_en (URL de Cloudinary)
 *   - audio_generated_at (timestamp)
 *   - audio_duration_seconds (duración real del audio)
 */

export default {
  generateAudioWithOpenAI,
  generateAndUploadAudio,
  generateTourAudios,
};

/**
 * Script de Prueba: Generar Audio con OpenAI TTS
 *
 * CÓMO USAR:
 * 1. Copiar texto de narración desde la consola del navegador
 * 2. Pegar en la variable `narrationText` abajo
 * 3. Obtener API key de OpenAI: https://platform.openai.com/api-keys
 * 4. Ejecutar: npx tsx scripts/test-audio-generation.ts
 * 5. El audio se guardará en: ./output/test-audio-{timestamp}.mp3
 *
 * REQUISITOS:
 * - npm install -D tsx
 * - Variable de entorno: OPENAI_API_KEY=sk-...
 */

import fs from 'fs';
import path from 'path';

// ====================================
// CONFIGURACIÓN - EDITA AQUÍ
// ====================================

const narrationText = `
Bienvenido a Recepción de Materiales. 
Primera etapa: verificación y almacenamiento de materia prima.

Esta área está bajo la responsabilidad de María González, Jefa de Recepción. 

Importante: Uso de casco, calzado de seguridad y chaleco reflectante obligatorio. 
Prohibido el paso a personal no autorizado. 

En esta área recibimos toda la materia prima que utilizamos en nuestro proceso productivo. 
Contamos con un equipo especializado que verifica la calidad, cantidad y documentación de cada envío. 
Utilizamos sistemas automatizados de registro y almacenamiento para garantizar la trazabilidad completa de todos los materiales.`;

const language: 'es' | 'en' = 'es';
const voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'nova';
const model: 'tts-1' | 'tts-1-hd' = 'tts-1-hd';

// ====================================
// CÓDIGO - NO EDITAR (a menos que sepas lo que haces)
// ====================================

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

if (!OPENAI_API_KEY) {
  console.error('❌ Error: Variable de entorno OPENAI_API_KEY no configurada');
  console.log('\nPara configurarla:');
  console.log('  export OPENAI_API_KEY=sk-tu-api-key-aqui');
  console.log('\nO crea un archivo .env con:');
  console.log('  OPENAI_API_KEY=sk-tu-api-key-aqui');
  process.exit(1);
}

async function generateAudio() {
  try {
    console.log('🎙️ Generando audio con OpenAI TTS...\n');
    console.log('Configuración:');
    console.log(`  - Modelo: ${model}`);
    console.log(`  - Voz: ${voice}`);
    console.log(`  - Idioma: ${language}`);
    console.log(`  - Caracteres: ${narrationText.length}`);

    const estimatedCost = (narrationText.length / 1_000_000) * (model === 'tts-1-hd' ? 30 : 15);
    console.log(`  - Costo estimado: $${estimatedCost.toFixed(4)} USD\n`);

    const startTime = Date.now();

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        voice,
        input: narrationText.trim(),
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API Error: ${JSON.stringify(error)}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const duration = Date.now() - startTime;

    console.log(`✅ Audio generado en ${duration}ms`);
    console.log(`📦 Tamaño del archivo: ${(audioBuffer.byteLength / 1024).toFixed(2)} KB\n`);

    // Crear carpeta output si no existe
    const outputDir = path.join(process.cwd(), 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Guardar archivo
    const timestamp = Date.now();
    const fileName = `test-audio-${language}-${voice}-${timestamp}.mp3`;
    const filePath = path.join(outputDir, fileName);

    fs.writeFileSync(filePath, Buffer.from(audioBuffer));

    console.log('💾 Audio guardado en:');
    console.log(`   ${filePath}\n`);
    console.log('🎵 Para reproducir:');
    console.log(`   open "${filePath}"`);
    console.log(`   # o simplemente abre el archivo en tu reproductor de audio favorito\n`);

    console.log('✨ ¡Listo! Ahora puedes escuchar el audio para validar calidad y voz.');
  } catch (error) {

    console.error('❌ Error generando audio:', error);

    process.exit(1);
  }
}

generateAudio();

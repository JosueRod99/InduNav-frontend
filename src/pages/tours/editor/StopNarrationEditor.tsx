import { CheckCircle2, Clock, Info, Loader2, PenLine, RotateCcw, Sparkles } from 'lucide-react';
import type { BuilderStop, NarrationItem, TourLanguage, UpdateStopPayload } from '../../../api/tourBuilder';

// Narration of an area: by default it is composed from the title, narrative and key points; it can
// be replaced by a custom script. Audio is generated when publishing, only if the script changed.

interface StopNarrationEditorProps {
  stop: BuilderStop;
  language: TourLanguage;
  item: NarrationItem | undefined; // server plan for this area and language (saved draft)
  isLoading: boolean;
  onChange: (patch: UpdateStopPayload) => void;
}

const CHARS_PER_MINUTE = 900; // approximate speaking rate of the narration voices

const duration = (chars: number) => {
  const seconds = Math.max(1, Math.round((chars / CHARS_PER_MINUTE) * 60));
  return seconds < 60 ? `${seconds} s` : `${Math.floor(seconds / 60)} min ${seconds % 60} s`;
};

const StopNarrationEditor = ({ stop, language, item, isLoading, onChange }: StopNarrationEditorProps) => {
  const custom = stop.content.narration_script?.[language];
  const isCustom = custom !== undefined && custom !== null;
  const setScript = (value: string | undefined) => {
    const next = { ...(stop.content.narration_script || {}) };
    if (value === undefined) delete next[language];
    else next[language] = value;
    onChange({ content: { ...stop.content, narration_script: next } });
  };

  const scriptText = isCustom ? custom! : item?.script || '';
  const chars = scriptText.trim().length;

  const status = (() => {
    if (isLoading || !item) return { Icon: Loader2, text: 'Revisando…', className: 'bg-gray-100 text-gray-600', spin: true };
    if (!item.script) {
      return language === 'es'
        ? { Icon: Info, text: 'Sin narración: escribe una narrativa o un guion', className: 'bg-gray-100 text-gray-700' }
        : { Icon: Info, text: 'Sin texto en inglés: se escuchará la narración en español', className: 'bg-gray-100 text-gray-700' };
    }
    if (item.audio_url) return { Icon: CheckCircle2, text: 'Audio listo para este guion', className: 'bg-green-100 text-green-800' };
    return { Icon: Clock, text: 'Se generará al publicar', className: 'bg-amber-100 text-amber-800' };
  })();

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <p>
          La narración se genera <strong>al publicar</strong> y solo para los textos que cambiaron; los demás audios se reutilizan.
          Por defecto se lee el título, la narrativa y los puntos clave del área.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}>
          <status.Icon className={`h-3.5 w-3.5 ${status.spin ? 'animate-spin' : ''}`} />
          {status.text}
        </span>
        {chars > 0 && (
          <span className="text-xs text-gray-500">
            {chars.toLocaleString('es-MX')} caracteres · ~{duration(chars)} de audio
          </span>
        )}
      </div>

      {item?.synth_text && item.script && item.synth_text !== item.script && (
        <p className="rounded-md border border-purple-200 bg-purple-50 px-3 py-2 text-xs text-purple-900">
          <strong>Modo prueba:</strong> solo se generará “{item.synth_text}”. Al apagarlo se genera el guion completo.
        </p>
      )}

      {item?.audio_url && (
        <audio controls src={item.audio_url} className="w-full max-w-lg" aria-label="Narración generada" />
      )}

      <div>
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-gray-700">
            {isCustom ? 'Guion personalizado' : 'Guion automático'}
          </p>
          {isCustom ? (
            <button
              type="button"
              onClick={() => setScript(undefined)}
              className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Volver al guion automático
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setScript(item?.script || '')}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              <PenLine className="h-3.5 w-3.5" />
              Personalizar guion
            </button>
          )}
        </div>

        {isCustom ? (
          <textarea
            value={custom || ''}
            onChange={(e) => setScript(e.target.value)}
            rows={8}
            maxLength={40000}
            placeholder="Escribe exactamente lo que dirá la voz al llegar a esta área…"
            className="w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        ) : (
          <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-700">
            {isLoading ? (
              <span className="text-gray-400">Cargando…</span>
            ) : item?.script ? (
              <>
                <Sparkles className="mr-1.5 inline h-3.5 w-3.5 text-blue-500" />
                {item.script}
              </>
            ) : (
              <span className="text-gray-500">
                {language === 'es'
                  ? 'Escribe la narrativa del área en la pestaña Contenido para generar la narración.'
                  : 'Escribe la narrativa en inglés (pestaña Contenido) o personaliza el guion para tener narración en inglés.'}
              </span>
            )}
          </div>
        )}
        <p className="mt-1.5 text-xs text-gray-500">
          Tip: escribe como se habla. Las siglas se leen mejor separadas (C. N. C.) y los números con letra si son importantes.
        </p>
      </div>
    </div>
  );
};

export default StopNarrationEditor;

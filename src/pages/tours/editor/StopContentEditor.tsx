import { Plus, Trash2 } from 'lucide-react';
import ImageUpload from '../../../components/shared/ImageUpload';
import { ImageType } from '../../../api/upload';
import type { BuilderStop, StopContent, TourLanguage, Translations, UpdateStopPayload } from '../../../api/tourBuilder';
import TranslatedField from './TranslatedField';

interface StopContentEditorProps {
  stop: BuilderStop;
  language: TourLanguage;
  organizationId: string;
  plantId: string;
  onChange: (patch: UpdateStopPayload) => void;
}

const sectionTitle = (title: string, hint?: string) => (
  <div className="mb-2">
    <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
    {hint && <p className="text-xs text-gray-500">{hint}</p>}
  </div>
);

const addButton = (label: string, onClick: () => void) => (
  <button
    type="button"
    onClick={onClick}
    className="mt-2 inline-flex items-center gap-1 rounded-md border border-dashed border-blue-300 px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
  >
    <Plus className="h-3.5 w-3.5" />
    {label}
  </button>
);

const removeButton = (onClick: () => void) => (
  <button
    type="button"
    onClick={onClick}
    className="mt-2 flex-shrink-0 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
    aria-label="Quitar"
    title="Quitar"
  >
    <Trash2 className="h-4 w-4" />
  </button>
);

const StopContentEditor = ({ stop, language, organizationId, plantId, onChange }: StopContentEditorProps) => {
  const content = stop.content || {};
  const setContent = (patch: Partial<StopContent>) => onChange({ content: { ...content, ...patch } });

  const keypoints = content.keypoints || [];
  const faq = content.faq || [];
  const highlights = content.highlights || [];

  const updateAt = <T,>(list: T[], index: number, value: T) => list.map((item, i) => (i === index ? value : item));
  const removeAt = <T,>(list: T[], index: number) => list.filter((_, i) => i !== index);

  return (
    <div className="space-y-8">
      {/* Title + narrative */}
      <div className="space-y-4">
        <TranslatedField
          label="Título del área en el tour"
          value={stop.title_translations}
          language={language}
          onChange={(value) => onChange({ title_translations: value })}
          maxLength={500}
        />
        <TranslatedField
          label="Narrativa"
          value={content.narrative}
          language={language}
          onChange={(value) => setContent({ narrative: value })}
          multiline
          rows={6}
          placeholder="Cuenta qué pasa en esta área, qué la hace especial y qué debe observar el visitante."
        />
      </div>

      {/* Keypoints */}
      <div>
        {sectionTitle('Puntos clave', 'Frases cortas que el visitante debe recordar')}
        <div className="space-y-2">
          {keypoints.map((point, index) => (
            <div key={index} className="flex items-start gap-2">
              <TranslatedField
                className="flex-1"
                value={point}
                language={language}
                onChange={(value) => setContent({ keypoints: updateAt(keypoints, index, value) })}
                placeholder="Ej. Operación 24/7 en tres turnos"
                maxLength={500}
              />
              {removeButton(() => setContent({ keypoints: removeAt(keypoints, index) }))}
            </div>
          ))}
        </div>
        {keypoints.length < 20 && addButton('Agregar punto clave', () => setContent({ keypoints: [...keypoints, {}] }))}
      </div>

      {/* FAQ */}
      <div>
        {sectionTitle('Preguntas frecuentes')}
        <div className="space-y-3">
          {faq.map((item, index) => (
            <div key={index} className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="flex-1 space-y-2">
                <TranslatedField
                  value={item.q}
                  language={language}
                  onChange={(q) => setContent({ faq: updateAt(faq, index, { ...item, q }) })}
                  placeholder="Pregunta"
                  maxLength={500}
                />
                <TranslatedField
                  value={item.a}
                  language={language}
                  onChange={(a) => setContent({ faq: updateAt(faq, index, { ...item, a }) })}
                  placeholder="Respuesta"
                  multiline
                  rows={2}
                />
              </div>
              {removeButton(() => setContent({ faq: removeAt(faq, index) }))}
            </div>
          ))}
        </div>
        {faq.length < 20 && addButton('Agregar pregunta', () => setContent({ faq: [...faq, { q: {}, a: {} }] }))}
      </div>

      {/* Highlights */}
      <div>
        {sectionTitle('Datos destacados', 'Cifras clave del área. El valor es igual en todos los idiomas.')}
        <div className="space-y-2">
          {highlights.map((item, index) => (
            <div key={index} className="flex items-start gap-2">
              <TranslatedField
                className="flex-1"
                value={item.label}
                language={language}
                onChange={(label: Translations) => setContent({ highlights: updateAt(highlights, index, { ...item, label }) })}
                placeholder="Ej. Capacidad"
                maxLength={500}
              />
              <input
                value={item.value}
                onChange={(e) => setContent({ highlights: updateAt(highlights, index, { ...item, value: e.target.value }) })}
                placeholder="10,000 u/día"
                maxLength={100}
                className="w-40 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              {removeButton(() => setContent({ highlights: removeAt(highlights, index) }))}
            </div>
          ))}
        </div>
        {highlights.length < 12 &&
          addButton('Agregar dato', () => setContent({ highlights: [...highlights, { label: {}, value: '' }] }))}
      </div>

      {/* Cover image */}
      <div>
        {sectionTitle('Imagen del área', 'Se muestra en la cabecera del área durante el tour')}
        <div className="max-w-md">
          <ImageUpload
            onImageUploaded={(url) => onChange({ image_url: url })}
            organizationId={organizationId}
            plantId={plantId}
            imageType={ImageType.AREA_IMAGE}
            currentImageUrl={stop.image_url || undefined}
            helperText="Arrastra una foto aquí o haz clic para seleccionar"
            maxSizeMB={10}
          />
          {stop.image_url && (
            <button
              type="button"
              onClick={() => onChange({ image_url: null })}
              className="mt-2 text-xs font-medium text-red-600 hover:underline"
            >
              Quitar imagen
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StopContentEditor;

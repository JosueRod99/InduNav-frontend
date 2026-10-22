import { Globe, Lock } from 'lucide-react';
import ImageUpload from '../../../components/shared/ImageUpload';
import { ImageType } from '../../../api/upload';
import {
  TOUR_LANGUAGE_LABELS,
  type BuilderTour,
  type TourLanguage,
  type UpdateTourSettingsPayload,
} from '../../../api/tourBuilder';
import TranslatedField from './TranslatedField';
import SectionsEditor from './SectionsEditor';

interface TourSettingsEditorProps {
  tour: BuilderTour;
  language: TourLanguage;
  onChange: (patch: UpdateTourSettingsPayload) => void;
}

const VISIBILITY_OPTIONS = [
  {
    value: 'link' as const,
    Icon: Globe,
    title: 'Con link',
    description: 'Cualquier persona con el link o el QR puede ver el tour. No aparece en buscadores ni en catálogos.',
  },
  {
    value: 'private' as const,
    Icon: Lock,
    title: 'Privado',
    description: 'Solo usuarios con sesión iniciada en tu organización pueden verlo.',
  },
];

const TourSettingsEditor = ({ tour, language, onChange }: TourSettingsEditorProps) => {
  const toggleLanguage = (lang: TourLanguage) => {
    const next = tour.languages.includes(lang) ? tour.languages.filter((l) => l !== lang) : [...tour.languages, lang];
    if (next.length > 0) onChange({ languages: next });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <TranslatedField
          label="Título del tour"
          value={tour.title_translations}
          language={language}
          onChange={(value) => onChange({ title_translations: value })}
          maxLength={500}
        />
        <TranslatedField
          label="Descripción"
          value={tour.description_translations}
          language={language}
          onChange={(value) => onChange({ description_translations: value })}
          multiline
          rows={3}
          placeholder="Qué conocerá el visitante en este recorrido"
        />
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold text-gray-900">¿Quién puede verlo?</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          {VISIBILITY_OPTIONS.map(({ value, Icon, title, description }) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange({ visibility: value })}
              className={`flex items-start gap-3 rounded-lg border-2 p-3 text-left transition-colors ${
                tour.visibility === value ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Icon className={`mt-0.5 h-5 w-5 ${tour.visibility === value ? 'text-blue-600' : 'text-gray-500'}`} />
              <div>
                <p className="text-sm font-medium text-gray-900">{title}</p>
                <p className="mt-0.5 text-xs text-gray-600">{description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-900">Idiomas</h4>
        <p className="mb-2 text-xs text-gray-500">
          Cada idioma activo genera su propia narración en audio al publicar.
        </p>
        <div className="flex gap-4">
          {(Object.keys(TOUR_LANGUAGE_LABELS) as TourLanguage[]).map((lang) => (
            <label key={lang} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={tour.languages.includes(lang)}
                disabled={lang === 'es'}
                onChange={() => toggleLanguage(lang)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              {TOUR_LANGUAGE_LABELS[lang]}
              {lang === 'es' && <span className="text-xs text-gray-400">(principal)</span>}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-900">Portada del tour</h4>
        <div className="mt-2 max-w-md">
          <ImageUpload
            onImageUploaded={(url) => onChange({ cover_image_url: url })}
            organizationId={tour.organization_id}
            plantId={tour.plant_id}
            imageType={ImageType.OTHER}
            currentImageUrl={tour.cover_image_url || undefined}
            helperText="Imagen que se muestra al compartir el tour"
            maxSizeMB={10}
          />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-900">Estructura por defecto de las paradas</h4>
        <p className="mb-3 text-xs text-gray-500">
          Las paradas nuevas empiezan con estas secciones en este orden. Cada parada se puede ajustar después.
        </p>
        <SectionsEditor
          sections={tour.default_sections}
          onChange={(sections) => onChange({ default_sections: sections })}
          language={language}
          allowCustom={false}
        />
      </div>
    </div>
  );
};

export default TourSettingsEditor;

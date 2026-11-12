import { useEffect, useState } from 'react';
import { Database, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import type { LiveField, LiveText, LiveTranslation } from '../../../api/tourBuilder';

// Live data of the tour (safety, positions, processes...): it is written in its own module and only its
// translation is reviewed here. Each translation is stored once per organization, so a correction
// applies in every tour (backend services/liveTranslationService.ts).

const FIELD_LABELS: Record<LiveField, string> = {
  area_name: 'Nombre del área',
  area_description: 'Descripción del área',
  map_area: 'Zona del mapa',
  position: 'Puesto',
  shift: 'Turno',
  process_name: 'Proceso',
  process_step: 'Paso del proceso',
  process_description: 'Descripción del paso',
  process_activity: 'Actividad',
  product_description: 'Descripción de un producto',
  product_step: 'Paso de fabricación',
  safety_ppe: 'Equipo de protección',
  safety_hazard: 'Riesgo',
  safety_assembly_point: 'Punto de reunión',
  safety_access: 'Requisitos de acceso',
  safety_instructions: 'Instrucciones especiales',
  industry: 'Giro de la empresa',
  plant_description: 'Descripción de la planta',
};

// In the order the visitor finds them, each with the module where the original is edited
const GROUPS: { title: string; module: string; fields: LiveField[] }[] = [
  { title: 'Área', module: 'Áreas', fields: ['area_name', 'area_description'] },
  { title: 'Seguridad', module: 'Seguridad del área', fields: ['safety_ppe', 'safety_hazard', 'safety_assembly_point', 'safety_access', 'safety_instructions'] },
  { title: 'Personal', module: 'Personal y plantilla del área', fields: ['position', 'shift'] },
  { title: 'Procesos', module: 'Procesos de la planta', fields: ['process_name', 'process_step', 'process_description', 'process_activity'] },
  { title: 'Productos', module: 'Productos', fields: ['product_description', 'product_step'] },
  { title: 'Mapa', module: 'Layout de la planta', fields: ['map_area'] },
  { title: 'Empresa y planta', module: 'Perfil de la empresa y de la planta', fields: ['industry', 'plant_description'] },
];

type State = 'missing' | 'auto' | 'manual';

const stateOf = (translation: LiveTranslation | undefined): State => (!translation ? 'missing' : translation.auto ? 'auto' : 'manual');

const inputClass =
  'w-full rounded-md border px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

interface LiveTextsEditorProps {
  items: LiveText[];
  language: string;
  languageName: string; // of `language`, lowercase
  liveLanguageName: string; // language the data is written in, lowercase
  isOriginal: boolean; // `language` is the one the data is written in
  translations: Record<string, LiveTranslation>; // of `language`
  onSave: (source: string, text: string) => Promise<void>;
  emptyText: string;
}

const LiveTextRow = ({
  item,
  translation,
  liveLanguageName,
  onSave,
}: {
  item: LiveText;
  translation: LiveTranslation | undefined;
  liveLanguageName: string;
  onSave: (source: string, text: string) => Promise<void>;
}) => {
  const [value, setValue] = useState(translation?.text ?? '');
  const [saving, setSaving] = useState(false);
  // A translation that arrives later (the Translate button) replaces what is shown
  useEffect(() => setValue(translation?.text ?? ''), [translation?.text]);

  const state = stateOf(translation);
  const save = async () => {
    if (value.trim() === (translation?.text ?? '')) return;
    setSaving(true);
    try {
      await onSave(item.text, value);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'No se pudo guardar la traducción');
      setValue(translation?.text ?? '');
    } finally {
      setSaving(false);
    }
  };

  const chip =
    state === 'missing'
      ? { text: `Sin traducir · se muestra en ${liveLanguageName}`, className: 'bg-amber-100 text-amber-800' }
      : state === 'auto'
      ? { text: 'Traducción automática', className: 'bg-gray-100 text-gray-700' }
      : { text: 'Corregida a mano', className: 'bg-green-100 text-green-800' };
  const long = item.text.length > 60 || item.text.includes('\n');
  const props = {
    value,
    onChange: (e: { target: { value: string } }) => setValue(e.target.value),
    onBlur: save,
    disabled: saving,
    placeholder: item.text,
    maxLength: 5000,
    'aria-label': `${FIELD_LABELS[item.field]}: ${item.text}`,
    className: `${inputClass} ${state === 'missing' ? 'border-amber-300' : 'border-gray-300'} ${state === 'auto' ? 'bg-slate-50' : ''}`,
  };

  return (
    <li className="space-y-1.5 py-3">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <p className="min-w-0 text-sm text-gray-900">
          <span className="block text-[11px] font-medium uppercase tracking-wide text-gray-500">{FIELD_LABELS[item.field]}</span>
          <span className="whitespace-pre-line">{item.text}</span>
        </p>
        <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${chip.className}`}>
          {saving ? 'Guardando…' : chip.text}
        </span>
      </div>
      {long ? <textarea rows={3} {...props} /> : <input {...props} />}
    </li>
  );
};

/** Live texts of a stop (or of the whole tour) and their translation in the language being edited */
const LiveTextsEditor = ({ items, language, languageName, liveLanguageName, isOriginal, translations, onSave, emptyText }: LiveTextsEditorProps) => {
  const groups = GROUPS.map((group) => ({ ...group, items: items.filter((item) => group.fields.includes(item.field)) })).filter(
    (group) => group.items.length > 0
  );
  const missing = items.filter((item) => !translations[item.text]).length;

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
        <Database className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <div className="space-y-1.5">
          <p>
            Estos datos <strong>no se escriben en el tour</strong>: vienen de los módulos de la plataforma y se actualizan solos.
            Están escritos en {liveLanguageName}, el idioma base de la empresa.
          </p>
          {!isOriginal && (
            <ul className="list-disc space-y-0.5 pl-5">
              <li>
                Aquí revisas y corriges cómo se leen en <strong>{languageName}</strong>. Cada corrección se guarda al salir del campo.
              </li>
              <li>
                Una traducción <strong>se comparte en toda la empresa</strong>: si corriges un texto, cambia en todos los tours que lo muestren.
              </li>
              <li>
                Si alguien cambia un dato en su módulo, el visitante lo verá en {liveLanguageName} hasta que se traduzca de nuevo con el botón
                <strong> Traducir</strong>. Así nunca lee una instrucción vieja.
              </li>
            </ul>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">{emptyText}</p>
      ) : isOriginal ? (
        <>
          <p className="flex items-start gap-2 text-sm text-gray-600">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
            Estás viendo el idioma original. Para cambiar un texto, edítalo en su módulo; para revisar sus traducciones, elige otro idioma arriba.
          </p>
          {groups.map((group) => (
            <section key={group.title}>
              <h4 className="text-sm font-semibold text-gray-900">{group.title}</h4>
              <p className="text-xs text-gray-500">Se edita en: {group.module}</p>
              <ul className="mt-2 space-y-1 text-sm text-gray-800">
                {group.items.map((item) => (
                  <li key={item.text} className="whitespace-pre-line rounded-md bg-gray-50 px-3 py-2">
                    <span className="block text-[11px] font-medium uppercase tracking-wide text-gray-500">{FIELD_LABELS[item.field]}</span>
                    {item.text}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      ) : (
        <>
          <p className="text-sm text-gray-600">
            {items.length} {items.length === 1 ? 'texto' : 'textos'} ·{' '}
            {missing === 0 ? (
              'todos traducidos'
            ) : (
              <span className="font-medium text-amber-700">
                {missing} sin traducir: {missing === 1 ? 'se muestra' : 'se muestran'} en {liveLanguageName}
              </span>
            )}
          </p>
          {groups.map((group) => (
            <section key={group.title}>
              <h4 className="text-sm font-semibold text-gray-900">{group.title}</h4>
              <p className="text-xs text-gray-500">El original se edita en: {group.module}</p>
              <ul className="divide-y divide-gray-100">
                {group.items.map((item) => (
                  <LiveTextRow
                    key={`${language}:${item.text}`}
                    item={item}
                    translation={translations[item.text]}
                    liveLanguageName={liveLanguageName}
                    onSave={onSave}
                  />
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </div>
  );
};

export default LiveTextsEditor;

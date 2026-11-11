import type { TourLanguage, Translations } from '../../../api/tourBuilder';
import { useSourceLanguage, useTranslationMeta } from './sourceLanguage';
import { translationState } from '../../../utils/translationState';

interface TranslatedFieldProps {
  label?: string;
  value: Translations | undefined;
  language: TourLanguage;
  onChange: (value: Translations) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

const inputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

/**
 * Edits one language of a translated text. In a translation it shows the original text as placeholder
 * and warns when it is missing (visitors would see the original text).
 */
const TranslatedField = ({
  label,
  value,
  language,
  onChange,
  multiline = false,
  rows = 4,
  placeholder,
  maxLength,
  className,
}: TranslatedFieldProps) => {
  const current = value?.[language] || '';
  const source = useSourceLanguage();
  const original = value?.[source.code] || '';
  const state = translationState(value, source.code, language, useTranslationMeta());
  const notice =
    state === 'missing'
      ? `Sin traducir · se mostrará en ${source.name.toLowerCase()}`
      : state === 'outdated'
      ? 'Traducción automática de un texto anterior · se actualiza al traducir'
      : state === 'auto'
      ? 'Traducción automática'
      : null;
  // Fields without a label say it with their border and a tooltip
  const stateClass = state === 'missing' || state === 'outdated' ? 'border-amber-300' : state === 'auto' ? 'bg-slate-50' : '';

  const handleChange = (text: string) => onChange({ ...(value || {}), [language]: text });
  const effectivePlaceholder = language !== source.code && original ? original : placeholder;

  return (
    <div className={className}>
      {label && (
        <div className="mb-1 flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">{label}</label>
          {notice && (
            <span className={`text-[11px] font-medium ${state === 'auto' ? 'text-gray-500' : 'text-amber-600'}`}>{notice}</span>
          )}
        </div>
      )}
      {multiline ? (
        <textarea
          value={current}
          onChange={(e) => handleChange(e.target.value)}
          rows={rows}
          maxLength={maxLength}
          placeholder={effectivePlaceholder}
          title={label ? undefined : notice ?? undefined}
          className={`${inputClass} resize-y ${stateClass}`}
        />
      ) : (
        <input
          value={current}
          onChange={(e) => handleChange(e.target.value)}
          maxLength={maxLength}
          placeholder={effectivePlaceholder}
          title={label ? undefined : notice ?? undefined}
          className={`${inputClass} ${stateClass}`}
        />
      )}
    </div>
  );
};

export default TranslatedField;

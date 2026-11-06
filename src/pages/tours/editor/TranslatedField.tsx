import type { TourLanguage, Translations } from '../../../api/tourBuilder';
import { useSourceLanguage } from './sourceLanguage';

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
  const missingTranslation = language !== source.code && !current && !!original;

  const handleChange = (text: string) => onChange({ ...(value || {}), [language]: text });
  const effectivePlaceholder = language !== source.code && original ? original : placeholder;

  return (
    <div className={className}>
      {label && (
        <div className="mb-1 flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">{label}</label>
          {missingTranslation && (
            <span className="text-[11px] font-medium text-amber-600">Sin traducir · se mostrará en {source.name.toLowerCase()}</span>
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
          className={`${inputClass} resize-y ${missingTranslation ? 'border-amber-300' : ''}`}
        />
      ) : (
        <input
          value={current}
          onChange={(e) => handleChange(e.target.value)}
          maxLength={maxLength}
          placeholder={effectivePlaceholder}
          className={`${inputClass} ${missingTranslation ? 'border-amber-300' : ''}`}
        />
      )}
    </div>
  );
};

export default TranslatedField;

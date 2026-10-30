import { useState } from 'react';
import IntlTelInput from '@intl-tel-input/react';
import * as esLocale from 'intl-tel-input/locale/es';
import 'intl-tel-input/styles';

// Phone field with country selector (intl-tel-input). Mexico by default; country names in Spanish.
// onChange receives the number in international format (+526564128901), or '' when empty.
// The formatting/validation rules load on first use (separate chunk).

// The package's typings miss the locale files' default export (the Spanish UI texts)
const esTranslations = (esLocale as unknown as { default: object }).default;

interface PhoneInputProps {
  id?: string;
  value: string | null | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

const PhoneInput = ({ id, value, onChange, disabled, ariaLabel, className = '' }: PhoneInputProps) => {
  const [invalid, setInvalid] = useState(false);
  const [touched, setTouched] = useState(false);
  return (
    <div className={className}>
      <IntlTelInput
        value={value || ''}
        onChangeNumber={(number) => onChange(number)}
        onChangeValidity={(valid) => setInvalid(!valid)}
        disabled={disabled}
        initialCountry="mx"
        countryOrder={['mx', 'us', 'ca']}
        countryNameLocale="es"
        uiTranslations={esTranslations as never}
        separateDialCode
        strictMode
        loadUtils={() => import('intl-tel-input/utils')}
        containerClass="w-full"
        inputProps={{
          id,
          'aria-label': ariaLabel,
          onBlur: () => setTouched(true),
          className:
            'block w-full rounded-md border border-gray-300 py-2 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:bg-gray-50',
        }}
      />
      {touched && invalid && !!value && <p className="mt-1 text-xs text-red-600">Número de teléfono no válido</p>}
    </div>
  );
};

export default PhoneInput;

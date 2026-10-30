import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { DOCUMENT_CODE_TYPES, getNextDocumentCode } from '../../../api/areaDocuments';

// Document code: automatic (TYPE-KEY-NNN, next free number of the organization), typed by hand, or none.

export type DocumentCodeValue =
  | { mode: 'auto'; prefix: string; key: string }
  | { mode: 'manual'; code: string }
  | { mode: 'none' };

interface Props {
  codeSource: { areaId?: string; plantId?: string }; // where the next number is asked (same organization)
  value: DocumentCodeValue;
  onChange: (value: DocumentCodeValue) => void;
  disabled?: boolean;
}

const inputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50';

const DocumentCodeField = ({ codeSource, value, onChange, disabled }: Props) => {
  const isCustomPrefix = value.mode === 'auto' && !DOCUMENT_CODE_TYPES.some((t) => t.prefix === value.prefix);
  const [debouncedKey, setDebouncedKey] = useState(value.mode === 'auto' ? value.key : '');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedKey(value.mode === 'auto' ? value.key : ''), 300);
    return () => clearTimeout(t);
  }, [value]);

  const prefix = value.mode === 'auto' ? value.prefix : '';
  const validPrefix = /^[A-Z]{2,6}$/.test(prefix);
  const validKey = /^[A-Z0-9]+(-[A-Z0-9]+)*$/.test(debouncedKey);
  const { data: next, isFetching, isError } = useQuery({
    queryKey: ['next-document-code', codeSource.areaId || codeSource.plantId, prefix, debouncedKey],
    queryFn: () => getNextDocumentCode(codeSource, prefix, debouncedKey),
    enabled: value.mode === 'auto' && validPrefix && validKey,
    staleTime: 0, // numbers move as documents are saved
  });

  const modes: [DocumentCodeValue['mode'], string][] = [
    ['auto', 'Automático'],
    ['manual', 'Escribirlo'],
    ['none', 'Sin código'],
  ];

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="block text-sm font-medium text-gray-700">Código</span>
        <div className="flex rounded-md border border-gray-300 p-0.5 text-xs font-medium" role="group" aria-label="Tipo de código">
          {modes.map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              disabled={disabled}
              aria-pressed={value.mode === mode}
              onClick={() =>
                onChange(
                  mode === 'auto'
                    ? { mode, prefix: 'PROC', key: value.mode === 'auto' ? value.key : '' }
                    : mode === 'manual'
                    ? { mode, code: value.mode === 'auto' && next ? next : '' }
                    : { mode }
                )
              }
              className={`rounded px-2 py-1 ${value.mode === mode ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {value.mode === 'auto' && (
        <div className="space-y-1.5">
          <div className="grid grid-cols-2 gap-2">
            <select
              aria-label="Tipo de documento"
              value={isCustomPrefix ? 'OTRO' : value.prefix}
              disabled={disabled}
              onChange={(e) => onChange({ ...value, prefix: e.target.value === 'OTRO' ? '' : e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              {DOCUMENT_CODE_TYPES.map((t) => (
                <option key={t.prefix} value={t.prefix}>
                  {t.prefix} · {t.label}
                </option>
              ))}
              <option value="OTRO">Otro…</option>
            </select>
            <input
              aria-label="Clave"
              value={value.key}
              disabled={disabled}
              maxLength={20}
              onChange={(e) => onChange({ ...value, key: e.target.value.toUpperCase().replace(/\s+/g, '-') })}
              placeholder="Clave (ej. RH)"
              className={inputClass}
            />
          </div>
          {isCustomPrefix && (
            <input
              aria-label="Tipo personalizado"
              value={value.prefix}
              disabled={disabled}
              maxLength={6}
              onChange={(e) => onChange({ ...value, prefix: e.target.value.toUpperCase().replace(/[^A-Z]/g, '') })}
              placeholder="Tipo (2 a 6 letras, ej. HDS)"
              className={inputClass}
            />
          )}
          <p className="flex items-center gap-1.5 text-xs text-gray-600">
            {!validKey ? (
              'Escribe la clave (letras, números y guiones; GEN para documentos generales).'
            ) : !validPrefix ? (
              'El tipo debe tener de 2 a 6 letras.'
            ) : isFetching ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" /> Calculando…
              </>
            ) : isError ? (
              'No se pudo calcular el código.'
            ) : (
              <>
                Se asignará <strong className="font-mono text-gray-900">{next}</strong> (el siguiente disponible al guardar)
              </>
            )}
          </p>
        </div>
      )}

      {value.mode === 'manual' && (
        <input
          aria-label="Código del documento"
          value={value.code}
          disabled={disabled}
          maxLength={50}
          onChange={(e) => onChange({ mode: 'manual', code: e.target.value.toUpperCase() })}
          placeholder="Ej. PROC-RH-001"
          className={inputClass}
        />
      )}
    </div>
  );
};

export default DocumentCodeField;

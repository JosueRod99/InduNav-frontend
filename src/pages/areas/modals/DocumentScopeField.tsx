import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { getAreas } from '../../../api/areas';
import { SCOPE_OPTIONS, type DocumentScope } from '../../../api/areaDocuments';

// Who a document applies to: one area (chosen from a list), several areas (checkboxes), the whole
// plant or the whole company. Areas are those of the plant being worked on.

export interface DocumentScopeValue {
  scope: DocumentScope;
  areaId: string | null; // "area" scope
  sharedAreaIds: string[]; // "areas" scope
}

interface Props {
  plantId: string;
  value: DocumentScopeValue;
  onChange: (value: DocumentScopeValue) => void;
  disabled?: boolean;
}

const DocumentScopeField = ({ plantId, value, onChange, disabled }: Props) => {
  const [search, setSearch] = useState('');
  const { data: areas = [] } = useQuery({
    queryKey: ['plant-areas-flat', plantId],
    queryFn: async () => (await getAreas({ plant_id: plantId, limit: 500 })).areas,
    enabled: !!plantId && (value.scope === 'area' || value.scope === 'areas'),
  });
  const sorted = [...areas].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const filtered = sorted.filter((a) => !search || `${a.name} ${a.code || ''}`.toLowerCase().includes(search.toLowerCase()));

  // Switching between one and several areas keeps the areas already chosen
  const changeScope = (scope: DocumentScope) =>
    onChange({
      scope,
      areaId: scope === 'area' ? value.areaId || value.sharedAreaIds[0] || null : value.areaId,
      sharedAreaIds: scope === 'areas' && !value.sharedAreaIds.length && value.areaId ? [value.areaId] : value.sharedAreaIds,
    });

  const toggle = (id: string) =>
    onChange({
      ...value,
      sharedAreaIds: value.sharedAreaIds.includes(id) ? value.sharedAreaIds.filter((x) => x !== id) : [...value.sharedAreaIds, id],
    });

  return (
    <fieldset disabled={disabled}>
      <legend className="mb-2 block text-sm font-medium text-gray-700">¿A quién aplica?</legend>
      <div className="grid grid-cols-2 gap-2">
        {SCOPE_OPTIONS.map((option) => (
          <label
            key={option.value}
            className={`cursor-pointer rounded-lg border-2 p-2.5 text-left transition-colors ${
              value.scope === option.value ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="document-scope"
              value={option.value}
              checked={value.scope === option.value}
              onChange={() => changeScope(option.value)}
              className="sr-only"
            />
            <span className={`block text-sm font-semibold ${value.scope === option.value ? 'text-blue-900' : 'text-gray-900'}`}>{option.label}</span>
            <span className="block text-xs text-gray-600">{option.hint}</span>
          </label>
        ))}
      </div>

      {value.scope === 'area' && (
        <select
          value={value.areaId || ''}
          onChange={(e) => onChange({ ...value, areaId: e.target.value || null })}
          aria-label="Área a la que aplica"
          className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Elige el área…</option>
          {sorted.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
              {area.code ? ` (${area.code})` : ''}
            </option>
          ))}
        </select>
      )}

      {value.scope === 'areas' && (
        <div className="mt-2 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between gap-2 border-b border-gray-200 px-3 py-2">
            <span className="text-xs font-medium text-gray-700">
              {value.sharedAreaIds.length} área{value.sharedAreaIds.length === 1 ? '' : 's'} seleccionada{value.sharedAreaIds.length === 1 ? '' : 's'}
            </span>
            <label className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar área"
                aria-label="Buscar área"
                className="w-36 rounded-md border border-gray-300 py-1 pl-7 pr-2 text-xs"
              />
            </label>
          </div>
          <ul className="max-h-44 overflow-y-auto p-1">
            {filtered.map((area) => (
              <li key={area.id}>
                <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={value.sharedAreaIds.includes(area.id)}
                    onChange={() => toggle(area.id)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-900">{area.name}</span>
                  {area.code && <span className="font-mono text-xs text-gray-500">{area.code}</span>}
                </label>
              </li>
            ))}
            {filtered.length === 0 && <li className="px-2 py-3 text-center text-xs text-gray-500">Sin áreas</li>}
          </ul>
        </div>
      )}
    </fieldset>
  );
};

export default DocumentScopeField;

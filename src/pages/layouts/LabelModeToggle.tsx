import { useState } from 'react';

// "Names: always / on hover" switch of the admin layout maps (plant layout and area layouts).
// One preference for both, remembered per browser.

export type LabelMode = 'permanent' | 'hover';

const STORAGE_KEY = 'indunav-layout-labels';

export const useLabelMode = () => {
  const [mode, setMode] = useState<LabelMode>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'hover' ? 'hover' : 'permanent';
    } catch {
      return 'permanent';
    }
  });
  const change = (next: LabelMode) => {
    setMode(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // private mode: the choice just isn't remembered
    }
  };
  return [mode, change] as const;
};

const OPTIONS: { value: LabelMode; label: string }[] = [
  { value: 'permanent', label: 'Siempre' },
  { value: 'hover', label: 'Al pasar el mouse' },
];

const LabelModeToggle = ({ value, onChange }: { value: LabelMode; onChange: (mode: LabelMode) => void }) => (
  <div className="flex items-center rounded-lg border border-gray-300 p-0.5 text-xs font-medium" role="group" aria-label="Nombres en el mapa">
    <span className="px-1.5 text-gray-500">Nombres:</span>
    {OPTIONS.map((opt) => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange(opt.value)}
        aria-pressed={value === opt.value}
        className={`rounded-md px-2.5 py-1.5 transition-colors ${
          value === opt.value ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'
        }`}
        title="Cuándo mostrar los nombres en el mapa"
      >
        {opt.label}
      </button>
    ))}
  </div>
);

export default LabelModeToggle;

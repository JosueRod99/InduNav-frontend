import { ChartColumn, ChartLine, ChartPie, Plus, Trash2, type LucideIcon } from 'lucide-react';
import SimpleChart from '../../../components/tours/SimpleChart';
import type { ChartData, ChartType, TourLanguage } from '../../../api/tourBuilder';
import TranslatedField from './TranslatedField';

const MAX_POINTS = 12;

const CHART_TYPES: { value: ChartType; label: string; Icon: LucideIcon }[] = [
  { value: 'bar', label: 'Barras', Icon: ChartColumn },
  { value: 'line', label: 'Línea', Icon: ChartLine },
  { value: 'donut', label: 'Dona', Icon: ChartPie },
];

interface ChartFieldsProps {
  chart: ChartData;
  language: TourLanguage;
  title?: string;
  onChange: (chart: ChartData) => void;
}

const ChartFields = ({ chart, language, title, onChange }: ChartFieldsProps) => {
  const points = chart.points;
  const setPoints = (next: ChartData['points']) => onChange({ ...chart, points: next });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <p className="mb-1.5 text-sm font-medium text-gray-700">Tipo</p>
          <div className="flex gap-1.5" role="radiogroup" aria-label="Tipo de gráfica">
            {CHART_TYPES.map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={chart.type === value}
                onClick={() => onChange({ ...chart, type: value })}
                className={`flex items-center gap-1.5 rounded-md border-2 px-3 py-1.5 text-sm transition-colors ${
                  chart.type === value ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Unidad</label>
          <input
            value={chart.unit || ''}
            onChange={(e) => onChange({ ...chart, unit: e.target.value || undefined })}
            placeholder="%, pzas, hrs…"
            maxLength={20}
            className="w-32 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium text-gray-700">Datos</p>
        <div className="space-y-2">
          {points.map((point, index) => (
            <div key={index} className="flex items-center gap-2">
              <TranslatedField
                className="flex-1"
                value={point.label}
                language={language}
                onChange={(label) => setPoints(points.map((p, i) => (i === index ? { ...p, label } : p)))}
                placeholder={chart.type === 'donut' ? 'Ej. Línea 1' : 'Ej. Enero'}
                maxLength={500}
              />
              <input
                type="number"
                step="any"
                value={Number.isFinite(point.value) ? point.value : ''}
                onChange={(e) =>
                  setPoints(points.map((p, i) => (i === index ? { ...p, value: e.target.value === '' ? 0 : Number(e.target.value) } : p)))
                }
                aria-label="Valor"
                className="w-28 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="button"
                onClick={() => setPoints(points.filter((_, i) => i !== index))}
                className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                aria-label="Quitar dato"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        {points.length < MAX_POINTS && (
          <button
            type="button"
            onClick={() => setPoints([...points, { label: {}, value: 0 }])}
            className="mt-2 inline-flex items-center gap-1 rounded-md border border-dashed border-blue-300 px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar dato
          </button>
        )}
        {points.length === 0 && (
          <p className="mt-2 text-xs text-amber-600">Sin datos, la gráfica no se mostrará al visitante.</p>
        )}
      </div>

      {points.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Vista previa</p>
          <SimpleChart chart={chart} language={language} title={title} compact />
        </div>
      )}
    </div>
  );
};

export default ChartFields;

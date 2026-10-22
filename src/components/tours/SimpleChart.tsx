import type { ChartData, TourLanguage } from '../../api/tourBuilder';

// Lightweight SVG charts for tour sections (bar, line, donut). Values are always printed so the
// chart is readable without hover, and the SVG has a text description for screen readers.

const PALETTE = ['#2563EB', '#16A34A', '#F59E0B', '#DC2626', '#7C3AED', '#0891B2', '#DB2777', '#65A30D', '#EA580C', '#4F46E5', '#0D9488', '#9333EA'];

const formatValue = (value: number, unit?: string) => {
  const n = Number.isInteger(value) ? value.toLocaleString('es-MX') : value.toLocaleString('es-MX', { maximumFractionDigits: 2 });
  if (!unit) return n;
  return unit === '%' ? `${n}%` : `${n} ${unit}`;
};

interface SimpleChartProps {
  chart: ChartData;
  language: TourLanguage;
  title?: string;
  compact?: boolean; // smaller height for the editor preview
}

const SimpleChart = ({ chart, language, title, compact = false }: SimpleChartProps) => {
  const points = chart.points.map((p) => ({ label: p.label[language] || p.label.es || '', value: Number(p.value) || 0 }));
  if (points.length === 0) return null;

  const description = `${title ? `${title}: ` : ''}${points.map((p) => `${p.label} ${formatValue(p.value, chart.unit)}`).join(', ')}`;

  if (chart.type === 'donut') {
    const total = points.reduce((s, p) => s + Math.max(p.value, 0), 0) || 1;
    const R = 60;
    const C = 2 * Math.PI * R;
    let offset = 0;
    return (
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
        <svg viewBox="0 0 160 160" className={compact ? 'h-32 w-32' : 'h-44 w-44'} role="img" aria-label={description}>
          <g transform="rotate(-90 80 80)">
            {points.map((p, i) => {
              const length = (Math.max(p.value, 0) / total) * C;
              const circle = (
                <circle
                  key={i}
                  cx="80"
                  cy="80"
                  r={R}
                  fill="none"
                  stroke={PALETTE[i % PALETTE.length]}
                  strokeWidth="26"
                  strokeDasharray={`${length} ${C - length}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += length;
              return circle;
            })}
          </g>
        </svg>
        <ul className="space-y-1.5">
          {points.map((p, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
              <span className="h-3 w-3 flex-shrink-0 rounded-sm" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
              <span>{p.label}</span>
              <span className="font-semibold text-slate-900">{formatValue(p.value, chart.unit)}</span>
              <span className="text-xs text-slate-500">({Math.round((Math.max(p.value, 0) / total) * 100)}%)</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Bar and line share the same axes
  const W = 600;
  const H = compact ? 200 : 260;
  const PAD = { top: 24, right: 16, bottom: 40, left: 16 };
  const max = Math.max(...points.map((p) => p.value), 0) || 1;
  const min = Math.min(...points.map((p) => p.value), 0);
  const range = max - min || 1;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const y = (v: number) => PAD.top + innerH - ((v - min) / range) * innerH;
  const slot = innerW / points.length;
  const x = (i: number) => PAD.left + slot * i + slot / 2;
  const baseline = y(Math.max(min, 0));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto h-auto w-full max-w-2xl" role="img" aria-label={description}>
      <line x1={PAD.left} x2={W - PAD.right} y1={baseline} y2={baseline} stroke="#CBD5E1" />
      {chart.type === 'bar' &&
        points.map((p, i) => {
          const barW = Math.min(slot * 0.6, 56);
          const top = Math.min(y(p.value), baseline);
          return (
            <rect
              key={i}
              x={x(i) - barW / 2}
              y={top}
              width={barW}
              height={Math.max(Math.abs(baseline - y(p.value)), 1)}
              rx="4"
              fill={PALETTE[0]}
            />
          );
        })}
      {chart.type === 'line' && (
        <>
          <polyline
            points={points.map((p, i) => `${x(i)},${y(p.value)}`).join(' ')}
            fill="none"
            stroke={PALETTE[0]}
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {points.map((p, i) => (
            <circle key={i} cx={x(i)} cy={y(p.value)} r="5" fill="#FFFFFF" stroke={PALETTE[0]} strokeWidth="3" />
          ))}
        </>
      )}
      {points.map((p, i) => (
        <g key={`t${i}`}>
          <text x={x(i)} y={y(p.value) - 8} textAnchor="middle" fontSize="13" fontWeight="600" fill="#0F172A">
            {formatValue(p.value, chart.unit)}
          </text>
          <text x={x(i)} y={H - PAD.bottom + 20} textAnchor="middle" fontSize="12" fill="#475569">
            {p.label.length > 14 ? `${p.label.slice(0, 13)}…` : p.label}
          </text>
        </g>
      ))}
    </svg>
  );
};

export default SimpleChart;

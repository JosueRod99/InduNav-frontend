import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getVisitsReport, type ReportScope, type VisitsReportTour } from '../../api/reports';
import ReportView, { formatReportDate } from './ReportView';
import type { ReportColumn, ReportSheet } from './reportExcel';
import { selectClass } from './reportStyles';

// Visits to the tours: how many, per day and per tour. The detail of each tour is in its statistics page.

const PERIODS = [7, 30, 90];
const LANGUAGES: Record<string, string> = { es: 'Español', en: 'Inglés' };
const DEVICES: Record<string, string> = { mobile: 'Celular', tablet: 'Tablet', desktop: 'Computadora' };

const duration = (seconds: number) => {
  if (!seconds) return '—';
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  return minutes < 60 ? `${minutes} min ${seconds % 60} s` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
};

const COLUMNS: ReportColumn<VisitsReportTour>[] = [
  { key: 'title', label: 'Tour', value: (t) => t.title, width: 36 },
  { key: 'plant', label: 'Planta', value: (t) => t.plant_name, width: 20 },
  { key: 'status', label: 'Estado', value: (t) => (t.status === 'published' ? 'Publicado' : 'Borrador'), width: 12 },
  { key: 'visits', label: 'Visitas', value: (t) => t.visits, width: 10 },
  { key: 'completed', label: 'Completadas', value: (t) => t.completed, width: 13 },
  { key: 'average', label: 'Tiempo promedio', value: (t) => duration(t.average_seconds), width: 16 },
];

const DAY_COLUMNS: ReportColumn<{ day: string; visits: number }>[] = [
  { key: 'day', label: 'Día', value: (d) => d.day, date: true, width: 14 },
  { key: 'visits', label: 'Visitas', value: (d) => d.visits, width: 10 },
];

const breakdown = (counts: Record<string, number>, labels: Record<string, string>) =>
  Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([key, n]) => `${labels[key] || key} ${n}`)
    .join(' · ') || '—';

const VisitsReport = ({ scope, scopeLabel }: { scope: ReportScope; scopeLabel: string }) => {
  const [days, setDays] = useState(30);
  const [tourId, setTourId] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['report-visits', scope, days, tourId],
    queryFn: () => getVisitsReport({ ...scope, days, tour_id: tourId || undefined }),
    placeholderData: keepPreviousData,
  });
  const tours = data?.tours || [];
  const rows = tourId ? tours.filter((t) => t.id === tourId) : tours;
  const byDay = data?.by_day || [];
  const maxDay = Math.max(1, ...byDay.map((d) => d.visits));
  const tourName = tours.find((t) => t.id === tourId)?.title;
  const daySheet: ReportSheet = { name: 'Por día', columns: DAY_COLUMNS, rows: byDay };

  return (
    <ReportView
      title="Visitas a tours"
      description="Cuántas visitas tuvo cada tour y cómo se reparten en el tiempo."
      scopeLabel={scopeLabel}
      filterLabel={[`Últimos ${days} días`, tourName].filter(Boolean).join(' · ')}
      columns={COLUMNS}
      rows={rows}
      rowKey={(t) => t.id}
      loading={isLoading}
      error={isError}
      emptyText="No hay tours en esta selección."
      extraSheets={[daySheet]}
      filters={
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Periodo" className={selectClass}>
            {PERIODS.map((p) => (
              <option key={p} value={p}>
                Últimos {p} días
              </option>
            ))}
          </select>
          <select value={tourId} onChange={(e) => setTourId(e.target.value)} aria-label="Tour" className={selectClass}>
            <option value="">Tour: todos</option>
            {tours.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
      }
      summary={
        data && (
          <div className="grid grid-cols-3 gap-3">
            {[
              ['Visitas', data.visits],
              ['Completadas', data.completed],
              ['Tiempo promedio', duration(data.average_seconds)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-gray-200 bg-white p-3">
                <span className="block text-xl font-bold text-gray-900 sm:text-2xl">{value}</span>
                <span className="text-xs text-gray-600">{label}</span>
              </div>
            ))}
          </div>
        )
      }
    >
      {data && (
        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-gray-900">Visitas por día</h3>
          {data.visits === 0 ? (
            <p className="mt-2 text-sm text-gray-600">Sin visitas en este periodo.</p>
          ) : (
            <>
              <div className="mt-3 flex h-24 items-end gap-px" role="img" aria-label={`Visitas por día de los últimos ${days} días`}>
                {byDay.map((d) => (
                  <div key={d.day} title={`${formatReportDate(d.day)}: ${d.visits}`} className={`min-w-0 flex-1 rounded-t ${d.visits ? 'bg-blue-500' : 'bg-gray-100'}`} style={{ height: `${Math.max(4, (d.visits / maxDay) * 100)}%` }} />
                ))}
              </div>
              <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span>{byDay[0] && formatReportDate(byDay[0].day)}</span>
                <span>{byDay[byDay.length - 1] && formatReportDate(byDay[byDay.length - 1].day)}</span>
              </div>
              <p className="mt-3 text-xs text-gray-600">
                Idioma: {breakdown(data.languages, LANGUAGES)}
                <br />
                Dispositivo: {breakdown(data.devices, DEVICES)}
              </p>
            </>
          )}
        </section>
      )}
    </ReportView>
  );
};

export default VisitsReport;

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BarChart3, CheckCircle2, Clock, Eye, Loader2, PlayCircle, ShieldCheck } from 'lucide-react';
import { getTourBuilder, getTourStats } from '../../api/tourBuilder';

// Visit statistics of a tour: anonymous visits of the published tour (PLAN_TOURS_REALES.md step 7)

const PERIODS = [7, 30, 90] as const;

const LABELS: Record<string, Record<string, string>> = {
  languages: { es: 'Español', en: 'Inglés' },
  sources: { link: 'Link corto', slug: 'Link con nombre', qr: 'QR de un área' },
  devices: { mobile: 'Celular', tablet: 'Tablet', desktop: 'Computadora' },
};

const duration = (seconds: number) => {
  if (!seconds) return '—';
  if (seconds < 60) return `${seconds} s`;
  const m = Math.floor(seconds / 60);
  return m < 60 ? `${m} min ${seconds % 60} s` : `${Math.floor(m / 60)} h ${m % 60} min`;
};

const pct = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);

const TourStatsPage = () => {
  const { tourId } = useParams<{ tourId: string }>();
  const [days, setDays] = useState<(typeof PERIODS)[number]>(30);

  const { data: builder } = useQuery({
    queryKey: ['tour-builder', tourId],
    queryFn: () => getTourBuilder(tourId!),
    enabled: !!tourId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['tour-stats', tourId, days],
    queryFn: () => getTourStats(tourId!, days),
    enabled: !!tourId,
    staleTime: 5 * 60 * 1000, // stats do not need to be live; keeps database usage low
    refetchOnWindowFocus: false,
  });

  const title = builder?.tour.title_translations?.es || builder?.tour.title || 'Tour';
  const totals = stats?.totals;
  const maxDay = Math.max(1, ...(stats?.by_day.map((d) => d.visits) || [1]));
  const maxStopViews = Math.max(1, ...(stats?.stops.map((s) => s.views) || [1]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <Link
            to={`/tours/${tourId}/edit`}
            className="mb-1 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al editor
          </Link>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <BarChart3 className="h-6 w-6 flex-shrink-0 text-blue-600" />
            <span className="truncate">Estadísticas · {title}</span>
          </h2>
          <p className="mt-1 text-sm text-gray-600">Visitas anónimas del tour publicado.</p>
        </div>
        <div className="flex rounded-lg bg-gray-100 p-1" role="group" aria-label="Periodo">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setDays(p)}
              aria-pressed={days === p}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                days === p ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {p} días
            </button>
          ))}
        </div>
      </div>

      {builder && builder.tour.status !== 'published' && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
          Este tour no está publicado: no recibe visitas nuevas. Las vistas previas del editor no se cuentan.
        </p>
      )}

      {isLoading ? (
        <p className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
        </p>
      ) : error || !stats || !totals ? (
        <p className="text-red-600">No se pudieron cargar las estadísticas.</p>
      ) : (
        <>
          {/* Funnel */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { Icon: Eye, label: 'Visitas', value: totals.visits.toLocaleString('es-MX'), sub: 'Abrieron el tour' },
              {
                Icon: PlayCircle,
                label: 'Iniciaron el recorrido',
                value: totals.started.toLocaleString('es-MX'),
                sub: `${pct(totals.started, totals.visits)}% de las visitas`,
              },
              {
                Icon: CheckCircle2,
                label: 'Terminaron',
                value: totals.completed.toLocaleString('es-MX'),
                sub: `${pct(totals.completed, totals.visits)}% de las visitas`,
              },
              { Icon: Clock, label: 'Tiempo promedio', value: duration(totals.avg_seconds), sub: 'De quienes recorrieron áreas' },
            ].map(({ Icon, label, value, sub }) => (
              <div key={label} className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
                <p className="mt-0.5 text-xs text-gray-500">{sub}</p>
              </div>
            ))}
          </div>

          {/* Visits per day */}
          <section className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Visitas por día</h3>
            {totals.visits === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">
                Aún no hay visitas en este periodo. Comparte el link o imprime los QR de las áreas.
              </p>
            ) : (
              <>
                <div
                  className="flex h-36 items-end gap-px sm:gap-0.5"
                  role="img"
                  aria-label={`Visitas por día: ${stats.by_day.filter((d) => d.visits > 0).map((d) => `${d.date} ${d.visits}`).join(', ')}`}
                >
                  {stats.by_day.map((d) => (
                    <div key={d.date} className="group relative flex h-full min-w-0 flex-1 items-end">
                      <div
                        className={`w-full rounded-t ${d.visits > 0 ? 'bg-blue-500 group-hover:bg-blue-700' : 'bg-gray-100'}`}
                        style={{ height: d.visits > 0 ? `${Math.max(4, (d.visits / maxDay) * 100)}%` : '2px' }}
                      />
                      <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white group-hover:block">
                        {new Date(`${d.date}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}: {d.visits}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-1 flex justify-between text-[11px] text-gray-500">
                  {[stats.by_day[0], stats.by_day[stats.by_day.length - 1]].map((d) => (
                    <span key={d.date}>{new Date(`${d.date}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</span>
                  ))}
                </div>
              </>
            )}
          </section>

          {/* Breakdowns */}
          <div className="grid gap-4 md:grid-cols-3">
            {(
              [
                ['languages', 'Idioma'],
                ['sources', 'Cómo llegaron'],
                ['devices', 'Dispositivo'],
              ] as const
            ).map(([key, heading]) => {
              const entries = Object.entries(stats[key]).sort((a, b) => b[1] - a[1]);
              return (
                <section key={key} className="rounded-lg border border-gray-200 bg-white p-4">
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">{heading}</h3>
                  {entries.length === 0 ? (
                    <p className="text-sm text-gray-500">Sin datos</p>
                  ) : (
                    <ul className="space-y-2.5">
                      {entries.map(([k, n]) => (
                        <li key={k}>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-700">{LABELS[key][k] || k}</span>
                            <span className="font-medium text-gray-900">
                              {n} <span className="font-normal text-gray-500">· {pct(n, totals.visits)}%</span>
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 rounded-full bg-gray-100">
                            <div className="h-full rounded-full bg-blue-500" style={{ width: `${pct(n, totals.visits)}%` }} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>

          {/* Per area */}
          <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <h3 className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900">
              Por área
              <span className="ml-2 font-normal text-gray-500">¿Dónde se quedan y dónde se van los visitantes?</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-2">Área</th>
                    <th className="px-4 py-2">Vistas</th>
                    <th className="whitespace-nowrap px-4 py-2 text-right">Tiempo promedio</th>
                    <th className="whitespace-nowrap px-4 py-2 text-right">Escucharon narración</th>
                    <th className="whitespace-nowrap px-4 py-2 text-right">Escucha promedio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.stops.map((s, i) => (
                    <tr key={s.stop_id}>
                      <td className="px-4 py-2">
                        <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-[11px] font-semibold text-blue-700">
                          {i + 1}
                        </span>
                        <span className="font-medium text-gray-900">{s.title}</span>
                      </td>
                      <td className="min-w-[10rem] px-4 py-2">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 rounded-full bg-gray-100">
                            <div className="h-full rounded-full bg-blue-500" style={{ width: `${(s.views / maxStopViews) * 100}%` }} />
                          </div>
                          <span className="w-8 text-right font-medium text-gray-900">{s.views}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right text-gray-700">{duration(s.avg_seconds)}</td>
                      <td className="px-4 py-2 text-right text-gray-700">
                        {s.audio_listeners}
                        {s.views > 0 && <span className="text-gray-500"> · {pct(s.audio_listeners, s.views)}%</span>}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-700">{duration(s.avg_audio_seconds)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <p className="flex items-start gap-2 text-xs text-gray-500">
            <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0" />
            Las visitas son anónimas: no se guardan nombres, IP, ubicación ni cookies. No se cuentan las vistas previas del
            editor ni los robots (buscadores y vistas previas de WhatsApp). Los datos se actualizan cada pocos minutos.
          </p>
        </>
      )}
    </div>
  );
};

export default TourStatsPage;

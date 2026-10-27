import { Fragment, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, FlaskConical, Loader2, Volume2 } from 'lucide-react';
import { getNarrationUsage } from '../../api/admin';

// Internal report (platform_admin): narration audios generated per month and their estimated cost.

const currentMonth = () => new Date().toLocaleString('sv-SE', { timeZone: 'America/Mexico_City' }).slice(0, 7);

const NarrationUsagePage = () => {
  const [month, setMonth] = useState(currentMonth());
  const [openPublication, setOpenPublication] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['narration-usage', month],
    queryFn: () => getNarrationUsage(month),
  });

  const usd = (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} USD`;
  const mxn = (value: number) =>
    `$${(value * (data?.rates.usd_mxn ?? 0)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;
  const num = (value: number) => value.toLocaleString('es-MX');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Consumo de narración</h2>
          <p className="mt-1 text-sm text-gray-600">
            Audios generados al publicar tours y su costo estimado. Solo visible para administradores de la plataforma.
          </p>
        </div>
        <div>
          <label htmlFor="usage-month" className="mb-1 block text-sm font-medium text-gray-700">
            Mes
          </label>
          <input
            id="usage-month"
            type="month"
            value={month}
            max={currentMonth()}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {isLoading ? (
        <p className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
        </p>
      ) : error || !data ? (
        <p className="text-red-600">No se pudo cargar el reporte.</p>
      ) : (
        <>
          {data.rates.test_mode && (
            <p className="flex items-center gap-2 rounded-lg border border-purple-300 bg-purple-50 px-4 py-2.5 text-sm text-purple-900">
              <FlaskConical className="h-4 w-4" />
              <strong>Modo prueba activo</strong> en el servidor: los audios nuevos solo contienen la primera frase.
            </p>
          )}

          {/* Totals */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: 'Costo estimado', value: usd(data.totals.cost_usd), sub: mxn(data.totals.cost_usd) },
              { label: 'Caracteres generados', value: num(data.totals.characters), sub: `${num(data.totals.audios)} audios` },
              { label: 'Publicaciones', value: num(data.totals.publications), sub: `${num(data.totals.counted)} con narración (cuentan para el límite)` },
              { label: 'Tarifa configurada', value: `$${data.rates.usd_per_1k_characters} USD / 1,000 caracteres`, sub: `${data.rates.model} · 1 USD = $${data.rates.usd_mxn} MXN` },
            ].map((card) => (
              <div key={card.label} className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{card.label}</p>
                <p className="mt-1 text-xl font-bold text-gray-900">{card.value}</p>
                <p className="mt-0.5 text-xs text-gray-500">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* By organization */}
          <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <h3 className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900">Por empresa</h3>
            {data.organizations.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-500">Sin publicaciones este mes.</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-2">Empresa</th>
                    <th className="px-4 py-2 text-right">Con narración / límite</th>
                    <th className="px-4 py-2 text-right">Audios</th>
                    <th className="px-4 py-2 text-right">Caracteres</th>
                    <th className="px-4 py-2 text-right">Costo estimado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.organizations.map((o) => (
                    <tr key={o.id}>
                      <td className="px-4 py-2 font-medium text-gray-900">{o.name}</td>
                      <td className="px-4 py-2 text-right">
                        <span className={o.counted >= o.limit ? 'font-semibold text-amber-700' : ''}>
                          {o.counted} / {o.limit}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">{num(o.audios)}</td>
                      <td className="px-4 py-2 text-right">{num(o.characters)}</td>
                      <td className="px-4 py-2 text-right">
                        {usd(o.cost_usd)} <span className="text-xs text-gray-500">({mxn(o.cost_usd)})</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Publications with their audios */}
          <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <h3 className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900">Publicaciones y audios</h3>
            {data.publications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-500">Sin publicaciones este mes.</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-2">Fecha</th>
                    <th className="px-4 py-2">Tour</th>
                    <th className="px-4 py-2">Empresa</th>
                    <th className="px-4 py-2 text-right">Audios</th>
                    <th className="px-4 py-2 text-right">Caracteres</th>
                    <th className="px-4 py-2 text-right">Costo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.publications.map((p) => {
                    const isOpen = openPublication === p.id;
                    return (
                      <Fragment key={p.id}>
                        <tr
                          className={p.audios.length > 0 ? 'cursor-pointer hover:bg-gray-50' : ''}
                          onClick={() => p.audios.length > 0 && setOpenPublication(isOpen ? null : p.id)}
                        >
                          <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                            <span className="inline-flex items-center gap-1">
                              {p.audios.length > 0 ? (
                                isOpen ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />
                              ) : (
                                <span className="w-4" />
                              )}
                              {new Date(p.published_at).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <span className="font-medium text-gray-900">{p.tour_title}</span>{' '}
                            <span className="text-xs text-gray-500">v{p.version}</span>
                            {p.tts_test_mode && (
                              <span className="ml-2 rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-700">Prueba</span>
                            )}
                            {!p.counts_toward_limit && (
                              <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">Sin narración nueva</span>
                            )}
                            {p.published_by && <span className="block text-xs text-gray-500">por {p.published_by}</span>}
                          </td>
                          <td className="px-4 py-2 text-gray-700">{p.organization_name}</td>
                          <td className="px-4 py-2 text-right">{p.audio_generated_count}</td>
                          <td className="px-4 py-2 text-right">{num(p.audio_characters)}</td>
                          <td className="whitespace-nowrap px-4 py-2 text-right">{usd(p.audio_cost_usd)}</td>
                        </tr>
                        {isOpen && (
                          <tr className="bg-gray-50/70">
                            <td colSpan={6} className="px-4 py-3">
                              <table className="w-full text-xs">
                                <thead className="text-left text-gray-500">
                                  <tr>
                                    <th className="py-1 pr-3">Área</th>
                                    <th className="py-1 pr-3">Idioma</th>
                                    <th className="py-1 pr-3 text-right">Caracteres</th>
                                    <th className="py-1 pr-3 text-right">Duración</th>
                                    <th className="py-1 pr-3 text-right">Costo</th>
                                    <th className="py-1">Escuchar</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {p.audios.map((a) => (
                                    <tr key={a.id}>
                                      <td className="py-1 pr-3 text-gray-800">{a.area_title}</td>
                                      <td className="py-1 pr-3 uppercase text-gray-600">{a.language}</td>
                                      <td className="py-1 pr-3 text-right">{num(a.characters)}</td>
                                      <td className="py-1 pr-3 text-right">{a.duration_seconds ? `~${a.duration_seconds} s` : '—'}</td>
                                      <td className="whitespace-nowrap py-1 pr-3 text-right">{usd(a.cost_usd)}</td>
                                      <td className="py-1">
                                        <audio controls preload="none" src={a.audio_url} className="h-7 w-56" aria-label={`Audio ${a.area_title} ${a.language}`}>
                                          <Volume2 className="h-4 w-4" />
                                        </audio>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>

          <p className="text-xs text-gray-500">
            El costo es una estimación con la tarifa vigente cuando se generó cada audio (configurable en el servidor:
            TTS_COST_USD_PER_1K_CHARS y USD_MXN_RATE). El cobro real lo muestra el panel de ElevenLabs. Las publicaciones de tours
            eliminados no aparecen.
          </p>
        </>
      )}
    </div>
  );
};

export default NarrationUsagePage;

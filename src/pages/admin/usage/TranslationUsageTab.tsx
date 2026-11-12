import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { getTranslationUsage, type CharactersByLanguage } from '../../../api/admin';
import UsageMeter from './UsageMeter';

// Internal report (platform_admin): characters sent to the automatic translator per month, by company,
// tour and language, and how much of the provider's free monthly characters they take.

const languageNames = new Intl.DisplayNames(['es'], { type: 'language' });
const languageName = (code: string) => {
  try {
    return languageNames.of(code) ?? code;
  } catch {
    return code;
  }
};

const num = (value: number) => value.toLocaleString('es-MX');

/** "japonés 5,331 · inglés 6,264", largest first */
const Languages = ({ byLanguage }: { byLanguage: CharactersByLanguage }) => (
  <span className="flex flex-wrap gap-1">
    {Object.entries(byLanguage)
      .sort(([, a], [, b]) => b - a)
      .map(([code, characters]) => (
        <span key={code} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700" title={code}>
          {languageName(code)} {num(characters)}
        </span>
      ))}
  </span>
);

const TranslationUsageTab = ({ month }: { month: string }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['translation-usage', month],
    queryFn: () => getTranslationUsage(month),
  });

  if (isLoading) {
    return (
      <p className="flex items-center gap-2 text-gray-600">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
      </p>
    );
  }
  if (error || !data) return <p className="text-red-600">No se pudo cargar el reporte.</p>;

  const { rates, totals } = data;
  const usd = (value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
  const mxn = (value: number) => `$${(value * rates.usd_mxn).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;
  const free = rates.free_characters;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-gray-900">Nivel gratuito de Google Translate</h3>
        <UsageMeter
          used={totals.characters}
          limit={free}
          title={`${num(totals.characters)} de ${num(free)} caracteres gratis del mes`}
          note={`Pasando los ${num(free)}, Google cobra $${rates.usd_per_1m_characters} USD por cada millón de caracteres. El gratuito es de toda la cuenta de Google: si la llave se usa en otros proyectos, también cuenta ahí.`}
        />
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Costo estimado', value: usd(totals.cost_usd), sub: totals.cost_usd > 0 ? mxn(totals.cost_usd) : 'Dentro del nivel gratuito' },
          { label: 'Caracteres enviados', value: num(totals.characters), sub: `${num(totals.requests)} ${totals.requests === 1 ? 'envío' : 'envíos'} al traductor` },
          { label: 'Textos del visor', value: num(data.platform.characters), sub: 'Botones y etiquetas, del catálogo de idiomas' },
          { label: 'Límite por empresa', value: `${num(rates.limit_per_organization)} / mes`, sub: `Traductor: ${rates.provider}` },
        ].map((card) => (
          <div key={card.label} className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{card.label}</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{card.value}</p>
            <p className="mt-0.5 text-xs text-gray-500">{card.sub}</p>
          </div>
        ))}
      </div>

      {totals.characters > 0 && (
        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold text-gray-900">Por idioma de destino</h3>
          <Languages byLanguage={totals.by_language} />
        </section>
      )}

      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <h3 className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900">Por empresa</h3>
        {data.organizations.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-gray-500">Ninguna empresa tradujo este mes.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-2">Empresa</th>
                  <th className="px-4 py-2 text-right">Caracteres / límite</th>
                  <th className="px-4 py-2">Idiomas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.organizations.map((o) => {
                  const share = o.limit > 0 ? o.characters / o.limit : 0;
                  return (
                    <tr key={o.id}>
                      <td className="px-4 py-2 font-medium text-gray-900">{o.name}</td>
                      <td className="whitespace-nowrap px-4 py-2 text-right">
                        <span className={share >= 0.9 ? 'font-semibold text-red-700' : share >= 0.75 ? 'font-semibold text-amber-700' : ''}>
                          {num(o.characters)} / {num(o.limit)}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <Languages byLanguage={o.by_language} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <h3 className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900">Por tour</h3>
        {data.tours.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-gray-500">No se tradujo ningún tour este mes.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-2">Tour</th>
                  <th className="px-4 py-2">Empresa</th>
                  <th className="px-4 py-2 text-right">Caracteres</th>
                  <th className="px-4 py-2">Idiomas</th>
                  <th className="px-4 py-2">Última traducción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.tours.map((t) => (
                  <tr key={t.tour_id ?? `deleted-${t.organization_name}`}>
                    <td className="px-4 py-2 font-medium text-gray-900">
                      {t.tour_id ? t.tour_title : <span className="italic text-gray-500">Tours eliminados</span>}
                    </td>
                    <td className="px-4 py-2 text-gray-700">{t.organization_name}</td>
                    <td className="px-4 py-2 text-right">{num(t.characters)}</td>
                    <td className="px-4 py-2">
                      <Languages byLanguage={t.by_language} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                      {new Date(t.last_at).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs text-gray-500">
        Cuenta cada carácter enviado al traductor: textos de los tours, datos de la planta y textos del visor. Lo ya traducido no se
        vuelve a enviar. El costo es una estimación (configurable en el servidor: TRANSLATION_FREE_CHARACTERS y
        TRANSLATION_COST_USD_PER_1M_CHARS); el cobro real lo muestra la consola de Google Cloud, que cierra el mes en horario del Pacífico.
      </p>
    </div>
  );
};

export default TranslationUsageTab;

import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AudioLines, Languages } from 'lucide-react';
import ScrollTabs from '../../components/ui/ScrollTabs';
import NarrationUsageTab from './usage/NarrationUsageTab';
import TranslationUsageTab from './usage/TranslationUsageTab';

// Internal report (platform_admin): what the paid services (narration and automatic translation)
// consumed in a month. Each one is counted in its own unit, so each has its own tab.

const currentMonth = () => new Date().toLocaleString('sv-SE', { timeZone: 'America/Mexico_City' }).slice(0, 7);

const TABS = [
  { id: 'narration', label: 'Narración', hint: 'ElevenLabs · audios generados al publicar tours', Icon: AudioLines },
  { id: 'translation', label: 'Traducción', hint: 'Google Translate · textos traducidos automáticamente', Icon: Languages },
] as const;

const ServiceUsagePage = () => {
  const [params] = useSearchParams();
  const activeTab = TABS.find((tab) => tab.id === params.get('tab')) ?? TABS[0];
  const [month, setMonth] = useState(currentMonth());

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Consumo de servicios</h2>
          <p className="mt-1 text-sm text-gray-600">
            Lo que consumen los servicios de pago y su costo estimado. Solo visible para administradores de la plataforma.
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
      <ScrollTabs label="Servicios">
        {TABS.map(({ id, label, Icon }) => (
          <Link
            key={id}
            to={`?tab=${id}`}
            replace
            aria-current={activeTab.id === id ? 'page' : undefined}
            className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              activeTab.id === id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900'
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </Link>
        ))}
      </ScrollTabs>
      <p className="text-sm text-gray-500">{activeTab.hint}</p>
      {activeTab.id === 'narration' ? <NarrationUsageTab month={month} /> : <TranslationUsageTab month={month} />}
    </div>
  );
};

export default ServiceUsagePage;

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { getCertificationsReport, type CertificationReportRow, type CertificationReportState, type ReportScope } from '../../api/reports';
import { matchesSearch } from '../../utils/search';
import ReportView from './ReportView';
import type { ReportColumn } from './reportExcel';
import { searchInputClass, selectClass } from './reportStyles';

// Certifications of the company and of each person: what is valid, what is about to expire and what expired.

const STATES: Record<CertificationReportState, string> = {
  expired: 'Vencida',
  expiring: 'Por vencer',
  active: 'Vigente',
  in_progress: 'En proceso',
  suspended: 'Suspendida',
};
const URGENCY: CertificationReportState[] = ['expired', 'expiring', 'suspended', 'in_progress', 'active'];

const appliesTo = (c: CertificationReportRow) => {
  if (c.kind === 'person') return c.holder;
  if (c.scope === 'organization') return 'Toda la empresa';
  if (c.scope === 'plant') return c.plant_name ? `Planta: ${c.plant_name}` : 'Una planta';
  return c.area_name ? `Área: ${c.area_name}` : 'Un área';
};

const COLUMNS: ReportColumn<CertificationReportRow>[] = [
  { key: 'name', label: 'Certificación', value: (c) => c.name, width: 34 },
  { key: 'kind', label: 'Tipo', value: (c) => (c.kind === 'system' ? 'Empresa' : 'Personal'), width: 11 },
  { key: 'applies', label: 'Aplica a', value: appliesTo, width: 30 },
  { key: 'area', label: 'Área', value: (c) => c.area_name, width: 22, inPreview: false },
  { key: 'plant', label: 'Planta', value: (c) => c.plant_name, width: 18, inPreview: false },
  { key: 'state', label: 'Estado', value: (c) => STATES[c.state], width: 12 },
  { key: 'issue', label: 'Emisión', value: (c) => c.issue_date, date: true, width: 13, inPreview: false },
  { key: 'expiry', label: 'Vence', value: (c) => c.expiry_date, date: true, width: 13 },
  { key: 'audit', label: 'Próxima auditoría', value: (c) => c.next_audit_date, date: true, width: 17 },
  { key: 'body', label: 'Organismo', value: (c) => c.issuing_body, width: 22, inPreview: false },
  { key: 'number', label: 'No. de certificado', value: (c) => c.certificate_number, width: 18, inPreview: false },
  { key: 'responsible', label: 'Responsable', value: (c) => c.responsible, width: 26, inPreview: false },
];

const CertificationsReport = ({ scope, scopeLabel }: { scope: ReportScope; scopeLabel: string }) => {
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState('');
  const [area, setArea] = useState('');
  const [state, setState] = useState<'' | CertificationReportState>('');

  const { data, isLoading, isError } = useQuery({ queryKey: ['report-certifications', scope], queryFn: () => getCertificationsReport(scope) });
  const all = useMemo(() => [...(data?.rows || [])].sort((a, b) => URGENCY.indexOf(a.state) - URGENCY.indexOf(b.state)), [data]);
  const areas = useMemo(() => [...new Set(all.map((c) => c.area_name).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, 'es')), [all]);

  const inFilters = all.filter((c) => (!kind || c.kind === kind) && (!area || c.area_name === area) && matchesSearch(search, c.name, c.holder, c.issuing_body));
  const rows = inFilters.filter((c) => !state || c.state === state);
  const count = (s: CertificationReportState) => inFilters.filter((c) => c.state === s).length;

  const cards: ['' | CertificationReportState, string, number][] = [
    ['', 'Certificaciones', inFilters.length],
    ['active', 'Vigentes', count('active')],
    ['expiring', `Por vencer en ${data?.alert_days ?? 30} días`, count('expiring')],
    ['expired', 'Vencidas', count('expired')],
  ];

  return (
    <ReportView
      title="Certificaciones"
      description="De la empresa y de cada persona, de la más urgente a la menos urgente."
      scopeLabel={scopeLabel}
      filterLabel={[state && STATES[state], kind && (kind === 'system' ? 'Empresa' : 'Personal'), area && `Área: ${area}`, search && `Búsqueda: ${search}`].filter(Boolean).join(' · ')}
      columns={COLUMNS}
      rows={rows}
      rowKey={(c) => `${c.kind}-${c.id}`}
      loading={isLoading}
      error={isError}
      emptyText="Ninguna certificación coincide."
      summary={
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {cards.map(([key, label, value]) => (
            <button
              key={label}
              onClick={() => setState(state === key ? '' : key)}
              aria-pressed={state === key}
              className={`rounded-lg border bg-white p-3 text-left transition-colors ${state === key ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200 hover:border-blue-300'}`}
            >
              <span className="block text-2xl font-bold text-gray-900">{value}</span>
              <span className="text-xs text-gray-600">{label}</span>
            </button>
          ))}
        </div>
      }
      filters={
        <>
          <label className="relative w-full flex-1 sm:w-auto sm:min-w-[12rem]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por certificación o persona" aria-label="Buscar certificaciones" className={searchInputClass} />
          </label>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
            <select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Tipo" className={selectClass}>
              <option value="">Tipo: todos</option>
              <option value="system">Empresa</option>
              <option value="person">Personal</option>
            </select>
            <select value={area} onChange={(e) => setArea(e.target.value)} aria-label="Área" className={selectClass}>
              <option value="">Área: todas</option>
              {areas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </>
      }
    />
  );
};

export default CertificationsReport;

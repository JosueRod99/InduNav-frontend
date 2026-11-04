import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { getPersonnelReport, type PersonnelReportRow, type ReportScope } from '../../api/reports';
import { matchesSearch } from '../../utils/search';
import ReportView from './ReportView';
import type { ReportColumn } from './reportExcel';
import { searchInputClass, selectClass } from './reportStyles';

// Who is in each area, their position and certifications. No phones or birth dates: not needed here.

const COLUMNS: ReportColumn<PersonnelReportRow>[] = [
  { key: 'name', label: 'Nombre', value: (p) => p.name, width: 30 },
  { key: 'number', label: 'No. de empleado', value: (p) => p.employee_number, width: 16 },
  { key: 'position', label: 'Puesto', value: (p) => p.position, width: 30 },
  { key: 'area', label: 'Área', value: (p) => p.areas[0], width: 22 },
  { key: 'others', label: 'Otras áreas', value: (p) => p.areas.slice(1).join(', '), width: 26, inPreview: false },
  { key: 'plant', label: 'Planta', value: (p) => p.plant_name, width: 18, inPreview: false },
  { key: 'manager', label: 'Reporta a', value: (p) => p.manager, width: 28 },
  { key: 'email', label: 'Correo', value: (p) => p.email, width: 30, inPreview: false },
  { key: 'hire', label: 'Ingreso', value: (p) => p.hire_date, date: true, width: 13, inPreview: false },
  { key: 'certifications', label: 'Certificaciones', value: (p) => p.certifications.join(', '), width: 40 },
  { key: 'alerts', label: 'Vencidas o por vencer', value: (p) => p.certification_alerts, width: 20, inPreview: false },
];

const PersonnelReport = ({ scope, scopeLabel }: { scope: ReportScope; scopeLabel: string }) => {
  const [search, setSearch] = useState('');
  const [area, setArea] = useState('');
  const [certification, setCertification] = useState('');

  const { data = [], isLoading, isError } = useQuery({ queryKey: ['report-personnel', scope], queryFn: () => getPersonnelReport(scope) });
  const areas = useMemo(() => [...new Set(data.flatMap((p) => p.areas))].sort((a, b) => a.localeCompare(b, 'es')), [data]);
  const certifications = useMemo(() => [...new Set(data.flatMap((p) => p.certifications))].sort((a, b) => a.localeCompare(b, 'es')), [data]);
  const rows = data.filter(
    (p) => (!area || p.areas.includes(area)) && (!certification || p.certifications.includes(certification)) && matchesSearch(search, p.name, p.employee_number, p.position)
  );

  return (
    <ReportView
      title="Personal por área"
      description="Quién está en cada área, su puesto y sus certificaciones. Solo personal activo."
      scopeLabel={scopeLabel}
      filterLabel={[area && `Área: ${area}`, certification && `Certificación: ${certification}`, search && `Búsqueda: ${search}`].filter(Boolean).join(' · ')}
      columns={COLUMNS}
      rows={rows}
      rowKey={(p) => p.id}
      loading={isLoading}
      error={isError}
      emptyText="Ninguna persona coincide."
      filters={
        <>
          <label className="relative w-full flex-1 sm:w-auto sm:min-w-[12rem]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre, número o puesto" aria-label="Buscar personal" className={searchInputClass} />
          </label>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
            <select value={area} onChange={(e) => setArea(e.target.value)} aria-label="Área" className={selectClass}>
              <option value="">Área: todas</option>
              {areas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <select value={certification} onChange={(e) => setCertification(e.target.value)} aria-label="Certificación" className={selectClass}>
              <option value="">Certificación: todas</option>
              {certifications.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </>
      }
    />
  );
};

export default PersonnelReport;

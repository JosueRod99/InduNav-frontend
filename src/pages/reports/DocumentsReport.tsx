import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { getCategoryLabel, getStatusLabel } from '../../api/areaDocuments';
import { getDocumentsReport, type DocumentReportRow, type ReportScope } from '../../api/reports';
import { matchesSearch } from '../../utils/search';
import ReportView from './ReportView';
import type { ReportColumn } from './reportExcel';
import { searchInputClass, selectClass } from './reportStyles';

// Documents master list: what exists, which version is current and who it applies to.

const SOURCES: Record<string, string> = { uploaded: 'Archivo', external_link: 'Link externo', pending: 'Sin archivo' };

const appliesTo = (d: DocumentReportRow) => {
  switch (d.scope) {
    case 'organization':
      return 'Toda la empresa';
    case 'plant':
      return 'Toda la planta';
    case 'area':
      return d.area_name || 'Un área';
    case 'areas':
      return d.shared_areas.join(', ');
    case 'products':
      return `Productos: ${d.shared_products.join(', ')}`;
    case 'equipment':
      return `Equipos: ${d.shared_equipment.join(', ')}`;
    default:
      return '';
  }
};

const COLUMNS: ReportColumn<DocumentReportRow>[] = [
  { key: 'code', label: 'Código', value: (d) => d.code, width: 16 },
  { key: 'title', label: 'Título', value: (d) => d.title, width: 40 },
  { key: 'category', label: 'Categoría', value: (d) => getCategoryLabel(d.category), width: 24 },
  { key: 'version', label: 'Versión', value: (d) => d.version, width: 9 },
  { key: 'status', label: 'Estado', value: (d) => getStatusLabel(d.status), width: 13 },
  { key: 'source', label: 'Archivo', value: (d) => SOURCES[d.source] || d.source, width: 13 },
  { key: 'applies', label: 'Aplica a', value: appliesTo, width: 34 },
  { key: 'plant', label: 'Planta', value: (d) => d.plant_name, width: 18, inPreview: false },
  { key: 'effective', label: 'Vigente desde', value: (d) => d.effective_date, date: true, width: 14, inPreview: false },
  { key: 'review', label: 'Próxima revisión', value: (d) => d.review_date, date: true, width: 16 },
  { key: 'expiry', label: 'Vence', value: (d) => d.expiry_date, date: true, width: 13, inPreview: false },
  { key: 'private', label: 'Privado', value: (d) => (d.is_private ? 'Sí' : 'No'), width: 9, inPreview: false },
  { key: 'updated', label: 'Actualizado', value: (d) => d.updated_at, date: true, width: 13, inPreview: false },
];

const DocumentsReport = ({ scope, scopeLabel }: { scope: ReportScope; scopeLabel: string }) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('current'); // current: everything except the archived ones

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ['report-documents', scope],
    queryFn: () => getDocumentsReport(scope),
  });
  const categories = useMemo(
    () => [...new Set(data.map((d) => d.category))].sort((a, b) => getCategoryLabel(a).localeCompare(getCategoryLabel(b), 'es')),
    [data]
  );
  const rows = data.filter((d) => {
    if (status === 'current' ? d.status === 'archived' : status !== 'all' && d.status !== status) return false;
    if (category && d.category !== category) return false;
    return matchesSearch(search, d.code, d.title);
  });

  const statusText = status === 'current' ? 'Sin archivados' : status === 'all' ? 'Incluye archivados' : getStatusLabel(status);

  return (
    <ReportView
      title="Lista maestra de documentos"
      description="Última versión de cada documento: código, estado y a quién aplica."
      scopeLabel={scopeLabel}
      filterLabel={[statusText, category && getCategoryLabel(category), search && `Búsqueda: ${search}`].filter(Boolean).join(' · ')}
      columns={COLUMNS}
      rows={rows}
      rowKey={(d) => d.id}
      loading={isLoading}
      error={isError}
      emptyText="Ningún documento coincide."
      filters={
        <>
          <label className="relative w-full flex-1 sm:w-auto sm:min-w-[12rem]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por código o título" aria-label="Buscar documentos" className={searchInputClass} />
          </label>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
            <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Categoría" className={selectClass}>
              <option value="">Categoría: todas</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {getCategoryLabel(c)}
                </option>
              ))}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Estado" className={selectClass}>
              <option value="current">Estado: sin archivados</option>
              <option value="active">Activos</option>
              <option value="under_review">En revisión</option>
              <option value="draft">Borradores</option>
              <option value="archived">Archivados</option>
              <option value="all">Todos</option>
            </select>
          </div>
        </>
      }
    />
  );
};

export default DocumentsReport;

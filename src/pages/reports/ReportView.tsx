import { useEffect, useState, type ReactNode } from 'react';
import { Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import SectionHeader from '../../components/ui/SectionHeader';
import { downloadReport, type ReportColumn, type ReportSheet } from './reportExcel';

// One report: what it is, its filters, a preview and the Excel button. What is filtered is what downloads.

const PAGE = 50;

/** "2026-10-29" → "29 oct 2026", without moving the day with the time zone */
export const formatReportDate = (value: string) => {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('es-MX', { dateStyle: 'medium' });
};

const display = <T,>(column: ReportColumn<T>, row: T) => {
  const value = column.value(row);
  if (value === null || value === undefined || value === '') return '—';
  return column.date && typeof value === 'string' ? formatReportDate(value) : value;
};

interface Props<T> {
  title: string;
  description: string;
  scopeLabel: string; // company and plant, on the file
  filterLabel?: string; // what is filtered, on the file
  columns: ReportColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading: boolean;
  error?: boolean;
  emptyText: string;
  filters?: ReactNode;
  summary?: ReactNode; // above the filters
  children?: ReactNode; // between the filters and the table
  extraSheets?: ReportSheet[];
}

const ReportView = <T,>({ title, description, scopeLabel, filterLabel, columns, rows, rowKey, loading, error, emptyText, filters, summary, children, extraSheets = [] }: Props<T>) => {
  const [limit, setLimit] = useState(PAGE);
  const [downloading, setDownloading] = useState(false);
  useEffect(() => setLimit(PAGE), [rows]);

  const preview = columns.filter((c) => c.inPreview !== false);
  const hidden = columns.length - preview.length;
  const shown = rows.slice(0, limit);

  const download = async () => {
    setDownloading(true);
    try {
      await downloadReport({
        title,
        subtitle: [scopeLabel, filterLabel].filter(Boolean).join(' · '),
        sheets: [{ name: title, columns, rows }, ...extraSheets],
      });
    } catch {
      toast.error('No se pudo generar el archivo');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        title={title}
        description={description}
        actions={
          <Button onClick={download} disabled={loading || rows.length === 0 || downloading} className="gap-2 whitespace-nowrap">
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Descargar Excel
          </Button>
        }
      />
      {summary}
      {filters && <div className="flex flex-wrap items-center gap-2">{filters}</div>}
      {children}

      {loading ? (
        <p className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white p-8 text-sm text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
        </p>
      ) : error ? (
        <p className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-red-600">No se pudo cargar el reporte.</p>
      ) : rows.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">{emptyText}</p>
      ) : (
        <>
          <p className="text-xs text-gray-500">
            {rows.length} {rows.length === 1 ? 'registro' : 'registros'}
            {hidden > 0 && ` · El Excel incluye ${hidden} ${hidden === 1 ? 'columna más' : 'columnas más'}`}
          </p>
          {/* Table on wide screens */}
          <div className="hidden overflow-x-auto rounded-lg border border-gray-200 bg-white md:block">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {preview.map((column) => (
                    <th key={column.key} className="whitespace-nowrap px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {shown.map((row) => (
                  <tr key={rowKey(row)}>
                    {preview.map((column) => (
                      <td key={column.key} className="px-4 py-2 text-gray-700 first:font-medium first:text-gray-900">
                        {display(column, row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Cards on phones */}
          <ul className="space-y-2 md:hidden">
            {shown.map((row) => (
              <li key={rowKey(row)} className="rounded-lg border border-gray-200 bg-white p-3">
                <p className="text-sm font-medium text-gray-900">{display(preview[0], row)}</p>
                <dl className="mt-1 space-y-0.5 text-xs">
                  {preview.slice(1).map((column) => (
                    <div key={column.key} className="flex gap-2">
                      <dt className="flex-shrink-0 text-gray-500">{column.label}:</dt>
                      <dd className="min-w-0 text-gray-700">{display(column, row)}</dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>
          {rows.length > limit && (
            <div className="text-center">
              <Button variant="outline" onClick={() => setLimit(limit + PAGE)}>
                Mostrar más
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReportView;

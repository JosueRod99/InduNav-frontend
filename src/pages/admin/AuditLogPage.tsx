import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { AlertCircle, ChevronLeft, ChevronRight, Clock, FileText, KeyRound, Loader2, Search, ShieldCheck } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import { getAuditLog, getAuditLogs, getAuditStats, type AuditLogFilters } from '../../api/admin';

// Internal audit log (platform_admin): changes, errors and login attempts on the API, 90 days.

const METHOD_STYLES: Record<string, string> = {
  GET: 'bg-sky-50 text-sky-700',
  POST: 'bg-green-50 text-green-700',
  PUT: 'bg-amber-50 text-amber-700',
  PATCH: 'bg-amber-50 text-amber-700',
  DELETE: 'bg-red-50 text-red-700',
};

const statusStyle = (code: number) =>
  code >= 500 ? 'bg-red-600 text-white' : code >= 400 ? 'bg-amber-500 text-white' : 'bg-gray-900 text-white';

const dateTime = (iso: string) =>
  new Date(iso).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'medium' });

const AuditLogPage = () => {
  const [filters, setFilters] = useState<AuditLogFilters>({ page: 1, limit: 25 });
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  // Search as you type, without a request per keystroke
  useEffect(() => {
    const timer = setTimeout(() => setFilters((f) => (f.search === (search || undefined) ? f : { ...f, search: search || undefined, page: 1 })), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const setFilter = (patch: Partial<AuditLogFilters>) => setFilters((f) => ({ ...f, ...patch, page: 1 }));

  const { data: stats } = useQuery({ queryKey: ['audit-stats'], queryFn: getAuditStats, refetchOnWindowFocus: false });
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => getAuditLogs(filters),
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });
  const { data: detail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['audit-log', openId],
    queryFn: () => getAuditLog(openId!),
    enabled: !!openId,
  });

  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Auditoría</h2>
        <p className="mt-1 text-sm text-gray-600">
          Cambios, errores e inicios de sesión en la API de los últimos {stats?.retention_days ?? 90} días. Solo visible para
          administradores de la plataforma.
        </p>
      </div>

      {stats?.logging_reads && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
          <strong>Registro de consultas activo</strong> (AUDIT_LOG_READS=true): también se guardan las consultas exitosas. Apágalo al
          terminar de depurar; hace crecer mucho la tabla.
        </p>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { Icon: FileText, label: 'Registros', value: stats?.total, sub: stats ? `Tabla: ${stats.table_size}` : '' },
          { Icon: Clock, label: 'Hoy', value: stats?.today, sub: 'Desde las 00:00 (CDMX)' },
          { Icon: AlertCircle, label: 'Errores', value: stats?.errors, sub: 'Respuestas 4xx y 5xx', danger: true },
          {
            Icon: KeyRound,
            label: 'Accesos fallidos',
            value: stats?.failed_logins_24h,
            sub: 'Últimas 24 horas',
            danger: true,
          },
        ].map(({ Icon, label, value, sub, danger }) => (
          <div key={label} className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-gray-500">
              {label}
              <Icon className="h-4 w-4" />
            </p>
            <p className={`mt-1 text-2xl font-bold ${danger && value ? 'text-red-600' : 'text-gray-900'}`}>
              {value === undefined ? '—' : value.toLocaleString('es-MX')}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">{sub}</p>
          </div>
        ))}
      </div>
      {stats && Object.keys(stats.methods).length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-gray-500">Por método:</span>
          {Object.entries(stats.methods).map(([method, n]) => (
            <button
              key={method}
              onClick={() => setFilter({ method: filters.method === method ? undefined : method })}
              className={`rounded-full border px-2.5 py-0.5 font-medium ${
                filters.method === method ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              {method}: {n.toLocaleString('es-MX')}
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative min-w-[14rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por URL, acción o usuario…"
            aria-label="Buscar"
            className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <select
          value={filters.method || ''}
          onChange={(e) => setFilter({ method: e.target.value || undefined })}
          aria-label="Método"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Todos los métodos</option>
          {['POST', 'PUT', 'PATCH', 'DELETE', 'GET'].map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={filters.status || ''}
          onChange={(e) => setFilter({ status: (e.target.value || undefined) as AuditLogFilters['status'] })}
          aria-label="Resultado"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Todos los resultados</option>
          <option value="success">Exitosos</option>
          <option value="error">Errores</option>
        </select>
        <label className="text-xs text-gray-600">
          Desde
          <input
            type="date"
            value={filters.from || ''}
            onChange={(e) => setFilter({ from: e.target.value || undefined })}
            className="mt-0.5 block rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs text-gray-600">
          Hasta
          <input
            type="date"
            value={filters.to || ''}
            onChange={(e) => setFilter({ to: e.target.value || undefined })}
            className="mt-0.5 block rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
        </label>
      </div>

      {/* Table */}
      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {isLoading ? (
          <p className="flex items-center gap-2 p-6 text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
          </p>
        ) : error ? (
          <p className="p-6 text-red-600">No se pudo cargar la auditoría.</p>
        ) : !data?.logs.length ? (
          <p className="p-8 text-center text-sm text-gray-500">No hay registros con estos filtros.</p>
        ) : (
          <div className={`overflow-x-auto ${isFetching ? 'opacity-60' : ''}`}>
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-2">Fecha</th>
                  <th className="px-4 py-2">Método</th>
                  <th className="px-4 py-2">URL</th>
                  <th className="px-4 py-2">Usuario</th>
                  <th className="px-4 py-2 text-center">Status</th>
                  <th className="px-4 py-2 text-right">Tiempo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setOpenId(log.id)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setOpenId(log.id))}
                    tabIndex={0}
                    className="cursor-pointer hover:bg-gray-50 focus:bg-blue-50 focus:outline-none"
                  >
                    <td className="whitespace-nowrap px-4 py-2 text-gray-600">{dateTime(log.created_at)}</td>
                    <td className="px-4 py-2">
                      <span className={`rounded px-2 py-0.5 font-mono text-xs font-semibold ${METHOD_STYLES[log.method] || 'bg-gray-100'}`}>
                        {log.method}
                      </span>
                    </td>
                    <td className="max-w-[28rem] px-4 py-2">
                      <span className="block truncate font-mono text-xs text-gray-900" title={log.url}>
                        {log.url}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {log.action}
                        {log.error_message && <span className="text-red-600"> · {log.error_message}</span>}
                      </span>
                    </td>
                    <td className="max-w-[16rem] px-4 py-2">
                      <span className="block truncate text-gray-900">{log.user_email || '—'}</span>
                      {log.organization_name && <span className="block truncate text-[11px] text-gray-500">{log.organization_name}</span>}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyle(log.status_code)}`}>{log.status_code}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-right text-gray-500">{log.response_time_ms ?? '—'} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pagination && pagination.total > 0 && (
          <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-4 py-2.5 text-sm text-gray-600">
            <span>
              {((pagination.page - 1) * pagination.limit + 1).toLocaleString('es-MX')}–
              {Math.min(pagination.page * pagination.limit, pagination.total).toLocaleString('es-MX')} de{' '}
              {pagination.total.toLocaleString('es-MX')}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                disabled={pagination.page <= 1}
                className="rounded p-1.5 hover:bg-gray-100 disabled:opacity-40"
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span>
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages}
                className="rounded p-1.5 hover:bg-gray-100 disabled:opacity-40"
                aria-label="Página siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      <p className="flex items-start gap-2 text-xs text-gray-500">
        <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0" />
        Se registran los cambios (crear, editar, borrar), los errores y los inicios de sesión. Las consultas exitosas y las páginas
        públicas de los tours no se registran. Contraseñas, tokens y llaves se guardan ocultos (***). Los registros de más de 90 días se
        borran solos.
      </p>

      <Modal isOpen={!!openId} onClose={() => setOpenId(null)} title="Detalle del registro" size="lg">
        {isLoadingDetail || !detail ? (
          <p className="flex items-center gap-2 text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
          </p>
        ) : (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded px-2 py-0.5 font-mono text-xs font-semibold ${METHOD_STYLES[detail.method] || 'bg-gray-100'}`}>
                {detail.method}
              </span>
              <span className="break-all font-mono text-xs text-gray-900">{detail.url}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyle(detail.status_code)}`}>{detail.status_code}</span>
            </div>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
              {[
                ['Fecha', dateTime(detail.created_at)],
                ['Tiempo de respuesta', `${detail.response_time_ms ?? '—'} ms`],
                ['Acción', detail.action],
                ['ID afectado', detail.resource_id],
                ['Usuario', detail.user_email],
                ['Empresa', detail.organization_name],
                ['IP', detail.ip_address],
                ['Navegador', detail.user_agent],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="text-xs text-gray-500">{label}</dt>
                  <dd className="break-words text-gray-900">{value || '—'}</dd>
                </div>
              ))}
            </dl>
            {detail.error_message && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-800">
                <p className="text-xs font-semibold uppercase tracking-wide">Error</p>
                <p className="mt-0.5">{detail.error_message}</p>
              </div>
            )}
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Datos enviados</p>
              {detail.request_body ? (
                <pre className="max-h-80 overflow-auto rounded-md bg-gray-900 p-3 text-xs text-gray-100">
                  {JSON.stringify(detail.request_body, null, 2)}
                </pre>
              ) : (
                <p className="text-gray-500">Sin datos (consulta o petición sin cuerpo).</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AuditLogPage;

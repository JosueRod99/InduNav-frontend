import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, GitBranch, Loader2, Pencil, Plus, Search, Trash2, User } from 'lucide-react';
import Button from '../../components/ui/Button';
import { deleteProcess, getProcess, getProcesses, type ProcessSummary } from '../../api/processes';
import ProcessStepsList from './ProcessStepsList';
import ProcessEditorModal from './ProcessEditorModal';
import { useAuthStore } from '../../store/authStore';
import SectionHeader from '../../components/ui/SectionHeader';
import { matchesSearch, normalizeSearch } from '../../utils/search';

// "Procesos" tab of a plant (PLAN_LAB_KRAFT.md point 5): processes that go across areas
// ("Del pedido a la entrega"). The list and one process (?proceso=<id>) live in the same tab.

const EDITORS = ['platform_admin', 'org_owner', 'plant_manager'];

// Search and status filter only appear when the list is long enough to need them
const FILTERS_FROM = 7;

/** Different areas the process goes through (the card shows the count; the detail shows each step) */
const areaCount = (p: ProcessSummary) => new Set(p.areas.map((a) => a.id)).size;

const StatusBadge = ({ status }: { status: 'draft' | 'active' }) =>
  status === 'active' ? (
    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Vigente</span>
  ) : (
    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">Borrador</span>
  );

const ProcessesTab = ({ plantId, organizationId, area }: { plantId: string; organizationId: string; area?: { id: string; name: string } }) => {
  const queryClient = useQueryClient();
  const canEdit = EDITORS.includes(useAuthStore((s) => s.user?.role?.name) || '');
  const [searchParams, setSearchParams] = useSearchParams();
  const processId = searchParams.get('proceso');
  const [editor, setEditor] = useState<'new' | 'edit' | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'draft'>('');
  const plant = { id: plantId, organization_id: organizationId };

  const { data: processes, isLoading } = useQuery({ queryKey: ['processes', plantId], queryFn: () => getProcesses(plantId) });
  const { data: process, isLoading: loadingProcess } = useQuery({
    queryKey: ['process', processId],
    queryFn: () => getProcess(processId!),
    enabled: !!processId,
  });

  // Keeps the rest of the URL (inside an area page, ?tab=processes)
  const open = (id: string | null) =>
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (id) next.set('proceso', id);
        else next.delete('proceso');
        return next;
      },
      { replace: false }
    );

  const remove = useMutation({
    mutationFn: (id: string) => deleteProcess(id),
    onSuccess: () => {
      toast.success('Proceso eliminado');
      queryClient.invalidateQueries({ queryKey: ['processes', plantId] });
      queryClient.invalidateQueries({ queryKey: ['area-process-steps'] });
      open(null);
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'No se pudo eliminar'),
  });

  const editorModal = (
    <ProcessEditorModal
      isOpen={!!editor}
      onClose={() => setEditor(null)}
      plant={plant}
      process={editor === 'edit' ? process : null}
      onSaved={(saved) => {
        setEditor(null);
        open(saved.id);
      }}
    />
  );

  // One process
  if (processId) {
    if (loadingProcess) {
      return (
        <p className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando proceso…
        </p>
      );
    }
    if (!process) {
      return (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">No se encontró el proceso.</p>
          <button type="button" onClick={() => open(null)} className="text-sm font-medium text-blue-600 hover:underline">
            Ver todos los procesos
          </button>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => open(null)} className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-blue-700">
          <ArrowLeft className="h-4 w-4" /> Todos los procesos
        </button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {process.code && <p className="font-mono text-xs font-semibold text-blue-700">{process.code}</p>}
            <h3 className="flex flex-wrap items-center gap-2 text-xl font-bold text-gray-900">
              {process.name} <StatusBadge status={process.status} />
            </h3>
            {process.objective && <p className="mt-1 max-w-3xl whitespace-pre-line text-sm text-gray-700">{process.objective}</p>}
            {process.owner_name && (
              <p className="mt-1 flex items-center gap-1 text-xs text-gray-600">
                <User className="h-3.5 w-3.5" /> Dueño del proceso: {process.owner_name}
              </p>
            )}
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditor('edit')}>
                <Pencil className="h-4 w-4" /> Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-red-600 hover:bg-red-50"
                onClick={() => window.confirm(`¿Eliminar el proceso "${process.name}"? Se borran también sus pasos.`) && remove.mutate(process.id)}
              >
                <Trash2 className="h-4 w-4" /> Eliminar
              </Button>
            </div>
          )}
        </div>
        <ProcessStepsList key={process.id + process.updated_at} steps={process.steps} />
        {editorModal}
      </div>
    );
  }

  // All processes of the plant
  const text = normalizeSearch(search);
  const inScope = (processes || []).filter((p) => !area || p.areas.some((a) => a.id === area.id));
  const visibleProcesses = inScope.filter(
    (p) =>
      (!statusFilter || p.status === statusFilter) &&
      matchesSearch(text, p.name, p.code, p.objective, ...p.areas.map((a) => a.name))
  );
  return (
    <div className="space-y-4">
      <SectionHeader
        title="Procesos"
        description={area ? `Procesos de la planta con pasos en "${area.name}".` : 'Procesos que recorren varias áreas de la planta, paso a paso.'}
        actions={
          canEdit && (
            <Button onClick={() => setEditor('new')} className="gap-1.5">
              <Plus className="h-4 w-4" /> Nuevo proceso
            </Button>
          )
        }
      />
      {isLoading ? (
        <p className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando procesos…
        </p>
      ) : !inScope.length ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center">
          <GitBranch className="mx-auto mb-3 h-10 w-10 text-gray-400" />
          <p className="font-medium text-gray-900">{area ? 'Esta área no participa en ningún proceso' : 'Todavía no hay procesos'}</p>
          <p className="mt-1 text-sm text-gray-600">
            {area ? 'En cada proceso se elige qué área hace cada paso.' : 'Por ejemplo "Del pedido a la entrega": qué área hace cada paso y con qué documentos.'}
          </p>
        </div>
      ) : (
        <>
        {inScope.length >= FILTERS_FROM && (
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative min-w-[14rem] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Buscar por nombre, código, objetivo o área"
                aria-label="Buscar procesos"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <select aria-label="Estado" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as '' | 'active' | 'draft')} className="text-sm">
              <option value="">Estado: todos</option>
              <option value="active">Vigente</option>
              <option value="draft">Borrador</option>
            </select>
          </div>
        )}
        {visibleProcesses.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-sm text-gray-600">
            Ningún proceso coincide con los filtros.{' '}
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('');
              }}
              className="font-medium text-blue-700 hover:underline"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {visibleProcesses.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => open(p.id)}
                className="block w-full rounded-lg border border-gray-200 bg-white p-4 text-left transition-colors hover:border-blue-300 hover:bg-blue-50/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {p.code && <p className="font-mono text-xs font-semibold text-blue-700">{p.code}</p>}
                    <p className="font-semibold text-gray-900">{p.name}</p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                {p.objective && <p className="mt-1 line-clamp-2 text-sm text-gray-600">{p.objective}</p>}
                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                  <span>
                    {p.step_count} paso{p.step_count === 1 ? '' : 's'}
                    {areaCount(p) > 0 && ` · ${areaCount(p)} área${areaCount(p) === 1 ? '' : 's'}`}
                  </span>
                  {area && <span className="font-medium text-blue-700">{p.areas.filter((a) => a.id === area.id).length} aquí</span>}
                  {p.owner_name ? (
                    <span className="inline-flex items-center gap-1">
                      <User className="h-3 w-3" /> Dueño: {p.owner_name}
                    </span>
                  ) : (
                    <span className="text-amber-700">Sin dueño</span>
                  )}
                </p>
              </button>
            </li>
          ))}
        </ul>
        )}
        </>
      )}
      <p className="text-xs text-gray-500">
        Cada área muestra en su pestaña <strong>Procesos</strong> los pasos que le tocan, y los tours los enseñan en su sección{' '}
        <strong>Procesos</strong>.
      </p>
      {editorModal}
    </div>
  );
};

export default ProcessesTab;

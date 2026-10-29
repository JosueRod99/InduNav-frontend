import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, GitBranch, Loader2, MapPin, Pencil, Plus, Trash2, User } from 'lucide-react';
import Button from '../../components/ui/Button';
import { deleteProcess, getProcess, getProcesses } from '../../api/processes';
import ProcessStepsList from './ProcessStepsList';
import ProcessEditorModal from './ProcessEditorModal';
import { useAuthStore } from '../../store/authStore';

// "Procesos" tab of a plant (PLAN_LAB_KRAFT.md point 5): processes that go across areas
// ("Del pedido a la entrega"). The list and one process (?proceso=<id>) live in the same tab.

const EDITORS = ['platform_admin', 'org_owner', 'plant_manager'];

const StatusBadge = ({ status }: { status: 'draft' | 'active' }) =>
  status === 'active' ? (
    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Vigente</span>
  ) : (
    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">Borrador</span>
  );

const ProcessesTab = ({ plantId, organizationId }: { plantId: string; organizationId: string }) => {
  const queryClient = useQueryClient();
  const canEdit = EDITORS.includes(useAuthStore((s) => s.user?.role?.name) || '');
  const [searchParams, setSearchParams] = useSearchParams();
  const processId = searchParams.get('proceso');
  const [editor, setEditor] = useState<'new' | 'edit' | null>(null);
  const plant = { id: plantId, organization_id: organizationId };

  const { data: processes, isLoading } = useQuery({ queryKey: ['processes', plantId], queryFn: () => getProcesses(plantId) });
  const { data: process, isLoading: loadingProcess } = useQuery({
    queryKey: ['process', processId],
    queryFn: () => getProcess(processId!),
    enabled: !!processId,
  });

  const open = (id: string | null) => setSearchParams(id ? { proceso: id } : {}, { replace: false });

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
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">Procesos que recorren varias áreas de la planta, paso a paso.</p>
        {canEdit && (
          <Button onClick={() => setEditor('new')} className="gap-1.5">
            <Plus className="h-4 w-4" /> Nuevo proceso
          </Button>
        )}
      </div>
      {isLoading ? (
        <p className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando procesos…
        </p>
      ) : !processes?.length ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center">
          <GitBranch className="mx-auto mb-3 h-10 w-10 text-gray-400" />
          <p className="font-medium text-gray-900">Todavía no hay procesos</p>
          <p className="mt-1 text-sm text-gray-600">Por ejemplo "Del pedido a la entrega": qué área hace cada paso y con qué documentos.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {processes.map((p) => (
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
                  </span>
                  {p.areas.length > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {p.areas.slice(0, 4).join(', ')}
                      {p.areas.length > 4 && ` y ${p.areas.length - 4} más`}
                    </span>
                  )}
                  {p.owner_name && <span>Dueño: {p.owner_name}</span>}
                </p>
              </button>
            </li>
          ))}
        </ul>
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

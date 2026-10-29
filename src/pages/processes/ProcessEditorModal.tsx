import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Loader2, Plus, Trash2 } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { createProcess, updateProcess, type Process } from '../../api/processes';
import { getAreas } from '../../api/areas';
import { getEmployees } from '../../api/employees';
import { getEquipment } from '../../api/equipment';
import { getDocumentsByArea } from '../../api/areaDocuments';
import { personName } from '../../utils/personName';

// Create / edit a process with all its steps; saved at once.

interface StepDraft {
  key: string;
  name: string;
  description: string;
  area_id: string;
  responsible_employee_id: string;
  activities: string; // one per line
  document_ids: string[];
  equipment_ids: string[];
}

const newKey = () => Math.random().toString(36).slice(2);
const emptyStep = (): StepDraft => ({
  key: newKey(),
  name: '',
  description: '',
  area_id: '',
  responsible_employee_id: '',
  activities: '',
  document_ids: [],
  equipment_ids: [],
});

const inputClass = 'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30';

/** Documents of the step's area (to link), current versions only */
const StepDocuments = ({ areaId, selected, onChange }: { areaId: string; selected: string[]; onChange: (ids: string[]) => void }) => {
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['area-documents-for-process', areaId],
    queryFn: () => getDocumentsByArea(areaId, { includePrivate: true }),
    enabled: !!areaId,
  });
  if (!areaId) return <p className="text-xs text-gray-500">Elige el área para ver sus documentos.</p>;
  if (isLoading) return <p className="text-xs text-gray-500">Cargando documentos…</p>;
  if (!documents.length) return <p className="text-xs text-gray-500">El área no tiene documentos.</p>;
  return (
    <div className="max-h-36 space-y-1 overflow-y-auto rounded-md border border-gray-200 p-2">
      {documents.map((doc) => (
        <label key={doc.id} className="flex items-center gap-2 text-xs text-gray-700">
          <input
            type="checkbox"
            checked={selected.includes(doc.id)}
            onChange={(e) => onChange(e.target.checked ? [...selected, doc.id] : selected.filter((id) => id !== doc.id))}
            className="rounded border-gray-300"
          />
          {doc.document_code && <span className="font-mono font-semibold text-blue-700">{doc.document_code}</span>}
          <span className="truncate">{doc.title}</span>
          {doc.document_type === 'pending' && <span className="text-amber-700">(sin archivo)</span>}
        </label>
      ))}
    </div>
  );
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  plant: { id: string; organization_id: string };
  process?: Process | null; // edit when given
  onSaved: (process: Process) => void;
}

const ProcessEditorModal = ({ isOpen, onClose, plant, process, onSaved }: Props) => {
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [objective, setObjective] = useState('');
  const [owner, setOwner] = useState('');
  const [status, setStatus] = useState<'draft' | 'active'>('active');
  const [steps, setSteps] = useState<StepDraft[]>([emptyStep()]);
  const [openStep, setOpenStep] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setCode(process?.code || '');
    setName(process?.name || '');
    setObjective(process?.objective || '');
    setOwner(process?.owner_employee_id || '');
    setStatus(process?.status || 'active');
    const drafts = process?.steps.length
      ? process.steps.map((s) => ({
          key: newKey(),
          name: s.name,
          description: s.description || '',
          area_id: s.area_id || '',
          responsible_employee_id: s.responsible_employee_id || '',
          activities: s.activities.join('\n'),
          document_ids: s.documents.map((d) => d.id),
          equipment_ids: s.equipment.map((e) => e.id),
        }))
      : [emptyStep()];
    setSteps(drafts);
    setOpenStep(drafts[0].key);
  }, [isOpen, process]);

  const { data: areasData } = useQuery({ queryKey: ['areas', plant.id, 'all'], queryFn: () => getAreas({ plant_id: plant.id, limit: 500 }), enabled: isOpen });
  const { data: peopleData } = useQuery({
    queryKey: ['employees-for-process', plant.organization_id],
    queryFn: () => getEmployees({ organization_id: plant.organization_id, is_active: true, limit: 500 }),
    enabled: isOpen,
  });
  const { data: equipment = [] } = useQuery({ queryKey: ['equipment-for-process', plant.id], queryFn: () => getEquipment({ plant_id: plant.id, limit: 500 }), enabled: isOpen });
  const areas = areasData?.areas || [];
  // People of this plant first
  const people = useMemo(
    () => [...(peopleData?.employees || [])].sort((a, b) => Number(b.plant_id === plant.id) - Number(a.plant_id === plant.id) || personName(a).localeCompare(personName(b))),
    [peopleData, plant.id]
  );

  const setStep = (key: string, patch: Partial<StepDraft>) => setSteps((list) => list.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  const moveStep = (index: number, delta: number) =>
    setSteps((list) => {
      const next = [...list];
      const [moved] = next.splice(index, 1);
      next.splice(index + delta, 0, moved);
      return next;
    });

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        code: code.trim() || null,
        name: name.trim(),
        objective: objective.trim() || null,
        owner_employee_id: owner || null,
        status,
        steps: steps.map((s) => ({
          name: s.name.trim(),
          description: s.description.trim() || null,
          area_id: s.area_id || null,
          responsible_employee_id: s.responsible_employee_id || null,
          activities: s.activities.split('\n').map((a) => a.trim()).filter(Boolean),
          document_ids: s.document_ids,
          equipment_ids: s.equipment_ids,
        })),
      };
      return process ? updateProcess(process.id, payload) : createProcess(plant.id, payload);
    },
    onSuccess: (saved) => {
      toast.success(process ? 'Proceso guardado' : 'Proceso creado');
      queryClient.invalidateQueries({ queryKey: ['processes', plant.id] });
      queryClient.setQueryData(['process', saved.id], saved);
      queryClient.invalidateQueries({ queryKey: ['area-process-steps'] });
      onSaved(saved);
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'No se pudo guardar el proceso'),
  });

  const invalidStep = steps.find((s) => s.name.trim().length < 2);
  const canSave = name.trim().length >= 3 && !invalidStep && !save.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={process ? `Editar proceso · ${process.name}` : 'Nuevo proceso'}
      size="xl"
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          {invalidStep && <span className="mr-auto text-xs text-amber-700">Cada paso necesita un nombre.</span>}
          <Button variant="outline" onClick={onClose} disabled={save.isPending}>
            Cancelar
          </Button>
          <Button onClick={() => save.mutate()} disabled={!canSave} className="gap-1.5">
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {process ? 'Guardar cambios' : 'Crear proceso'}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[10rem_1fr_9rem]">
          <label className="block text-sm font-medium text-gray-700">
            Código <span className="font-normal text-gray-400">(opcional)</span>
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={50} placeholder="Ej. P-VENT-01" className={`mt-1 font-mono ${inputClass}`} />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Nombre del proceso
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={200} placeholder="Ej. Del pedido a la entrega" className={`mt-1 ${inputClass}`} />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Estado
            <select value={status} onChange={(e) => setStatus(e.target.value as 'draft' | 'active')} className={`mt-1 ${inputClass}`}>
              <option value="active">Vigente</option>
              <option value="draft">Borrador</option>
            </select>
          </label>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_16rem]">
          <label className="block text-sm font-medium text-gray-700">
            Objetivo <span className="font-normal text-gray-400">(opcional)</span>
            <textarea value={objective} onChange={(e) => setObjective(e.target.value)} rows={2} maxLength={2000} className={`mt-1 ${inputClass}`} />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Dueño del proceso <span className="font-normal text-gray-400">(opcional)</span>
            <select value={owner} onChange={(e) => setOwner(e.target.value)} className={`mt-1 ${inputClass}`}>
              <option value="">Sin asignar</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {personName(p)}
                  {p.position ? ` · ${p.position}` : ''}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Pasos ({steps.length})</h3>
            <span className="text-xs text-gray-500">Borradores no aparecen en los tours</span>
          </div>
          <ol className="space-y-2">
            {steps.map((step, index) => {
              const isOpen = openStep === step.key;
              const areaName = areas.find((a) => a.id === step.area_id)?.name;
              return (
                <li key={step.key} className="rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">{index + 1}</span>
                    <button type="button" onClick={() => setOpenStep(isOpen ? null : step.key)} className="flex min-w-0 flex-1 items-center gap-1 text-left" aria-expanded={isOpen}>
                      {isOpen ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                      <span className={`truncate text-sm font-medium ${step.name ? 'text-gray-900' : 'text-gray-400'}`}>{step.name || 'Paso sin nombre'}</span>
                      {areaName && <span className="truncate text-xs text-gray-500">· {areaName}</span>}
                    </button>
                    <button type="button" onClick={() => moveStep(index, -1)} disabled={index === 0} className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30" aria-label={`Subir paso ${index + 1}`}>
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => moveStep(index, 1)} disabled={index === steps.length - 1} className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30" aria-label={`Bajar paso ${index + 1}`}>
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSteps((list) => list.filter((s) => s.key !== step.key))}
                      className="rounded p-1 text-gray-500 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Quitar paso ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {isOpen && (
                    <div className="grid grid-cols-1 gap-3 border-t border-gray-100 p-3 sm:grid-cols-2">
                      <label className="block text-xs font-medium text-gray-700 sm:col-span-2">
                        Nombre del paso
                        <input
                          value={step.name}
                          onChange={(e) => setStep(step.key, { name: e.target.value })}
                          maxLength={200}
                          placeholder="Ej. Recepción y confirmación de la orden de compra"
                          aria-label={`Nombre del paso ${index + 1}`}
                          className={`mt-1 ${inputClass}`}
                        />
                      </label>
                      <label className="block text-xs font-medium text-gray-700">
                        Área
                        <select
                          value={step.area_id}
                          onChange={(e) => setStep(step.key, { area_id: e.target.value, document_ids: [] })}
                          aria-label={`Área del paso ${index + 1}`}
                          className={`mt-1 ${inputClass}`}
                        >
                          <option value="">Sin área</option>
                          {areas.map((a) => (
                            <option key={a.id} value={a.id}>
                              {'· '.repeat(Math.max(0, (a.hierarchy_level || 1) - 1))}
                              {a.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block text-xs font-medium text-gray-700">
                        Responsable <span className="font-normal text-gray-400">(opcional)</span>
                        <select
                          value={step.responsible_employee_id}
                          onChange={(e) => setStep(step.key, { responsible_employee_id: e.target.value })}
                          aria-label={`Responsable del paso ${index + 1}`}
                          className={`mt-1 ${inputClass}`}
                        >
                          <option value="">Sin asignar</option>
                          {people.map((p) => (
                            <option key={p.id} value={p.id}>
                              {personName(p)}
                              {p.position ? ` · ${p.position}` : ''}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block text-xs font-medium text-gray-700 sm:col-span-2">
                        Actividades <span className="font-normal text-gray-400">(una por renglón)</span>
                        <textarea
                          value={step.activities}
                          onChange={(e) => setStep(step.key, { activities: e.target.value })}
                          rows={4}
                          placeholder={'Recibir la orden de compra del cliente\nVerificar precio y fecha de entrega\nDar de alta en el ERP'}
                          aria-label={`Actividades del paso ${index + 1}`}
                          className={`mt-1 ${inputClass}`}
                        />
                      </label>
                      <label className="block text-xs font-medium text-gray-700 sm:col-span-2">
                        Descripción <span className="font-normal text-gray-400">(opcional)</span>
                        <textarea value={step.description} onChange={(e) => setStep(step.key, { description: e.target.value })} rows={2} maxLength={2000} className={`mt-1 ${inputClass}`} />
                      </label>
                      <div>
                        <p className="mb-1 text-xs font-medium text-gray-700">Documentos del área</p>
                        <StepDocuments areaId={step.area_id} selected={step.document_ids} onChange={(ids) => setStep(step.key, { document_ids: ids })} />
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-medium text-gray-700">Equipos que se usan</p>
                        {equipment.length ? (
                          <div className="max-h-36 space-y-1 overflow-y-auto rounded-md border border-gray-200 p-2">
                            {equipment.map((eq) => (
                              <label key={eq.id} className="flex items-center gap-2 text-xs text-gray-700">
                                <input
                                  type="checkbox"
                                  checked={step.equipment_ids.includes(eq.id)}
                                  onChange={(e) =>
                                    setStep(step.key, {
                                      equipment_ids: e.target.checked ? [...step.equipment_ids, eq.id] : step.equipment_ids.filter((id) => id !== eq.id),
                                    })
                                  }
                                  className="rounded border-gray-300"
                                />
                                <span className="truncate">{eq.name}</span>
                                <span className="font-mono text-gray-400">{eq.code}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500">La planta no tiene equipos registrados.</p>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2 gap-1.5"
            onClick={() => {
              const step = emptyStep();
              setSteps((list) => [...list, step]);
              setOpenStep(step.key);
            }}
          >
            <Plus className="h-4 w-4" /> Agregar paso
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ProcessEditorModal;

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Search, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import {
  EQUIPMENT_STATUS_COLORS,
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_TYPE_LABELS,
} from '../../../api/equipment';
import {
  getStepEquipmentCandidates,
  createStepEquipment,
  USAGE_TYPE_LABELS,
  type StepEquipmentCandidate,
  type StepEquipmentUsageType,
} from '../../../api/productStepEquipment';
import type { ProductProcessStep } from '../../../api/products';

interface StepEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  step: ProductProcessStep;
}

interface Selection {
  usage_type: StepEquipmentUsageType;
  notes: string;
  outsideArea: boolean;
}

const StepEquipmentModal = ({ isOpen, onClose, productId, step }: StepEquipmentModalProps) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Record<string, Selection>>({});

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelected({});
    }
  }, [isOpen]);

  const { data: candidates, isLoading } = useQuery({
    queryKey: ['step-equipment-candidates', step.id],
    queryFn: () => getStepEquipmentCandidates(step.id),
    enabled: isOpen,
  });

  const matches = (c: StepEquipmentCandidate) => {
    const q = search.trim().toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
  };
  const inArea = (candidates?.in_area || []).filter(matches);
  const otherInPlant = (candidates?.other_in_plant || []).filter(matches);

  const toggle = (c: StepEquipmentCandidate, outsideArea: boolean) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[c.id]) delete next[c.id];
      else next[c.id] = { usage_type: 'required', notes: '', outsideArea };
      return next;
    });
  };

  const updateSelection = (id: string, patch: Partial<Selection>) =>
    setSelected((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      for (const [equipmentId, sel] of Object.entries(selected)) {
        await createStepEquipment(step.id, {
          equipment_id: equipmentId,
          usage_type: sel.usage_type,
          notes: sel.notes.trim() || null,
        });
      }
    },
    onSuccess: () => {
      const count = Object.keys(selected).length;
      toast.success(count === 1 ? 'Equipo vinculado al paso' : `${count} equipos vinculados al paso`);
      queryClient.invalidateQueries({ queryKey: ['product-equipment', productId] });
      queryClient.invalidateQueries({ queryKey: ['step-equipment-candidates', step.id] });
      queryClient.invalidateQueries({ queryKey: ['equipment-products'] });
      onClose();
    },
    onError: (error: any) => {
      // Links saved before the error stay; refresh so the UI shows them
      queryClient.invalidateQueries({ queryKey: ['product-equipment', productId] });
      toast.error(error.response?.data?.message || 'Error al vincular equipos');
    },
  });

  const selectedCount = Object.keys(selected).length;

  const renderCandidate = (c: StepEquipmentCandidate, outsideArea: boolean) => {
    const sel = selected[c.id];
    return (
      <div
        key={c.id}
        className={`rounded-lg border-2 transition-colors ${
          sel ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <button
          type="button"
          onClick={() => toggle(c, outsideArea)}
          className="w-full flex items-center gap-3 p-3 text-left"
        >
          {c.primary_image_url ? (
            <img src={c.primary_image_url} alt={c.name} className="h-10 w-10 rounded object-cover border border-gray-200" />
          ) : (
            <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Wrench className="h-5 w-5 text-gray-400" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
            <p className="text-xs text-gray-500 truncate">
              <span className="font-mono">{c.code}</span> · {EQUIPMENT_TYPE_LABELS[c.equipment_type]}
              {outsideArea && ` · ${c.current_area_name || 'Sin área asignada'}`}
            </p>
          </div>
          <span className="flex items-center gap-1 text-xs text-gray-600 flex-shrink-0">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: EQUIPMENT_STATUS_COLORS[c.status] }} />
            {EQUIPMENT_STATUS_LABELS[c.status]}
          </span>
        </button>

        {sel && (
          <div className="flex flex-col sm:flex-row gap-2 px-3 pb-3">
            <div className="flex rounded-md border border-gray-300 p-0.5 text-xs font-medium self-start">
              {(Object.keys(USAGE_TYPE_LABELS) as StepEquipmentUsageType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => updateSelection(c.id, { usage_type: type })}
                  className={`px-2.5 py-1 rounded ${
                    sel.usage_type === type ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {USAGE_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
            <input
              value={sel.notes}
              onChange={(e) => updateSelection(c.id, { notes: e.target.value })}
              placeholder="Notas (ej. usar broca de 8 mm)"
              className="flex-1 rounded-md border border-gray-300 px-2.5 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Equipos para "${step.step_name}"`}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={selectedCount === 0}
            isLoading={saveMutation.isPending}
          >
            Vincular{selectedCount > 0 && ` (${selectedCount})`}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o código..."
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="max-h-[55vh] overflow-y-auto space-y-5 pr-1">
            <section>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                Equipos en {candidates?.step_area_name || step.area_name || 'el área del paso'}
              </h4>
              {inArea.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">
                  {search ? 'Sin coincidencias.' : 'No hay equipos disponibles asignados a esta área.'}
                </p>
              ) : (
                <div className="space-y-2">{inArea.map((c) => renderCandidate(c, false))}</div>
              )}
            </section>

            {(otherInPlant.length > 0 || search) && (
              <section>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">Otros equipos de la planta</h4>
                <p className="flex items-center gap-1.5 text-xs text-amber-700 mb-2">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Estos equipos no están en el área del paso; se marcarán con una advertencia.
                </p>
                {otherInPlant.length === 0 ? (
                  <p className="text-sm text-gray-500 py-2">Sin coincidencias.</p>
                ) : (
                  <div className="space-y-2">{otherInPlant.map((c) => renderCandidate(c, true))}</div>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default StepEquipmentModal;

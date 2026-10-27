import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Plus } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import AreaSelector from '../../../components/areas/AreaSelector';
import AreaModal from '../../areas/AreaModal';
import { getAreaTree } from '../../../api/areas';

interface AddStopModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  plantId: string;
  usedAreaIds: Set<string>;
  onAdd: (areaId: string) => Promise<unknown>;
}

const AddStopModal = ({ isOpen, onClose, organizationId, plantId, usedAreaIds, onAdd }: AddStopModalProps) => {
  const queryClient = useQueryClient();
  const [areaId, setAreaId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    if (isOpen) setAreaId(null);
  }, [isOpen]);

  const { data: areasTree = [], isLoading } = useQuery({
    queryKey: ['areas-tree', organizationId, plantId],
    queryFn: () => getAreaTree({ organization_id: organizationId, plant_id: plantId }),
    enabled: isOpen && !!organizationId,
  });

  const alreadyInTour = !!areaId && usedAreaIds.has(areaId);

  const handleAdd = async () => {
    if (!areaId || alreadyInTour) return;
    setIsAdding(true);
    try {
      await onAdd(areaId);
      onClose();
    } catch {
      // The error toast is shown by the caller; keep the modal open to pick another area
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !isCreateOpen}
        onClose={onClose}
        title="Agregar área"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleAdd} disabled={!areaId || alreadyInTour} isLoading={isAdding}>
              Agregar al tour
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Elige un área de la planta. Su personal, equipos, productos y plano se muestran en vivo.
          </p>

          {isLoading ? (
            <div className="flex justify-center py-6">
              <div className="h-7 w-7 animate-spin rounded-full border-b-2 border-blue-600" />
            </div>
          ) : (
            <AreaSelector
              label="Área"
              areas={areasTree}
              selectedAreaId={areaId}
              onSelect={(area) => setAreaId(area?.id || null)}
              placeholder="Seleccionar área…"
              required
            />
          )}

          {alreadyInTour && (
            <p className="flex items-center gap-1.5 text-sm text-amber-700">
              <AlertCircle className="h-4 w-4" />
              Esta área ya está en el tour.
            </p>
          )}

          <div className="border-t border-gray-100 pt-3">
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <Plus className="h-4 w-4" />
              ¿No existe? Crear área nueva
            </button>
          </div>
        </div>
      </Modal>

      {isCreateOpen && (
        <AreaModal
          isOpen
          onClose={() => {
            setIsCreateOpen(false);
            queryClient.invalidateQueries({ queryKey: ['areas-tree', organizationId, plantId] });
          }}
          organizationId={organizationId}
          plantId={plantId}
        />
      )}
    </>
  );
};

export default AddStopModal;

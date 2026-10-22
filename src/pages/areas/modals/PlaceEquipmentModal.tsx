import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Wrench } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import { leafletToGeoJSON } from '../../../api/areaRepresentations';
import {
  createFootprint,
  EQUIPMENT_TYPE_LABELS,
  type EquipmentAreaAssignment,
} from '../../../api/equipment';

const FOOTPRINT_COLORS = ['#334155', '#B45309', '#047857', '#1D4ED8', '#7C3AED', '#BE123C'];

interface PlaceEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  layoutId: string;
  coordinates: number[][]; // Leaflet format [lat, lng]
  unplacedEquipment: EquipmentAreaAssignment[];
}

const PlaceEquipmentModal = ({
  isOpen,
  onClose,
  layoutId,
  coordinates,
  unplacedEquipment,
}: PlaceEquipmentModalProps) => {
  const queryClient = useQueryClient();
  const [equipmentId, setEquipmentId] = useState<string | null>(null);
  const [color, setColor] = useState(FOOTPRINT_COLORS[0]);

  useEffect(() => {
    if (isOpen) {
      setEquipmentId(unplacedEquipment.length === 1 ? unplacedEquipment[0].equipment_id : null);
      setColor(FOOTPRINT_COLORS[0]);
    }
  }, [isOpen, unplacedEquipment]);

  const placeMutation = useMutation({
    mutationFn: () =>
      createFootprint(equipmentId!, {
        layout_id: layoutId,
        geometry: leafletToGeoJSON(coordinates),
        display_color: color,
      }),
    onSuccess: () => {
      toast.success('Equipo colocado en el layout');
      queryClient.invalidateQueries({ queryKey: ['layout-footprints', layoutId] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al colocar el equipo');
    },
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Colocar equipo"
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => placeMutation.mutate()}
            disabled={!equipmentId}
            isLoading={placeMutation.isPending}
          >
            Colocar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Elige qué herramienta o máquina ocupa el espacio que dibujaste.
        </p>

        <div className="max-h-64 overflow-y-auto space-y-2">
          {unplacedEquipment.map((a) => (
            <button
              key={a.equipment_id}
              type="button"
              onClick={() => setEquipmentId(a.equipment_id)}
              className={`w-full flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-colors ${
                equipmentId === a.equipment_id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {a.equipment_image_url ? (
                <img
                  src={a.equipment_image_url}
                  alt={a.equipment_name}
                  className="h-10 w-10 rounded object-cover border border-gray-200"
                />
              ) : (
                <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center">
                  <Wrench className="h-5 w-5 text-gray-400" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{a.equipment_name}</p>
                <p className="text-xs text-gray-500">
                  <span className="font-mono">{a.equipment_code}</span>
                  {a.equipment_type && ` · ${EQUIPMENT_TYPE_LABELS[a.equipment_type]}`}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
          <div className="flex gap-2">
            {FOOTPRINT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded border-2 transition-all ${
                  color === c ? 'border-gray-900 scale-110' : 'border-gray-300 hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PlaceEquipmentModal;

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import {
  createEquipment,
  updateEquipment,
  type Equipment,
  type CreateEquipmentRequest,
  type UpdateEquipmentRequest,
  type EquipmentType,
  type EquipmentStatus,
  EQUIPMENT_TYPE_LABELS,
  EQUIPMENT_STATUS_LABELS,
} from '../../api/equipment';

interface EquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment?: Equipment | null;
  organizationId: string;
  plantId?: string;
}

const EquipmentModal = ({
  isOpen,
  onClose,
  equipment,
  organizationId,
  plantId,
}: EquipmentModalProps) => {
  const queryClient = useQueryClient();
  const isEditing = !!equipment;

  const [formData, setFormData] = useState<CreateEquipmentRequest>({
    organization_id: organizationId,
    plant_id: plantId || '',
    code: '',
    name: '',
    equipment_type: 'tool',
    manufacturer: '',
    model: '',
    serial_number: '',
    description: '',
    specifications: {},
    status: 'active',
    acquisition_date: undefined,
    warranty_expiry_date: undefined,
  });

  useEffect(() => {
    if (equipment) {
      setFormData({
        organization_id: equipment.organization_id,
        plant_id: equipment.plant_id,
        code: equipment.code,
        name: equipment.name,
        equipment_type: equipment.equipment_type,
        manufacturer: equipment.manufacturer || '',
        model: equipment.model || '',
        serial_number: equipment.serial_number || '',
        description: equipment.description || '',
        specifications: equipment.specifications || {},
        status: equipment.status,
        acquisition_date: equipment.acquisition_date || undefined,
        warranty_expiry_date: equipment.warranty_expiry_date || undefined,
      });
    }
  }, [equipment]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createEquipment,
    onSuccess: () => {
      toast.success('Equipo creado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear equipo');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEquipmentRequest }) =>
      updateEquipment(id, data),
    onSuccess: () => {
      toast.success('Equipo actualizado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['equipment', equipment?.id] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar equipo');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    if (!formData.code.trim()) {
      toast.error('El código es requerido');
      return;
    }

    if (!formData.plant_id) {
      toast.error('La planta es requerida');
      return;
    }

    if (isEditing && equipment) {
      updateMutation.mutate({ id: equipment.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (field: keyof CreateEquipmentRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Equipo' : 'Nuevo Equipo'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {isEditing ? 'Actualizar' : 'Crear'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Code */}
          <Input
            label="Código"
            value={formData.code}
            onChange={(e) => handleChange('code', e.target.value)}
            required
            placeholder="Ej: TOOL-001, MACH-CNC-01"
          />

          {/* Name */}
          <Input
            label="Nombre"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
            placeholder="Ej: Taladro Industrial, Torno CNC"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.equipment_type}
              onChange={(e) => handleChange('equipment_type', e.target.value as EquipmentType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              required
            >
              {Object.entries(EQUIPMENT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value as EquipmentStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              required
            >
              {Object.entries(EQUIPMENT_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Manufacturer */}
          <Input
            label="Fabricante"
            value={formData.manufacturer}
            onChange={(e) => handleChange('manufacturer', e.target.value)}
            placeholder="Ej: Siemens, Bosch"
          />

          {/* Model */}
          <Input
            label="Modelo"
            value={formData.model}
            onChange={(e) => handleChange('model', e.target.value)}
            placeholder="Ej: X-3000, Pro Series"
          />
        </div>

        {/* Serial Number */}
        <Input
          label="Número de Serie"
          value={formData.serial_number}
          onChange={(e) => handleChange('serial_number', e.target.value)}
          placeholder="Ej: SN123456789"
        />

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="Descripción detallada del equipo..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Acquisition Date */}
          <Input
            label="Fecha de Adquisición"
            type="date"
            value={formData.acquisition_date ? new Date(formData.acquisition_date).toISOString().split('T')[0] : ''}
            onChange={(e) => handleChange('acquisition_date', e.target.value ? new Date(e.target.value) : undefined)}
          />

          {/* Warranty Expiry Date */}
          <Input
            label="Vencimiento de Garantía"
            type="date"
            value={formData.warranty_expiry_date ? new Date(formData.warranty_expiry_date).toISOString().split('T')[0] : ''}
            onChange={(e) => handleChange('warranty_expiry_date', e.target.value ? new Date(e.target.value) : undefined)}
          />
        </div>
      </form>
    </Modal>
  );
};

export default EquipmentModal;

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { getPlants } from '../../api/plants';

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

  const { data: plantsData } = useQuery({
    queryKey: ['plants', organizationId],
    queryFn: () => getPlants({ organization_id: organizationId, limit: 100 }),
    enabled: isOpen && !!organizationId,
  });
  const plants = plantsData?.plants || [];

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
    if (!equipment) {
      // Preselect the plant filtered on the list page; the user can change it
      setFormData((prev) => ({ ...prev, organization_id: organizationId, plant_id: plantId || '' }));
    }
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
  }, [equipment, organizationId, plantId]);

  // Auto-select when the organization has a single plant
  useEffect(() => {
    if (!isEditing && !formData.plant_id && plants.length === 1) {
      setFormData((prev) => ({ ...prev, plant_id: plants[0].id }));
    }
  }, [isEditing, formData.plant_id, plants]);

  const plantChanged = isEditing && !!equipment && formData.plant_id !== equipment.plant_id;

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
      if (plantChanged) {
        queryClient.invalidateQueries({ queryKey: ['equipment-assignments', equipment?.id] });
        queryClient.invalidateQueries({ queryKey: ['area-equipment'] });
        queryClient.invalidateQueries({ queryKey: ['layout-footprints'] });
        queryClient.invalidateQueries({ queryKey: ['product-equipment'] });
        queryClient.invalidateQueries({ queryKey: ['equipment-products', equipment?.id] });
      }
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
      toast.error('Selecciona la planta a la que pertenece el equipo');
      return;
    }

    if (
      plantChanged &&
      !window.confirm(
        'Al cambiar de planta, el equipo se retirará de su área actual, se borrará su dibujo en el layout y se quitará de los pasos de producto donde se usa. ¿Continuar?'
      )
    ) {
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
        {/* Plant */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Planta <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.plant_id}
            onChange={(e) => handleChange('plant_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Seleccionar planta...</option>
            {plants.map((plant) => (
              <option key={plant.id} value={plant.id}>
                {plant.name}
              </option>
            ))}
          </select>
          {plantChanged && (
            <p className="mt-1 text-xs text-amber-700">
              Cambiar de planta retira el equipo de su área actual, borra su dibujo en el layout y lo quita de
              los pasos de producto donde se usa.
            </p>
          )}
        </div>

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

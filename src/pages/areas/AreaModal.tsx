import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import AreaSelector from '../../components/areas/AreaSelector';
import {
  createArea,
  updateArea,
  getAreaTree,
  type CreateAreaRequest,
  type OrganizationalArea,
} from '../../api/areas';
import { getEmployees } from '../../api/employees';

interface AreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  area?: OrganizationalArea | null;
  organizationId: string;
  plantId: string;
  parentAreaId?: string | null;
}

const AREA_TYPES = [
  { value: 'general', label: 'General' },
  { value: 'production', label: 'Producción' },
  { value: 'warehouse', label: 'Almacén' },
  { value: 'office', label: 'Oficina' },
  { value: 'quality', label: 'Control de Calidad' },
  { value: 'maintenance', label: 'Mantenimiento' },
];

const PREDEFINED_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
];

const AreaModal = ({
  isOpen,
  onClose,
  area,
  organizationId,
  plantId,
  parentAreaId,
}: AreaModalProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateAreaRequest>({
    organization_id: organizationId,
    plant_id: plantId,
    parent_area_id: parentAreaId || null,
    name: '',
    code: '',
    description: '',
    area_type: 'general',
    color: PREDEFINED_COLORS[0],
    capacity: undefined,
    square_meters: undefined,
    cost_center: '',
    supervisor_id: '',
  });

  const isEditing = !!area;

  // Fetch area tree for parent selection
  const { data: areasTree } = useQuery({
    queryKey: ['areas-tree', organizationId, plantId],
    queryFn: () =>
      getAreaTree({
        organization_id: organizationId,
        plant_id: plantId || undefined,
      }),
    enabled: !!organizationId,
  });

  // Fetch employees for supervisor selection
  const { data: employeesData } = useQuery({
    queryKey: ['employees', organizationId, plantId],
    queryFn: () =>
      getEmployees({
        organization_id: organizationId,
        plant_id: plantId || undefined,
        limit: 200,
      }),
    enabled: !!organizationId,
  });

  useEffect(() => {
    if (area) {
      setFormData({
        organization_id: area.organization_id,
        plant_id: area.plant_id,
        parent_area_id: area.parent_area_id,
        name: area.name,
        code: area.code || '',
        description: area.description || '',
        area_type: area.area_type,
        color: area.color || PREDEFINED_COLORS[0],
        capacity: area.capacity || undefined,
        square_meters: area.square_meters || undefined,
        cost_center: area.cost_center || '',
        supervisor_id: area.supervisor_id || '',
      });
    } else {
      setFormData({
        organization_id: organizationId,
        plant_id: plantId,
        parent_area_id: parentAreaId || null,
        name: '',
        code: '',
        description: '',
        area_type: 'general',
        color: PREDEFINED_COLORS[0],
        capacity: undefined,
        square_meters: undefined,
        cost_center: '',
        supervisor_id: '',
      });
    }
  }, [area, organizationId, plantId, parentAreaId]);

  const createMutation = useMutation({
    mutationFn: createArea,
    onSuccess: () => {
      toast.success('Área creada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['areas-tree'] });
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear área');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; payload: any }) =>
      updateArea(data.id, data.payload),
    onSuccess: () => {
      toast.success('Área actualizada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['areas-tree'] });
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      queryClient.invalidateQueries({ queryKey: ['area'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar área');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Prepare payload
    const payload = {
      ...formData,
      capacity: formData.capacity ? Number(formData.capacity) : undefined,
      square_meters: formData.square_meters ? Number(formData.square_meters) : undefined,
      code: formData.code || undefined,
      description: formData.description || undefined,
      cost_center: formData.cost_center || undefined,
      supervisor_id: formData.supervisor_id || undefined,
    };

    if (isEditing) {
      updateMutation.mutate({ id: area!.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleChange = (field: keyof CreateAreaRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Área' : 'Nueva Área'}
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
            {isEditing ? 'Guardar Cambios' : 'Crear Área'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <Input
          label="Nombre del Área"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
          placeholder="Ej: Producción, Almacén, Oficinas"
        />

        {/* Code */}
        <Input
          label="Código"
          value={formData.code}
          onChange={(e) => handleChange('code', e.target.value)}
          placeholder="Ej: PROD-01, ALM-02"
        />

        {/* Parent Area */}
        {areasTree && (
          <AreaSelector
            label="Área Padre (opcional)"
            areas={areasTree.filter((a) => a.id !== area?.id)} // Exclude self from parent options
            selectedAreaId={formData.parent_area_id}
            onSelect={(selectedArea) =>
              handleChange('parent_area_id', selectedArea?.id || null)
            }
            placeholder="Ninguna (será un área raíz)"
            allowClear={true}
          />
        )}

        {/* Area Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Área
          </label>
          <select
            value={formData.area_type}
            onChange={(e) => handleChange('area_type', e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          >
            {AREA_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Color Identificador
          </label>
          <div className="flex gap-2">
            {PREDEFINED_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => handleChange('color', color)}
                className={`w-10 h-10 rounded-full border-2 transition-all ${
                  formData.color === color
                    ? 'border-gray-900 scale-110'
                    : 'border-gray-300 hover:scale-105'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
            <input
              type="color"
              value={formData.color}
              onChange={(e) => handleChange('color', e.target.value)}
              className="w-10 h-10 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Descripción del área y su propósito"
          />
        </div>

        {/* Capacity & Square Meters */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Capacidad (personas)"
            type="number"
            value={formData.capacity || ''}
            onChange={(e) => handleChange('capacity', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="0"
            min="0"
          />
          <Input
            label="Metros Cuadrados"
            type="number"
            step="0.01"
            value={formData.square_meters || ''}
            onChange={(e) => handleChange('square_meters', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="0.00"
            min="0"
          />
        </div>

        {/* Cost Center */}
        <Input
          label="Centro de Costo"
          value={formData.cost_center}
          onChange={(e) => handleChange('cost_center', e.target.value)}
          placeholder="Ej: CC-001"
        />

        {/* Supervisor */}
        {employeesData && employeesData.employees.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supervisor
            </label>
            <select
              value={formData.supervisor_id}
              onChange={(e) => handleChange('supervisor_id', e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Ninguno</option>
              {employeesData.employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} ({emp.position})
                </option>
              ))}
            </select>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default AreaModal;

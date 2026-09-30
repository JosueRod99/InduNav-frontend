import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { createArea, updateArea, type CreateAreaRequest, type PlantArea } from '../../api/layouts';

interface AreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  area?: PlantArea | null;
  plantId: string;
  layoutId?: string;
  coordinates?: number[][];
}

const AreaModal = ({ isOpen, onClose, area, plantId, layoutId, coordinates }: AreaModalProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateAreaRequest>({
    plant_id: plantId,
    layout_id: layoutId,
    name: '',
    description: '',
    area_type: 'general',
    geometry: { type: 'Polygon', coordinates: [[]] },
    floor_level: 0,
    color: '#3B82F6',
    capacity: undefined,
    square_meters: undefined,
  });

  const isEditing = !!area;

  useEffect(() => {
    if (area) {
      setFormData({
        plant_id: area.plant_id,
        layout_id: area.layout_id || undefined,
        name: area.name,
        description: area.description || '',
        area_type: area.area_type,
        geometry: area.geometry,
        floor_level: area.floor_level,
        color: area.color || '#3B82F6',
        capacity: area.capacity || undefined,
        square_meters: area.square_meters || undefined,
      });
    } else if (coordinates) {
      // Convert coordinates to GeoJSON format
      const geoJsonCoords = coordinates.map(coord => [coord[1], coord[0]]);
      geoJsonCoords.push(geoJsonCoords[0]); // Close the polygon

      setFormData({
        plant_id: plantId,
        layout_id: layoutId,
        name: '',
        description: '',
        area_type: 'general',
        geometry: {
          type: 'Polygon',
          coordinates: [geoJsonCoords],
        },
        floor_level: 0,
        color: '#3B82F6',
        capacity: undefined,
        square_meters: undefined,
      });
    }
  }, [area, coordinates, plantId, layoutId]);

  const createMutation = useMutation({
    mutationFn: createArea,
    onSuccess: () => {
      toast.success('Área creada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear área');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; payload: CreateAreaRequest }) =>
      updateArea(data.id, data.payload),
    onSuccess: () => {
      toast.success('Área actualizada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar área');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing && area) {
      updateMutation.mutate({ id: area.id, payload: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseFloat(value) : undefined) : value,
    }));
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Área' : 'Nueva Área'}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre <span className="text-red-500">*</span>
          </label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Nombre del área"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Descripción del área"
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="area_type" className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Área
            </label>
            <select
              id="area_type"
              name="area_type"
              value={formData.area_type}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="general">General</option>
              <option value="production">Producción</option>
              <option value="warehouse">Almacén</option>
              <option value="office">Oficina</option>
              <option value="laboratory">Laboratorio</option>
              <option value="restricted">Área Restringida</option>
            </select>
          </div>

          <div>
            <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <input
              type="color"
              id="color"
              name="color"
              value={formData.color}
              onChange={handleChange}
              className="mt-1 block w-full h-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
              Capacidad (personas)
            </label>
            <Input
              id="capacity"
              name="capacity"
              type="number"
              min="0"
              value={formData.capacity || ''}
              onChange={handleChange}
              placeholder="0"
            />
          </div>

          <div>
            <label htmlFor="square_meters" className="block text-sm font-medium text-gray-700 mb-1">
              Metros Cuadrados
            </label>
            <Input
              id="square_meters"
              name="square_meters"
              type="number"
              min="0"
              step="0.01"
              value={formData.square_meters || ''}
              onChange={handleChange}
              placeholder="0.00"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default AreaModal;

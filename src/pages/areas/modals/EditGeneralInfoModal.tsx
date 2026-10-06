import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../../components/ui/Button';
import { updateArea, type OrganizationalArea } from '../../../api/areas';

interface EditGeneralInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  area: OrganizationalArea;
}

const EditGeneralInfoModal = ({ isOpen, onClose, area }: EditGeneralInfoModalProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: area.name || '',
    code: area.code || '',
    description: area.description || '',
    area_type: area.area_type || 'production',
    color: area.color || '#3B82F6',
    capacity: area.capacity?.toString() || '',
    square_meters: area.square_meters?.toString() || '',
    cost_center: area.cost_center || '',
    days_without_accident: area.days_without_accident?.toString() || '0',
  });

  useEffect(() => {
    if (isOpen && area) {
      setFormData({
        name: area.name || '',
        code: area.code || '',
        description: area.description || '',
        area_type: area.area_type || 'production',
        color: area.color || '#3B82F6',
        capacity: area.capacity?.toString() || '',
        square_meters: area.square_meters?.toString() || '',
        cost_center: area.cost_center || '',
        days_without_accident: area.days_without_accident?.toString() || '0',
      });
    }
  }, [isOpen, area]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateArea(area.id, data),
    onSuccess: () => {
      toast.success('Información actualizada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['organizational-area', area.id] });
      queryClient.invalidateQueries({ queryKey: ['areas-tree'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar área');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      code: formData.code || null,
      description: formData.description || null,
      area_type: formData.area_type,
      color: formData.color || null,
      capacity: formData.capacity ? parseInt(formData.capacity) : null,
      square_meters: formData.square_meters ? parseFloat(formData.square_meters) : null,
      cost_center: formData.cost_center || null,
      metadata: {
        ...area.metadata,
        days_without_accident: formData.days_without_accident ? parseInt(formData.days_without_accident) : 0,
      },
    };

    updateMutation.mutate(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Editar Información General</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Área <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>

          {/* Code */}
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
              Código
            </label>
            <input
              type="text"
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono"
              placeholder="PROD-001"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Descripción del área..."
            />
          </div>

          {/* Area Type & Color */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="area_type" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Área
              </label>
              <select
                id="area_type"
                value={formData.area_type}
                onChange={(e) => setFormData({ ...formData, area_type: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="production">Producción</option>
                <option value="warehouse">Almacén</option>
                <option value="office">Oficina</option>
                <option value="laboratory">Laboratorio</option>
                <option value="maintenance">Mantenimiento</option>
                <option value="quality_control">Control de Calidad</option>
                <option value="shipping">Embarque</option>
                <option value="receiving">Recepción</option>
                <option value="other">Otro</option>
              </select>
            </div>

            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono"
                  placeholder="#3B82F6"
                />
              </div>
            </div>
          </div>

          {/* Capacity & Square Meters */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
                Capacidad (personas)
              </label>
              <input
                type="number"
                id="capacity"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                min="0"
                placeholder="50"
              />
            </div>

            <div>
              <label htmlFor="square_meters" className="block text-sm font-medium text-gray-700 mb-1">
                Metros Cuadrados
              </label>
              <input
                type="number"
                id="square_meters"
                value={formData.square_meters}
                onChange={(e) => setFormData({ ...formData, square_meters: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                min="0"
                step="0.01"
                placeholder="250.50"
              />
            </div>
          </div>

          {/* Cost Center & Days Without Accident */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="cost_center" className="block text-sm font-medium text-gray-700 mb-1">
                Centro de Costo
              </label>
              <input
                type="text"
                id="cost_center"
                value={formData.cost_center}
                onChange={(e) => setFormData({ ...formData, cost_center: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="CC-001"
              />
            </div>

            <div>
              <label htmlFor="days_without_accident" className="block text-sm font-medium text-gray-700 mb-1">
                Días Sin Accidente
              </label>
              <input
                type="number"
                id="days_without_accident"
                value={formData.days_without_accident}
                onChange={(e) => setFormData({ ...formData, days_without_accident: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                min="0"
                placeholder="0"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditGeneralInfoModal;

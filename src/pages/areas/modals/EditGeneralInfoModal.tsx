import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../../components/ui/Button';
import { updateArea, type OrganizationalArea } from '../../../api/areas';
import { getEmployees } from '../../../api/employees';

interface EditGeneralInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  area: OrganizationalArea;
}

const EditGeneralInfoModal = ({ isOpen, onClose, area }: EditGeneralInfoModalProps) => {
  const queryClient = useQueryClient();

  // Calculate days without accident from last incident date
  const calculateLastIncidentDate = () => {
    if (!area.days_without_accident || area.days_without_accident === 0) {
      return new Date().toISOString().split('T')[0];
    }
    const date = new Date();
    date.setDate(date.getDate() - area.days_without_accident);
    return date.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    name: area.name || '',
    code: area.code || '',
    description: area.description || '',
    area_type: area.area_type || 'production',
    color: area.color || '#3B82F6',
    capacity: area.capacity?.toString() || '',
    square_meters: area.square_meters?.toString() || '',
    cost_center: area.cost_center || '',
    supervisor_id: area.supervisor_id || '',
    emergency_contact_id: area.emergency_contact_id || '',
    quality_manager_id: area.quality_manager_id || '',
    last_incident_date: calculateLastIncidentDate(),
  });

  // Fetch employees for dropdowns
  const { data: employeesData } = useQuery({
    queryKey: ['employees', area.organization_id],
    queryFn: () => getEmployees({ organization_id: area.organization_id, limit: 500 }),
    enabled: isOpen,
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
        supervisor_id: area.supervisor_id || '',
        emergency_contact_id: area.emergency_contact_id || '',
        quality_manager_id: area.quality_manager_id || '',
        last_incident_date: calculateLastIncidentDate(),
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

    // Calculate days_without_accident from last_incident_date
    const calculateDaysWithoutAccident = () => {
      if (!formData.last_incident_date) return 0;
      const lastIncident = new Date(formData.last_incident_date);
      const today = new Date();
      const diffTime = today.getTime() - lastIncident.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    };

    // Clean metadata to remove days_without_accident if it exists there
    const cleanMetadata = { ...area.metadata };
    delete cleanMetadata.days_without_accident;

    const payload = {
      name: formData.name,
      code: formData.code || null,
      description: formData.description || null,
      area_type: formData.area_type,
      color: formData.color || null,
      capacity: formData.capacity ? parseInt(formData.capacity) : null,
      square_meters: formData.square_meters ? parseFloat(formData.square_meters) : null,
      cost_center: formData.cost_center || null,
      supervisor_id: formData.supervisor_id || null,
      emergency_contact_id: formData.emergency_contact_id || null,
      quality_manager_id: formData.quality_manager_id || null,
      days_without_accident: calculateDaysWithoutAccident(),
      metadata: cleanMetadata, // Clean metadata without days_without_accident
    };

    updateMutation.mutate(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 !mt-0">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">Editar Información General</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto flex-1">
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
              className="p-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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

          {/* Cost Center */}
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

          {/* Responsible People Section */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-md font-semibold text-gray-900 mb-4">Responsables</h3>

            <div className="space-y-4">
              {/* Supervisor */}
              <div>
                <label htmlFor="supervisor_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Supervisor del Área
                </label>
                <select
                  id="supervisor_id"
                  value={formData.supervisor_id}
                  onChange={(e) => setFormData({ ...formData, supervisor_id: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Sin asignar</option>
                  {employeesData?.employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} {emp.position ? `- ${emp.position}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quality Manager */}
              <div>
                <label htmlFor="quality_manager_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Responsable de Calidad
                </label>
                <select
                  id="quality_manager_id"
                  value={formData.quality_manager_id}
                  onChange={(e) => setFormData({ ...formData, quality_manager_id: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Sin asignar</option>
                  {employeesData?.employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} {emp.position ? `- ${emp.position}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Emergency Contact */}
              <div>
                <label htmlFor="emergency_contact_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Contacto de Emergencia
                </label>
                <select
                  id="emergency_contact_id"
                  value={formData.emergency_contact_id}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_id: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Sin asignar</option>
                  {employeesData?.employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} {emp.position ? `- ${emp.position}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Safety Section */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-md font-semibold text-gray-900 mb-4">Seguridad</h3>

            <div>
              <label htmlFor="last_incident_date" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha del Último Incidente
              </label>
              <input
                type="date"
                id="last_incident_date"
                value={formData.last_incident_date}
                onChange={(e) => setFormData({ ...formData, last_incident_date: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {formData.last_incident_date && (
                <p className="mt-2 text-sm text-gray-600">
                  Días sin accidente: <span className="font-semibold text-green-600">
                    {Math.floor((new Date().getTime() - new Date(formData.last_incident_date).getTime()) / (1000 * 60 * 60 * 24))} días
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 flex-shrink-0">
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

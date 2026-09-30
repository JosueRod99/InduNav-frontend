import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { getEmployees, createEmployee, updateEmployee, type CreateEmployeeRequest, type Employee } from '../../api/employees';
import { getOrganizations } from '../../api/organizations';
import { getPlants } from '../../api/plants';
import { getAreas } from '../../api/layouts';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee | null;
  organizationId?: string;
}

const EmployeeModal = ({ isOpen, onClose, employee, organizationId }: EmployeeModalProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateEmployeeRequest>({
    organization_id: organizationId || '',
    plant_id: '',
    area_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    employee_number: '',
    hire_date: new Date().toISOString().split('T')[0],
    reports_to: '',
  });

  const isEditing = !!employee;

  // Fetch organizations for selector
  const { data: organizationsData } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => getOrganizations({ limit: 100 }),
  });

  // Fetch plants for selected organization
  const { data: plantsData } = useQuery({
    queryKey: ['plants', formData.organization_id],
    queryFn: () => getPlants({ organization_id: formData.organization_id, limit: 100 }),
    enabled: !!formData.organization_id,
  });

  // Fetch areas for selected plant
  const { data: areas } = useQuery({
    queryKey: ['areas', formData.plant_id],
    queryFn: () => getAreas({ plant_id: formData.plant_id }),
    enabled: !!formData.plant_id,
  });

  // Fetch employees for manager selection
  const { data: managersData } = useQuery({
    queryKey: ['employees-for-manager', formData.organization_id],
    queryFn: () => getEmployees({ organization_id: formData.organization_id, limit: 200 }),
    enabled: !!formData.organization_id,
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        organization_id: employee.organization_id,
        plant_id: employee.plant_id || '',
        area_id: employee.area_id || '',
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email,
        phone: employee.phone || '',
        position: employee.position,
        department: employee.department,
        employee_number: employee.employee_number,
        hire_date: new Date(employee.hire_date).toISOString().split('T')[0],
        reports_to: employee.reports_to || '',
      });
    } else if (organizationId) {
      setFormData(prev => ({ ...prev, organization_id: organizationId }));
    }
  }, [employee, organizationId]);

  const createMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      toast.success('Empleado creado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['orgChart'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear empleado');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; payload: CreateEmployeeRequest }) =>
      updateEmployee(data.id, data.payload),
    onSuccess: () => {
      toast.success('Empleado actualizado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['orgChart'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar empleado');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      plant_id: formData.plant_id || undefined,
      area_id: formData.area_id || undefined,
      phone: formData.phone || undefined,
      reports_to: formData.reports_to || undefined,
    };

    if (isEditing && employee) {
      updateMutation.mutate({ id: employee.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Empleado' : 'Nuevo Empleado'}
      size="lg"
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
        {/* Organization selector (disabled when editing) */}
        <div>
          <label htmlFor="organization_id" className="block text-sm font-medium text-gray-700 mb-1">
            Organización <span className="text-red-500">*</span>
          </label>
          <select
            id="organization_id"
            name="organization_id"
            value={formData.organization_id}
            onChange={handleChange}
            disabled={isEditing}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Seleccionar organización</option>
            {organizationsData?.organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>

        {/* Personal Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <Input
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              placeholder="Juan"
              required
            />
          </div>

          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
              Apellido <span className="text-red-500">*</span>
            </label>
            <Input
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              placeholder="Pérez"
              required
            />
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="juan.perez@empresa.com"
              required
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+52 999 123 4567"
            />
          </div>
        </div>

        {/* Job Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
              Puesto <span className="text-red-500">*</span>
            </label>
            <Input
              id="position"
              name="position"
              value={formData.position}
              onChange={handleChange}
              placeholder="Gerente de Operaciones"
              required
            />
          </div>

          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
              Departamento <span className="text-red-500">*</span>
            </label>
            <Input
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              placeholder="Operaciones"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="employee_number" className="block text-sm font-medium text-gray-700 mb-1">
              Número de Empleado <span className="text-red-500">*</span>
            </label>
            <Input
              id="employee_number"
              name="employee_number"
              value={formData.employee_number}
              onChange={handleChange}
              placeholder="EMP-001"
              required
            />
          </div>

          <div>
            <label htmlFor="hire_date" className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Contratación <span className="text-red-500">*</span>
            </label>
            <Input
              id="hire_date"
              name="hire_date"
              type="date"
              value={formData.hire_date}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Location */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="plant_id" className="block text-sm font-medium text-gray-700 mb-1">
              Planta
            </label>
            <select
              id="plant_id"
              name="plant_id"
              value={formData.plant_id}
              onChange={handleChange}
              disabled={!formData.organization_id}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
            >
              <option value="">Seleccionar planta</option>
              {plantsData?.plants.map((plant) => (
                <option key={plant.id} value={plant.id}>
                  {plant.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="area_id" className="block text-sm font-medium text-gray-700 mb-1">
              Área
            </label>
            <select
              id="area_id"
              name="area_id"
              value={formData.area_id}
              onChange={handleChange}
              disabled={!formData.plant_id}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
            >
              <option value="">Seleccionar área</option>
              {areas?.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reports To */}
        <div>
          <label htmlFor="reports_to" className="block text-sm font-medium text-gray-700 mb-1">
            Reporta a (Manager)
          </label>
          <select
            id="reports_to"
            name="reports_to"
            value={formData.reports_to}
            onChange={handleChange}
            disabled={!formData.organization_id}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
          >
            <option value="">Sin manager (CEO/Director)</option>
            {managersData?.employees
              .filter((emp) => emp.id !== employee?.id) // Exclude current employee when editing
              .map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} - {emp.position}
                </option>
              ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Selecciona el empleado al que reporta este empleado
          </p>
        </div>
      </form>
    </Modal>
  );
};

export default EmployeeModal;

import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import EmployeeAreaAssignments from './EmployeeAreaAssignments';
import { getEmployees, createEmployee, updateEmployee, type CreateEmployeeRequest, type Employee } from '../../api/employees';
import { getOrganizations } from '../../api/organizations';
import { getPlants } from '../../api/plants';
import { createAssignment } from '../../api/areaAssignments';
import { DEPARTMENT_OPTIONS } from '../../constants/departments';
import { NAME_PREFIXES, personName } from '../../utils/personName';
import { Camera, Loader2 } from 'lucide-react';
import EmployeeAvatar from '../../components/employees/EmployeeAvatar';
import { uploadImage, ImageType } from '../../api/upload';
import PhoneInput from '../../components/ui/PhoneInput';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee | null;
  organizationId?: string;
}

const EmployeeModal = ({ isOpen, onClose, employee, organizationId }: EmployeeModalProps) => {
  const queryClient = useQueryClient();
  const [primaryAreaId, setPrimaryAreaId] = useState<string | null>(null); // For new employees
  const [formData, setFormData] = useState<CreateEmployeeRequest>({
    organization_id: organizationId || '',
    plant_id: '',
    area_id: '', // Keep for backward compatibility, but won't be used
    name_prefix: '',
    avatar_url: null,
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
  const photoInput = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const uploadPhoto = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('La foto pesa más de 10 MB');
      return;
    }
    setUploadingPhoto(true);
    try {
      const result = await uploadImage(file, { imageType: ImageType.AVATAR, organizationId: formData.organization_id, plantId: formData.plant_id || undefined });
      setFormData((prev) => ({ ...prev, avatar_url: result.url }));
    } catch {
      toast.error('No se pudo subir la foto');
    } finally {
      setUploadingPhoto(false);
      if (photoInput.current) photoInput.current.value = '';
    }
  };

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

  // Fetch employees for manager selection (filtered by plant if selected)
  const { data: managersData, isLoading: isLoadingManagers, error: managersError } = useQuery({
    queryKey: ['employees-for-manager', formData.organization_id, formData.plant_id],
    queryFn: () => {
      console.log('🔄 Fetching employees for:', {
        organizationId: formData.organization_id,
        plantId: formData.plant_id || 'all plants'
      });
      // If plant is selected, filter by plant. Otherwise by organization.
      return getEmployees({
        organization_id: formData.organization_id,
        plant_id: formData.plant_id || undefined,
        limit: 100
      });
    },
    enabled: !!formData.organization_id,
  });

  // Debug: Log query state
  useEffect(() => {
    console.log('📊 Managers Query State:', {
      organizationId: formData.organization_id,
      enabled: !!formData.organization_id,
      isLoading: isLoadingManagers,
      hasData: !!managersData,
      data: managersData,
      error: managersError
    });
  }, [formData.organization_id, isLoadingManagers, managersData, managersError]);

  useEffect(() => {
    if (employee) {
      setFormData({
        organization_id: employee.organization_id,
        plant_id: employee.plant_id || '',
        area_id: employee.area_id || '',
        name_prefix: employee.name_prefix || '',
        avatar_url: employee.avatar_url || null,
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email || '',
        phone: employee.phone || '',
        position: employee.position || '',
        department: employee.department || '',
        employee_number: employee.employee_number || '',
        hire_date: employee.hire_date ? new Date(employee.hire_date).toISOString().split('T')[0] : '',
        reports_to: employee.reports_to || '',
      });
    } else if (organizationId) {
      setFormData(prev => ({ ...prev, organization_id: organizationId }));
    }
  }, [employee, organizationId]);

  const createMutation = useMutation({
    mutationFn: async (payload: CreateEmployeeRequest) => {
      // First create the employee
      const newEmployee = await createEmployee(payload);

      // Then create primary area assignment if area was selected
      if (primaryAreaId) {
        await createAssignment(newEmployee.id, {
          organizational_area_id: primaryAreaId,
          assignment_type: 'primary',
        });
      }

      return newEmployee;
    },
    onSuccess: () => {
      toast.success('Empleado creado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['orgChart'] });
      queryClient.invalidateQueries({ queryKey: ['employee-assignments'] });
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
      phone: formData.phone || null,
      reports_to: formData.reports_to === '' ? null : formData.reports_to || null,
      // Optional fields: empty means "not captured"
      email: formData.email?.trim() || null,
      employee_number: formData.employee_number?.trim() || null,
      position: formData.position?.trim() || null,
      department: formData.department || null,
      hire_date: formData.hire_date || undefined,
      avatar_url: formData.avatar_url || null,
    } as unknown as CreateEmployeeRequest;

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
        {/* Profile photo (cropped around the face when shown) */}
        <div className="flex items-center gap-4">
          <EmployeeAvatar person={formData} size={72} />
          <div className="space-y-1.5">
            <input
              ref={photoInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => uploadPhoto(e.target.files?.[0])}
            />
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" className="gap-1.5" disabled={uploadingPhoto || !formData.organization_id} onClick={() => photoInput.current?.click()}>
                {uploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                {formData.avatar_url ? 'Cambiar foto' : 'Subir foto'}
              </Button>
              {formData.avatar_url && (
                <Button type="button" variant="outline" size="sm" onClick={() => setFormData((prev) => ({ ...prev, avatar_url: null }))}>
                  Quitar
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-500">Opcional. JPG o PNG hasta 10 MB; se recorta centrado en la cara.</p>
          </div>
        </div>

        {/* Organization selector (disabled when editing) */}
        <div>
          <Select
            id="organization_id"
            name="organization_id"
            label="Organización"
            value={formData.organization_id}
            onChange={handleChange}
            disabled={isEditing}
            required
            options={[
              { value: '', label: 'Seleccionar organización' },
              ...(organizationsData?.organizations.map((org) => ({
                value: org.id,
                label: org.name,
              })) || []),
            ]}
            helperText={isEditing ? 'No se puede cambiar la organización al editar' : undefined}
          />
        </div>

        {/* Personal Info */}
        <div className="grid grid-cols-[6.5rem_1fr_1fr] gap-4">
          <div>
            <label htmlFor="name_prefix" className="block text-sm font-medium text-gray-700 mb-1">
              Título
            </label>
            <Input
              id="name_prefix"
              name="name_prefix"
              value={formData.name_prefix || ''}
              onChange={handleChange}
              placeholder="Ing."
              maxLength={20}
              list="name-prefix-options"
            />
            <datalist id="name-prefix-options">
              {NAME_PREFIXES.map((prefix) => (
                <option key={prefix} value={prefix} />
              ))}
            </datalist>
          </div>
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
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="juan.perez@empresa.com"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <PhoneInput id="phone" value={formData.phone} onChange={(phone) => setFormData((prev) => ({ ...prev, phone }))} />
          </div>
        </div>

        {/* Job Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
              Puesto
            </label>
            <Input
              id="position"
              name="position"
              value={formData.position}
              onChange={handleChange}
              placeholder="Gerente de Operaciones"
            />
          </div>

          <div>
            <Select
              id="department"
              name="department"
              label="Departamento"
              value={formData.department}
              onChange={handleChange}
              // Departments imported from Excel may not be in the fixed list: keep them selectable
              options={
                formData.department && !DEPARTMENT_OPTIONS.some((o) => o.value === formData.department)
                  ? [...DEPARTMENT_OPTIONS, { value: formData.department, label: formData.department }]
                  : DEPARTMENT_OPTIONS
              }
              placeholder="Selecciona un departamento"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="employee_number" className="block text-sm font-medium text-gray-700 mb-1">
              Número de Empleado
            </label>
            <Input
              id="employee_number"
              name="employee_number"
              value={formData.employee_number}
              onChange={handleChange}
              placeholder="EMP-001"
            />
          </div>

          <div>
            <label htmlFor="hire_date" className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Contratación
            </label>
            <Input
              id="hire_date"
              name="hire_date"
              type="date"
              value={formData.hire_date}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <Select
            id="plant_id"
            name="plant_id"
            label="Planta"
            value={formData.plant_id}
            onChange={handleChange}
            disabled={!formData.organization_id}
            options={[
              { value: '', label: 'Seleccionar planta' },
              ...(plantsData?.plants.map((plant) => ({
                value: plant.id,
                label: plant.name,
              })) || []),
            ]}
            helperText="Selecciona la planta donde trabajará el empleado"
          />
        </div>

        {/* Reports To */}
        <div>
          <Select
            id="reports_to"
            name="reports_to"
            label="Reporta a (Manager/Supervisor)"
            value={formData.reports_to}
            onChange={handleChange}
            disabled={!formData.organization_id}
            options={(() => {
              const options = [
                { value: '', label: 'Sin manager (CEO/Director)' },
                ...(managersData?.employees
                  ?.filter((emp) => emp.id !== employee?.id) // Exclude current employee when editing
                  .map((emp) => ({
                    value: emp.id,
                    label: `${personName(emp)} - ${emp.position}`,
                  })) || []),
              ];
              console.log('🎯 Manager options generated:', {
                totalEmployees: managersData?.employees?.length,
                filteredCount: options.length - 1, // -1 for "Sin manager" option
                options
              });
              return options;
            })()}
            helperText={
              managersData?.employees?.length === 0 ||
              (managersData?.employees?.length === 1 && isEditing)
                ? 'Aún no hay otros empleados en esta organización'
                : 'Selecciona el empleado al que reporta este empleado'
            }
          />
        </div>

        {/* Area Assignments */}
        {formData.organization_id && formData.plant_id && (
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-md font-semibold text-gray-900 mb-3">
              Asignaciones de Área
            </h3>
            <EmployeeAreaAssignments
              employeeId={employee?.id}
              organizationId={formData.organization_id}
              plantId={formData.plant_id}
              onPrimaryAreaChange={setPrimaryAreaId}
            />
          </div>
        )}
      </form>
    </Modal>
  );
};

export default EmployeeModal;

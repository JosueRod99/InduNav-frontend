import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Users, MapPin, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EmployeeModal from './EmployeeModal';
import { getEmployees, deleteEmployee, type Employee } from '../../api/employees';
import { getOrganizations } from '../../api/organizations';
import { getPlants } from '../../api/plants';

const EmployeesPage = () => {
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [selectedPlant, setSelectedPlant] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const queryClient = useQueryClient();

  // Fetch organizations
  const { data: organizationsData } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => getOrganizations({ limit: 100 }),
  });

  // Fetch plants for selected organization
  const { data: plantsData } = useQuery({
    queryKey: ['plants', selectedOrg],
    queryFn: () => getPlants({ organization_id: selectedOrg || undefined, limit: 100 }),
    enabled: !!selectedOrg,
  });

  // Fetch employees with filters
  const { data: employeesData, isLoading } = useQuery({
    queryKey: ['employees', selectedOrg, selectedPlant, selectedDept, searchTerm],
    queryFn: () =>
      getEmployees({
        organization_id: selectedOrg || undefined,
        plant_id: selectedPlant || undefined,
        department: selectedDept || undefined,
        search: searchTerm || undefined,
        limit: 100,
      }),
    enabled: !!selectedOrg,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      toast.success('Empleado eliminado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['orgChart'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar empleado');
    },
  });

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsModalOpen(true);
  };

  const handleDelete = (employee: Employee) => {
    if (window.confirm(`¿Estás seguro de eliminar a ${employee.first_name} ${employee.last_name}?`)) {
      deleteMutation.mutate(employee.id);
    }
  };

  const handleCreate = () => {
    setEditingEmployee(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
  };

  // Get unique departments from employees
  const departments = Array.from(
    new Set(employeesData?.employees.map((e) => e.department) || [])
  ).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Empleados</h2>
          <p className="mt-1 text-sm text-gray-600">
            Gestiona empleados y su estructura organizacional
          </p>
        </div>

        {selectedOrg && (
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Empleado
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="org-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Organización
            </label>
            <select
              id="org-filter"
              value={selectedOrg}
              onChange={(e) => {
                setSelectedOrg(e.target.value);
                setSelectedPlant('');
                setSelectedDept('');
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Seleccionar organización</option>
              {organizationsData?.organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          {selectedOrg && (
            <>
              <div>
                <label htmlFor="plant-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Planta
                </label>
                <select
                  id="plant-filter"
                  value={selectedPlant}
                  onChange={(e) => setSelectedPlant(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Todas las plantas</option>
                  {plantsData?.plants.map((plant) => (
                    <option key={plant.id} value={plant.id}>
                      {plant.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="dept-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Departamento
                </label>
                <select
                  id="dept-filter"
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Todos los departamentos</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar
                </label>
                <input
                  id="search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nombre, email, #empleado..."
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {!selectedOrg ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Selecciona una organización</h3>
          <p className="mt-1 text-sm text-gray-500">
            Elige una organización para ver y gestionar empleados
          </p>
        </div>
      ) : isLoading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">Cargando empleados...</p>
        </div>
      ) : !employeesData?.employees.length ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay empleados</h3>
          <p className="mt-1 text-sm text-gray-500">
            Comienza agregando un nuevo empleado
          </p>
          <div className="mt-6">
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Empleado
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empleado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    # Empleado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Puesto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Departamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ubicación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Manager
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employeesData.employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {employee.first_name} {employee.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{employee.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 font-mono">
                        {employee.employee_number}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{employee.position}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="default">{employee.department}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {employee.plant || employee.area ? (
                        <div className="flex items-start gap-1 text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <div>
                            {employee.plant?.name && <div>{employee.plant.name}</div>}
                            {employee.area?.name && (
                              <div className="text-xs text-gray-500">{employee.area.name}</div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Sin asignar</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {employee.manager ? (
                        <div className="text-sm text-gray-900">
                          {employee.manager.first_name} {employee.manager.last_name}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={employee.is_active ? 'success' : 'error'}>
                        {employee.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(employee)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(employee)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4">
            <p className="text-sm text-gray-700">
              Mostrando <span className="font-medium">{employeesData.employees.length}</span> de{' '}
              <span className="font-medium">{employeesData.total}</span> empleados
            </p>
          </div>
        </div>
      )}

      {/* Employee Modal */}
      <EmployeeModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        employee={editingEmployee}
        organizationId={selectedOrg}
      />
    </div>
  );
};

export default EmployeesPage;

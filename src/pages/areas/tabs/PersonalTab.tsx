import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Mail, Phone, MapPin, Award, UserPlus, LayoutGrid, Table, Edit, UserMinus, X, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getEmployeesByArea,
  updateAssignment,
  endAssignment,
  deleteAssignment,
  type AssignmentType,
} from '../../../api/areaAssignments';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import EmployeeDetailModal from '../../../components/employees/EmployeeDetailModal';
import ManageAssignmentsModal from '../modals/ManageAssignmentsModal';

interface PersonalTabProps {
  areaId: string;
  area?: any; // Should be OrganizationalArea type
}

type ViewMode = 'table' | 'cards';

const PersonalTab = ({ areaId, area }: PersonalTabProps) => {
  const queryClient = useQueryClient();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [editingAssignment, setEditingAssignment] = useState<any | null>(null);

  const { data: employees, isLoading } = useQuery({
    queryKey: ['area-employees', areaId],
    queryFn: () => getEmployeesByArea(areaId),
  });

  // Mutations
  const endAssignmentMutation = useMutation({
    mutationFn: (assignmentId: string) =>
      endAssignment(assignmentId, { end_date: new Date().toISOString().split('T')[0] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['area-employees', areaId] });
      toast.success('Asignación terminada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al terminar la asignación');
    },
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: deleteAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['area-employees', areaId] });
      toast.success('Asignación eliminada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al eliminar la asignación');
    },
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: ({ assignmentId, data }: { assignmentId: string; data: any }) =>
      updateAssignment(assignmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['area-employees', areaId] });
      setEditingAssignment(null);
      toast.success('Asignación actualizada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al actualizar la asignación');
    },
  });

  // Handlers
  const handleEndAssignment = (assignmentId: string) => {
    if (window.confirm('¿Estás seguro de que quieres terminar esta asignación?')) {
      endAssignmentMutation.mutate(assignmentId);
    }
  };

  const handleDeleteAssignment = (assignmentId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta asignación permanentemente?')) {
      deleteAssignmentMutation.mutate(assignmentId);
    }
  };

  const handleUpdateAssignment = (assignmentType: AssignmentType, roleInArea: string) => {
    if (!editingAssignment) return;

    updateAssignmentMutation.mutate({
      assignmentId: editingAssignment.id,
      data: {
        assignment_type: assignmentType,
        role_in_area: roleInArea || undefined,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Cargando empleados...</div>
      </div>
    );
  }

  // Ensure employees is always an array
  const employeesList = Array.isArray(employees) ? employees : [];

  if (employeesList.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Sin Empleados Asignados</h3>
        <p className="text-gray-600">
          Aún no hay empleados asignados a esta área.
        </p>
      </div>
    );
  }

  // Group employees by assignment type
  const primaryEmployees = employeesList.filter((e) => e.assignment_type === 'primary');
  const secondaryEmployees = employeesList.filter((e) => e.assignment_type === 'secondary');
  const temporaryEmployees = employeesList.filter((e) => e.assignment_type === 'temporary');

  return (
    <div className="space-y-8">
      {/* Supervisor Card */}
      {area?.supervisor && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-600 text-white rounded-full p-2">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                    Supervisor del Área
                  </p>
                  <h3 className="text-xl font-bold text-gray-900">
                    {area.supervisor.first_name} {area.supervisor.last_name}
                  </h3>
                </div>
              </div>
              {area.supervisor.position && (
                <p className="text-sm text-gray-700 ml-14">{area.supervisor.position}</p>
              )}
              <div className="mt-3 ml-14 space-y-1">
                {area.supervisor.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <a
                      href={`mailto:${area.supervisor.email}`}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      {area.supervisor.email}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header with Manage Button and View Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Personal Asignado ({employeesList.length})
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Gestiona los empleados asignados a esta área
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded transition-colors ${viewMode === 'table'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
              title="Vista de Tabla"
            >
              <Table className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded transition-colors ${viewMode === 'cards'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
              title="Vista de Tarjetas"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
          <Button
            onClick={() => setIsManageModalOpen(true)}
            className="gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Asignar Empleados
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          title="Empleados Principales"
          count={primaryEmployees.length}
          variant="primary"
        />
        <SummaryCard
          title="Empleados Secundarios"
          count={secondaryEmployees.length}
          variant="secondary"
        />
        <SummaryCard
          title="Empleados Temporales"
          count={temporaryEmployees.length}
          variant="temporary"
        />
      </div>

      {/* Employees View - Table or Cards */}
      {viewMode === 'table' ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empleado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Posición
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Desde
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employeesList.map((employee) => {
                  const assignmentLabel = {
                    primary: 'Principal',
                    secondary: 'Secundario',
                    temporary: 'Temporal',
                  }[employee.assignment_type] || employee.assignment_type;

                  const assignmentColor = {
                    primary: 'blue',
                    secondary: 'purple',
                    temporary: 'yellow',
                  }[employee.assignment_type] || 'gray';

                  return (
                    <tr
                      key={employee.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td
                        className="px-6 py-4 whitespace-nowrap cursor-pointer"
                        onClick={() => setSelectedEmployeeId(employee.employee_id)}
                      >
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.first_name} {employee.last_name}
                          </div>
                          {employee.employee_number && (
                            <div className="text-xs text-gray-500 font-mono">
                              {employee.employee_number}
                            </div>
                          )}
                        </div>
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap cursor-pointer"
                        onClick={() => setSelectedEmployeeId(employee.employee_id)}
                      >
                        <div className="text-sm text-gray-900">{employee.position}</div>
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap cursor-pointer"
                        onClick={() => setSelectedEmployeeId(employee.employee_id)}
                      >
                        <Badge
                          variant={assignmentColor === 'blue' ? 'primary' : assignmentColor === 'purple' ? 'default' : 'warning'}
                          size="sm"
                        >
                          {assignmentLabel}
                        </Badge>
                      </td>

                      <td
                        className="px-6 py-4 cursor-pointer"
                        onClick={() => setSelectedEmployeeId(employee.employee_id)}
                      >
                        <div className="flex flex-col gap-1">
                          {employee.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-gray-400" />
                              <a
                                href={`mailto:${employee.email}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs text-blue-600 hover:text-blue-700"
                              >
                                {employee.email}
                              </a>
                            </div>
                          )}
                          {employee.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-gray-400" />
                              <a
                                href={`tel:${employee.phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs text-gray-700"
                              >
                                {employee.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap cursor-pointer"
                        onClick={() => setSelectedEmployeeId(employee.employee_id)}
                      >
                        <div className="text-sm text-gray-500">
                          {new Date(employee.start_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingAssignment(employee);
                            }}
                            disabled={!!employee.end_date}
                            className="p-1 text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {!employee.end_date && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEndAssignment(employee.id);
                              }}
                              disabled={endAssignmentMutation.isPending}
                              className="p-1 text-yellow-600 hover:text-yellow-700"
                              title="Terminar Asignación"
                            >
                              <UserMinus className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAssignment(employee.id);
                            }}
                            disabled={deleteAssignmentMutation.isPending}
                            className="p-1 text-red-600 hover:text-red-700"
                            title="Eliminar"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          {/* Primary Employees */}
          {primaryEmployees.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Empleados Principales ({primaryEmployees.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {primaryEmployees.map((employee) => (
                  <EmployeeCard
                    key={employee.id}
                    employee={employee}
                    onClick={() => setSelectedEmployeeId(employee.employee_id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Secondary Employees */}
          {secondaryEmployees.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Empleados Secundarios ({secondaryEmployees.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {secondaryEmployees.map((employee) => (
                  <EmployeeCard
                    key={employee.id}
                    employee={employee}
                    onClick={() => setSelectedEmployeeId(employee.employee_id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Temporary Employees */}
          {temporaryEmployees.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Empleados Temporales ({temporaryEmployees.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {temporaryEmployees.map((employee) => (
                  <EmployeeCard
                    key={employee.id}
                    employee={employee}
                    onClick={() => setSelectedEmployeeId(employee.employee_id)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Employee Detail Modal */}
      <EmployeeDetailModal
        isOpen={!!selectedEmployeeId}
        onClose={() => setSelectedEmployeeId(null)}
        employeeId={selectedEmployeeId}
      />

      {/* Manage Assignments Modal */}
      <ManageAssignmentsModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        areaId={areaId}
        area={area}
      />

      {/* Edit Assignment Modal */}
      {editingAssignment && (
        <EditAssignmentModal
          isOpen={!!editingAssignment}
          onClose={() => setEditingAssignment(null)}
          assignment={editingAssignment}
          onSave={handleUpdateAssignment}
          isLoading={updateAssignmentMutation.isPending}
        />
      )}
    </div>
  );
};

// Helper Components
interface SummaryCardProps {
  title: string;
  count: number;
  variant: 'primary' | 'secondary' | 'temporary';
}

const SummaryCard = ({ title, count, variant }: SummaryCardProps) => {
  const colors = {
    primary: 'bg-blue-50 border-blue-200 text-blue-700',
    secondary: 'bg-purple-50 border-purple-200 text-purple-700',
    temporary: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  };

  return (
    <div className={`border rounded-lg p-4 ${colors[variant]}`}>
      <p className="text-sm font-medium opacity-75">{title}</p>
      <p className="text-3xl font-bold mt-2">{count}</p>
    </div>
  );
};

interface EmployeeCardProps {
  employee: any; // Should be typed based on getEmployeesByArea response
  onClick: () => void;
}

const EmployeeCard = ({ employee, onClick }: EmployeeCardProps) => {
  const assignmentColor = {
    primary: 'blue',
    secondary: 'purple',
    temporary: 'yellow',
  }[employee.assignment_type] || 'gray';

  const assignmentLabel = {
    primary: 'Principal',
    secondary: 'Secundario',
    temporary: 'Temporal',
  }[employee.assignment_type] || employee.assignment_type;

  return (
    <div
      onClick={onClick}
      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-all hover:shadow-md cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">
            {employee.first_name} {employee.last_name}
          </h4>
          <p className="text-sm text-gray-600 mt-1">{employee.position}</p>
        </div>
        <Badge
          variant={assignmentColor === 'blue' ? 'primary' : assignmentColor === 'purple' ? 'default' : 'warning'}
          size="sm"
        >
          {assignmentLabel}
        </Badge>
      </div>

      {employee.role_in_area && (
        <div className="flex items-center gap-2 mb-2">
          <Award className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-700">{employee.role_in_area}</span>
        </div>
      )}

      {employee.email && (
        <div className="flex items-center gap-2 mb-2">
          <Mail className="h-4 w-4 text-gray-400" />
          <a
            href={`mailto:${employee.email}`}
            onClick={(e) => e.stopPropagation()}
            className="text-sm text-blue-600 hover:text-blue-700 truncate"
          >
            {employee.email}
          </a>
        </div>
      )}

      {employee.phone && (
        <div className="flex items-center gap-2 mb-2">
          <Phone className="h-4 w-4 text-gray-400" />
          <a
            href={`tel:${employee.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="text-sm text-gray-700"
          >
            {employee.phone}
          </a>
        </div>
      )}

      {employee.employee_number && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 font-mono">{employee.employee_number}</p>
        </div>
      )}

      {employee.start_date && (
        <div className="flex items-center gap-2 mt-2">
          <MapPin className="h-4 w-4 text-gray-400" />
          <span className="text-xs text-gray-500">
            Desde: {new Date(employee.start_date).toLocaleDateString()}
          </span>
        </div>
      )}
    </div>
  );
};

// Edit Assignment Modal Component
interface EditAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: any;
  onSave: (assignmentType: AssignmentType, roleInArea: string) => void;
  isLoading: boolean;
}

const EditAssignmentModal = ({ isOpen, onClose, assignment, onSave, isLoading }: EditAssignmentModalProps) => {
  const [assignmentType, setAssignmentType] = useState<AssignmentType>(assignment.assignment_type);
  const [roleInArea, setRoleInArea] = useState(assignment.role_in_area || '');

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSave(assignmentType, roleInArea);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 !mt-0">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Editar Asignación</h2>
            <p className="text-sm text-gray-600 mt-1">
              {assignment.first_name} {assignment.last_name}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Assignment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Asignación <span className="text-red-500">*</span>
            </label>
            <select
              value={assignmentType}
              onChange={(e) => setAssignmentType(e.target.value as AssignmentType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="primary">Principal</option>
              <option value="secondary">Secundario</option>
              <option value="temporary">Temporal</option>
            </select>
          </div>

          {/* Role in Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rol en el Área (Opcional)
            </label>
            <input
              type="text"
              value={roleInArea}
              onChange={(e) => setRoleInArea(e.target.value)}
              placeholder="Ej: Supervisor, Operador Líder, Inspector..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Assignment Info */}
          <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                Desde: {new Date(assignment.start_date).toLocaleDateString()}
              </span>
            </div>
            {assignment.end_date && (
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4" />
                <span>
                  Hasta: {new Date(assignment.end_date).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 rounded-b-lg">
          <Button onClick={onClose} variant="outline" disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="gap-2">
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Guardando...
              </>
            ) : (
              'Guardar Cambios'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PersonalTab;

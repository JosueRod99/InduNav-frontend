import { useQuery } from '@tanstack/react-query';
import { X, User, Mail, Phone, Briefcase, Building2, Calendar, MapPin, Award, Users } from 'lucide-react';
import { getEmployee, type Employee } from '../../api/employees';
import { getAssignmentsByEmployee } from '../../api/areaAssignments';
import Badge from '../ui/Badge';

interface EmployeeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string | null;
}

const EmployeeDetailModal = ({ isOpen, onClose, employeeId }: EmployeeDetailModalProps) => {
  // Fetch employee details
  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => getEmployee(employeeId!),
    enabled: isOpen && !!employeeId,
  });

  // Fetch area assignments
  const { data: assignments = [] } = useQuery({
    queryKey: ['employee-assignments', employeeId],
    queryFn: () => getAssignmentsByEmployee(employeeId!, false),
    enabled: isOpen && !!employeeId,
  });

  if (!isOpen || !employeeId) return null;

  const primaryAssignment = assignments.find((a) => a.assignment_type === 'primary');
  const secondaryAssignments = assignments.filter((a) => a.assignment_type === 'secondary');
  const temporaryAssignments = assignments.filter((a) => a.assignment_type === 'temporary');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 rounded-full p-3">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isLoading ? 'Cargando...' : `${employee?.first_name} ${employee?.last_name}`}
              </h2>
              {employee?.employee_number && (
                <p className="text-sm text-gray-500 font-mono">{employee.employee_number}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : employee ? (
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-blue-600" />
                Información Laboral
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                <InfoRow
                  icon={<Award className="h-4 w-4 text-gray-500" />}
                  label="Posición"
                  value={employee.position}
                />
                <InfoRow
                  icon={<Building2 className="h-4 w-4 text-gray-500" />}
                  label="Departamento"
                  value={employee.department}
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4 text-gray-500" />}
                  label="Fecha de Contratación"
                  value={new Date(employee.hire_date).toLocaleDateString()}
                />
                {employee.organization && (
                  <InfoRow
                    icon={<Building2 className="h-4 w-4 text-gray-500" />}
                    label="Organización"
                    value={employee.organization.name}
                  />
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                Información de Contacto
              </h3>
              <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                {employee.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <a
                      href={`mailto:${employee.email}`}
                      className="text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      {employee.email}
                    </a>
                  </div>
                )}
                {employee.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <a
                      href={`tel:${employee.phone}`}
                      className="text-gray-700 hover:text-gray-900 transition-colors"
                    >
                      {employee.phone}
                    </a>
                  </div>
                )}
                {employee.plant && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">{employee.plant.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Area Assignments */}
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Asignaciones de Área
              </h3>

              {assignments.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                  Sin asignaciones de área
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Primary Assignment */}
                  {primaryAssignment && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="primary" size="sm">
                              Área Principal
                            </Badge>
                          </div>
                          <p className="font-semibold text-gray-900">
                            {primaryAssignment.area_name || 'Área sin nombre'}
                          </p>
                          {primaryAssignment.role_in_area && (
                            <p className="text-sm text-gray-600 mt-1">
                              Rol: {primaryAssignment.role_in_area}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        Desde: {new Date(primaryAssignment.start_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {/* Secondary Assignments */}
                  {secondaryAssignments.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Áreas Secundarias ({secondaryAssignments.length})
                      </p>
                      <div className="space-y-2">
                        {secondaryAssignments.map((assignment) => (
                          <div
                            key={assignment.id}
                            className="bg-purple-50 border border-purple-200 rounded-lg p-3"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 text-sm">
                                  {assignment.area_name || 'Área sin nombre'}
                                </p>
                                {assignment.role_in_area && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    {assignment.role_in_area}
                                  </p>
                                )}
                              </div>
                              <Badge variant="default" size="sm">
                                Secundaria
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              Desde: {new Date(assignment.start_date).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Temporary Assignments */}
                  {temporaryAssignments.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Asignaciones Temporales ({temporaryAssignments.length})
                      </p>
                      <div className="space-y-2">
                        {temporaryAssignments.map((assignment) => (
                          <div
                            key={assignment.id}
                            className="bg-yellow-50 border border-yellow-200 rounded-lg p-3"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 text-sm">
                                  {assignment.area_name || 'Área sin nombre'}
                                </p>
                                {assignment.role_in_area && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    {assignment.role_in_area}
                                  </p>
                                )}
                              </div>
                              <Badge variant="warning" size="sm">
                                Temporal
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              Desde: {new Date(assignment.start_date).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Status */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Estado</span>
                <Badge variant={employee.is_active ? 'success' : 'default'}>
                  {employee.is_active ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            No se pudo cargar la información del empleado
          </div>
        )}

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper component
interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const InfoRow = ({ icon, label, value }: InfoRowProps) => (
  <div className="flex items-start gap-3">
    {icon}
    <div className="flex-1">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm text-gray-900 font-medium">{value}</p>
    </div>
  </div>
);

export default EmployeeDetailModal;

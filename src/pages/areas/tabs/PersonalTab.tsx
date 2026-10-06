import { useQuery } from '@tanstack/react-query';
import { Users, Mail, Phone, MapPin, Award } from 'lucide-react';
import { getEmployeesByArea } from '../../../api/areaAssignments';
import Badge from '../../../components/ui/Badge';

interface PersonalTabProps {
  areaId: string;
  area?: any; // Should be OrganizationalArea type
}

const PersonalTab = ({ areaId, area }: PersonalTabProps) => {
  const { data: employees, isLoading } = useQuery({
    queryKey: ['area-employees', areaId],
    queryFn: () => getEmployeesByArea(areaId),
  });

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

      {/* Primary Employees */}
      {primaryEmployees.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Empleados Principales ({primaryEmployees.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {primaryEmployees.map((employee) => (
              <EmployeeCard key={employee.id} employee={employee} />
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
              <EmployeeCard key={employee.id} employee={employee} />
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
              <EmployeeCard key={employee.id} employee={employee} />
            ))}
          </div>
        </div>
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
}

const EmployeeCard = ({ employee }: EmployeeCardProps) => {
  const assignmentColor = {
    primary: 'blue',
    secondary: 'purple',
    temporary: 'yellow',
  }[employee.assignment_type] || 'gray';

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-all hover:shadow-md">
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
          {employee.assignment_type}
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

export default PersonalTab;

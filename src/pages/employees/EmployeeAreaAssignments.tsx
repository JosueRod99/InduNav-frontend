import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Calendar, User } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import AreaSelector from '../../components/areas/AreaSelector';
import { getAreaTree } from '../../api/areas';
import {
  getAssignmentsByEmployee,
  createAssignment,
  endAssignment,
  deleteAssignment,
  type EmployeeAreaAssignment,
  type AssignmentType,
} from '../../api/areaAssignments';

interface EmployeeAreaAssignmentsProps {
  employeeId?: string; // Undefined for new employees
  organizationId: string;
  plantId: string;
  onPrimaryAreaChange?: (areaId: string | null) => void; // For new employees
}

const EmployeeAreaAssignments = ({
  employeeId,
  organizationId,
  plantId,
  onPrimaryAreaChange,
}: EmployeeAreaAssignmentsProps) => {
  const queryClient = useQueryClient();
  const [showAddSecondary, setShowAddSecondary] = useState(false);
  const [newSecondaryAreaId, setNewSecondaryAreaId] = useState<string | null>(null);
  const [newSecondaryRole, setNewSecondaryRole] = useState('');
  const [newPrimaryAreaId, setNewPrimaryAreaId] = useState<string | null>(null);
  const [newPrimaryRole, setNewPrimaryRole] = useState('');

  // Fetch area tree
  const { data: areasTree } = useQuery({
    queryKey: ['areas-tree', organizationId, plantId],
    queryFn: () =>
      getAreaTree({
        organization_id: organizationId,
        plant_id: plantId || undefined,
      }),
    enabled: !!organizationId,
  });

  // Fetch existing assignments (only for existing employees)
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['employee-assignments', employeeId],
    queryFn: () => getAssignmentsByEmployee(employeeId!, false),
    enabled: !!employeeId,
  });

  const primaryAssignment = assignments.find((a) => a.assignment_type === 'primary' && !a.end_date);
  const secondaryAssignments = assignments.filter(
    (a) => (a.assignment_type === 'secondary' || a.assignment_type === 'temporary') && !a.end_date
  );

  // Initialize primary area for new employees
  useEffect(() => {
    if (!employeeId && newPrimaryAreaId && onPrimaryAreaChange) {
      onPrimaryAreaChange(newPrimaryAreaId);
    }
  }, [newPrimaryAreaId, employeeId, onPrimaryAreaChange]);

  // Create assignment mutation
  const createMutation = useMutation({
    mutationFn: (data: { areaId: string; type: AssignmentType; role?: string }) =>
      createAssignment(employeeId!, {
        organizational_area_id: data.areaId,
        assignment_type: data.type,
        role_in_area: data.role || undefined,
      }),
    onSuccess: () => {
      toast.success('Asignación creada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['employee-assignments', employeeId] });
      setShowAddSecondary(false);
      setNewSecondaryAreaId(null);
      setNewSecondaryRole('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear asignación');
    },
  });

  // End assignment mutation
  const endMutation = useMutation({
    mutationFn: (assignmentId: string) =>
      endAssignment(assignmentId, { end_date: new Date().toISOString().split('T')[0] }),
    onSuccess: () => {
      toast.success('Asignación finalizada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['employee-assignments', employeeId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al finalizar asignación');
    },
  });

  // Delete assignment mutation
  const deleteMutation = useMutation({
    mutationFn: deleteAssignment,
    onSuccess: () => {
      toast.success('Asignación eliminada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['employee-assignments', employeeId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar asignación');
    },
  });

  const handleAddSecondary = () => {
    if (!newSecondaryAreaId) {
      toast.error('Selecciona un área');
      return;
    }

    createMutation.mutate({
      areaId: newSecondaryAreaId,
      type: 'secondary',
      role: newSecondaryRole,
    });
  };

  const handleRemoveSecondary = (assignment: EmployeeAreaAssignment) => {
    if (window.confirm('¿Estás seguro de eliminar esta asignación?')) {
      deleteMutation.mutate(assignment.id);
    }
  };

  const handleChangePrimaryArea = (areaId: string | null, role?: string) => {
    if (!employeeId) {
      // For new employees, just update local state
      setNewPrimaryAreaId(areaId);
      setNewPrimaryRole(role || '');
      return;
    }

    // For existing employees, end current primary and create new one
    if (primaryAssignment && areaId) {
      endMutation.mutate(primaryAssignment.id);
    }

    if (areaId) {
      createMutation.mutate({
        areaId,
        type: 'primary',
        role: role,
      });
    }
  };

  if (isLoading && employeeId) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Primary Area */}
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="flex items-center gap-2 mb-3">
          <User className="h-4 w-4 text-gray-600" />
          <h4 className="text-sm font-semibold text-gray-900">
            Área Principal <span className="text-red-500">*</span>
          </h4>
        </div>

        {areasTree && (
          <div className="space-y-3">
            <AreaSelector
              areas={areasTree}
              selectedAreaId={employeeId ? primaryAssignment?.organizational_area_id : newPrimaryAreaId}
              onSelect={(area) => handleChangePrimaryArea(area?.id || null)}
              placeholder="Seleccionar área principal..."
              required
            />

            <Input
              label="Rol en el Área"
              value={employeeId ? primaryAssignment?.role_in_area || '' : newPrimaryRole}
              onChange={(e) => {
                if (!employeeId) {
                  setNewPrimaryRole(e.target.value);
                }
              }}
              placeholder="Ej: Operador Líder, Supervisor"
              disabled={!!employeeId} // For existing employees, role is managed separately
            />

            {primaryAssignment && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Calendar className="h-3 w-3" />
                <span>Desde: {new Date(primaryAssignment.start_date).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        )}

        {!employeeId && (
          <p className="mt-2 text-xs text-gray-500">
            El área principal se asignará automáticamente al crear el empleado
          </p>
        )}
      </div>

      {/* Secondary Areas - Only for existing employees */}
      {employeeId && (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900">Áreas Secundarias</h4>
            {!showAddSecondary && (
              <Button
                onClick={() => setShowAddSecondary(true)}
                variant="outline"
                className="gap-2 text-xs py-1 px-2 h-auto"
              >
                <Plus className="h-3 w-3" />
                Agregar
              </Button>
            )}
          </div>

          {/* Add Secondary Form */}
          {showAddSecondary && areasTree && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded space-y-3">
              <AreaSelector
                areas={areasTree}
                selectedAreaId={newSecondaryAreaId}
                onSelect={(area) => setNewSecondaryAreaId(area?.id || null)}
                placeholder="Seleccionar área secundaria..."
              />

              <Input
                label="Rol en el Área"
                value={newSecondaryRole}
                onChange={(e) => setNewSecondaryRole(e.target.value)}
                placeholder="Ej: Inspector, Supervisor Backup"
              />

              <div className="flex gap-2">
                <Button
                  onClick={handleAddSecondary}
                  disabled={!newSecondaryAreaId || createMutation.isPending}
                  className="text-xs flex-1"
                >
                  Guardar
                </Button>
                <Button
                  onClick={() => {
                    setShowAddSecondary(false);
                    setNewSecondaryAreaId(null);
                    setNewSecondaryRole('');
                  }}
                  variant="outline"
                  className="text-xs flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Secondary Assignments List */}
          {secondaryAssignments.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No hay áreas secundarias asignadas
            </p>
          ) : (
            <div className="space-y-2">
              {secondaryAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-start justify-between p-3 bg-gray-50 rounded border border-gray-200"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {assignment.organizational_area?.full_path_name ||
                          assignment.organizational_area?.name ||
                          'Área sin nombre'}
                      </p>
                      <Badge
                        variant="default"
                        className="text-xs bg-blue-100 text-blue-800 flex-shrink-0"
                      >
                        {assignment.assignment_type}
                      </Badge>
                    </div>

                    {assignment.role_in_area && (
                      <p className="text-xs text-gray-600 mb-1">{assignment.role_in_area}</p>
                    )}

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>Desde: {new Date(assignment.start_date).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveSecondary(assignment)}
                    className="ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
                    title="Eliminar asignación"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!employeeId && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-xs text-yellow-800">
            <strong>Nota:</strong> Las áreas secundarias se pueden agregar después de crear el empleado.
          </p>
        </div>
      )}
    </div>
  );
};

export default EmployeeAreaAssignments;

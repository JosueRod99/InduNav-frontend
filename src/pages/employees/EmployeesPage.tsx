import { confirmar } from '../../components/ui/ConfirmDialog';
import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Users, Building2, FileSpreadsheet, Search, Eye, UserMinus, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EmployeeModal from './EmployeeModal';
import { getEmployees, deleteEmployee, type Employee } from '../../api/employees';
import { getOrganizations } from '../../api/organizations';
import { getPlant, getPlants } from '../../api/plants';
import type { PlantScopedProps } from '../plants/plantScope';
import { personName } from '../../utils/personName';
import ImportEmployeesModal from './import/ImportEmployeesModal';
import EmployeeDetailModal from '../../components/employees/EmployeeDetailModal';
import EmployeeAvatar from '../../components/employees/EmployeeAvatar';
import SectionHeader from '../../components/ui/SectionHeader';
import { endAssignment, getEmployeesByArea, updateAssignment, type AssignmentType, type EmployeeAreaAssignment } from '../../api/areaAssignments';
import AreaHeadcountSection from '../../components/headcount/AreaHeadcountSection';
import ManageAssignmentsModal from '../areas/modals/ManageAssignmentsModal';
import EditAssignmentModal from '../areas/modals/EditAssignmentModal';
import { matchesSearch, normalizeSearch } from '../../utils/search';
import { useCan } from '../../hooks/usePermissions';

// Personnel of the plant: summary (each card filters), one row of filters, and a compact table
// (name + number + email, position, area, who they report to); cards on phones.
// Everything is loaded once (up to MAX_LOADED) and filtered here; the list shows PAGE rows at a time.

const MAX_LOADED = 500;
const PAGE = 50;
const NO_AREA = '__none__';
type Quick = '' | 'no_area' | 'no_manager' | 'cert_alerts';

const ASSIGNMENT: Record<AssignmentType, { label: string; variant: 'primary' | 'default' | 'warning' }> = {
  primary: { label: 'Principal', variant: 'primary' },
  secondary: { label: 'Secundario', variant: 'default' },
  temporary: { label: 'Temporal', variant: 'warning' },
};

const hasArea = (e: Employee) => !!e.primary_area?.id;

const EmployeesPage = ({ plantId, organizationId, viewSwitch, area }: PlantScopedProps = {}) => {
  const embedded = !!plantId; // inside the plant workspace: fixed plant, no org/plant selectors

  const [selectedOrg, setSelectedOrg] = useState<string>(organizationId ?? '');
  const [selectedPlant, setSelectedPlant] = useState<string>(plantId ?? '');
  const [selectedArea, setSelectedArea] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'inactive'>('');
  const [quick, setQuick] = useState<Quick>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [shown, setShown] = useState(PAGE);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [detailEmployeeId, setDetailEmployeeId] = useState<string | null>(null); // record with responsibilities
  const [returnToDetail, setReturnToDetail] = useState<string | null>(null); // edit opened from a record goes back to it
  // Plant name for the import (already cached by the plant workspace)
  const { data: plant } = useQuery({ queryKey: ['plant', plantId], queryFn: () => getPlant(plantId!), enabled: embedded });
  const queryClient = useQueryClient();
  const can = useCan();
  const canCreate = can('employees.create');
  const canUpdate = can('employees.update');
  const canDelete = can('employees.delete');
  const canAssign = !!area && can('employees.assign');
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<EmployeeAreaAssignment | null>(null);

  // Inside an area: who is assigned to it, how, and since when
  const { data: assignments } = useQuery({
    queryKey: ['area-employees', area?.id],
    queryFn: () => getEmployeesByArea(area!.id),
    enabled: !!area,
  });
  const assignmentOf = useMemo(() => new Map((Array.isArray(assignments) ? assignments : []).map((a) => [a.employee_id, a])), [assignments]);
  const refreshAssignments = () => {
    queryClient.invalidateQueries({ queryKey: ['area-employees', area?.id] });
    queryClient.invalidateQueries({ queryKey: ['employees'] });
    queryClient.invalidateQueries({ queryKey: ['plant-areas-overview'] });
  };
  const endMutation = useMutation({
    mutationFn: (id: string) => endAssignment(id, { end_date: new Date().toISOString().split('T')[0] }),
    onSuccess: () => {
      toast.success('Se quitó del área');
      refreshAssignments();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'No se pudo quitar del área'),
  });
  const updateAssignmentMutation = useMutation({
    mutationFn: ({ id, type, roleInArea }: { id: string; type: AssignmentType; roleInArea: string }) =>
      updateAssignment(id, { assignment_type: type, role_in_area: roleInArea || undefined }),
    onSuccess: () => {
      setEditingAssignment(null);
      toast.success('Asignación actualizada');
      refreshAssignments();
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'No se pudo actualizar la asignación'),
  });

  const { data: organizationsData } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => getOrganizations({ limit: 100 }),
    enabled: !embedded,
  });

  const { data: plantsData } = useQuery({
    queryKey: ['plants', selectedOrg],
    queryFn: () => getPlants({ organization_id: selectedOrg || undefined, limit: 100 }),
    enabled: !!selectedOrg && !embedded,
  });

  const { data: employeesData, isLoading } = useQuery({
    // Inside an area: the whole company, since someone from another plant can be assigned to it
    queryKey: ['employees', selectedOrg, area ? 'company' : selectedPlant],
    queryFn: () => getEmployees({ organization_id: selectedOrg || undefined, plant_id: area ? undefined : selectedPlant || undefined, limit: MAX_LOADED }),
    enabled: !!selectedOrg,
  });
  const employees = useMemo(() => {
    const list = employeesData?.employees || [];
    return area ? list.filter((e) => assignmentOf.has(e.id)) : list;
  }, [employeesData, area, assignmentOf]);
  const totalInDb = employeesData?.total || 0;

  const deleteMutation = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      toast.success('Empleado eliminado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['orgChart'] });
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Error al eliminar empleado'),
  });

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsModalOpen(true);
  };

  const handleDelete = async (employee: Employee) => {
    if (await confirmar({ title: 'Eliminar empleado', message: `Se eliminará a ${personName(employee)}.` })) deleteMutation.mutate(employee.id);
  };

  const handleCreate = () => {
    setEditingEmployee(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
    if (returnToDetail) setDetailEmployeeId(returnToDetail);
    setReturnToDetail(null);
  };

  const areas = useMemo(() => {
    const map = new Map<string, string>();
    employees.forEach((e) => hasArea(e) && map.set(e.primary_area!.id, e.primary_area!.name));
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], 'es'));
  }, [employees]);

  const quickTest: Record<Exclude<Quick, ''>, (e: Employee) => boolean> = {
    no_area: (e) => !hasArea(e),
    no_manager: (e) => !e.reports_to,
    cert_alerts: (e) => (e.certification_alerts || 0) > 0,
  };

  const text = normalizeSearch(searchTerm);
  const filtered = employees.filter((e) => {
    if (quick && !quickTest[quick](e)) return false;
    if (statusFilter && e.is_active !== (statusFilter === 'active')) return false;
    if (area && selectedArea && assignmentOf.get(e.id)?.assignment_type !== selectedArea) return false;
    if (!area && selectedArea === NO_AREA && hasArea(e)) return false;
    if (!area && selectedArea && selectedArea !== NO_AREA && e.primary_area?.id !== selectedArea) return false;
    if (!matchesSearch(text, personName(e), e.email, e.employee_number, e.position)) return false;
    return true;
  });
  const visible = filtered.slice(0, shown);

  const summary: { key: Quick; label: string; value: number; tone: string }[] = [
    { key: '', label: 'Personas', value: employees.length, tone: 'text-gray-900' },
    // Inside an area everyone has one
    ...(area ? [] : [{ key: 'no_area' as Quick, label: 'Sin área', value: employees.filter(quickTest.no_area).length, tone: 'text-amber-700' }]),
    { key: 'no_manager', label: 'Sin jefe', value: employees.filter(quickTest.no_manager).length, tone: 'text-amber-700' },
    { key: 'cert_alerts', label: 'Con certificaciones por vencer', value: employees.filter(quickTest.cert_alerts).length, tone: 'text-red-700' },
  ];
  const filtersActive = !!(text || selectedArea || statusFilter || quick);
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedArea('');
    setStatusFilter('');
    setQuick('');
  };
  // Changing a filter starts the list from the top again
  const withReset =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setShown(PAGE);
    };

  const NameCell = ({ employee }: { employee: Employee }) => (
    <div className="flex min-w-0 items-center gap-3">
      <EmployeeAvatar person={employee} size={36} />
      <div className="min-w-0">
        <button type="button" onClick={() => setDetailEmployeeId(employee.id)} className="text-left text-sm font-medium text-gray-900 hover:text-blue-700 hover:underline">
          {personName(employee)}
        </button>
        {!employee.is_active && (
          <Badge variant="error" size="sm" className="ml-2">
            Inactivo
          </Badge>
        )}
        <div className="truncate text-xs text-gray-500">{[employee.employee_number, employee.email].filter(Boolean).join(' · ')}</div>
      </div>
    </div>
  );

  const PositionCell = ({ employee }: { employee: Employee }) => (
    <div>
      <div className="text-sm text-gray-900">{employee.position || '—'}</div>
      {/* Department only when it says something the area does not */}
      {employee.department && employee.department !== employee.primary_area?.name && <div className="text-xs text-gray-500">Depto. {employee.department}</div>}
    </div>
  );

  const AreaCell = ({ employee }: { employee: Employee }) =>
    hasArea(employee) ? (
      <span className="inline-flex items-center gap-1.5 text-sm text-gray-900">
        <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: employee.primary_area!.color || '#94A3B8' }} />
        {employee.primary_area!.name}
      </span>
    ) : (
      <span className="text-xs text-amber-700">Sin área</span>
    );

  const ManagerCell = ({ employee }: { employee: Employee }) =>
    employee.manager ? (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setDetailEmployeeId(employee.manager!.id);
        }} className="text-left text-sm text-gray-900 hover:text-blue-700 hover:underline">
        {personName(employee.manager)}
      </button>
    ) : (
      <span className="text-xs text-amber-700">Sin jefe</span>
    );

  // Inside an area: how the person is assigned; clicking it changes the type or the role
  const AssignmentCell = ({ employee }: { employee: Employee }) => {
    const assignment = assignmentOf.get(employee.id);
    if (!assignment) return null;
    const info = ASSIGNMENT[assignment.assignment_type as AssignmentType];
    const badge = (
      <Badge variant={info?.variant || 'default'} size="sm">
        {info?.label || assignment.assignment_type}
      </Badge>
    );
    return (
      <span className="inline-flex flex-col items-start gap-0.5" onClick={(e) => e.stopPropagation()}>
        {canAssign ? (
          <button type="button" onClick={() => setEditingAssignment(assignment)} title="Cambiar tipo o rol en el área" aria-label={`Cambiar asignación de ${personName(employee)}`}>
            {badge}
          </button>
        ) : (
          badge
        )}
        {assignment.role_in_area && <span className="text-xs text-gray-500">{assignment.role_in_area}</span>}
      </span>
    );
  };

  const Actions = ({ employee }: { employee: Employee }) => (
    <span className="flex flex-shrink-0 items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      <button onClick={() => setDetailEmployeeId(employee.id)} className="rounded p-1.5 text-gray-600 hover:bg-gray-100" aria-label={`Ver ficha de ${personName(employee)}`} title="Ver ficha">
        <Eye className="h-4 w-4" />
      </button>
      {canUpdate && (
          <button onClick={() => handleEdit(employee)} className="rounded p-1.5 text-blue-600 hover:bg-blue-50" aria-label={`Editar a ${personName(employee)}`} title="Editar">
            <Pencil className="h-4 w-4" />
          </button>
      )}
      {canDelete && (
          <button onClick={() => handleDelete(employee)} className="rounded p-1.5 text-red-600 hover:bg-red-50" aria-label={`Eliminar a ${personName(employee)}`} title="Eliminar empleado">
            <Trash2 className="h-4 w-4" />
          </button>
      )}
      {/* Only leaves this area; the person stays in the company */}
      {area && canAssign && assignmentOf.get(employee.id) && (
        <button
          onClick={async () => (await confirmar({ title: 'Quitar del área', message: `${personName(employee)} saldrá de "${area.name}". Sigue siendo empleado de la empresa.`, confirmLabel: 'Quitar' })) && endMutation.mutate(assignmentOf.get(employee.id)!.id)}
          disabled={endMutation.isPending}
          className="rounded p-1.5 text-amber-600 hover:bg-amber-50"
          aria-label={`Quitar a ${personName(employee)} del área`}
          title="Quitar del área"
        >
          <UserMinus className="h-4 w-4" />
        </button>
      )}
    </span>
  );

  const organizations = organizationsData?.organizations || [];
  const plants = plantsData?.plants || [];

  return (
    <div className="space-y-4">
      <SectionHeader
        title={embedded ? 'Personal' : 'Empleados'}
        description={
          area
            ? `Empleados asignados a "${area.name}", su puesto y a quién reportan.`
            : embedded
              ? 'Empleados de la planta, su puesto, área y a quién reportan.'
              : 'Gestiona empleados y su estructura organizacional'
        }
        actions={
          area ? (
            <>
              {canAssign && (
                <Button variant="outline" onClick={() => setIsAssignOpen(true)} className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Asignar Empleados
                </Button>
              )}
              {canCreate && (
                <Button onClick={handleCreate} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nuevo Empleado
                </Button>
              )}
            </>
          ) : selectedOrg && (
            <>
              {/* Import works on one plant: available inside the plant workspace */}
              {embedded && can('employees.import') && (
                <Button variant="outline" onClick={() => setIsImportOpen(true)} className="gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Importar Excel
                </Button>
              )}
              {canCreate && (
                <Button onClick={handleCreate} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nuevo Empleado
                </Button>
              )}
            </>
          )
        }
      />
      {viewSwitch}

      {/* Organization and plant (only outside the plant workspace) */}
      {!embedded && (
        <div className="flex flex-wrap gap-2">
          <select
            aria-label="Organización"
            value={selectedOrg}
            onChange={(e) => {
              setSelectedOrg(e.target.value);
              setSelectedPlant('');
              setSelectedArea('');
            }}
            className="w-full sm:w-64"
          >
            <option value="">Seleccionar organización</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
          {selectedOrg && (
            <select aria-label="Planta" value={selectedPlant} onChange={(e) => setSelectedPlant(e.target.value)} className="w-full sm:w-64">
              <option value="">Todas las plantas</option>
              {plants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {selectedOrg && employees.length > 0 && (
        <>
          {/* Summary: each card filters (a second click clears it) */}
          <div className={`grid grid-cols-2 gap-3 ${area ? 'sm:grid-cols-3' : 'sm:grid-cols-4'}`}>
            {summary.map(({ key, label, value, tone }) => (
              <button
                key={label}
                onClick={() => withReset(setQuick)(quick === key ? '' : key)}
                aria-pressed={quick === key}
                className={`rounded-lg border bg-white p-3 text-left transition-colors ${quick === key ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200 hover:border-blue-300'}`}
              >
                <span className={`block text-2xl font-bold ${value || key === '' ? tone : 'text-gray-400'}`}>{value}</span>
                <span className="text-xs text-gray-600">{label}</span>
              </button>
            ))}
          </div>

          {/* Filters in one row */}
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative min-w-[14rem] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => withReset(setSearchTerm)(e.target.value)}
                placeholder="Buscar nombre, puesto o número"
                aria-label="Buscar personal"
                className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
              {area ? (
                <select aria-label="Asignación" value={selectedArea} onChange={(e) => withReset(setSelectedArea)(e.target.value)} className="min-w-0 text-sm">
                  <option value="">Asignación: todas</option>
                  {Object.entries(ASSIGNMENT).map(([value, { label }]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              ) : (
                <select aria-label="Área" value={selectedArea} onChange={(e) => withReset(setSelectedArea)(e.target.value)} className="min-w-0 text-sm">
                  <option value="">Área: todas</option>
                  {areas.map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                  <option value={NO_AREA}>Sin área</option>
                </select>
              )}
              <select aria-label="Estado" value={statusFilter} onChange={(e) => withReset(setStatusFilter)(e.target.value as '' | 'active' | 'inactive')} className="min-w-0 text-sm">
                <option value="">Estado: todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>
          </div>
        </>
      )}

      {/* Content */}
      {!selectedOrg ? (
        <div className="rounded-lg bg-white p-8 text-center shadow">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Selecciona una organización</h3>
          <p className="mt-1 text-sm text-gray-500">Elige una organización para ver y gestionar empleados</p>
        </div>
      ) : isLoading ? (
        <div className="rounded-lg bg-white p-8 text-center shadow">
          <p className="text-gray-600">Cargando empleados...</p>
        </div>
      ) : !employees.length ? (
        <div className="rounded-lg bg-white p-8 text-center shadow">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">{area ? 'Sin empleados con nombre asignados' : 'No hay empleados'}</h3>
          <p className="mt-1 text-sm text-gray-500">{area ? 'Aún no hay empleados asignados a esta área.' : 'Comienza agregando un nuevo empleado'}</p>
          {(area ? canAssign : canCreate) && (
            <div className="mt-6">
              <Button onClick={area ? () => setIsAssignOpen(true) : handleCreate} className="gap-2">
                {area ? <UserPlus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {area ? 'Asignar Empleados' : 'Nuevo Empleado'}
              </Button>
            </div>
          )}
        </div>
      ) : !filtered.length ? (
        <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-sm text-gray-600">
          Nadie coincide con los filtros.{' '}
          {filtersActive && (
            <button onClick={clearFilters} className="font-medium text-blue-700 hover:underline">
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          {/* Table (tablets and up) */}
          <table className="hidden min-w-full divide-y divide-gray-200 md:table">
            <thead className="bg-gray-50">
              <tr>
                {['Empleado', 'Puesto', area ? 'Asignación' : 'Área', 'Reporta a'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {h}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {visible.map((employee) => (
                <tr key={employee.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setDetailEmployeeId(employee.id)} title="Ver ficha">
                  <td className="max-w-xs px-4 py-3">
                    <NameCell employee={employee} />
                  </td>
                  <td className="px-4 py-3">
                    <PositionCell employee={employee} />
                  </td>
                  <td className="px-4 py-3">{area ? <AssignmentCell employee={employee} /> : <AreaCell employee={employee} />}</td>
                  <td className="px-4 py-3">
                    <ManagerCell employee={employee} />
                  </td>
                  <td className="px-4 py-3">
                    <Actions employee={employee} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Cards (phones) */}
          <ul className="divide-y divide-gray-100 md:hidden">
            {visible.map((employee) => (
              <li key={employee.id} className="cursor-pointer px-4 py-3" onClick={() => setDetailEmployeeId(employee.id)}>
                <div className="flex items-start justify-between gap-2">
                  <NameCell employee={employee} />
                  <Actions employee={employee} />
                </div>
                <div className="mt-2 space-y-1 pl-12 text-sm">
                  <PositionCell employee={employee} />
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
                    {area ? <AssignmentCell employee={employee} /> : <AreaCell employee={employee} />}
                    <span className="inline-flex items-center gap-1">
                      Reporta a: <ManagerCell employee={employee} />
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Footer: how many are shown, and "Mostrar más" */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            <span>
              Mostrando <strong>{visible.length}</strong> de <strong>{filtered.length}</strong> {filtersActive ? 'que coinciden' : 'personas'}
              {totalInDb > (employeesData?.employees.length || 0) && (
                <span className="ml-1 text-amber-700">(se cargaron las primeras {employeesData?.employees.length} de {totalInDb})</span>
              )}
            </span>
            {visible.length < filtered.length && (
              <Button variant="outline" size="sm" onClick={() => setShown(shown + PAGE)}>
                Mostrar {Math.min(PAGE, filtered.length - visible.length)} más
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Inside an area: people counted by position (without names), assigning and the type of assignment */}
      {area && <AreaHeadcountSection areaId={area.id} namedCount={employees.length} />}
      {area && <ManageAssignmentsModal isOpen={isAssignOpen} onClose={() => setIsAssignOpen(false)} areaId={area.id} area={area as any} />}
      {editingAssignment && (
        <EditAssignmentModal
          isOpen
          onClose={() => setEditingAssignment(null)}
          assignment={editingAssignment}
          onSave={(type, roleInArea) => updateAssignmentMutation.mutate({ id: editingAssignment.id, type, roleInArea })}
          isLoading={updateAssignmentMutation.isPending}
        />
      )}

      <EmployeeModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        employee={editingEmployee}
        organizationId={selectedOrg}
        onCreated={(created) => {
          setDetailEmployeeId(created.id);
          if (area) refreshAssignments();
        }}
        defaultPlantId={plantId}
        defaultArea={area}
      />
      <EmployeeDetailModal
        isOpen={!!detailEmployeeId}
        onClose={() => setDetailEmployeeId(null)}
        employeeId={detailEmployeeId}
        onEdit={!canUpdate ? undefined : (employee) => {
          setDetailEmployeeId(null);
          setReturnToDetail(employee.id);
          handleEdit(employee);
        }}
      />
      {embedded && (
        <ImportEmployeesModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} plantId={plantId!} plantName={plant?.name || 'la planta'} />
      )}
    </div>
  );
};

export default EmployeesPage;

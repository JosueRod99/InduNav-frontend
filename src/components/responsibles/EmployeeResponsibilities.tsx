import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ClipboardList, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import ReportsPrompt, { type ReportsPromptRequest } from './ReportsPrompt';
import {
  addResponsible,
  getResponsibilitiesByEmployee,
  removeResponsible,
  RESPONSIBLE_ROLES,
  roleLabel,
  type ResponsibleRole,
} from '../../api/areaResponsibles';
import { getAreas } from '../../api/areas';
import { getPlants } from '../../api/plants';
import type { Employee } from '../../api/employees';
import { personName } from '../../utils/personName';
import { useAuthStore } from '../../store/authStore';

// "Responsabilidades" of an employee (their record): the areas they are in charge of, in any plant
// of the company, unrelated to where they work. Several areas can be added at once.

const EDITORS = ['platform_admin', 'org_owner', 'plant_manager'];

const EmployeeResponsibilities = ({ employee }: { employee: Employee }) => {
  const queryClient = useQueryClient();
  const canEdit = EDITORS.includes(useAuthStore((s) => s.user?.role?.name) || '');
  const [isAdding, setIsAdding] = useState(false);
  const [role, setRole] = useState<ResponsibleRole>('supervisor');
  const [plantId, setPlantId] = useState<string>(employee.plant_id || '');
  const [selected, setSelected] = useState<string[]>([]);
  const [shift, setShift] = useState('');
  const [filter, setFilter] = useState('');
  const [prompt, setPrompt] = useState<ReportsPromptRequest | null>(null);

  const queryKey = ['employee-responsibilities', employee.id];
  const { data: responsibilities = [] } = useQuery({ queryKey, queryFn: () => getResponsibilitiesByEmployee(employee.id) });
  const { data: plants } = useQuery({
    queryKey: ['plants', employee.organization_id],
    queryFn: () => getPlants({ organization_id: employee.organization_id, limit: 100 }),
    enabled: isAdding,
  });
  const { data: areasData } = useQuery({
    queryKey: ['areas-for-responsibles', plantId],
    queryFn: () => getAreas({ plant_id: plantId, limit: 500 }),
    enabled: isAdding && !!plantId,
  });

  const already = useMemo(
    () => new Set(responsibilities.filter((r) => r.role === role).map((r) => r.area_id)),
    [responsibilities, role]
  );
  const areas = (areasData?.areas || []).filter((a) => !filter || a.name.toLowerCase().includes(filter.toLowerCase()));

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: ['area-responsibles'] });
    queryClient.invalidateQueries({ queryKey: ['orgChart'] });
  };

  const add = useMutation({
    mutationFn: () => addResponsible({ employee_id: employee.id, role, area_ids: selected, shift: shift.trim() || null }),
    onSuccess: ({ added }) => {
      toast.success(`${roleLabel(role)} de ${added} área${added === 1 ? '' : 's'}`);
      if (role === 'supervisor') {
        const names = (areasData?.areas || []).filter((a) => selected.includes(a.id)).map((a) => a.name);
        setPrompt({
          employeeId: employee.id,
          employeeName: personName(employee),
          areaIds: selected,
          areaLabel: names.length === 1 ? names[0] : `${names.length} áreas`,
        });
      }
      closeAdd();
      refresh();
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'No se pudo guardar'),
  });
  const remove = useMutation({
    mutationFn: (id: string) => removeResponsible(id),
    onSuccess: refresh,
    onError: (error: any) => toast.error(error.response?.data?.message || 'No se pudo quitar'),
  });

  const closeAdd = () => {
    setIsAdding(false);
    setSelected([]);
    setShift('');
    setFilter('');
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-md font-semibold text-gray-900">
          <ClipboardList className="h-5 w-5 text-blue-600" />
          Responsabilidades
        </h3>
        {canEdit && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setIsAdding(true)}>
            <Plus className="h-4 w-4" /> Agregar responsabilidad
          </Button>
        )}
      </div>
      {responsibilities.length === 0 ? (
        <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">No es responsable de ningún área.</p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
          {responsibilities.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <span className="min-w-0">
                <span className="font-medium text-gray-900">{roleLabel(r.role)}</span>
                <span className="text-gray-600"> · </span>
                <Link to={`/areas/${r.area_id}`} className="text-blue-700 hover:underline">
                  {r.area_name}
                </Link>
                {r.plant_name && r.plant_id !== employee.plant_id && <span className="text-xs text-gray-500"> ({r.plant_name})</span>}
                {r.shift && <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700">{r.shift}</span>}
              </span>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => window.confirm(`¿Quitar la responsabilidad de ${r.area_name}?`) && remove.mutate(r.id)}
                  className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  aria-label={`Quitar responsabilidad de ${r.area_name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <Modal
        isOpen={isAdding}
        onClose={closeAdd}
        title={`Agregar responsabilidad · ${personName(employee)}`}
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={closeAdd}>
              Cancelar
            </Button>
            <Button onClick={() => add.mutate()} disabled={!selected.length || add.isPending}>
              Agregar a {selected.length} área{selected.length === 1 ? '' : 's'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="block text-sm font-medium text-gray-700">
              Papel
              <select
                value={role}
                onChange={(e) => {
                  setRole(e.target.value as ResponsibleRole);
                  setSelected([]);
                }}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {RESPONSIBLE_ROLES.map((r) => (
                  <option key={r.role} value={r.role}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Planta
              <select
                value={plantId}
                onChange={(e) => {
                  setPlantId(e.target.value);
                  setSelected([]);
                }}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {!plantId && <option value="">Elige una planta</option>}
                {plants?.plants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Turno <span className="font-normal text-gray-500">(opcional)</span>
              <input
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                maxLength={50}
                placeholder="Ej. Turno 1"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filtrar áreas"
                aria-label="Filtrar áreas"
                className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
              />
              <span className="text-xs text-gray-500">{selected.length} seleccionada{selected.length === 1 ? '' : 's'}</span>
            </div>
            <ul className="max-h-72 divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-200" aria-label="Áreas">
              {areas.map((a) => {
                const has = already.has(a.id);
                return (
                  <li key={a.id}>
                    <label
                      className={`flex items-center gap-2 px-3 py-2 text-sm ${has ? 'text-gray-400' : 'cursor-pointer hover:bg-blue-50'}`}
                      style={{ paddingLeft: `${0.75 + Math.max(0, (a.hierarchy_level || 1) - 1) * 1.25}rem` }}
                    >
                      <input
                        type="checkbox"
                        disabled={has}
                        checked={has || selected.includes(a.id)}
                        onChange={(e) => setSelected((s) => (e.target.checked ? [...s, a.id] : s.filter((id) => id !== a.id)))}
                        className="rounded border-gray-300"
                      />
                      <span className="flex-1">{a.name}</span>
                      {has && <span className="text-[11px]">Ya es {roleLabel(role).toLowerCase()}</span>}
                    </label>
                  </li>
                );
              })}
              {plantId && areasData && areas.length === 0 && <li className="px-3 py-4 text-center text-sm text-gray-500">Sin áreas</li>}
            </ul>
          </div>
          <p className="text-xs text-gray-500">
            Ser responsable no cambia dónde trabaja. Si el área ya tiene alguien en ese papel, esta persona se agrega como adicional.
          </p>
        </div>
      </Modal>

      <ReportsPrompt request={prompt} onDone={() => setPrompt(null)} />
    </div>
  );
};

export default EmployeeResponsibilities;

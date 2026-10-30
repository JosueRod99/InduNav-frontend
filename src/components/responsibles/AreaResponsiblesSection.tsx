import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Award, Clock, Mail, Phone, Plus, Shield, Star, Trash2, User, Users } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import EmployeePicker from './EmployeePicker';
import ReportsPrompt, { type ReportsPromptRequest } from './ReportsPrompt';
import {
  addResponsible,
  getResponsiblesByArea,
  removeResponsible,
  RESPONSIBLE_ROLES,
  roleLabel,
  updateResponsible,
  type AreaResponsible,
  type ResponsibleRole,
} from '../../api/areaResponsibles';
import type { Employee } from '../../api/employees';
import { personName } from '../../utils/personName';
import { useAuthStore } from '../../store/authStore';
import EmployeeAvatar from '../employees/EmployeeAvatar';
import { formatPhone, phoneHref } from '../../utils/phone';

// "Responsables" of an area (General tab): supervisors, quality and emergency contacts. Several
// people per role, each with an optional shift; the first one is the main one (shown in tours).

const EDITORS = ['platform_admin', 'org_owner', 'plant_manager'];
const ROLE_ICON: Record<ResponsibleRole, JSX.Element> = {
  supervisor: <User className="h-5 w-5 text-blue-600" />,
  quality: <Award className="h-5 w-5 text-purple-600" />,
  emergency: <Shield className="h-5 w-5 text-red-600" />,
};

interface Props {
  area: { id: string; name: string; organization_id: string; plant_id: string | null };
  onOpenEmployee?: (employeeId: string) => void;
}

const AreaResponsiblesSection = ({ area, onOpenEmployee }: Props) => {
  const queryClient = useQueryClient();
  const canEdit = EDITORS.includes(useAuthStore((s) => s.user?.role?.name) || '');
  const [adding, setAdding] = useState<ResponsibleRole | null>(null);
  const [picked, setPicked] = useState<Employee | null>(null);
  const [shift, setShift] = useState('');
  const [prompt, setPrompt] = useState<ReportsPromptRequest | null>(null);

  const queryKey = ['area-responsibles', area.id];
  const { data: responsibles = [] } = useQuery({ queryKey, queryFn: () => getResponsiblesByArea(area.id) });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: ['organizational-area', area.id] }); // main supervisor shown elsewhere
    queryClient.invalidateQueries({ queryKey: ['employee-responsibilities'] });
    queryClient.invalidateQueries({ queryKey: ['orgChart'] });
  };
  const onError = (error: any) => toast.error(error.response?.data?.message || 'No se pudo guardar el cambio');

  const add = useMutation({
    mutationFn: () => addResponsible({ employee_id: picked!.id, role: adding!, area_ids: [area.id], shift: shift.trim() || null }),
    onSuccess: () => {
      toast.success(`${personName(picked)} agregado como ${roleLabel(adding!).toLowerCase()}`);
      if (adding === 'supervisor') setPrompt({ employeeId: picked!.id, employeeName: personName(picked), areaIds: [area.id], areaLabel: area.name });
      closeAdd();
      refresh();
    },
    onError,
  });
  const update = useMutation({
    mutationFn: ({ id, ...payload }: { id: string; shift?: string | null; make_primary?: true }) => updateResponsible(id, payload),
    onSuccess: refresh,
    onError,
  });
  const remove = useMutation({
    mutationFn: (r: AreaResponsible) => removeResponsible(r.id),
    onSuccess: refresh,
    onError,
  });

  const closeAdd = () => {
    setAdding(null);
    setPicked(null);
    setShift('');
  };

  return (
    <div>
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
        <Users className="h-5 w-5 text-blue-600" />
        Responsables
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {RESPONSIBLE_ROLES.map(({ role, plural }) => {
          const people = responsibles.filter((r) => r.role === role);
          return (
            <section key={role} className="rounded-lg border border-gray-200 bg-white" aria-label={plural}>
              <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  {ROLE_ICON[role]}
                  {plural}
                </h4>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setAdding(role)}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
                    aria-label={`Agregar ${roleLabel(role).toLowerCase()}`}
                  >
                    <Plus className="h-3.5 w-3.5" /> Agregar
                  </button>
                )}
              </div>
              {people.length === 0 ? (
                <p className="px-4 py-4 text-sm text-gray-500">Sin asignar</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {people.map((r, index) => (
                    <li key={r.id} className="space-y-1 px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <EmployeeAvatar person={r} size={32} />
                        <button
                          type="button"
                          onClick={() => onOpenEmployee?.(r.employee_id)}
                          className="min-w-0 flex-1 text-left text-sm font-semibold text-gray-900 hover:text-blue-700 hover:underline"
                        >
                          {personName(r)}
                        </button>
                        <span className="flex flex-shrink-0 items-center gap-1">
                          {people.length > 1 && index === 0 && (
                            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800" title="El que aparece en los tours">
                              Principal
                            </span>
                          )}
                          {canEdit && people.length > 1 && index > 0 && (
                            <button
                              type="button"
                              onClick={() => update.mutate({ id: r.id, make_primary: true })}
                              className="rounded p-1 text-gray-400 hover:bg-amber-50 hover:text-amber-600"
                              title="Hacer principal (aparece en los tours)"
                              aria-label={`Hacer principal a ${personName(r)}`}
                            >
                              <Star className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => window.confirm(`¿Quitar a ${personName(r)} como ${roleLabel(role).toLowerCase()} de ${area.name}?`) && remove.mutate(r)}
                              className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                              aria-label={`Quitar a ${personName(r)}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </span>
                      </div>
                      {r.position && <p className="text-xs text-gray-600">{r.position}</p>}
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        {canEdit ? (
                          <button
                            type="button"
                            onClick={() => {
                              const value = window.prompt('Turno (vacío para quitarlo)', r.shift || '');
                              if (value !== null && value.trim() !== (r.shift || '')) update.mutate({ id: r.id, shift: value.trim() || null });
                            }}
                            className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-gray-700 hover:bg-gray-200"
                            title="Cambiar turno"
                          >
                            <Clock className="h-3 w-3" />
                            {r.shift || 'Sin turno'}
                          </button>
                        ) : (
                          r.shift && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-gray-700">
                              <Clock className="h-3 w-3" />
                              {r.shift}
                            </span>
                          )
                        )}
                        {!r.works_here && r.works_in && <span className="text-gray-500">Trabaja en {r.works_in}</span>}
                      </div>
                      <div className="flex flex-col gap-0.5 text-xs">
                        {r.email && (
                          <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1 text-blue-700 hover:underline">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{r.email}</span>
                          </a>
                        )}
                        {r.phone && (
                          <a href={phoneHref(r.phone)} className="inline-flex items-center gap-1 text-gray-600 hover:text-blue-700">
                            <Phone className="h-3 w-3" />
                            {formatPhone(r.phone)}
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <Modal
        isOpen={!!adding}
        onClose={closeAdd}
        title={adding ? `Agregar ${roleLabel(adding).toLowerCase()} · ${area.name}` : ''}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeAdd}>
              Cancelar
            </Button>
            <Button onClick={() => add.mutate()} disabled={!picked || add.isPending}>
              Agregar
            </Button>
          </div>
        }
      >
        {picked ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2 text-sm">
              <span>
                <span className="font-semibold text-gray-900">{personName(picked)}</span>
                {picked.position && <span className="text-gray-600"> · {picked.position}</span>}
              </span>
              <button type="button" onClick={() => setPicked(null)} className="text-xs font-medium text-blue-700 hover:underline">
                Cambiar
              </button>
            </div>
            <label className="block text-sm font-medium text-gray-700">
              Turno <span className="font-normal text-gray-500">(opcional)</span>
              <input
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                maxLength={50}
                placeholder="Ej. Turno 1, Nocturno"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </label>
            <p className="text-xs text-gray-500">
              Puede ser responsable de esta área aunque trabaje en otra. Para varias áreas a la vez, usa "Agregar responsabilidad" en su ficha.
            </p>
          </div>
        ) : (
          adding && (
            <EmployeePicker
              organizationId={area.organization_id}
              plantId={area.plant_id}
              excludeIds={responsibles.filter((r) => r.role === adding).map((r) => r.employee_id)}
              onPick={setPicked}
              autoFocus
            />
          )
        )}
      </Modal>

      <ReportsPrompt request={prompt} onDone={() => setPrompt(null)} />
    </div>
  );
};

export default AreaResponsiblesSection;

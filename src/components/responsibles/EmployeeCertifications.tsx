import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Award, BadgeCheck, Plus, X } from 'lucide-react';
import Button from '../ui/Button';
import { useAuthStore } from '../../store/authStore';
import {
  formatDate,
  getCertificationTypes,
  getEmployeeCertifications,
  saveHolders,
  scopeLabel,
  STATUS_CLASSES,
  STATUS_LABELS,
} from '../../api/certifications';

// "Certificaciones" of an employee record: their own (people certifications, which editors can add
// or remove here, one person at a time) and the system ones they are covered by (read only here:
// they are managed in the plant "Certificaciones" tab).

const EDITORS = ['platform_admin', 'org_owner', 'plant_manager'];
const today = () => new Date().toISOString().slice(0, 10);

const STATE = {
  valid: { label: 'Vigente', className: 'bg-green-100 text-green-800' },
  expiring: { label: 'Por vencer', className: 'bg-amber-100 text-amber-800' },
  expired: { label: 'Vencida', className: 'bg-red-100 text-red-800' },
};

const EmployeeCertifications = ({ employeeId, plantId }: { employeeId: string; plantId?: string | null }) => {
  const queryClient = useQueryClient();
  const canEdit = EDITORS.includes(useAuthStore((st) => st.user?.role?.name) || '') && !!plantId;
  const [adding, setAdding] = useState(false);
  const [typeId, setTypeId] = useState('');
  const [obtained, setObtained] = useState(today());
  const { data } = useQuery({ queryKey: ['employee-certifications', employeeId], queryFn: () => getEmployeeCertifications(employeeId) });
  const { data: types = [] } = useQuery({
    queryKey: ['certification-types', plantId, 'person'],
    queryFn: () => getCertificationTypes(plantId!, 'person'),
    enabled: canEdit && adding,
  });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['employee-certifications', employeeId] });
    queryClient.invalidateQueries({ queryKey: ['plant-certifications'] });
    queryClient.invalidateQueries({ queryKey: ['employees'] });
  };
  const save = useMutation({
    mutationFn: ({ type, holds, date }: { type: string; holds: boolean; date?: string | null }) =>
      saveHolders(type, [{ employee_id: employeeId, holds, obtained_date: holds ? date || null : undefined }]),
    onSuccess: (_, { holds }) => {
      toast.success(holds ? 'Certificación asignada' : 'Certificación quitada');
      setAdding(false);
      setTypeId('');
      setObtained(today());
      refresh();
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'No se pudo guardar'),
  });

  if (!data) return null;
  const empty = !data.own.length && !data.inherited.length;
  const available = types.filter((t) => !data.own.some((o) => o.type_id === t.id));
  const chosen = types.find((t) => t.id === typeId);
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-md font-semibold text-gray-900">
          <Award className="h-5 w-5 text-blue-600" />
          Certificaciones
        </h3>
        {canEdit && !adding && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" /> Asignar certificación
          </Button>
        )}
      </div>
      {adding && (
        <div className="mb-3 flex flex-wrap items-end gap-2 rounded-lg border border-blue-200 bg-blue-50/50 p-3 text-sm">
          <label className="min-w-[12rem] flex-1 text-xs font-medium text-gray-700">
            Certificación de personal
            <select value={typeId} onChange={(e) => setTypeId(e.target.value)} className="mt-1 w-full text-sm font-normal" aria-label="Certificación a asignar">
              <option value="">Elige…</option>
              {available.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {t.validity_months ? ` (vigencia ${t.validity_months} meses)` : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-gray-700">
            La obtuvo el
            <input
              type="date"
              value={obtained}
              max={today()}
              onChange={(e) => setObtained(e.target.value)}
              className="mt-1 block rounded-md border border-gray-300 px-2 py-1.5 text-sm font-normal"
              aria-label="Fecha en que la obtuvo"
            />
          </label>
          <Button size="sm" disabled={!typeId || save.isPending} onClick={() => save.mutate({ type: typeId, holds: true, date: obtained })}>
            Asignar
          </Button>
          <Button size="sm" variant="outline" onClick={() => setAdding(false)}>
            Cancelar
          </Button>
          {chosen?.validity_months && obtained && <p className="w-full text-xs text-gray-600">El vencimiento se calcula con la vigencia de {chosen.validity_months} meses.</p>}
          {types.length > 0 && available.length === 0 && <p className="w-full text-xs text-gray-600">Ya tiene todas las certificaciones de personal de la empresa.</p>}
          {types.length === 0 && <p className="w-full text-xs text-gray-600">No hay certificaciones de personal; créalas en la pestaña Certificaciones de la planta.</p>}
        </div>
      )}
      {empty ? (
        <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">Sin certificaciones.</p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 text-sm">
          {data.own.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <span className="flex min-w-0 items-center gap-2">
                <BadgeCheck className="h-4 w-4 flex-shrink-0 text-blue-600" />
                <span className="font-medium text-gray-900">{c.name}</span>
                {c.obtained_date && <span className="text-xs text-gray-500">desde {formatDate(c.obtained_date)}</span>}
              </span>
              <span className="flex items-center gap-2 text-xs">
                {c.expiry_date && <span className="text-gray-500">vence {formatDate(c.expiry_date)}</span>}
                {c.expiry_date && <span className={`rounded-full px-2 py-0.5 font-medium ${STATE[c.state].className}`}>{STATE[c.state].label}</span>}
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => window.confirm(`¿Quitar "${c.name}" a esta persona?`) && save.mutate({ type: c.type_id, holds: false })}
                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    aria-label={`Quitar ${c.name}`}
                    title="Quitar"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </span>
            </li>
          ))}
          {data.inherited.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <span className="flex min-w-0 items-center gap-2">
                <Award className="h-4 w-4 flex-shrink-0 text-amber-500" />
                <span className="font-medium text-gray-900">{c.name}</span>
                <span className="text-xs text-gray-500">por {c.scope === 'organization' ? 'la empresa' : scopeLabel(c).toLowerCase().replace(/^planta/, 'la planta').replace(/^área/, 'el área')}</span>
              </span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[c.effective_status]}`}>{STATUS_LABELS[c.effective_status]}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default EmployeeCertifications;

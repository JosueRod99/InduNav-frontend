import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Award, Loader2, Pencil, Plus, Trash2, UserCheck } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import {
  createCertificationType,
  deleteCertificationType,
  deleteSystemCertification,
  formatDate,
  getAreaCertifications,
  getPlantCertifications,
  scopeLabel,
  STATUS_CLASSES,
  STATUS_LABELS,
  updateCertificationType,
  type PersonCertificationStats,
  type SystemCertification,
} from '../../api/certifications';
import SystemCertificationModal from './SystemCertificationModal';
import HoldersModal from './HoldersModal';
import { useAuthStore } from '../../store/authStore';
import SectionHeader from '../../components/ui/SectionHeader';
import { useCan } from '../../hooks/usePermissions';

// "Certificaciones" tab of a plant (PLAN_LAB_KRAFT.md point 9): system certifications that cover the
// plant (company-wide, plant or area) and people certifications with their holders (checkboxes).

const inputClass = 'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none';

/** Create / edit a people certification (name, issuing body, validity) */
const PersonTypeModal = ({
  plantId,
  type,
  isOpen,
  onClose,
}: {
  plantId: string;
  type: PersonCertificationStats | null;
  isOpen: boolean;
  onClose: (createdId?: string) => void;
}) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [validity, setValidity] = useState('');
  const [lastKey, setLastKey] = useState<string | null>(null);
  const key = `${isOpen}-${type?.id ?? 'new'}`;
  if (isOpen && key !== lastKey) {
    setLastKey(key);
    setName(type?.name || '');
    setBody(type?.issuing_body || '');
    setValidity(type?.validity_months ? String(type.validity_months) : '');
  }
  const save = useMutation({
    mutationFn: () => {
      const payload = { name: name.trim(), issuing_body: body.trim() || null, validity_months: validity ? Number(validity) : null };
      return type ? updateCertificationType(type.id, payload) : createCertificationType(plantId, { kind: 'person', ...payload });
    },
    onSuccess: (saved) => {
      toast.success(type ? 'Certificación guardada' : 'Certificación creada: ahora marca al personal que la tiene');
      queryClient.invalidateQueries({ queryKey: ['plant-certifications'] });
      onClose(type ? undefined : saved.id);
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'No se pudo guardar'),
  });
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => onClose()}
      title={type ? `Editar · ${type.name}` : 'Nueva certificación de personal'}
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onClose()}>
            Cancelar
          </Button>
          <Button onClick={() => save.mutate()} disabled={name.trim().length < 2 || save.isPending}>
            {type ? 'Guardar' : 'Crear y marcar personal'}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Nombre
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={200} placeholder="Ej. Operador de montacargas" className={inputClass} />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Organismo o instructor <span className="font-normal text-gray-400">(opcional)</span>
          <input value={body} onChange={(e) => setBody(e.target.value)} maxLength={200} placeholder="Ej. STPS (DC-3)" className={inputClass} />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Vigencia en meses <span className="font-normal text-gray-400">(opcional)</span>
          <input type="number" min={1} max={600} value={validity} onChange={(e) => setValidity(e.target.value)} placeholder="Ej. 12" className={inputClass} />
          <span className="mt-1 block text-xs font-normal text-gray-500">Con la fecha de cada persona se calcula cuándo le vence.</span>
        </label>
      </div>
    </Modal>
  );
};

type Urgency = 'expired' | 'expiring' | 'ok' | 'other';
type Quick = '' | 'ok' | 'expiring' | 'expired' | 'people';
const URGENCY_ORDER: Record<Urgency, number> = { expired: 0, expiring: 1, other: 2, ok: 3 };

/** Expired, about to expire (within the alert window), valid, or in process / suspended */
const systemUrgency = (c: SystemCertification, alertDays: number): Urgency => {
  if (c.effective_status === 'expired') return 'expired';
  if (c.effective_status !== 'active') return 'other';
  if (c.expiry_date && new Date(`${c.expiry_date.slice(0, 10)}T12:00:00`).getTime() <= Date.now() + alertDays * 864e5) return 'expiring';
  return 'ok';
};
const personUrgency = (t: PersonCertificationStats): Urgency => (t.expired > 0 ? 'expired' : t.expiring > 0 ? 'expiring' : 'ok');
const matches = (u: Urgency, quick: Quick) => !quick || quick === 'people' || u === quick;
const byUrgency = <T,>(rows: T[], urgency: (r: T) => Urgency) =>
  rows.map((r, i) => ({ r, i, u: urgency(r) })).sort((a, b) => URGENCY_ORDER[a.u] - URGENCY_ORDER[b.u] || a.i - b.i);

const Pill = ({ n, tone, label }: { n: number; tone: 'amber' | 'red'; label: string }) =>
  n > 0 ? (
    <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${tone === 'red' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
      {n} {label}
    </span>
  ) : (
    <span className="text-gray-400">—</span>
  );

const thClass = 'px-4 py-2 font-medium';
const iconBtn = 'rounded p-1 text-gray-500 hover:bg-gray-100';

const PlantCertificationsTab = ({ plant, area }: { plant: { id: string; organization_id: string; name?: string }; area?: { id: string; name: string } }) => {
  const queryClient = useQueryClient();
  const can = useCan();
  const canEdit = can('certifications.update');
  // Plant scope: what is of the whole company is read, not changed
  const isPlantScope = useAuthStore((s) => s.user?.role?.scope) === 'plant';
  const [systemModal, setSystemModal] = useState<{ open: boolean; certification: SystemCertification | null }>({ open: false, certification: null });
  const [typeModal, setTypeModal] = useState<{ open: boolean; type: PersonCertificationStats | null }>({ open: false, type: null });
  const [rosterType, setRosterType] = useState<string | null>(null);
  const [quick, setQuick] = useState<Quick>('');

  // Inside an area's page: what covers that area and the certifications of its staff
  const { data, isLoading } = useQuery({
    queryKey: ['plant-certifications', plant.id, area?.id ?? 'plant'],
    queryFn: () => (area ? getAreaCertifications(area.id) : getPlantCertifications(plant.id)),
  });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['plant-certifications'] });
    queryClient.invalidateQueries({ queryKey: ['plant-summary'] });
  };
  const removeSystem = useMutation({ mutationFn: deleteSystemCertification, onSuccess: refresh, onError: (e: any) => toast.error(e.response?.data?.message || 'No se pudo quitar') });
  const removeType = useMutation({ mutationFn: deleteCertificationType, onSuccess: refresh, onError: (e: any) => toast.error(e.response?.data?.message || 'No se pudo eliminar') });

  if (isLoading || !data) {
    return (
      <p className="flex items-center gap-2 text-gray-600">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando certificaciones…
      </p>
    );
  }

  // Most urgent first; the summary cards filter both lists
  const system = byUrgency(data.system, (c) => systemUrgency(c, data.alert_days));
  const person = byUrgency(data.person, personUrgency);
  const count = (u: Urgency) => system.filter((x) => x.u === u).length + person.filter((x) => x.u === u).length;
  const shownSystem = quick === 'people' ? [] : system.filter((x) => matches(x.u, quick));
  const shownPerson = person.filter((x) => (quick === 'people' ? x.u !== 'ok' : matches(x.u, quick)));
  const summary: { key: Quick; label: string; value: number; tone: string }[] = [
    { key: 'ok', label: 'Vigentes', value: count('ok'), tone: 'text-green-700' },
    { key: 'expiring', label: `Por vencer (${data.alert_days} días)`, value: count('expiring'), tone: 'text-amber-700' },
    { key: 'expired', label: 'Vencidas', value: count('expired'), tone: 'text-red-700' },
    { key: 'people', label: area ? 'Personas del área con alertas' : 'Personas con alertas', value: data.people_with_alerts, tone: 'text-red-700' },
  ];
  const filtered = !!quick;
  const emptyFiltered = (
    <p className="px-4 py-6 text-center text-sm text-gray-500">
      Ninguna coincide con el filtro.{' '}
      <button onClick={() => setQuick('')} className="font-medium text-blue-700 hover:underline">
        Ver todas
      </button>
    </p>
  );

  const header = (Icon: typeof Award, iconClass: string, title: string, description: string, onAdd: () => void, addLabel: string, canAdd = canEdit) => (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Icon className={`h-4 w-4 ${iconClass}`} /> {title}
        </h3>
        <p className="mt-0.5 text-xs text-gray-500">{description}</p>
      </div>
      {canAdd && (
        <Button size="sm" className="gap-1.5" onClick={onAdd} aria-label={addLabel}>
          <Plus className="h-4 w-4" /> Agregar
        </Button>
      )}
    </div>
  );

  const systemActions = (c: SystemCertification) =>
    canEdit && !(isPlantScope && c.scope === 'organization') && (
      <span className="flex flex-shrink-0 justify-end" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={() => setSystemModal({ open: true, certification: c })} className={iconBtn} aria-label={`Editar ${c.name}`}>
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => window.confirm(`¿Quitar ${c.name} (${scopeLabel(c)})?`) && removeSystem.mutate(c.id)}
          className="rounded p-1 text-gray-500 hover:bg-red-50 hover:text-red-600"
          aria-label={`Quitar ${c.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </span>
    );

  const personActions = (t: PersonCertificationStats) =>
    canEdit && !isPlantScope && (
      <span className="flex flex-shrink-0 justify-end" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={() => setTypeModal({ open: true, type: t })} className={iconBtn} aria-label={`Editar ${t.name}`}>
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => window.confirm(`¿Eliminar "${t.name}"? Se quita de todo el personal de la empresa.`) && removeType.mutate(t.id)}
          className="rounded p-1 text-gray-500 hover:bg-red-50 hover:text-red-600"
          aria-label={`Eliminar ${t.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </span>
    );

  const status = (c: SystemCertification, u: Urgency) => (
    <span className="flex flex-wrap items-center gap-1">
      <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[c.effective_status]}`}>{STATUS_LABELS[c.effective_status]}</span>
      {u === 'expiring' && <span className="whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Por vencer</span>}
    </span>
  );
  const validity = (t: PersonCertificationStats) => (t.validity_months ? `${t.validity_months} meses` : 'Sin vigencia');

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Certificaciones"
        description={area ? `Las que cubren "${area.name}" y las de su personal.` : 'Normas y sistemas de la empresa y la planta, y las certificaciones de cada persona.'}
      />

      {/* Summary: each card filters both lists */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summary.map(({ key, label, value, tone }) => (
          <button
            key={key}
            onClick={() => setQuick(quick === key ? '' : key)}
            aria-pressed={quick === key}
            className={`rounded-lg border bg-white p-3 text-left transition-colors ${quick === key ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200 hover:border-blue-300'}`}
          >
            <span className={`block text-2xl font-bold ${value ? tone : 'text-gray-400'}`}>{value}</span>
            <span className="text-xs text-gray-600">{label}</span>
          </button>
        ))}
      </div>

      {/* System */}
      <section className="rounded-lg border border-gray-200 bg-white">
        {header(Award, 'text-amber-500', area ? 'Del área, la planta y la empresa' : 'De la empresa y la planta', 'Normas y sistemas (ISO 9001, FSC…). Las de toda la empresa aparecen en la ficha de cada empleado.', () => setSystemModal({ open: true, certification: null }), 'Agregar certificación de la empresa o la planta')}
        {data.system.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-gray-500">Sin certificaciones registradas.</p>
        ) : shownSystem.length === 0 ? (
          quick === 'people' ? <p className="px-4 py-4 text-center text-xs text-gray-500">El filtro "Personas con alertas" solo aplica al personal.</p> : emptyFiltered
        ) : (
          <>
            <table className="hidden min-w-full divide-y divide-gray-100 text-sm md:table">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className={thClass}>Certificación</th>
                  <th className={thClass}>Aplica a</th>
                  <th className={thClass}>Estado</th>
                  <th className={thClass}>Vence</th>
                  <th className={thClass}>Próxima auditoría</th>
                  {canEdit && <th className="px-4 py-2" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {shownSystem.map(({ r: c, u }) => (
                  <tr key={c.id}>
                    <td className="px-4 py-2">
                      <p className="font-medium text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-500">{[c.issuing_body, c.certificate_number && `No. ${c.certificate_number}`].filter(Boolean).join(' · ')}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-gray-700">{scopeLabel(c)}</td>
                    <td className="px-4 py-2">{status(c, u)}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-gray-700">{formatDate(c.expiry_date)}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-gray-700">{formatDate(c.next_audit_date)}</td>
                    {canEdit && <td className="whitespace-nowrap px-4 py-2">{systemActions(c)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="divide-y divide-gray-100 md:hidden">
              {shownSystem.map(({ r: c, u }) => (
                <li key={c.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-500">{[scopeLabel(c), c.issuing_body].filter(Boolean).join(' · ')}</p>
                    </div>
                    {systemActions(c)}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
                    {status(c, u)}
                    <span>Vence {formatDate(c.expiry_date)}</span>
                    {c.next_audit_date && <span>Auditoría {formatDate(c.next_audit_date)}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* People */}
      <section className="rounded-lg border border-gray-200 bg-white">
        {header(UserCheck, 'text-blue-600', 'Del personal', 'Licencias y cursos por persona (montacargas, auditor interno…). Clic en una para ver y marcar al personal.', () => setTypeModal({ open: true, type: null }), 'Agregar certificación de personal', canEdit && !isPlantScope)}
        {data.person.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-gray-500">Sin certificaciones de personal.</p>
        ) : shownPerson.length === 0 ? (
          emptyFiltered
        ) : (
          <>
            <table className="hidden min-w-full divide-y divide-gray-100 text-sm md:table">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className={thClass}>Certificación</th>
                  <th className={thClass}>Personas</th>
                  <th className={thClass}>Por vencer</th>
                  <th className={thClass}>Vencidas</th>
                  <th className={thClass}>Vigencia</th>
                  {canEdit && <th className="px-4 py-2" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {shownPerson.map(({ r: t }) => (
                  <tr
                    key={t.id}
                    onClick={() => setRosterType(t.id)}
                    className="cursor-pointer hover:bg-gray-50"
                    title={canEdit ? 'Ver y marcar personal' : 'Ver personal'}
                  >
                    <td className="px-4 py-2">
                      <p className="font-medium text-gray-900">{t.name}</p>
                      {t.issuing_body && <p className="text-xs text-gray-500">{t.issuing_body}</p>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                      <strong>{t.holders}</strong> persona{t.holders === 1 ? '' : 's'}
                    </td>
                    <td className="px-4 py-2">
                      <Pill n={t.expiring} tone="amber" label="por vencer" />
                    </td>
                    <td className="px-4 py-2">
                      <Pill n={t.expired} tone="red" label={t.expired === 1 ? 'vencida' : 'vencidas'} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-gray-700">{validity(t)}</td>
                    {canEdit && <td className="whitespace-nowrap px-4 py-2">{personActions(t)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="divide-y divide-gray-100 md:hidden">
              {shownPerson.map(({ r: t }) => (
                <li key={t.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <button onClick={() => setRosterType(t.id)} className="min-w-0 text-left">
                      <p className="font-medium text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-500">{[t.issuing_body, validity(t)].filter(Boolean).join(' · ')}</p>
                    </button>
                    {personActions(t)}
                  </div>
                  <button onClick={() => setRosterType(t.id)} className="mt-1.5 flex w-full flex-wrap items-center gap-2 text-left text-xs text-gray-700">
                    <span>
                      <strong>{t.holders}</strong> persona{t.holders === 1 ? '' : 's'}
                    </span>
                    {t.expiring > 0 && <Pill n={t.expiring} tone="amber" label="por vencer" />}
                    {t.expired > 0 && <Pill n={t.expired} tone="red" label={t.expired === 1 ? 'vencida' : 'vencidas'} />}
                    <span className="ml-auto font-medium text-blue-700">{canEdit ? 'Ver y marcar' : 'Ver personal'}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
      {filtered && (
        <p className="text-xs text-gray-500">
          Filtrando por <strong>{summary.find((x) => x.key === quick)?.label}</strong>.{' '}
          <button onClick={() => setQuick('')} className="font-medium text-blue-700 hover:underline">
            Ver todas
          </button>
        </p>
      )}

      <SystemCertificationModal
        isOpen={systemModal.open}
        onClose={() => setSystemModal({ open: false, certification: null })}
        plant={plant}
        certification={systemModal.certification}
        defaultAreaId={area?.id}
      />
      <PersonTypeModal
        plantId={plant.id}
        type={typeModal.type}
        isOpen={typeModal.open}
        onClose={(createdId) => {
          setTypeModal({ open: false, type: null });
          if (createdId) setRosterType(createdId); // straight to the checkboxes
        }}
      />
      <HoldersModal typeId={rosterType} plantId={plant.id} onClose={() => setRosterType(null)} readOnly={!canEdit} initialArea={area?.name} />
    </div>
  );
};

export default PlantCertificationsTab;

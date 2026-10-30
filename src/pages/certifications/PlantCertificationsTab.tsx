import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Award, BadgeCheck, Loader2, Pencil, Plus, Trash2, UserCheck } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import {
  createCertificationType,
  deleteCertificationType,
  deleteSystemCertification,
  formatDate,
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

// "Certificaciones" tab of a plant (PLAN_LAB_KRAFT.md point 9): system certifications that cover the
// plant (company-wide, plant or area) and people certifications with their holders (checkboxes).

const EDITORS = ['platform_admin', 'org_owner', 'plant_manager'];
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

const PlantCertificationsTab = ({ plant }: { plant: { id: string; organization_id: string; name: string } }) => {
  const queryClient = useQueryClient();
  const canEdit = EDITORS.includes(useAuthStore((s) => s.user?.role?.name) || '');
  const [systemModal, setSystemModal] = useState<{ open: boolean; certification: SystemCertification | null }>({ open: false, certification: null });
  const [typeModal, setTypeModal] = useState<{ open: boolean; type: PersonCertificationStats | null }>({ open: false, type: null });
  const [rosterType, setRosterType] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ['plant-certifications', plant.id], queryFn: () => getPlantCertifications(plant.id) });
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

  return (
    <div className="space-y-6">
      <SectionHeader title="Certificaciones" description="Normas y sistemas de la empresa y la planta, y las certificaciones de cada persona." />

      {/* System */}
      <section className="rounded-lg border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Award className="h-4 w-4 text-amber-500" /> De la empresa y la planta
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">Normas y sistemas (ISO 9001, FSC…). Las de toda la empresa aparecen en la ficha de cada empleado.</p>
          </div>
          {canEdit && (
            <Button size="sm" className="gap-1.5" onClick={() => setSystemModal({ open: true, certification: null })}>
              <Plus className="h-4 w-4" /> Agregar
            </Button>
          )}
        </div>
        {data.system.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-gray-500">Sin certificaciones registradas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Certificación</th>
                  <th className="px-4 py-2 font-medium">Aplica a</th>
                  <th className="px-4 py-2 font-medium">Estado</th>
                  <th className="px-4 py-2 font-medium">Vence</th>
                  <th className="px-4 py-2 font-medium">Próxima auditoría</th>
                  {canEdit && <th className="px-4 py-2" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.system.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-2">
                      <p className="font-medium text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-500">{[c.issuing_body, c.certificate_number && `No. ${c.certificate_number}`].filter(Boolean).join(' · ')}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-gray-700">{scopeLabel(c)}</td>
                    <td className="px-4 py-2">
                      <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[c.effective_status]}`}>{STATUS_LABELS[c.effective_status]}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-gray-700">{formatDate(c.expiry_date)}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-gray-700">{formatDate(c.next_audit_date)}</td>
                    {canEdit && (
                      <td className="whitespace-nowrap px-4 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => setSystemModal({ open: true, certification: c })}
                          className="rounded p-1 text-gray-500 hover:bg-gray-100"
                          aria-label={`Editar ${c.name}`}
                        >
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
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* People */}
      <section className="rounded-lg border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <UserCheck className="h-4 w-4 text-blue-600" /> Del personal
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">Licencias y cursos por persona (montacargas, auditor interno…). Se marcan con casillas.</p>
          </div>
          {canEdit && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setTypeModal({ open: true, type: null })}>
              <Plus className="h-4 w-4" /> Nueva certificación de personal
            </Button>
          )}
        </div>
        {data.person.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-gray-500">Sin certificaciones de personal.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
            {data.person.map((t) => (
              <li key={t.id} className="rounded-lg border border-gray-200 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 font-medium text-gray-900">
                      <BadgeCheck className="h-4 w-4 flex-shrink-0 text-blue-600" />
                      <span className="truncate">{t.name}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {[t.issuing_body, t.validity_months && `Vigencia ${t.validity_months} meses`].filter(Boolean).join(' · ') || 'Sin vigencia definida'}
                    </p>
                  </div>
                  {canEdit && (
                    <span className="flex flex-shrink-0">
                      <button type="button" onClick={() => setTypeModal({ open: true, type: t })} className="rounded p-1 text-gray-400 hover:bg-gray-100" aria-label={`Editar ${t.name}`}>
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => window.confirm(`¿Eliminar "${t.name}"? Se quita de todo el personal de la empresa.`) && removeType.mutate(t.id)}
                        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        aria-label={`Eliminar ${t.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-700">
                  <strong>{t.holders}</strong> persona{t.holders === 1 ? '' : 's'} en esta planta
                  {t.expiring > 0 && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">{t.expiring} por vencer</span>}
                  {t.expired > 0 && <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">{t.expired} vencidas</span>}
                </p>
                <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => setRosterType(t.id)}>
                  {canEdit ? 'Ver y marcar personal' : 'Ver personal'}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <SystemCertificationModal
        isOpen={systemModal.open}
        onClose={() => setSystemModal({ open: false, certification: null })}
        plant={plant}
        certification={systemModal.certification}
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
      <HoldersModal typeId={rosterType} plantId={plant.id} onClose={() => setRosterType(null)} readOnly={!canEdit} />
    </div>
  );
};

export default PlantCertificationsTab;

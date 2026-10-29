import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import {
  createCertificationType,
  createSystemCertification,
  getCertificationTypes,
  STATUS_LABELS,
  updateSystemCertification,
  type CertificationScope,
  type CertificationStatus,
  type SystemCertification,
} from '../../api/certifications';
import { getAreas } from '../../api/areas';
import { getEmployees } from '../../api/employees';
import { personName } from '../../utils/personName';

// System certification (ISO 9001, FSC…): which one, what it covers (whole company, this plant or
// an area), status, certificate number, dates and responsible person.

const inputClass = 'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30';
const NEW_TYPE = '__new__';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  plant: { id: string; organization_id: string; name: string };
  certification?: SystemCertification | null;
}

const SystemCertificationModal = ({ isOpen, onClose, plant, certification }: Props) => {
  const queryClient = useQueryClient();
  const [typeId, setTypeId] = useState('');
  const [newName, setNewName] = useState('');
  const [newBody, setNewBody] = useState('');
  const [scope, setScope] = useState<CertificationScope>('organization');
  const [areaId, setAreaId] = useState('');
  const [status, setStatus] = useState<CertificationStatus>('active');
  const [number, setNumber] = useState('');
  const [issue, setIssue] = useState('');
  const [expiry, setExpiry] = useState('');
  const [audit, setAudit] = useState('');
  const [responsible, setResponsible] = useState('');
  const [notes, setNotes] = useState('');

  const { data: types = [] } = useQuery({ queryKey: ['certification-types', plant.id, 'system'], queryFn: () => getCertificationTypes(plant.id, 'system'), enabled: isOpen });
  const { data: areasData } = useQuery({ queryKey: ['areas', plant.id, 'all'], queryFn: () => getAreas({ plant_id: plant.id, limit: 500 }), enabled: isOpen });
  const { data: people } = useQuery({
    queryKey: ['employees-for-process', plant.organization_id],
    queryFn: () => getEmployees({ organization_id: plant.organization_id, is_active: true, limit: 500 }),
    enabled: isOpen,
  });

  useEffect(() => {
    if (!isOpen) return;
    setTypeId(certification?.type_id || '');
    setNewName('');
    setNewBody('');
    setScope(certification?.scope || 'organization');
    setAreaId(certification?.area_id || '');
    setStatus(certification?.status || 'active');
    setNumber(certification?.certificate_number || '');
    setIssue(certification?.issue_date?.slice(0, 10) || '');
    setExpiry(certification?.expiry_date?.slice(0, 10) || '');
    setAudit(certification?.next_audit_date?.slice(0, 10) || '');
    setResponsible(certification?.responsible_employee_id || '');
    setNotes(certification?.notes || '');
  }, [isOpen, certification]);
  // First time: no type yet → offer to create one
  useEffect(() => {
    if (isOpen && !certification && !typeId && types.length === 0) setTypeId(NEW_TYPE);
  }, [isOpen, certification, typeId, types.length]);

  const save = useMutation({
    mutationFn: async () => {
      let id = typeId;
      if (typeId === NEW_TYPE) {
        id = (await createCertificationType(plant.id, { kind: 'system', name: newName.trim(), issuing_body: newBody.trim() || null })).id;
      }
      const payload = {
        type_id: id,
        scope,
        plant_id: plant.id,
        area_id: scope === 'area' ? areaId : null,
        status,
        certificate_number: number.trim() || null,
        issue_date: issue || null,
        expiry_date: expiry || null,
        next_audit_date: audit || null,
        responsible_employee_id: responsible || null,
        notes: notes.trim() || null,
      };
      return certification ? updateSystemCertification(certification.id, payload) : createSystemCertification(payload);
    },
    onSuccess: () => {
      toast.success(certification ? 'Certificación guardada' : 'Certificación agregada');
      queryClient.invalidateQueries({ queryKey: ['plant-certifications'] });
      queryClient.invalidateQueries({ queryKey: ['certification-types'] });
      queryClient.invalidateQueries({ queryKey: ['plant-summary'] });
      onClose();
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'No se pudo guardar la certificación'),
  });

  const valid =
    (typeId === NEW_TYPE ? newName.trim().length >= 2 : !!typeId) && (scope !== 'area' || !!areaId) && (!expiry || !issue || expiry >= issue);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={certification ? `Editar certificación · ${certification.name}` : 'Nueva certificación de la empresa o planta'}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={save.isPending}>
            Cancelar
          </Button>
          <Button onClick={() => save.mutate()} disabled={!valid || save.isPending} className="gap-1.5">
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Certificación
          <select value={typeId} onChange={(e) => setTypeId(e.target.value)} className={inputClass}>
            <option value="" disabled>
              Elige una certificación
            </option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.issuing_body ? ` · ${t.issuing_body}` : ''}
              </option>
            ))}
            <option value={NEW_TYPE}>+ Nueva certificación…</option>
          </select>
        </label>
        {typeId === NEW_TYPE && (
          <div className="grid grid-cols-1 gap-3 rounded-lg bg-gray-50 p-3 sm:grid-cols-2">
            <label className="block text-sm font-medium text-gray-700">
              Nombre
              <input value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={200} placeholder="Ej. ISO 9001:2015" className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Organismo que la emite <span className="font-normal text-gray-400">(opcional)</span>
              <input value={newBody} onChange={(e) => setNewBody(e.target.value)} maxLength={200} placeholder="Ej. Bureau Veritas" className={inputClass} />
            </label>
          </div>
        )}

        <fieldset>
          <legend className="text-sm font-medium text-gray-700">Aplica a</legend>
          <div className="mt-1 flex flex-wrap gap-4 text-sm">
            {(
              [
                ['organization', 'Toda la empresa'],
                ['plant', `Esta planta (${plant.name})`],
                ['area', 'Un área'],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="flex items-center gap-1.5">
                <input type="radio" name="scope" checked={scope === value} onChange={() => setScope(value)} />
                {label}
              </label>
            ))}
          </div>
          {scope === 'organization' && <p className="mt-1 text-xs text-gray-500">Aparece en todas las plantas y en la ficha de cada empleado.</p>}
          {scope === 'area' && (
            <select value={areaId} onChange={(e) => setAreaId(e.target.value)} aria-label="Área" className={inputClass}>
              <option value="">Elige el área</option>
              {(areasData?.areas || []).map((a) => (
                <option key={a.id} value={a.id}>
                  {'· '.repeat(Math.max(0, (a.hierarchy_level || 1) - 1))}
                  {a.name}
                </option>
              ))}
            </select>
          )}
        </fieldset>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium text-gray-700">
            Estado
            <select value={status} onChange={(e) => setStatus(e.target.value as CertificationStatus)} className={inputClass}>
              {(Object.keys(STATUS_LABELS) as CertificationStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                  {s === 'in_progress' ? ' (objetivo, aún no se obtiene)' : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Número de certificado <span className="font-normal text-gray-400">(opcional)</span>
            <input value={number} onChange={(e) => setNumber(e.target.value)} maxLength={100} className={inputClass} />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Fecha de emisión
            <input type="date" value={issue} onChange={(e) => setIssue(e.target.value)} className={inputClass} />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Vencimiento
            <input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} className={inputClass} />
            {expiry && issue && expiry < issue && <span className="mt-1 block text-xs text-red-600">Debe ser posterior a la emisión</span>}
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Próxima auditoría
            <input type="date" value={audit} onChange={(e) => setAudit(e.target.value)} className={inputClass} />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Responsable <span className="font-normal text-gray-400">(opcional)</span>
            <select value={responsible} onChange={(e) => setResponsible(e.target.value)} className={inputClass}>
              <option value="">Sin asignar</option>
              {(people?.employees || []).map((p) => (
                <option key={p.id} value={p.id}>
                  {personName(p)}
                  {p.position ? ` · ${p.position}` : ''}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block text-sm font-medium text-gray-700">
          Notas <span className="font-normal text-gray-400">(opcional)</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={2000} className={inputClass} />
        </label>
      </div>
    </Modal>
  );
};

export default SystemCertificationModal;

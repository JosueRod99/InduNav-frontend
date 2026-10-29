import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Loader2, Network } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { assignReports, getUnmanaged } from '../../api/areaResponsibles';
import { personName } from '../../utils/personName';

// After someone becomes supervisor of areas: if people working there have no manager yet, ask
// whether they should report to that person (fills the org chart). Never changes an existing manager.

export interface ReportsPromptRequest {
  employeeId: string;
  employeeName: string;
  areaIds: string[];
  areaLabel: string; // "Línea 1" or "3 áreas"
}

const ReportsPrompt = ({ request, onDone }: { request: ReportsPromptRequest | null; onDone: () => void }) => {
  const queryClient = useQueryClient();
  const [people, setPeople] = useState<Awaited<ReturnType<typeof getUnmanaged>> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPeople(null);
    if (!request) return;
    getUnmanaged(request.employeeId, request.areaIds)
      .then((list) => (list.length ? setPeople(list) : onDone()))
      .catch(() => onDone());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);

  if (!request || !people) return null;

  const confirm = async () => {
    setSaving(true);
    try {
      const { updated } = await assignReports(request.employeeId, request.areaIds);
      toast.success(`${updated} persona${updated === 1 ? '' : 's'} ahora reporta${updated === 1 ? '' : 'n'} a ${request.employeeName}`);
      queryClient.invalidateQueries({ queryKey: ['orgChart'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'No se pudo actualizar el organigrama');
    } finally {
      setSaving(false);
      onDone();
    }
  };

  const shown = people.slice(0, 6);
  return (
    <Modal
      isOpen
      onClose={onDone}
      title="¿Actualizar el organigrama?"
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onDone} disabled={saving}>
            No, dejarlo así
          </Button>
          <Button onClick={confirm} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Network className="h-4 w-4" />}
            Sí, que le reporten
          </Button>
        </div>
      }
    >
      <p className="text-sm text-gray-700">
        En {request.areaLabel} hay <strong>{people.length}</strong> persona{people.length === 1 ? '' : 's'} sin jefe directo. ¿Quieres que le
        reporte{people.length === 1 ? '' : 'n'} a <strong>{request.employeeName}</strong>?
      </p>
      <ul className="mt-3 space-y-1 text-sm text-gray-600">
        {shown.map((p) => (
          <li key={p.id}>· {personName(p)}</li>
        ))}
        {people.length > shown.length && <li>· y {people.length - shown.length} más</li>}
      </ul>
      <p className="mt-3 text-xs text-gray-500">Quien ya tiene jefe directo no cambia.</p>
    </Modal>
  );
};

export default ReportsPrompt;

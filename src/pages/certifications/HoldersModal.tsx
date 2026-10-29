import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Loader2, Search } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { formatDate, getRoster, saveHolders, type RosterRow } from '../../api/certifications';
import { personName } from '../../utils/personName';

// People certification: the plant's employees with a checkbox each (who holds it) and an optional
// date. The expiry is computed from the certification's validity. Changes are saved together.

interface Draft {
  holds: boolean;
  obtained_date: string;
}

const HoldersModal = ({ typeId, plantId, onClose, readOnly = false }: { typeId: string | null; plantId: string; onClose: () => void; readOnly?: boolean }) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [area, setArea] = useState('');
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});

  const { data, isLoading } = useQuery({ queryKey: ['cert-roster', typeId, plantId], queryFn: () => getRoster(typeId!, plantId), enabled: !!typeId });
  useEffect(() => setDrafts({}), [typeId]);

  const rows = data?.data || [];
  const areas = useMemo(() => [...new Set(rows.map((r) => r.area_name).filter(Boolean) as string[])].sort(), [rows]);
  const current = (row: RosterRow): Draft => drafts[row.employee_id] || { holds: row.holds, obtained_date: row.obtained_date?.slice(0, 10) || '' };
  const changed = rows.filter((row) => {
    const d = drafts[row.employee_id];
    return d && (d.holds !== row.holds || (d.holds && d.obtained_date !== (row.obtained_date?.slice(0, 10) || '')));
  });
  const visible = rows.filter((row) => {
    const text = `${personName(row)} ${row.position || ''}`.toLowerCase();
    return (!search || text.includes(search.toLowerCase())) && (!area || row.area_name === area);
  });
  const holdersCount = rows.filter((row) => current(row).holds).length;
  const setDraft = (row: RosterRow, patch: Partial<Draft>) => setDrafts((d) => ({ ...d, [row.employee_id]: { ...current(row), ...patch } }));

  const save = useMutation({
    mutationFn: () =>
      saveHolders(
        typeId!,
        changed.map((row) => ({ employee_id: row.employee_id, holds: drafts[row.employee_id].holds, obtained_date: drafts[row.employee_id].obtained_date || null }))
      ),
    onSuccess: () => {
      toast.success(`${changed.length} cambio${changed.length === 1 ? '' : 's'} guardado${changed.length === 1 ? '' : 's'}`);
      queryClient.invalidateQueries({ queryKey: ['cert-roster', typeId] });
      queryClient.invalidateQueries({ queryKey: ['plant-certifications'] });
      queryClient.invalidateQueries({ queryKey: ['employee-certifications'] });
      queryClient.invalidateQueries({ queryKey: ['plant-summary'] });
      setDrafts({});
      onClose();
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'No se pudo guardar'),
  });

  const type = data?.type;
  const allVisibleChecked = visible.length > 0 && visible.every((row) => current(row).holds);

  return (
    <Modal
      isOpen={!!typeId}
      onClose={onClose}
      title={type ? `Personal con ${type.name}` : 'Personal certificado'}
      size="xl"
      footer={
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <span className="mr-auto text-sm text-gray-600">
            {holdersCount} persona{holdersCount === 1 ? '' : 's'} con la certificación
            {changed.length > 0 && <span className="text-amber-700"> · {changed.length} cambio{changed.length === 1 ? '' : 's'} sin guardar</span>}
          </span>
          <Button variant="outline" onClick={onClose} disabled={save.isPending}>
            Cancelar
          </Button>
          {!readOnly && (
            <Button onClick={() => save.mutate()} disabled={!changed.length || save.isPending} className="gap-1.5">
              {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar cambios
            </Button>
          )}
        </div>
      }
    >
      {isLoading || !type ? (
        <p className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando personal…
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-600">
            Marca a quien tiene la certificación. La fecha es opcional
            {type.validity_months ? `; con ella se calcula el vencimiento (vigencia de ${type.validity_months} meses).` : '.'}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative min-w-[12rem] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o puesto"
                aria-label="Buscar empleado"
                className="w-full rounded-md border border-gray-300 py-1.5 pl-9 pr-3 text-sm"
              />
            </label>
            <select value={area} onChange={(e) => setArea(e.target.value)} aria-label="Filtrar por área" className="rounded-md border border-gray-300 px-3 py-1.5 text-sm">
              <option value="">Todas las áreas</option>
              {areas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <label className={`flex items-center gap-1.5 text-sm text-gray-700 ${readOnly ? 'hidden' : ''}`}>
              <input
                type="checkbox"
                checked={allVisibleChecked}
                onChange={(e) => visible.forEach((row) => setDraft(row, { holds: e.target.checked }))}
                className="rounded border-gray-300"
              />
              Marcar los {visible.length} mostrados
            </label>
          </div>
          <div className="max-h-[55vh] overflow-y-auto rounded-lg border border-gray-200">
            <ul className="divide-y divide-gray-100">
              {visible.map((row) => {
                const d = current(row);
                const name = personName(row);
                return (
                  <li key={row.employee_id} className={`flex flex-wrap items-center gap-3 px-3 py-2 text-sm ${d.holds ? 'bg-green-50/40' : ''}`}>
                    <label className="flex min-w-0 flex-1 items-center gap-3">
                      <input
                        type="checkbox"
                        checked={d.holds}
                        disabled={readOnly}
                        onChange={(e) => setDraft(row, { holds: e.target.checked })}
                        aria-label={name}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-gray-900">{name}</span>
                        <span className="block truncate text-xs text-gray-500">{[row.position, row.area_name].filter(Boolean).join(' · ') || 'Sin puesto'}</span>
                      </span>
                    </label>
                    {d.holds && (
                      <span className="flex items-center gap-2">
                        <input
                          type="date"
                          value={d.obtained_date}
                          disabled={readOnly}
                          onChange={(e) => setDraft(row, { obtained_date: e.target.value })}
                          aria-label={`Fecha en que ${name} la obtuvo`}
                          className="rounded-md border border-gray-300 px-2 py-1 text-xs"
                        />
                        {!drafts[row.employee_id] && row.expiry_date && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              row.state === 'expired' ? 'bg-red-100 text-red-800' : row.state === 'expiring' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {row.state === 'expired' ? 'Venció' : 'Vence'} {formatDate(row.expiry_date)}
                          </span>
                        )}
                      </span>
                    )}
                  </li>
                );
              })}
              {visible.length === 0 && <li className="px-3 py-6 text-center text-sm text-gray-500">Sin empleados que coincidan.</li>}
            </ul>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default HoldersModal;

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Trash2, UsersRound } from 'lucide-react';
import Button from '../ui/Button';
import { addHeadcount, getHeadcount, removeHeadcount, updateHeadcount, type HeadcountRow } from '../../api/areaHeadcount';
import { useAuthStore } from '../../store/authStore';

// "Plantilla" of an area: people counted by position, without names ("Montacarguista · 5").
// With high turnover only the number changes. The area's total = named people + this.

const EDITORS = ['platform_admin', 'org_owner', 'plant_manager'];

const AreaHeadcountSection = ({ areaId, namedCount }: { areaId: string; namedCount: number }) => {
  const queryClient = useQueryClient();
  const canEdit = EDITORS.includes(useAuthStore((s) => s.user?.role?.name) || '');
  const [position, setPosition] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [shift, setShift] = useState('');

  const queryKey = ['area-headcount', areaId];
  const { data: rows = [] } = useQuery({ queryKey, queryFn: () => getHeadcount(areaId) });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: ['orgChart'] });
    queryClient.invalidateQueries({ queryKey: ['plant-summary'] });
  };
  const onError = (error: any) => toast.error(error.response?.data?.message || 'No se pudo guardar');

  const add = useMutation({
    mutationFn: () => addHeadcount({ area_id: areaId, position: position.trim(), quantity: Number(quantity), shift: shift.trim() || null }),
    onSuccess: () => {
      setPosition('');
      setQuantity('1');
      setShift('');
      refresh();
    },
    onError,
  });
  const update = useMutation({
    mutationFn: ({ id, ...payload }: { id: string; quantity?: number; position?: string; shift?: string | null }) => updateHeadcount(id, payload),
    onSuccess: refresh,
    onError,
  });
  const remove = useMutation({ mutationFn: (row: HeadcountRow) => removeHeadcount(row.id), onSuccess: refresh, onError });

  const counted = rows.reduce((sum, r) => sum + r.quantity, 0);
  const validNew = position.trim().length >= 2 && Number(quantity) >= 1;

  return (
    <section className="rounded-lg border border-gray-200 bg-white" aria-label="Plantilla del área">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-gray-100 px-4 py-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <UsersRound className="h-4 w-4 text-blue-600" />
            Plantilla (personal sin nombre)
          </h3>
          <p className="mt-0.5 text-xs text-gray-500">Puestos con su número de personas, para quien no se registra por nombre.</p>
        </div>
        <p className="text-sm text-gray-700" aria-label="Total de personas">
          {namedCount} con nombre + {counted} en plantilla = <strong>{namedCount + counted} personas</strong>
        </p>
      </div>

      {rows.length > 0 && (
        <ul className="divide-y divide-gray-100">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center gap-3 px-4 py-2 text-sm">
              <span className="min-w-0 flex-1">
                <span className="font-medium text-gray-900">{row.position}</span>
                {row.shift && <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{row.shift}</span>}
              </span>
              {canEdit ? (
                <input
                  type="number"
                  min={1}
                  max={10000}
                  defaultValue={row.quantity}
                  aria-label={`Personas en ${row.position}`}
                  onBlur={(e) => {
                    const value = Number(e.target.value);
                    if (value >= 1 && value !== row.quantity) update.mutate({ id: row.id, quantity: value });
                    else e.target.value = String(row.quantity);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                  className="w-20 rounded-md border border-gray-300 px-2 py-1 text-right text-sm"
                />
              ) : (
                <span className="font-semibold text-gray-900">{row.quantity}</span>
              )}
              <span className="text-xs text-gray-500">persona{row.quantity === 1 ? '' : 's'}</span>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => window.confirm(`¿Quitar "${row.position}" de la plantilla?`) && remove.mutate(row)}
                  className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  aria-label={`Quitar ${row.position}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {rows.length === 0 && !canEdit && <p className="px-4 py-3 text-sm text-gray-500">Sin plantilla registrada.</p>}

      {canEdit && (
        <form
          className="flex flex-wrap items-end gap-2 border-t border-gray-100 bg-gray-50/60 px-4 py-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (validNew) add.mutate();
          }}
        >
          <label className="min-w-[12rem] flex-1 text-xs font-medium text-gray-600">
            Puesto
            <input
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              maxLength={150}
              placeholder="Ej. Ayudante general"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            />
          </label>
          <label className="w-24 text-xs font-medium text-gray-600">
            Personas
            <input
              type="number"
              min={1}
              max={10000}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-right text-sm"
            />
          </label>
          <label className="w-36 text-xs font-medium text-gray-600">
            Turno <span className="font-normal text-gray-400">(opcional)</span>
            <input
              value={shift}
              onChange={(e) => setShift(e.target.value)}
              maxLength={50}
              placeholder="Ej. Turno 1"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            />
          </label>
          <Button type="submit" size="sm" className="gap-1.5" disabled={!validNew || add.isPending}>
            <Plus className="h-4 w-4" /> Agregar puesto
          </Button>
        </form>
      )}
    </section>
  );
};

export default AreaHeadcountSection;

import { useQuery } from '@tanstack/react-query';
import { ExternalLink, LayoutGrid, PenTool, Plus, Trash2, UserRound, Users, Wrench, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AreaPhysicalRepresentation } from '../../api/areaRepresentations';
import { getArea } from '../../api/areas';
import { getAreaEquipment } from '../../api/equipment';
import { areaTypeLabel } from '../../constants/areaTypes';
import { floorLabel } from '../../utils/floors';

// Selected area of the plant layout: quick facts and every action in one place, at the top of the
// side panel. Areas with several zones list them; the chosen zone is the one edited or deleted.

interface Props {
  rep: AreaPhysicalRepresentation;
  zoneIndex: number;
  zoneCount: number;
  otherFloors: number[];
  canEdit: boolean;
  backState?: unknown;
  onSelectZone: (index: number) => void;
  onGoToFloor: (floor: number) => void;
  onOpenInternal: () => void;
  onEditZone: () => void;
  onAddZone: () => void;
  onDeleteZone: () => void;
  onRemove: () => void;
  onClose: () => void;
}

const actionClass =
  'inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:border-blue-400 hover:text-blue-700';

const SelectedAreaPanel = ({
  rep,
  zoneIndex,
  zoneCount,
  otherFloors,
  canEdit,
  backState,
  onSelectZone,
  onGoToFloor,
  onOpenInternal,
  onEditZone,
  onAddZone,
  onDeleteZone,
  onRemove,
  onClose,
}: Props) => {
  const areaId = rep.organizational_area_id;
  const { data: area } = useQuery({ queryKey: ['organizational-area', areaId, 'relations'], queryFn: () => getArea(areaId, true) });
  const { data: equipment } = useQuery({ queryKey: ['area-equipment', areaId], queryFn: () => getAreaEquipment(areaId) });
  const name = rep.display_name || rep.organizational_area?.name || 'Área';
  const color = rep.display_color || rep.organizational_area?.color || '#3B82F6';
  const people = (area as { employee_count?: number } | undefined)?.employee_count;
  const supervisor = (area as { supervisor_name?: string | null } | undefined)?.supervisor_name;

  return (
    <section aria-label={`Área seleccionada: ${name}`} className="rounded-lg border border-blue-200 bg-blue-50/60 p-3">
      <div className="flex items-start gap-2">
        <span className="mt-1 h-3 w-3 flex-shrink-0 rounded-sm" style={{ backgroundColor: color }} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">{name}</p>
          <p className="text-xs text-gray-600">
            {[rep.organizational_area?.code, areaTypeLabel(rep.organizational_area?.area_type)].filter(Boolean).join(' · ')}
          </p>
        </div>
        <button onClick={onClose} className="rounded p-0.5 text-gray-400 hover:text-gray-700" aria-label="Cerrar selección">
          <X className="h-4 w-4" />
        </button>
      </div>

      <ul className="mt-2 space-y-1 text-xs text-gray-700">
        <li className="flex items-center gap-1.5">
          <UserRound className="h-3.5 w-3.5 text-gray-400" />
          {supervisor ? supervisor : <span className="text-amber-700">Sin supervisor</span>}
        </li>
        <li className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-gray-400" /> {people ?? '…'} persona{people === 1 ? '' : 's'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Wrench className="h-3.5 w-3.5 text-gray-400" /> {equipment ? equipment.length : '…'} equipo{equipment?.length === 1 ? '' : 's'}
          </span>
        </li>
      </ul>

      {zoneCount > 1 && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-medium text-gray-700">Zonas (clic en el plano o aquí)</p>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Zonas del área">
            {Array.from({ length: zoneCount }, (_, i) => (
              <button
                key={i}
                onClick={() => onSelectZone(i)}
                aria-pressed={i === zoneIndex}
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                  i === zoneIndex ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400'
                }`}
              >
                Zona {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {otherFloors.length > 0 && (
        <p className="mt-2 flex flex-wrap items-center gap-1 text-xs text-gray-600">
          También en:
          {otherFloors.map((level) => (
            <button key={level} onClick={() => onGoToFloor(level)} className="rounded-full bg-white px-2 py-0.5 font-medium text-blue-700 ring-1 ring-blue-200 hover:bg-blue-50">
              {floorLabel(level)}
            </button>
          ))}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        <button onClick={onOpenInternal} className={actionClass}>
          <LayoutGrid className="h-3.5 w-3.5" /> Layout interno
        </button>
        <Link to={`/areas/${areaId}`} state={backState} className={actionClass}>
          <ExternalLink className="h-3.5 w-3.5" /> Ver área
        </Link>
        {canEdit && (
          <>
            <button onClick={onEditZone} className={actionClass}>
              <PenTool className="h-3.5 w-3.5" /> {zoneCount > 1 ? `Editar zona ${zoneIndex + 1}` : 'Editar forma'}
            </button>
            <button onClick={onAddZone} className={actionClass}>
              <Plus className="h-3.5 w-3.5" /> Agregar zona
            </button>
            {zoneCount > 1 && (
              <button onClick={onDeleteZone} className={`${actionClass} text-red-700 hover:border-red-400 hover:text-red-800`}>
                <Trash2 className="h-3.5 w-3.5" /> Eliminar zona {zoneIndex + 1}
              </button>
            )}
            <button onClick={onRemove} className={`${actionClass} text-red-700 hover:border-red-400 hover:text-red-800`}>
              <Trash2 className="h-3.5 w-3.5" /> Quitar del plano
            </button>
          </>
        )}
      </div>
    </section>
  );
};

export default SelectedAreaPanel;

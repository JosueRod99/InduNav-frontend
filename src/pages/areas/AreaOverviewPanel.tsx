import { Link } from 'react-router-dom';
import {
  BadgeAlert,
  ChevronRight,
  ExternalLink,
  FileText,
  GitBranch,
  Layers,
  LayoutGrid,
  Map,
  Package,
  Pencil,
  PenTool,
  Plus,
  Trash2,
  UserRound,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import type { AreaOverview } from '../../api/areas';
import { areaTypeLabel } from '../../constants/areaTypes';
import { floorLabel } from '../../utils/floors';
import { descendantsOf } from './PlantAreaTree';

// Side panel of the "Áreas" tab (a bottom sheet on phones): the actions first, then real figures
// that open the matching tab of the area, the supervisor and where the area is drawn.

interface Props {
  area: AreaOverview;
  areas: AreaOverview[]; // for the path and the "inside <area>" drawings
  plantId: string;
  backState?: unknown;
  onSelect: (area: AreaOverview) => void;
  onEdit: () => void;
  onAddChild: () => void;
  onDelete: () => void;
  onClose: () => void;
  onMove?: (parentId: string | null) => void; // keyboard alternative to dragging in the tree
}

const Stat = ({ to, Icon, label, value, detail, alert, backState }: {
  to: string;
  Icon: typeof Users;
  label: string;
  value: number;
  detail?: string | null;
  alert?: boolean;
  backState?: unknown;
}) => (
  <Link
    to={to}
    state={backState}
    className={`rounded-md border px-2.5 py-2 transition-colors hover:border-blue-300 hover:bg-blue-50/50 ${alert ? 'border-red-200 bg-red-50/40' : 'border-gray-200 bg-white'}`}
  >
    <span className="flex items-center gap-1.5 text-xs text-gray-600">
      <Icon className={`h-3.5 w-3.5 ${alert ? 'text-red-600' : 'text-gray-400'}`} />
      {label}
    </span>
    <span className="block text-lg font-bold leading-tight text-gray-900">{value}</span>
    {detail && <span className={`block text-[11px] ${alert ? 'text-red-700' : 'text-gray-500'}`}>{detail}</span>}
  </Link>
);

const AreaOverviewPanel = ({ area, areas, plantId, backState, onSelect, onEdit, onAddChild, onDelete, onClose, onMove }: Props) => {
  const byId = new globalThis.Map(areas.map((a) => [a.id, a]));
  const path: AreaOverview[] = [];
  for (let node = area.parent_area_id ? byId.get(area.parent_area_id) : undefined; node; node = node.parent_area_id ? byId.get(node.parent_area_id) : undefined) {
    path.unshift(node);
  }
  const tab = (name: string) => `/areas/${area.id}?tab=${name}`;
  const certAlerts = area.certification_alerts + area.people_certification_alerts;
  const onPlant = area.drawn.filter((d) => !d.inside_area_id);
  const insideOthers = area.drawn.filter((d) => d.inside_area_id);
  const people = area.employees + area.headcount;

  return (
    <div className="space-y-4">
      {/* Path, name and actions */}
      <div>
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            {path.length > 0 && (
              <nav aria-label="Ruta del área" className="mb-1 flex flex-wrap items-center gap-0.5 text-xs text-gray-500">
                {path.map((p) => (
                  <span key={p.id} className="inline-flex items-center gap-0.5">
                    <button onClick={() => onSelect(p)} className="hover:text-blue-700 hover:underline">
                      {p.name}
                    </button>
                    <ChevronRight className="h-3 w-3" />
                  </span>
                ))}
              </nav>
            )}
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <span className="h-3.5 w-3.5 flex-shrink-0 rounded-full" style={{ backgroundColor: area.color || '#94A3B8' }} />
              <span className="truncate">{area.name}</span>
            </h3>
            <p className="text-xs text-gray-600">{[area.code, areaTypeLabel(area.area_type)].filter(Boolean).join(' · ')}</p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-0.5">
            <button onClick={onDelete} title="Eliminar área" aria-label="Eliminar área" className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600">
              <Trash2 className="h-4 w-4" />
            </button>
            <button onClick={onClose} title="Cerrar" aria-label="Cerrar" className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Link
            to={`/areas/${area.id}`}
            state={backState}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-2.5 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <ExternalLink className="h-4 w-4" /> Abrir área
          </Link>
          <button onClick={onEdit} className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Pencil className="h-4 w-4" /> Editar
          </button>
          <button onClick={onAddChild} className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Plus className="h-4 w-4" /> Subárea
          </button>
        </div>
      </div>

      {area.description && <p className="text-sm text-gray-600">{area.description}</p>}

      {/* Supervisor */}
      <div className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2 text-sm">
        <UserRound className="h-4 w-4 flex-shrink-0 text-gray-400" />
        {area.supervisor_name ? (
          <span className="min-w-0">
            <span className="font-medium text-gray-900">{area.supervisor_name}</span>
            {area.supervisor_position && <span className="text-gray-500"> · {area.supervisor_position}</span>}
          </span>
        ) : (
          <span className="flex flex-1 items-center justify-between gap-2">
            <span className="font-medium text-amber-700">Sin supervisor</span>
            <Link to={tab('general')} state={backState} className="text-xs font-medium text-blue-700 hover:underline">
              Asignar
            </Link>
          </span>
        )}
      </div>

      {/* Real figures: each opens its tab */}
      <div className="grid grid-cols-2 gap-2">
        <Stat to={tab('personal')} Icon={Users} label="Personal" value={people} detail={area.headcount ? `${area.employees} con nombre · ${area.headcount} plantilla` : null} backState={backState} />
        <Stat
          to={tab('equipment')}
          Icon={Wrench}
          label="Equipos"
          value={area.equipment}
          detail={area.equipment_stopped ? `${area.equipment_stopped} detenido${area.equipment_stopped === 1 ? '' : 's'}` : null}
          alert={area.equipment_stopped > 0}
          backState={backState}
        />
        <Stat to={tab('documents')} Icon={FileText} label="Documentos" value={area.documents} backState={backState} />
        <Stat
          to={tab('certifications')}
          Icon={BadgeAlert}
          label="Certificaciones"
          value={certAlerts}
          detail={certAlerts ? 'por vencer o vencidas' : 'sin alertas'}
          alert={certAlerts > 0}
          backState={backState}
        />
        <Stat to={tab('products')} Icon={Package} label="Productos" value={area.products} backState={backState} />
        <Stat to={tab('processes')} Icon={GitBranch} label="Pasos de proceso" value={area.process_steps} backState={backState} />
      </div>

      {area.children > 0 && (
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-gray-700">
            <Layers className="h-3.5 w-3.5" /> Subáreas ({area.children})
          </p>
          <div className="flex flex-wrap gap-1">
            {areas
              .filter((a) => a.parent_area_id === area.id)
              .sort((a, b) => a.name.localeCompare(b.name, 'es'))
              .map((child) => (
                <button key={child.id} onClick={() => onSelect(child)} className="rounded-full border border-gray-300 px-2.5 py-0.5 text-xs text-gray-700 hover:border-blue-400 hover:text-blue-700">
                  {child.name}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Where it is drawn */}
      <div>
        <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-gray-700">
          <Map className="h-3.5 w-3.5" /> En el plano
        </p>
        {area.drawn.length === 0 ? (
          <div className="flex items-center justify-between gap-2 rounded-md border border-dashed border-gray-300 px-3 py-2 text-sm">
            <span className="text-gray-500">Sin dibujar en ningún plano</span>
            <Link
              to={`/plants/${plantId}/layout?area=${area.id}&draw=1`}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline"
            >
              <PenTool className="h-3.5 w-3.5" /> Dibujar en el plano
            </Link>
          </div>
        ) : (
          <ul className="space-y-1">
            {onPlant.map((d) => (
              <li key={`p${d.floor_level}`} className="flex items-center justify-between gap-2 rounded-md bg-gray-50 px-3 py-1.5 text-sm">
                <span className="text-gray-700">
                  {floorLabel(d.floor_level)}
                  {d.zones > 1 && <span className="text-gray-500"> · {d.zones} zonas</span>}
                </span>
                <Link to={`/plants/${plantId}/layout?floor=${d.floor_level}&area=${area.id}`} className="text-xs font-medium text-blue-700 hover:underline">
                  Ver en el plano
                </Link>
              </li>
            ))}
            {insideOthers.map((d) => {
              const parent = byId.get(d.inside_area_id!);
              return (
                <li key={`i${d.inside_area_id}${d.floor_level}`} className="flex items-center justify-between gap-2 rounded-md bg-gray-50 px-3 py-1.5 text-sm">
                  <span className="text-gray-700">
                    Dentro de {parent?.name || 'otra área'}
                    {d.zones > 1 && <span className="text-gray-500"> · {d.zones} zonas</span>}
                  </span>
                  <Link to={`/areas/${d.inside_area_id}?tab=layout&floor=${d.floor_level}`} state={backState} className="text-xs font-medium text-blue-700 hover:underline">
                    Ver plano
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {area.has_internal_layout && (
          <Link to={tab('layout')} state={backState} className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline">
            <LayoutGrid className="h-3.5 w-3.5" /> Ver su layout interno
          </Link>
        )}
      </div>
      {onMove && (
        <label className="block text-xs font-semibold text-gray-700">
          Dentro de
          <select
            value={area.parent_area_id || ''}
            onChange={(e) => onMove(e.target.value || null)}
            className="mt-1 w-full text-sm font-normal"
            aria-label="Mover dentro de"
          >
            <option value="">— Ninguna (área raíz) —</option>
            {areas
              .filter((a) => !descendantsOf(areas, area.id).has(a.id))
              .sort((a, b) => a.name.localeCompare(b.name, 'es'))
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
          </select>
        </label>
      )}
    </div>
  );
};

export default AreaOverviewPanel;

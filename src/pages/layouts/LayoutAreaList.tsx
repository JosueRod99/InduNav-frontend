import { PenTool } from 'lucide-react';
import type { AreaPhysicalRepresentation } from '../../api/areaRepresentations';
import type { AreaCoverage } from '../../api/layouts';
import { areaTypeLabel } from '../../constants/areaTypes';
import { zonesOf } from '../../utils/areaGeometry';
import { floorLabel, sortFloors } from '../../utils/floors';

// Side list of the plant layout: the areas drawn on this floor (one line each), how many areas of the
// plant are drawn, areas drawn only on other floors, and the ones not drawn yet (with "Dibujar").

interface Props {
  drawn: AreaPhysicalRepresentation[]; // on this floor
  coverage: AreaCoverage[];
  floor: number;
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (rep: AreaPhysicalRepresentation) => void;
  onHover: (id: string | null) => void;
  onDraw?: (area: AreaCoverage) => void; // editors, when the floor has a plan
  onGoToFloor: (floor: number) => void;
  rowRef: (id: string, el: HTMLElement | null) => void;
}

const LayoutAreaList = ({ drawn, coverage, floor, selectedId, hoveredId, onSelect, onHover, onDraw, onGoToFloor, rowRef }: Props) => {
  const drawnHere = new Set(drawn.map((r) => r.organizational_area_id));
  const plantFloors = (area: AreaCoverage) => sortFloors(area.drawn.filter((d) => !d.inside_area_id).map((d) => d.floor_level));
  const otherFloors = coverage.filter((a) => !drawnHere.has(a.id) && plantFloors(a).length > 0);
  // Not on any plant floor nor inside another area's internal layout
  const notDrawn = coverage.filter((a) => a.drawn.length === 0);
  const drawnCount = coverage.length - notDrawn.length;
  const percent = coverage.length ? Math.round((drawnCount / coverage.length) * 100) : 0;
  const typeOf = (rep: AreaPhysicalRepresentation) => coverage.find((a) => a.id === rep.organizational_area_id)?.area_type;

  return (
    <div className="space-y-5">
      {coverage.length > 0 && (
        <div>
          <p className="text-sm text-gray-700">
            <strong className="text-gray-900">{drawnCount}</strong> de {coverage.length} áreas dibujadas
          </p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100" aria-hidden>
            <div className="h-full rounded-full bg-blue-600" style={{ width: `${percent}%` }} />
          </div>
        </div>
      )}

      <section>
        <h3 className="mb-1.5 text-sm font-semibold text-gray-900">En {floorLabel(floor)} ({drawn.length})</h3>
        {drawn.length === 0 ? (
          <p className="rounded-md border border-dashed border-gray-200 px-3 py-4 text-center text-xs text-gray-500">Aún no hay áreas dibujadas en este piso.</p>
        ) : (
          <ul className="space-y-0.5">
            {drawn.map((rep) => {
              const name = rep.display_name || rep.organizational_area?.name || 'Sin nombre';
              const zones = zonesOf(rep.geometry).length;
              const active = selectedId === rep.id;
              return (
                <li key={rep.id}>
                  <button
                    ref={(el) => rowRef(rep.id, el)}
                    onClick={() => onSelect(rep)}
                    onMouseEnter={() => onHover(rep.id)}
                    onMouseLeave={() => onHover(null)}
                    aria-pressed={active}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                      active ? 'bg-blue-50 ring-1 ring-blue-300' : hoveredId === rep.id ? 'bg-gray-100' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="h-3 w-3 flex-shrink-0 rounded-sm" style={{ backgroundColor: rep.display_color || rep.organizational_area?.color || '#3B82F6' }} />
                    <span className="min-w-0 flex-1 truncate font-medium text-gray-900">{name}</span>
                    {rep.organizational_area?.code && <span className="flex-shrink-0 font-mono text-xs text-gray-500">{rep.organizational_area.code}</span>}
                    {zones > 1 && <span className="flex-shrink-0 rounded-full bg-gray-100 px-1.5 text-[11px] text-gray-600">{zones} zonas</span>}
                  </button>
                  {active && typeOf(rep) && <p className="px-7 pb-1 text-xs text-gray-500">{areaTypeLabel(typeOf(rep))}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {otherFloors.length > 0 && (
        <section>
          <h3 className="mb-1.5 text-sm font-semibold text-gray-900">En otros pisos ({otherFloors.length})</h3>
          <ul className="space-y-0.5">
            {otherFloors.map((area) => (
              <li key={area.id} className="flex items-center gap-2 px-2 py-1 text-sm">
                <span className="h-3 w-3 flex-shrink-0 rounded-sm opacity-60" style={{ backgroundColor: area.color || '#94A3B8' }} />
                <span className="min-w-0 flex-1 truncate text-gray-700">{area.name}</span>
                {plantFloors(area).map((level) => (
                  <button
                    key={level}
                    onClick={() => onGoToFloor(level)}
                    className="flex-shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                  >
                    {floorLabel(level)}
                  </button>
                ))}
              </li>
            ))}
          </ul>
        </section>
      )}

      {notDrawn.length > 0 && (
        <section>
          <h3 className="mb-0.5 text-sm font-semibold text-gray-900">Sin dibujar ({notDrawn.length})</h3>
          <p className="mb-1.5 text-xs text-gray-500">No aparecen en ningún plano todavía.</p>
          <ul className="space-y-0.5">
            {notDrawn.map((area) => (
              <li key={area.id} className="flex items-center gap-2 px-2 py-1 text-sm">
                <span className="h-3 w-3 flex-shrink-0 rounded-sm border border-dashed border-gray-400" />
                <span className="min-w-0 flex-1 truncate text-gray-700">
                  {area.name}
                  {area.parent_name && <span className="text-xs text-gray-500"> · en {area.parent_name}</span>}
                </span>
                {onDraw && (
                  <button
                    onClick={() => onDraw(area)}
                    className="inline-flex flex-shrink-0 items-center gap-1 rounded-md border border-gray-300 px-2 py-0.5 text-xs font-medium text-gray-700 hover:border-blue-400 hover:text-blue-700"
                    aria-label={`Dibujar ${area.name}`}
                  >
                    <PenTool className="h-3 w-3" /> Dibujar
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default LayoutAreaList;

import { useMemo, useState } from 'react';
import { BadgeAlert, ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown, MapPinOff, Search, UserX, Wrench } from 'lucide-react';
import { areaPending, hasPending, type AreaOverview } from '../../api/areas';

// Tree of the plant areas with aligned figures (people, subareas, equipment) and what needs
// attention in each one. Search and "solo con pendientes" keep the ancestors of every match.
// Drag an area onto another to move it inside (or onto the top strip to make it a root area).

interface Props {
  areas: AreaOverview[];
  selectedId: string | null;
  onSelect: (area: AreaOverview) => void;
  onMove?: (area: AreaOverview, parentId: string | null) => void;
}

/** The area itself and everything under it: where it cannot be moved */
export const descendantsOf = (areas: AreaOverview[], id: string) => {
  const result = new Set([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const a of areas) {
      if (a.parent_area_id && result.has(a.parent_area_id) && !result.has(a.id)) {
        result.add(a.id);
        grew = true;
      }
    }
  }
  return result;
};

const byName = (a: AreaOverview, b: AreaOverview) => a.name.localeCompare(b.name, 'es');

const PendingIcons = ({ area }: { area: AreaOverview }) => {
  const p = areaPending(area);
  return (
    <span className="flex flex-shrink-0 items-center gap-1">
      {p.noSupervisor && (
        <span title="Sin supervisor" aria-label="Sin supervisor">
          <UserX className="h-3.5 w-3.5 text-amber-600" />
        </span>
      )}
      {p.notDrawn && (
        <span title="Sin dibujar en ningún plano" aria-label="Sin dibujar">
          <MapPinOff className="h-3.5 w-3.5 text-gray-400" />
        </span>
      )}
      {p.stoppedEquipment > 0 && (
        <span title={`${p.stoppedEquipment} equipo(s) detenido(s)`} aria-label="Equipo detenido">
          <Wrench className="h-3.5 w-3.5 text-red-600" />
        </span>
      )}
      {p.certifications > 0 && (
        <span title="Certificaciones vencidas o por vencer" aria-label="Certificaciones por vencer">
          <BadgeAlert className="h-3.5 w-3.5 text-red-600" />
        </span>
      )}
    </span>
  );
};

const PlantAreaTree = ({ areas, selectedId, onSelect, onMove }: Props) => {
  const [search, setSearch] = useState('');
  const [dragging, setDragging] = useState<AreaOverview | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null); // area id, or 'root'
  const blocked = useMemo(() => (dragging ? descendantsOf(areas, dragging.id) : new Set<string>()), [areas, dragging]);
  const canDropOn = (targetId: string | null) =>
    !!dragging && (targetId === null ? !!dragging.parent_area_id : !blocked.has(targetId) && dragging.parent_area_id !== targetId);
  const endDrag = () => {
    setDragging(null);
    setDropTarget(null);
  };
  const drop = (targetId: string | null) => {
    if (dragging && canDropOn(targetId)) onMove?.(dragging, targetId);
    endDrag();
  };
  const [onlyPending, setOnlyPending] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const children = useMemo(() => {
    const map = new Map<string | null, AreaOverview[]>();
    const ids = new Set(areas.map((a) => a.id));
    for (const area of areas) {
      const parent = area.parent_area_id && ids.has(area.parent_area_id) ? area.parent_area_id : null;
      map.set(parent, [...(map.get(parent) || []), area]);
    }
    map.forEach((list) => list.sort(byName));
    return map;
  }, [areas]);

  // Rows that match the search / pending filter, plus their ancestors (so they stay in context)
  const visible = useMemo(() => {
    const text = search.trim().toLowerCase();
    if (!text && !onlyPending) return null;
    const byId = new Map(areas.map((a) => [a.id, a]));
    const keep = new Set<string>();
    for (const area of areas) {
      const matches = (!text || `${area.name} ${area.code || ''}`.toLowerCase().includes(text)) && (!onlyPending || hasPending(area));
      if (!matches) continue;
      for (let node: AreaOverview | undefined = area; node; node = node.parent_area_id ? byId.get(node.parent_area_id) : undefined) keep.add(node.id);
    }
    return keep;
  }, [areas, search, onlyPending]);

  const pendingCount = areas.filter(hasPending).length;
  const parents = areas.filter((a) => (children.get(a.id) || []).length > 0).map((a) => a.id);

  const toggle = (id: string) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const renderRows = (parentId: string | null, depth: number): React.ReactNode[] =>
    (children.get(parentId) || [])
      .filter((area) => !visible || visible.has(area.id))
      .flatMap((area) => {
        const kids = children.get(area.id) || [];
        // Filtering always shows the matches; otherwise respect what the user collapsed
        const open = kids.length > 0 && (!!visible || !collapsed.has(area.id));
        const active = area.id === selectedId;
        return [
          <li key={area.id} role="treeitem" aria-selected={active} aria-expanded={kids.length ? open : undefined} aria-level={depth + 1}>
            <div
              draggable={!!onMove}
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', area.id);
                setDragging(area);
              }}
              onDragEnd={endDrag}
              onDragOver={(e) => {
                if (!canDropOn(area.id)) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setDropTarget(area.id);
              }}
              onDragLeave={() => dropTarget === area.id && setDropTarget(null)}
              onDrop={(e) => {
                e.preventDefault();
                drop(area.id);
              }}
              className={`flex items-center gap-2 rounded-md py-1.5 pr-2 text-sm transition-colors ${
                dropTarget === area.id
                  ? 'bg-green-50 ring-2 ring-green-400'
                  : dragging?.id === area.id
                    ? 'opacity-50'
                    : active
                      ? 'bg-blue-50 ring-1 ring-blue-300'
                      : 'hover:bg-gray-50'
              } ${onMove ? 'cursor-grab active:cursor-grabbing' : ''}`}
              style={{ paddingLeft: depth * 20 + 4 }}
              title={dropTarget === area.id && dragging ? `Mover ${dragging.name} dentro de ${area.name}` : undefined}
            >
              {kids.length ? (
                <button
                  onClick={() => toggle(area.id)}
                  className="rounded p-0.5 text-gray-500 hover:bg-gray-200"
                  aria-label={open ? `Colapsar ${area.name}` : `Expandir ${area.name}`}
                >
                  {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              ) : (
                <span className="w-5" />
              )}
              <button onClick={() => onSelect(area)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                <span className="h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: area.color || '#94A3B8' }} />
                <span className={`truncate font-medium ${active ? 'text-blue-800' : 'text-gray-900'}`}>{area.name}</span>
                {area.code && <span className="flex-shrink-0 font-mono text-xs text-gray-500">{area.code}</span>}
                <PendingIcons area={area} />
              </button>
              <span className="hidden w-16 flex-shrink-0 text-right text-xs tabular-nums text-gray-600 sm:block" title="Personas (con nombre + plantilla)">
                {area.employees + area.headcount || '—'}
              </span>
              <span className="hidden w-16 flex-shrink-0 text-right text-xs tabular-nums text-gray-600 sm:block">{area.children || '—'}</span>
              <span className="hidden w-16 flex-shrink-0 text-right text-xs tabular-nums text-gray-600 sm:block">{area.equipment || '—'}</span>
            </div>
          </li>,
          ...(open ? renderRows(area.id, depth + 1) : []),
        ];
      });

  const rows = renderRows(null, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 p-3">
        <label className="relative min-w-[10rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar área o código"
            aria-label="Buscar área"
            className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>
        <label
          className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${onlyPending ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-gray-300 text-gray-700'}`}
        >
          <input type="checkbox" checked={onlyPending} onChange={(e) => setOnlyPending(e.target.checked)} className="rounded text-amber-600" />
          Solo con pendientes ({pendingCount})
        </label>
        <div className="flex gap-1">
          <button
            onClick={() => setCollapsed(new Set())}
            className="rounded-md border border-gray-300 p-2 text-gray-600 hover:bg-gray-50"
            title="Expandir todo"
            aria-label="Expandir todo"
          >
            <ChevronsUpDown className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCollapsed(new Set(parents))}
            className="rounded-md border border-gray-300 p-2 text-gray-600 hover:bg-gray-50"
            title="Colapsar todo"
            aria-label="Colapsar todo"
          >
            <ChevronsDownUp className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-2">
        <div className="hidden items-center gap-2 px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 sm:flex">
          <span className="flex-1 pl-7">Área</span>
          <span className="w-16 text-right">Personas</span>
          <span className="w-16 text-right">Subáreas</span>
          <span className="w-16 text-right">Equipos</span>
        </div>
        {dragging && dragging.parent_area_id && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDropTarget('root');
            }}
            onDragLeave={() => dropTarget === 'root' && setDropTarget(null)}
            onDrop={(e) => {
              e.preventDefault();
              drop(null);
            }}
            className={`mb-1 rounded-md border-2 border-dashed px-3 py-2 text-center text-xs font-medium ${
              dropTarget === 'root' ? 'border-green-400 bg-green-50 text-green-800' : 'border-gray-300 text-gray-500'
            }`}
          >
            Soltar aquí para hacer de "{dragging.name}" un área raíz
          </div>
        )}
        {rows.length ? (
          <ul role="tree" aria-label="Áreas de la planta" className="space-y-0.5">
            {rows}
          </ul>
        ) : (
          <p className="px-3 py-8 text-center text-sm text-gray-500">{areas.length ? 'Ninguna área coincide.' : 'Aún no hay áreas en esta planta.'}</p>
        )}
        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-gray-100 px-2 pt-2 text-[11px] text-gray-500">
          <span className="inline-flex items-center gap-1">
            <UserX className="h-3 w-3 text-amber-600" /> Sin supervisor
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPinOff className="h-3 w-3 text-gray-400" /> Sin dibujar
          </span>
          <span className="inline-flex items-center gap-1">
            <Wrench className="h-3 w-3 text-red-600" /> Equipo detenido
          </span>
          <span className="inline-flex items-center gap-1">
            <BadgeAlert className="h-3 w-3 text-red-600" /> Certificación por vencer
          </span>
          {onMove && <span className="ml-auto">Arrastra un área sobre otra para moverla dentro</span>}
        </p>
      </div>
    </div>
  );
};

export default PlantAreaTree;

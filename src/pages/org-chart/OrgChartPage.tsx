import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, ChevronDown, ChevronRight, Maximize2, Search, UserX, ZoomIn, ZoomOut } from 'lucide-react';
import { OrgChart } from 'd3-org-chart';
import { getOrganizations } from '../../api/organizations';
import { getPlants } from '../../api/plants';
import { getOrgChart, type OrgChartNode } from '../../api/employees';
import { avatarUrl } from '../../utils/avatarUrl';
import { matchesSearch } from '../../utils/search';
import type { PlantScopedProps } from '../plants/plantScope';
import SectionHeader from '../../components/ui/SectionHeader';
import EmployeeDetailModal from '../../components/employees/EmployeeDetailModal';

// Org chart: white cards (photo, name, position, a thin stripe with the area color), two levels open
// at first, search that opens the branch and highlights the person, and a click opens the record.
// People without a boss (other than the top of the chart) are listed apart. Phones get an indented tree.

// Card HTML is built as a string: escape every value that comes from the data
const esc = (value: unknown) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const ROLE_SHORT = { supervisor: 'Supervisor', quality: 'Calidad', emergency: 'Emergencia' } as const;
/** "Supervisor: Línea 1, Línea 3 · Calidad: Almacén" */
const responsibilityText = (node: OrgChartNode) =>
  (node.responsibilities || []).map((r) => `${ROLE_SHORT[r.role]}: ${r.areas.join(', ')}`).join(' · ');

const NEUTRAL = '#CBD5E1';
const VIRTUAL_ID = '__sin_jefe__';
const CARD_W = 250;
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => w && !w.endsWith('.'))
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

const avatarHtml = (node: OrgChartNode, size: number) =>
  node.avatar_url
    ? `<img src="${esc(avatarUrl(node.avatar_url, size))}" alt="" style="width:${size}px;height:${size}px;border-radius:9999px;object-fit:cover;flex-shrink:0" />`
    : `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:#F1F5F9;color:#475569;display:flex;align-items:center;justify-content:center;font-size:${Math.round(size * 0.36)}px;font-weight:600;flex-shrink:0">${esc(initials(node.name || '?'))}</div>`;

const ellipsis = 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis';

/** Fit the chart in view, but never zoom in past 100% (a small chart would get huge cards) */
const fitCapped = (instance: any) => {
  if (!instance) return;
  const attrs = instance.getChartState();
  const layout = attrs.layoutBindings[attrs.layout];
  const nodes = attrs.root.descendants();
  const width = Math.max(...nodes.map((d: any) => d.x + layout.nodeRightX(d))) - Math.min(...nodes.map((d: any) => d.x + layout.nodeLeftX(d))) + 100;
  const height = Math.max(...nodes.map((d: any) => d.y + layout.nodeBottomY(d))) - Math.min(...nodes.map((d: any) => d.y + layout.nodeTopY(d))) + 100;
  if (0.9 / Math.max(width / attrs.svgWidth, height / attrs.svgHeight) < 1) instance.fit();
  else {
    attrs.lastTransform.k = 1;
    instance.fit({ scale: false });
  }
};

/** One card of the chart (desktop) */
const cardHtml = (node: OrgChartNode & { _highlighted?: boolean }) => {
  const ring = node._highlighted ? 'box-shadow:0 0 0 3px #3B82F6;border-color:#3B82F6;' : 'box-shadow:0 1px 2px rgba(15,23,42,.06);';
  if (node.id === VIRTUAL_ID) {
    return `<div style="width:100%;height:100%;border:1px dashed #94A3B8;border-radius:10px;background:#F8FAFC;display:flex;align-items:center;justify-content:center;font:600 13px system-ui;color:#475569">Sin jefe asignado</div>`;
  }
  if (node.is_headcount) {
    return `<div style="width:100%;height:100%;border:1px dashed #CBD5E1;border-left:3px solid ${esc(node.area_color || NEUTRAL)};border-radius:10px;background:#F8FAFC;padding:10px 12px;font-family:system-ui;display:flex;align-items:center;gap:10px;${ring}">
        <div style="font-size:22px;font-weight:700;color:#1E293B;min-width:28px;text-align:center">${esc(node.quantity)}</div>
        <div style="min-width:0">
          <div style="font-size:13px;font-weight:600;color:#0F172A;${ellipsis}">${esc(node.position)}</div>
          <div style="font-size:11px;color:#64748B;${ellipsis}">Plantilla · ${esc(node.area || node.department)}${node.shift ? ` · ${esc(node.shift)}` : ''}</div>
        </div>
      </div>`;
  }
  const resp = responsibilityText(node);
  return `<div style="width:100%;height:100%;background:#fff;border:1px solid #E2E8F0;border-left:3px solid ${esc(node.area_color || NEUTRAL)};border-radius:10px;padding:10px 12px;font-family:system-ui;display:flex;align-items:center;gap:10px;cursor:pointer;${ring}">
      ${avatarHtml(node, 36)}
      <div style="min-width:0;flex:1">
        <div style="font-size:13px;font-weight:600;color:#0F172A;${ellipsis}">${esc(node.name || 'Sin nombre')}</div>
        <div style="font-size:12px;color:#475569;${ellipsis}">${esc(node.position || 'Sin puesto')}</div>
        ${node.area ? `<div style="font-size:11px;color:#64748B;${ellipsis}">${esc(node.area)}</div>` : ''}
        ${resp ? `<div title="${esc(resp)}" style="font-size:11px;color:#92400E;${ellipsis}">★ ${esc(resp)}</div>` : ''}
      </div>
    </div>`;
};

/** Whether the screen is wide enough for the horizontal chart */
const useWide = () => {
  const query = '(min-width: 768px)';
  const [wide, setWide] = useState(() => typeof window === 'undefined' || window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setWide(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return wide;
};

/** Phones: indented tree with expand / collapse; a search keeps the people above each match */
const OrgTree = ({ nodes, search, onOpen }: { nodes: OrgChartNode[]; search: string; onOpen: (n: OrgChartNode) => void }) => {
  const children = useMemo(() => {
    const map = new Map<string | null, OrgChartNode[]>();
    nodes.forEach((n) => map.set(n.parentId, [...(map.get(n.parentId) || []), n]));
    return map;
  }, [nodes]);
  const roots = children.get(null) || [];
  const [open, setOpen] = useState<Set<string>>(() => new Set(roots.map((r) => r.id)));
  const visible = useMemo(() => {
    if (!search.trim()) return null;
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const keep = new Set<string>();
    nodes
      .filter((n) => matchesSearch(search, n.name, n.position, n.area))
      .forEach((n) => {
        for (let x: OrgChartNode | undefined = n; x; x = x.parentId ? byId.get(x.parentId) : undefined) keep.add(x.id);
      });
    return keep;
  }, [nodes, search]);

  const rows = (parent: string | null, depth: number): React.ReactNode[] =>
    (children.get(parent) || [])
      .filter((n) => !visible || visible.has(n.id))
      .flatMap((n) => {
        const kids = (children.get(n.id) || []).length;
        const expanded = kids > 0 && (!!visible || open.has(n.id));
        return [
          <li key={n.id} className="flex items-center gap-1.5 py-1.5" style={{ paddingLeft: depth * 16 }}>
            {kids ? (
              <button
                onClick={() =>
                  setOpen((s) => {
                    const next = new Set(s);
                    if (next.has(n.id)) next.delete(n.id);
                    else next.add(n.id);
                    return next;
                  })
                }
                className="rounded p-0.5 text-gray-500 hover:bg-gray-100"
                aria-label={expanded ? `Cerrar equipo de ${n.name}` : `Abrir equipo de ${n.name}`}
              >
                {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            ) : (
              <span className="w-5" />
            )}
            <button
              onClick={() => !n.is_headcount && n.id !== VIRTUAL_ID && onOpen(n)}
              className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-left"
              style={{ borderLeft: `3px solid ${n.area_color || NEUTRAL}` }}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-gray-900">
                  {n.is_headcount ? `${n.quantity} · ${n.position}` : n.id === VIRTUAL_ID ? 'Sin jefe asignado' : n.name}
                </span>
                {!n.is_headcount && n.id !== VIRTUAL_ID && <span className="block truncate text-xs text-gray-500">{[n.position, n.area].filter(Boolean).join(' · ')}</span>}
              </span>
              {kids > 0 && <span className="flex-shrink-0 text-xs text-gray-500">{kids}</span>}
            </button>
          </li>,
          ...(expanded ? rows(n.id, depth + 1) : []),
        ];
      });

  const list = rows(null, 0);
  return list.length ? <ul className="p-2">{list}</ul> : <p className="p-6 text-center text-sm text-gray-500">Nadie coincide con la búsqueda.</p>;
};

const OrgChartPage = ({ plantId, organizationId, viewSwitch }: PlantScopedProps = {}) => {
  const embedded = !!plantId; // inside the plant workspace: fixed plant, no org/plant selectors
  const wide = useWide();

  const [selectedOrg, setSelectedOrg] = useState<string>(organizationId ?? '');
  const [selectedPlant, setSelectedPlant] = useState<string>(plantId ?? '');
  const [search, setSearch] = useState('');
  const [showMatches, setShowMatches] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const chart = useRef<any>(null);

  const { data: organizationsData } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => getOrganizations({ limit: 100 }),
    enabled: !embedded,
  });

  const { data: plantsData } = useQuery({
    queryKey: ['plants', selectedOrg],
    queryFn: () => getPlants({ limit: 100, organization_id: selectedOrg }),
    enabled: !!selectedOrg && !embedded,
  });

  const { data: chartData, isLoading } = useQuery({
    queryKey: ['orgChart', selectedOrg, selectedPlant],
    queryFn: () => getOrgChart(selectedOrg, selectedPlant || undefined),
    enabled: !!selectedOrg,
  });

  // The top of the chart is the root with the most people under it; other roots have no boss.
  // Those with a team hang from a "Sin jefe asignado" box; those alone are only listed apart.
  const { nodes, withoutBoss } = useMemo(() => {
    const data = chartData || [];
    const kids = new Map<string, number>();
    data.forEach((n) => n.parentId && kids.set(n.parentId, (kids.get(n.parentId) || 0) + 1));
    const size = (id: string): number => data.filter((n) => n.parentId === id).reduce((sum, n) => sum + 1 + size(n.id), 0);
    const roots = data.filter((n) => !n.parentId);
    if (roots.length <= 1) return { nodes: data, withoutBoss: [] as OrgChartNode[] };
    const top = roots.reduce((best, r) => (size(r.id) > size(best.id) ? r : best), roots[0]);
    const others = roots.filter((r) => r.id !== top.id);
    const alone = new Set(others.filter((r) => !kids.has(r.id)).map((r) => r.id));
    const teams = others.filter((r) => kids.has(r.id));
    const virtual: OrgChartNode = { id: VIRTUAL_ID, name: 'Sin jefe asignado', position: '', department: '', email: '', employee_number: '', parentId: top.id };
    return {
      nodes: [
        ...data.filter((n) => !alone.has(n.id)).map((n) => (teams.some((t) => t.id === n.id) ? { ...n, parentId: VIRTUAL_ID } : n)),
        ...(teams.length ? [virtual] : []),
      ],
      withoutBoss: others.filter((r) => !r.is_headcount),
    };
  }, [chartData]);

  const people = nodes.filter((n) => !n.is_headcount && n.id !== VIRTUAL_ID);
  const matches = search.trim() ? people.filter((n) => matchesSearch(search, n.name, n.position, n.area)).slice(0, 8) : [];

  useEffect(() => {
    if (!wide || !chartRef.current || !nodes.length) return;
    chartRef.current.innerHTML = '';
    chart.current = new OrgChart()
      .container(chartRef.current as any)
      .data(nodes.map((n) => ({ ...n })))
      .nodeWidth(() => CARD_W)
      .nodeHeight((d: any) => (d.data.is_headcount || d.data.id === VIRTUAL_ID ? 60 : 64 + (d.data.area ? 16 : 0) + (responsibilityText(d.data) ? 16 : 0)))
      // "N personas" goes under the card, not over its text
      .nodeButtonWidth(() => 120)
      .nodeButtonHeight(() => 26)
      .nodeButtonX(() => -60)
      .nodeButtonY(() => 6)
      .childrenMargin(() => 48)
      .compactMarginBetween(() => 28)
      .compactMarginPair(() => 28)
      .neighbourMargin(() => 24)
      .initialExpandLevel(1)
      .nodeContent((d: any) => cardHtml(d.data))
      // The card draws its own border and highlight
      .nodeUpdate(function (this: any) {
        this.querySelector?.('.node-rect')?.setAttribute('stroke', 'none');
      })
      .linkUpdate(function (this: any) {
        this.setAttribute('stroke', '#CBD5E1');
        this.setAttribute('stroke-width', '1');
      })
      .buttonContent(({ node }: any) => {
        const n = node.data._directSubordinates;
        const open = !!node.children;
        return `<div style="display:flex;justify-content:center"><div style="display:inline-flex;align-items:center;gap:4px;white-space:nowrap;border:1px solid #CBD5E1;border-radius:9999px;background:#fff;padding:2px 8px;font:500 11px system-ui;color:#334155;cursor:pointer">${open ? '▴' : '▾'} ${n} persona${n === 1 ? '' : 's'}</div></div>`;
      })
      .onNodeClick((d: any) => {
        const n: OrgChartNode = d.data ?? d;
        if (!n.is_headcount && n.id !== VIRTUAL_ID) setDetailId(n.id);
      })
      .render();
    fitCapped(chart.current);
  }, [nodes, wide]);

  const focus = (n: OrgChartNode) => {
    setSearch(n.name);
    setShowMatches(false);
    if (chart.current) {
      chart.current.clearHighlighting();
      chart.current.setHighlighted(n.id).render();
    }
  };

  const controls = [
    { Icon: ZoomIn, label: 'Acercar', onClick: () => chart.current?.zoomIn() },
    { Icon: ZoomOut, label: 'Alejar', onClick: () => chart.current?.zoomOut() },
    { Icon: Maximize2, label: 'Ajustar a la vista', onClick: () => fitCapped(chart.current) },
  ];

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title={embedded ? 'Personal' : 'Organigrama'}
        description={embedded ? 'Organigrama de la planta: quién reporta a quién, responsables de área y puestos.' : 'Visualiza la estructura jerárquica de la organización'}
      />
      {viewSwitch}

      {!embedded && (
        <div className="flex flex-wrap gap-2">
          <select aria-label="Organización" value={selectedOrg} onChange={(e) => (setSelectedOrg(e.target.value), setSelectedPlant(''))} className="w-full sm:w-64">
            <option value="">Seleccionar organización</option>
            {organizationsData?.organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
          {selectedOrg && (
            <select aria-label="Planta" value={selectedPlant} onChange={(e) => setSelectedPlant(e.target.value)} className="w-full sm:w-64">
              <option value="">Todas las plantas</option>
              {plantsData?.plants.map((plant) => (
                <option key={plant.id} value={plant.id}>
                  {plant.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {selectedOrg && nodes.length > 0 && (
        <>
          {/* Find a person: opens the branch, centers and highlights them */}
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowMatches(true);
              }}
              onFocus={() => setShowMatches(true)}
              onBlur={() => setTimeout(() => setShowMatches(false), 150)}
              onKeyDown={(e) => e.key === 'Enter' && matches[0] && focus(matches[0])}
              placeholder="Buscar persona, puesto o área"
              aria-label="Buscar en el organigrama"
              className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {wide && showMatches && matches.length > 0 && (
              <ul role="listbox" className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
                {matches.map((n) => (
                  <li key={n.id}>
                    <button
                      role="option"
                      aria-selected={false}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => focus(n)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-blue-50"
                    >
                      <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: n.area_color || NEUTRAL }} />
                      <span className="font-medium text-gray-900">{n.name}</span>
                      <span className="truncate text-xs text-gray-500">{n.position}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {withoutBoss.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <UserX className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">Sin jefe asignado ({withoutBoss.length}):</span>
              {withoutBoss.map((n) => (
                <button key={n.id} onClick={() => setDetailId(n.id)} className="rounded-full border border-amber-300 bg-white px-2 py-0.5 text-xs hover:border-amber-500" title="Abrir su ficha para asignarle jefe">
                  {n.name}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {!selectedOrg ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-gray-200 bg-white p-8">
          <div className="text-center">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Selecciona una organización</h3>
            <p className="mt-1 text-sm text-gray-500">Elige una organización para ver su organigrama</p>
          </div>
        </div>
      ) : isLoading ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-gray-200 bg-white p-8 text-gray-600">Cargando organigrama...</div>
      ) : !nodes.length ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-gray-200 bg-white p-8">
          <div className="text-center">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay empleados</h3>
            <p className="mt-1 text-sm text-gray-500">Agrega empleados para visualizar el organigrama</p>
          </div>
        </div>
      ) : wide ? (
        <div className="relative h-[65vh] min-h-[440px] overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
          <div ref={chartRef} className="h-full w-full" />
          {/* Map-style controls in the corner */}
          <div className="absolute right-3 top-3 flex flex-col overflow-hidden rounded-md border border-gray-300 bg-white shadow-sm">
            {controls.map(({ Icon, label, onClick }) => (
              <button key={label} onClick={onClick} title={label} aria-label={label} className="border-b border-gray-200 p-2 text-gray-700 last:border-b-0 hover:bg-gray-50">
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
          <p className="pointer-events-none absolute bottom-2 left-3 text-[11px] text-gray-500">Clic en una persona para ver su ficha · la franja de color es su área</p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white">
          <OrgTree nodes={nodes} search={search} onOpen={(n) => setDetailId(n.id)} />
        </div>
      )}

      <EmployeeDetailModal isOpen={!!detailId} onClose={() => setDetailId(null)} employeeId={detailId} />
    </div>
  );
};

export default OrgChartPage;

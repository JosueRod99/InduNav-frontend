import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Building2, LayoutGrid, MapPin, Package, Wrench, X } from 'lucide-react';
import LayoutMap, { type MapFootprint } from '../../layouts/LayoutMap';
import type { AreaPhysicalRepresentation, GeoJSONPolygon } from '../../../api/areaRepresentations';
import {
  EQUIPMENT_STATUS_COLORS,
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_TYPE_LABELS,
  type EquipmentStatus,
  type EquipmentType,
} from '../../../api/equipment';
import { computePlantCrop, plantImageBoundsForCrop } from '../../../utils/areaLayout';

// Read-only plant + area interior viewer for tours. Data comes in through props so it works
// with the static demo now and with API data later (tours phase 2).
//
// The map only shows colors; names appear on hover (desktop) or when a shape is highlighted
// or selected (touch). A side list (desktop) or a list under the map (mobile) doubles as the
// legend, and the detail of the selected item opens in the side panel or a bottom sheet.

export interface ViewerArea {
  id: string;
  name: string;
  polygon: number[][]; // GeoJSON ring in plant layout coordinates
  description?: string;
}

export interface ViewerShape {
  id: string;
  name: string;
  polygon: number[][]; // plant layout coordinates
  color?: string;
}

export interface ViewerEquipment {
  id: string;
  code: string;
  name: string;
  type: EquipmentType;
  status: EquipmentStatus;
  polygon: number[][]; // plant layout coordinates
  usedIn: string[];
}

interface TourLayoutViewerProps {
  plantImageUrl: string | null;
  areas: ViewerArea[];
  currentAreaId: string;
  interior?: { subAreas: ViewerShape[]; equipment: ViewerEquipment[] } | null;
  language: 'es' | 'en';
  onGoToArea?: (areaId: string) => void; // jump to another area of the tour
}

const STATUS_LABELS_EN: Record<EquipmentStatus, string> = {
  active: 'Active',
  maintenance: 'Under maintenance',
  out_of_service: 'Out of service',
  retired: 'Retired',
};

const TYPE_LABELS_EN: Record<EquipmentType, string> = {
  tool: 'Tool',
  machinery: 'Machinery',
  vehicle: 'Vehicle',
  computer: 'Computer equipment',
  other: 'Other',
};

const CURRENT_AREA_COLOR = '#DC2626';
const OTHER_AREA_COLOR = '#94A3B8';

const polygonOf = (ring: number[][]): GeoJSONPolygon => ({ type: 'Polygon', coordinates: [ring] });

const bbox = (ring: number[][]) => ({
  x1: Math.min(...ring.map((p) => p[0])),
  x2: Math.max(...ring.map((p) => p[0])),
  y1: Math.min(...ring.map((p) => p[1])),
  y2: Math.max(...ring.map((p) => p[1])),
});

// Equipment belongs to the zone whose bounding box contains its center
const isInside = (inner: number[][], outer: number[][]) => {
  const a = bbox(inner);
  const b = bbox(outer);
  const cx = (a.x1 + a.x2) / 2;
  const cy = (a.y1 + a.y2) / 2;
  return cx >= b.x1 && cx <= b.x2 && cy >= b.y1 && cy <= b.y2;
};

// LayoutMap renders AreaPhysicalRepresentation; build a minimal one for display only
const toRepresentation = (id: string, name: string, ring: number[][], color: string): AreaPhysicalRepresentation => ({
  id,
  organizational_area_id: id,
  layout_id: null,
  geometry: polygonOf(ring),
  floor_level: 0,
  display_name: name,
  display_color: color,
  created_at: new Date(0),
  updated_at: new Date(0),
});

const useIsDesktop = () => {
  const query = '(min-width: 1024px)';
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return matches;
};

const TourLayoutViewer = ({
  plantImageUrl,
  areas,
  currentAreaId,
  interior,
  language,
  onGoToArea,
}: TourLayoutViewerProps) => {
  const isDesktop = useIsDesktop();
  const [view, setView] = useState<'plant' | 'interior'>('plant');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const statusLabels = language === 'es' ? EQUIPMENT_STATUS_LABELS : STATUS_LABELS_EN;
  const typeLabels = language === 'es' ? EQUIPMENT_TYPE_LABELS : TYPE_LABELS_EN;
  const tr = (es: string, en: string) => (language === 'es' ? es : en);

  // Moving to another area of the tour starts again from the plant view
  useEffect(() => {
    setView('plant');
    setSelectedId(null);
    setHoveredId(null);
  }, [currentAreaId]);

  const switchView = (next: 'plant' | 'interior') => {
    setView(next);
    setSelectedId(null);
    setHoveredId(null);
  };

  const currentArea = areas.find((a) => a.id === currentAreaId);
  const subAreas = interior?.subAreas || [];
  const equipment = interior?.equipment || [];
  const hasInterior = !!currentArea && (subAreas.length > 0 || equipment.length > 0);

  // Interior = plant image cropped to the current area, same transform as real area layouts
  const interiorView = useMemo(() => {
    if (!currentArea || !interior) return null;
    const { crop, outline } = computePlantCrop(polygonOf(currentArea.polygon));
    const transform = (ring: number[][]) =>
      ring.map(([x, y]) => [(x - crop.x) * crop.scale, (y - crop.y) * crop.scale]);

    return {
      imageBounds: plantImageBoundsForCrop(crop),
      outline,
      subAreas: interior.subAreas.map((s) =>
        toRepresentation(s.id, s.name, transform(s.polygon), s.color || '#3B82F6')
      ),
      footprints: interior.equipment.map<MapFootprint>((e) => ({
        id: e.id,
        geometry: polygonOf(transform(e.polygon)),
        label: `${e.code} · ${e.name}`,
        status: e.status,
      })),
    };
  }, [currentArea, interior]);

  const plantAreas = useMemo(
    () =>
      areas.map((a) =>
        toRepresentation(a.id, a.name, a.polygon, a.id === currentAreaId ? CURRENT_AREA_COLOR : OTHER_AREA_COLOR)
      ),
    [areas, currentAreaId]
  );

  const unavailable = equipment.filter((e) => e.status === 'maintenance' || e.status === 'out_of_service').length;

  // ---------- Selection ----------
  const selectedArea = view === 'plant' ? areas.find((a) => a.id === selectedId) : undefined;
  const selectedZone = view === 'interior' ? subAreas.find((s) => s.id === selectedId) : undefined;
  const selectedEquipment = view === 'interior' ? equipment.find((e) => e.id === selectedId) : undefined;
  const hasSelection = !!(selectedArea || selectedZone || selectedEquipment);

  const zoneOf = (e: ViewerEquipment) => subAreas.find((s) => isInside(e.polygon, s.polygon));

  // ---------- Pieces ----------
  const listRow = (id: string, swatch: ReactNode, title: string, subtitle?: ReactNode) => (
    <button
      key={id}
      onClick={() => setSelectedId(id)}
      onMouseEnter={() => setHoveredId(id)}
      onMouseLeave={() => setHoveredId(null)}
      className={`w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors ${
        hoveredId === id || selectedId === id ? 'bg-blue-50' : 'hover:bg-slate-50'
      }`}
    >
      {swatch}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium text-slate-800">{title}</span>
        {subtitle && <span className="block truncate text-[11px] text-slate-500">{subtitle}</span>}
      </span>
    </button>
  );

  const statusDot = (status: EquipmentStatus) => (
    <span
      className="h-2.5 w-2.5 flex-shrink-0 rounded-full ring-1 ring-slate-900/20"
      style={{ backgroundColor: EQUIPMENT_STATUS_COLORS[status] }}
    />
  );

  const sectionTitle = (text: string) => (
    <p className="px-2 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{text}</p>
  );

  const list = (
    <div className="space-y-1">
      {view === 'plant' ? (
        <>
          {sectionTitle(tr('Áreas del recorrido', 'Tour areas'))}
          {areas.map((a) =>
            listRow(
              a.id,
              <span
                className="h-3 w-3 flex-shrink-0 rounded-sm"
                style={{ backgroundColor: a.id === currentAreaId ? CURRENT_AREA_COLOR : OTHER_AREA_COLOR }}
              />,
              a.name,
              a.id === currentAreaId ? <span className="text-red-600">{tr('Área actual', 'Current area')}</span> : undefined
            )
          )}
        </>
      ) : (
        <>
          {subAreas.length > 0 && sectionTitle(tr('Zonas', 'Zones'))}
          {subAreas.map((s) =>
            listRow(
              s.id,
              <span className="h-3 w-3 flex-shrink-0 rounded-sm opacity-70" style={{ backgroundColor: s.color }} />,
              s.name
            )
          )}
          {equipment.length > 0 && sectionTitle(tr('Equipos', 'Machines'))}
          {equipment.map((e) =>
            listRow(
              e.id,
              statusDot(e.status),
              e.name,
              <>
                <span className="font-mono">{e.code}</span>
                {e.status !== 'active' && (
                  <span style={{ color: EQUIPMENT_STATUS_COLORS[e.status] }}> · {statusLabels[e.status]}</span>
                )}
              </>
            )
          )}
        </>
      )}
    </div>
  );

  const detailBody = (
    <div className="space-y-3">
      {selectedArea && (
        <>
          <div>
            <p className="text-sm font-semibold text-slate-900">{selectedArea.name}</p>
            {selectedArea.id === currentAreaId && (
              <p className="text-xs font-medium text-red-600">{tr('Estás aquí', 'You are here')}</p>
            )}
          </div>
          {selectedArea.description && <p className="text-xs text-slate-600">{selectedArea.description}</p>}
          {selectedArea.id === currentAreaId
            ? hasInterior && (
                <button
                  onClick={() => switchView('interior')}
                  className="flex w-full items-center justify-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  {tr('Ver interior del área', 'View area interior')}
                </button>
              )
            : onGoToArea && (
                <button
                  onClick={() => onGoToArea(selectedArea.id)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  {tr('Ir a esta área del tour', 'Go to this tour area')}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
        </>
      )}

      {selectedZone && (
        <>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm opacity-70" style={{ backgroundColor: selectedZone.color }} />
            <p className="text-sm font-semibold text-slate-900">{selectedZone.name}</p>
          </div>
          {(() => {
            const inZone = equipment.filter((e) => isInside(e.polygon, selectedZone.polygon));
            return inZone.length === 0 ? (
              <p className="text-xs text-slate-500">{tr('Sin equipos en esta zona', 'No machines in this zone')}</p>
            ) : (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
                  {tr('Equipos en esta zona', 'Machines in this zone')}
                </p>
                <div className="space-y-0.5">
                  {inZone.map((e) => listRow(e.id, statusDot(e.status), e.name, <span className="font-mono">{e.code}</span>))}
                </div>
              </div>
            );
          })()}
        </>
      )}

      {selectedEquipment && (
        <>
          <div className="flex items-start gap-3">
            <div
              className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${EQUIPMENT_STATUS_COLORS[selectedEquipment.status]}22` }}
            >
              <Wrench className="h-4 w-4" style={{ color: EQUIPMENT_STATUS_COLORS[selectedEquipment.status] }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">{selectedEquipment.name}</p>
              <p className="text-xs text-slate-500">
                <span className="font-mono">{selectedEquipment.code}</span> · {typeLabels[selectedEquipment.type]}
              </p>
            </div>
          </div>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{
              backgroundColor: `${EQUIPMENT_STATUS_COLORS[selectedEquipment.status]}1A`,
              color: EQUIPMENT_STATUS_COLORS[selectedEquipment.status],
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: EQUIPMENT_STATUS_COLORS[selectedEquipment.status] }}
            />
            {statusLabels[selectedEquipment.status]}
          </span>
          {zoneOf(selectedEquipment) && (
            <p className="flex items-center gap-1.5 text-xs text-slate-600">
              <MapPin className="h-3 w-3 text-slate-400" />
              {zoneOf(selectedEquipment)!.name}
            </p>
          )}
          {selectedEquipment.usedIn.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {tr('Se usa en', 'Used in')}
              </p>
              <ul className="mt-1 space-y-0.5">
                {selectedEquipment.usedIn.map((use) => (
                  <li key={use} className="flex items-center gap-1.5 text-xs text-slate-700">
                    <Package className="h-3 w-3 text-slate-400 flex-shrink-0" />
                    {use}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );

  const summary =
    view === 'interior' ? (
      <p className="px-2 text-[11px] text-slate-500">
        {subAreas.length} {tr('zonas', 'zones')} · {equipment.length} {tr('equipos', 'machines')}
        {unavailable > 0 && (
          <span className="text-amber-700">
            {' '}
            · {unavailable} {tr('no disponibles', 'unavailable')}
          </span>
        )}
      </p>
    ) : null;

  // ---------- Render ----------
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Header + view switch */}
      <div className="bg-slate-800 px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="w-4 h-4 text-white flex-shrink-0" />
          <h3 className="text-white text-xs font-semibold truncate">
            {view === 'plant'
              ? tr('Plano de la Planta', 'Plant Layout')
              : `${tr('Interior', 'Inside')}: ${currentArea?.name}`}
          </h3>
        </div>
        {hasInterior && (
          <div className="flex rounded-md bg-slate-700 p-0.5 text-[11px] font-medium flex-shrink-0">
            <button
              onClick={() => switchView('plant')}
              className={`flex items-center gap-1 px-2 py-1 rounded ${
                view === 'plant' ? 'bg-white text-slate-900' : 'text-slate-200 hover:text-white'
              }`}
            >
              <Building2 className="w-3 h-3" />
              {tr('Planta', 'Plant')}
            </button>
            <button
              onClick={() => switchView('interior')}
              className={`flex items-center gap-1 px-2 py-1 rounded ${
                view === 'interior' ? 'bg-white text-slate-900' : 'text-slate-200 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3 h-3" />
              {tr('Interior', 'Inside')}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Map — `isolate` keeps Leaflet panes below the sticky tour header */}
        <div className="relative isolate h-80 sm:h-[26rem] lg:flex-1">
          {view === 'plant' || !interiorView ? (
            <LayoutMap
              key={`plant-${currentAreaId}`}
              imageUrl={plantImageUrl}
              areas={plantAreas}
              onAreaClick={(a) => setSelectedId(a.id)}
              selectedAreaId={selectedId ?? currentAreaId}
              showAreaLabels
              labelMode="hover"
              highlightedId={hoveredId}
              onShapeHover={setHoveredId}
              scrollWheelZoom={false}
            />
          ) : (
            <LayoutMap
              key={`interior-${currentAreaId}`}
              imageUrl={plantImageUrl}
              imageBounds={interiorView.imageBounds}
              outline={interiorView.outline}
              areas={interiorView.subAreas}
              onAreaClick={(a) => setSelectedId(a.id)}
              selectedAreaId={selectedZone?.id ?? null}
              showAreaLabels
              labelMode="hover"
              footprints={interiorView.footprints}
              onFootprintClick={(fp) => setSelectedId(fp.id)}
              selectedFootprintId={selectedEquipment?.id ?? null}
              highlightedId={hoveredId}
              onShapeHover={setHoveredId}
              colorByStatus
              statusLabels={statusLabels}
              scrollWheelZoom={false}
            />
          )}

          {/* Shortcut to the interior from the plant view */}
          {view === 'plant' && hasInterior && !hasSelection && (
            <button
              onClick={() => switchView('interior')}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg hover:bg-blue-700"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              {tr('Ver interior del área', 'View area interior')}
            </button>
          )}
        </div>

        {/* Side panel (desktop) / list under the map (mobile) */}
        <div className="border-t border-slate-200 lg:border-t-0 lg:border-l lg:w-72 lg:h-[26rem] lg:overflow-y-auto">
          {isDesktop && hasSelection ? (
            <div className="p-3">
              <button
                onClick={() => setSelectedId(null)}
                className="mb-3 flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {tr('Volver a la lista', 'Back to list')}
              </button>
              {detailBody}
            </div>
          ) : (
            <div className="p-2">
              {list}
              {summary && <div className="mt-2 border-t border-slate-100 pt-2">{summary}</div>}
            </div>
          )}
        </div>
      </div>

      {/* Bottom sheet with the detail (mobile) */}
      {!isDesktop && hasSelection && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-900/30" onClick={() => setSelectedId(null)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[70vh] overflow-y-auto rounded-t-2xl bg-white p-4 pb-8 shadow-2xl">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-300" />
            <button
              onClick={() => setSelectedId(null)}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              aria-label={tr('Cerrar', 'Close')}
            >
              <X className="h-5 w-5" />
            </button>
            {detailBody}
          </div>
        </div>
      )}
    </div>
  );
};

export default TourLayoutViewer;

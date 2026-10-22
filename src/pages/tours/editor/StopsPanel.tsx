import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Map as MapIcon, Plus, Settings2, Trash2 } from 'lucide-react';
import SortableList from '../../../components/ui/SortableList';
import LayoutMap from '../../layouts/LayoutMap';
import { getLayouts } from '../../../api/layouts';
import { getAreasByLayout, type AreaPhysicalRepresentation } from '../../../api/areaRepresentations';
import type { BuilderStop } from '../../../api/tourBuilder';

interface StopsPanelProps {
  plantId: string;
  stops: BuilderStop[];
  selectedStopId: string | null; // null = tour settings
  onSelect: (stopId: string | null) => void;
  onAdd: () => void;
  onAddArea: (areaId: string) => void;
  onMove: (from: number, to: number) => void;
  onDelete: (stop: BuilderStop) => void;
}

const IN_TOUR_COLOR = '#2563EB';
const OTHER_AREA_COLOR = '#94A3B8';

const centroid = (ring: number[][]) => {
  const pts = ring.length > 1 ? ring.slice(0, -1) : ring; // closed ring repeats the first point
  return [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
};

const StopsPanel = ({ plantId, stops, selectedStopId, onSelect, onAdd, onAddArea, onMove, onDelete }: StopsPanelProps) => {
  // Plant layout for the mini map (ground floor first)
  const { data: layouts = [] } = useQuery({
    queryKey: ['layouts', plantId, 'all'],
    queryFn: () => getLayouts({ plant_id: plantId }),
  });
  const layout = layouts.find((l) => l.floor_level === 0) || layouts[0];

  const { data: representations = [] } = useQuery({
    queryKey: ['layout-areas', layout?.id],
    queryFn: () => getAreasByLayout(layout!.id),
    enabled: !!layout?.id,
  });

  const stopNumberByArea = useMemo(() => {
    const map = new Map<string, number>();
    stops.forEach((s, i) => s.organizational_area_id && map.set(s.organizational_area_id, i + 1));
    return map;
  }, [stops]);

  const mapAreas = useMemo<AreaPhysicalRepresentation[]>(
    () =>
      representations.map((rep) => {
        const number = stopNumberByArea.get(rep.organizational_area_id);
        const name = rep.display_name || rep.organizational_area?.name || '';
        return {
          ...rep,
          display_name: number ? `${number}. ${name}` : name,
          display_color: number ? IN_TOUR_COLOR : OTHER_AREA_COLOR,
        };
      }),
    [representations, stopNumberByArea]
  );

  const route = useMemo(
    () =>
      stops
        .map((s) => representations.find((r) => r.organizational_area_id === s.organizational_area_id))
        .filter((r): r is AreaPhysicalRepresentation => !!r?.geometry?.coordinates?.[0])
        .map((r) => centroid(r.geometry.coordinates[0])),
    [stops, representations]
  );

  const selectedStop = stops.find((s) => s.id === selectedStopId);
  const selectedRep = representations.find((r) => r.organizational_area_id === selectedStop?.organizational_area_id);

  const handleMapClick = (rep: AreaPhysicalRepresentation) => {
    const stop = stops.find((s) => s.organizational_area_id === rep.organizational_area_id);
    if (stop) onSelect(stop.id);
    else onAddArea(rep.organizational_area_id);
  };

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Tour settings entry */}
      <button
        onClick={() => onSelect(null)}
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors ${
          selectedStopId === null ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
        }`}
      >
        <Settings2 className="h-4 w-4" />
        Ajustes del tour
      </button>

      {/* Stops */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
          <h3 className="text-sm font-semibold text-gray-900">Paradas ({stops.length})</h3>
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar
          </button>
        </div>

        {stops.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-gray-500">
            Agrega áreas con el botón <strong>Agregar</strong> o haciendo clic en ellas en el plano.
          </p>
        ) : (
          <SortableList
            items={stops}
            getKey={(s) => s.id}
            onMove={onMove}
            className="max-h-80 overflow-y-auto p-1.5"
            handleLabel="Arrastra para cambiar el orden de la parada"
            renderItem={(stop, index) => {
              const isSelected = stop.id === selectedStopId;
              return (
                <div
                  className={`group flex items-center gap-2 rounded-md px-2 py-1.5 ${
                    isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <button onClick={() => onSelect(stop.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                    <span
                      className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-sm ${isSelected ? 'font-semibold text-blue-800' : 'text-gray-800'}`}>
                        {stop.title_translations.es || stop.area_name || 'Sin título'}
                      </span>
                      <span className="block truncate text-[11px] text-gray-500">
                        {stop.area_available ? stop.area_code || stop.area_name : 'Área no disponible'}
                      </span>
                    </span>
                    {!stop.area_available && <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-500" />}
                  </button>
                  <button
                    onClick={() => onDelete(stop)}
                    className="rounded p-1 text-gray-300 opacity-0 hover:bg-red-50 hover:text-red-600 focus:opacity-100 group-hover:opacity-100"
                    aria-label={`Quitar parada ${index + 1}`}
                    title="Quitar parada"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            }}
          />
        )}
      </div>

      {/* Mini map with the route */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
          <MapIcon className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">Ruta en el plano</h3>
        </div>
        {layout ? (
          <>
            <div className="relative isolate h-64">
              <LayoutMap
                key={layout.id}
                imageUrl={layout.layout_image_url}
                areas={mapAreas}
                onAreaClick={handleMapClick}
                selectedAreaId={selectedRep?.id ?? null}
                showAreaLabels
                labelMode="hover"
                route={route}
                scrollWheelZoom={false}
              />
            </div>
            <p className="px-3 py-2 text-[11px] text-gray-500">
              <span className="font-medium text-blue-700">Azul:</span> en el tour. Clic en un área gris para agregarla.
            </p>
          </>
        ) : (
          <p className="px-3 py-6 text-center text-xs text-gray-500">
            Esta planta no tiene un plano cargado. Puedes agregar paradas con el botón <strong>Agregar</strong>.
          </p>
        )}
      </div>
    </div>
  );
};

export default StopsPanel;

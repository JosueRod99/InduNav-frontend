import { useMemo, useState } from 'react';
import { Layers } from 'lucide-react';
import { liveOutlines, plantImageBoundsForCrop } from '../../../utils/areaLayout';
import { ringArea, zonesOf } from '../../../utils/areaGeometry';
import { floorLabel } from '../../../utils/floors';
import type { TourLanguage } from '../../../api/tourBuilder';
import { tr, type TourView, type TourViewPlantLayout, type TourViewStop } from '../../../api/tourView';
import TourMapViewer, { type ViewerArea, type ViewerInterior } from '../components/TourMapViewer';

interface LocationSectionProps {
  view: TourView;
  stop: TourViewStop;
  language: TourLanguage;
  onGoToArea: (areaId: string) => void;
}

// Surface the area covers on a floor's plan (sum of its zones)
const areaSurface = (layout: TourViewPlantLayout, areaId: string) =>
  layout.areas.filter((a) => a.area_id === areaId).reduce((sum, a) => sum + zonesOf(a.geometry).reduce((s, ring) => s + ringArea(ring), 0), 0);

const LocationSection = ({ view, stop, language, onGoToArea }: LocationSectionProps) => {
  // Older responses only have the ground floor
  const plantLayouts = useMemo(() => view.plant_layouts ?? (view.plant_layout ? [view.plant_layout] : []), [view]);

  // Floors where the area is drawn, the one where it covers more space first
  const floors = useMemo(() => {
    if (!stop.area_id) return [];
    return plantLayouts
      .filter((layout) => layout.areas.some((a) => a.area_id === stop.area_id))
      .sort((a, b) => areaSurface(b, stop.area_id!) - areaSurface(a, stop.area_id!))
      .map((layout) => layout.floor_level ?? 0);
  }, [plantLayouts, stop.area_id]);

  const [chosenFloor, setChosenFloor] = useState<number | null>(null);
  const floor = chosenFloor !== null && floors.includes(chosenFloor) ? chosenFloor : floors[0];
  // Area not drawn anywhere: the ground floor plan, with nothing highlighted
  const plantLayout = plantLayouts.find((layout) => (layout.floor_level ?? 0) === floor) ?? plantLayouts[0] ?? null;

  const areas = useMemo<ViewerArea[]>(
    () =>
      (plantLayout?.areas || []).map((a) => {
        // Prefer the stop title (translated) for areas that are part of the tour
        const tourStop = view.stops.find((s) => s.area_id === a.area_id);
        return {
          id: a.area_id,
          name: tourStop ? tr(tourStop.title, language) || a.name : a.name,
          zones: zonesOf(a.geometry),
          description: tourStop ? tr(tourStop.content.narrative, language).slice(0, 160) || undefined : undefined,
        };
      }),
    [plantLayout, view.stops, language]
  );

  const interior = useMemo<ViewerInterior | null>(() => {
    // Internal layout of the floor shown (older responses: the only one)
    const interiors = stop.live.interiors ?? (stop.live.interior ? [stop.live.interior] : []);
    const data = interiors.find((i) => (i.floor_level ?? 0) === (floor ?? 0)) ?? (floors.length <= 1 ? interiors[0] : undefined);
    if (!data) return null;
    const layoutData = data.layout_data || {};

    // Background of the internal layout: crop of the plant plan, its own image, or blank
    let imageUrl: string | null = null;
    let imageBounds: ViewerInterior['imageBounds'];
    if (layoutData.source === 'plant_crop' && layoutData.crop) {
      imageUrl = plantLayout?.image_url || layoutData.plant_image_url || null;
      imageBounds = plantImageBoundsForCrop(layoutData.crop);
    } else if (layoutData.source === 'image') {
      imageUrl = data.image_url;
    }

    return {
      imageUrl,
      imageBounds,
      // Zones of the area, live from its current drawing on the plant (see liveOutlines)
      outlines: liveOutlines(layoutData, plantLayout?.areas.find((a) => a.area_id === stop.area_id)?.geometry),
      subAreas: data.sub_areas.map((s) => ({
        id: s.id,
        name: s.name,
        color: s.color || undefined,
        zones: zonesOf(s.geometry),
      })),
      equipment: data.footprints.map((f) => {
        const details = stop.live.equipment.find((e) => e.id === f.id);
        return {
          id: f.id,
          code: f.code,
          name: f.name,
          type: f.equipment_type,
          status: f.status,
          polygon: f.geometry.coordinates[0],
          usedIn: (details?.used_in || []).map(
            (u) => `${u.product} · ${language === 'es' ? 'Paso' : 'Step'} ${u.step_number} · ${u.step_name}`
          ),
        };
      }),
    };
  }, [stop, plantLayout, floor, floors.length, language]);

  if (!stop.area_id) return null;

  return (
    <div className="space-y-3">
      {floors.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
            <Layers className="h-4 w-4" />
            {language === 'es' ? `Esta área está en ${floors.length} pisos:` : `This area spans ${floors.length} floors:`}
          </span>
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={language === 'es' ? 'Piso' : 'Floor'}>
            {floors.map((level) => (
              <button
                key={level}
                role="tab"
                aria-selected={level === floor}
                onClick={() => setChosenFloor(level)}
                className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                  level === floor ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {floorLabel(level, language)}
              </button>
            ))}
          </div>
        </div>
      )}
      <TourMapViewer
        // A different floor is a different map: start again from the plant view
        key={floor ?? 'none'}
        plantImageUrl={plantLayout?.image_url || null}
        areas={areas}
        currentAreaId={stop.area_id}
        interior={interior}
        language={language}
        onGoToArea={onGoToArea}
        tourAreaIds={new Set(view.stops.map((s) => s.area_id).filter((id): id is string => !!id))}
      />
    </div>
  );
};

export default LocationSection;

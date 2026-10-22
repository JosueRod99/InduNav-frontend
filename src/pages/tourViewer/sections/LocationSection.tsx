import { useMemo } from 'react';
import { plantImageBoundsForCrop } from '../../../utils/areaLayout';
import type { TourLanguage } from '../../../api/tourBuilder';
import { tr, type TourView, type TourViewStop } from '../../../api/tourView';
import TourMapViewer, { type ViewerArea, type ViewerInterior } from '../components/TourMapViewer';

interface LocationSectionProps {
  view: TourView;
  stop: TourViewStop;
  language: TourLanguage;
  onGoToArea: (areaId: string) => void;
}

const LocationSection = ({ view, stop, language, onGoToArea }: LocationSectionProps) => {
  const areas = useMemo<ViewerArea[]>(
    () =>
      (view.plant_layout?.areas || []).map((a) => {
        // Prefer the stop title (translated) for areas that are part of the tour
        const tourStop = view.stops.find((s) => s.area_id === a.area_id);
        return {
          id: a.area_id,
          name: tourStop ? tr(tourStop.title, language) || a.name : a.name,
          polygon: a.geometry.coordinates[0],
          description: tourStop ? tr(tourStop.content.narrative, language).slice(0, 160) || undefined : undefined,
        };
      }),
    [view, language]
  );

  const interior = useMemo<ViewerInterior | null>(() => {
    const data = stop.live.interior;
    if (!data) return null;
    const layoutData = data.layout_data || {};

    // Background of the internal layout: crop of the plant plan, its own image, or blank
    let imageUrl: string | null = null;
    let imageBounds: ViewerInterior['imageBounds'];
    if (layoutData.source === 'plant_crop' && layoutData.crop) {
      imageUrl = view.plant_layout?.image_url || layoutData.plant_image_url || null;
      imageBounds = plantImageBoundsForCrop(layoutData.crop);
    } else if (layoutData.source === 'image') {
      imageUrl = data.image_url;
    }

    return {
      imageUrl,
      imageBounds,
      outline: layoutData.outline || null,
      subAreas: data.sub_areas.map((s) => ({
        id: s.id,
        name: s.name,
        color: s.color || undefined,
        polygon: s.geometry.coordinates[0],
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
  }, [stop, view.plant_layout, language]);

  if (!stop.area_id) return null;

  return (
    <TourMapViewer
      plantImageUrl={view.plant_layout?.image_url || null}
      areas={areas}
      currentAreaId={stop.area_id}
      interior={interior}
      language={language}
      onGoToArea={onGoToArea}
      tourAreaIds={new Set(view.stops.map((s) => s.area_id).filter((id): id is string => !!id))}
    />
  );
};

export default LocationSection;

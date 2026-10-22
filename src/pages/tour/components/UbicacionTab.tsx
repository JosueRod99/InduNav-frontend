import { useMemo } from 'react';
import type { DemoArea, MultiLangText } from '../../../demo/tourData';
import { getText } from '../../../demo/tourData';
import type { AreaLayout } from '../../../demo/enhancedTourData';
import { DEMO_PLANT_IMAGE_URL, getDemoAreaLayout } from '../../../demo/tourLayoutData';
import TourLayoutViewer, { type ViewerArea } from './TourLayoutViewer';
import { MapPin } from 'lucide-react';

interface UbicacionTabProps {
  content: MultiLangText;
  layout: AreaLayout; // legacy photo + highlighted zone, used when the area has no layout data
  language: 'es' | 'en';
  areaId: string;
  tourAreas: DemoArea[];
  onGoToArea?: (areaId: string) => void;
}

const UbicacionTab = ({ content, layout, language, areaId, tourAreas, onGoToArea }: UbicacionTabProps) => {
  const text = content[language];
  const demoLayout = getDemoAreaLayout(areaId);

  const viewerAreas = useMemo<ViewerArea[]>(
    () =>
      tourAreas.flatMap((area) => {
        const areaLayout = getDemoAreaLayout(area.id);
        return areaLayout
          ? [
              {
                id: area.id,
                name: getText(area.name, language),
                description: getText(area.shortDescription, language),
                polygon: areaLayout.plantPolygon,
              },
            ]
          : [];
      }),
    [tourAreas, language]
  );

  const interior = useMemo(
    () =>
      demoLayout && {
        subAreas: demoLayout.subAreas.map((s) => ({ ...s, name: getText(s.name, language) })),
        equipment: demoLayout.equipment.map((e) => ({
          ...e,
          name: getText(e.name, language),
          usedIn: e.usedIn.map((u) => getText(u, language)),
        })),
      },
    [demoLayout, language]
  );

  return (
    <div className="space-y-4">
      {demoLayout ? (
        <TourLayoutViewer
          plantImageUrl={DEMO_PLANT_IMAGE_URL}
          areas={viewerAreas}
          currentAreaId={areaId}
          interior={interior}
          language={language}
          onGoToArea={onGoToArea}
        />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="bg-slate-800 px-3 py-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-white" />
            <h3 className="text-white text-xs font-semibold">
              {language === 'es' ? 'Plano del Área' : 'Area Layout'}
            </h3>
          </div>

          <div className="relative">
            <img src={layout.imageUrl} alt="Layout" className="w-full h-64 object-cover" />

            {/* Highlighted Zone Overlay */}
            <div
              className="absolute border-2 border-red-500 bg-red-500 bg-opacity-10 rounded animate-pulse"
              style={{
                left: `${layout.highlightedZone.x}%`,
                top: `${layout.highlightedZone.y}%`,
                width: `${layout.highlightedZone.width}%`,
                height: `${layout.highlightedZone.height}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Location Details */}
      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
        <p className="text-xs text-slate-700 leading-relaxed">{text}</p>
      </div>
    </div>
  );
};

export default UbicacionTab;

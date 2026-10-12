import type { MultiLangText } from '../../../demo/tourData';
import type { AreaLayout } from '../../../demo/enhancedTourData';
import { MapPin } from 'lucide-react';

interface UbicacionTabProps {
  content: MultiLangText;
  layout: AreaLayout;
  language: 'es' | 'en';
}

const UbicacionTab = ({ content, layout, language }: UbicacionTabProps) => {
  const text = content[language];

  return (
    <div className="space-y-4">
      {/* Layout Map */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="bg-slate-800 px-3 py-2 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-white" />
          <h3 className="text-white text-xs font-semibold">
            {language === 'es' ? 'Plano del Área' : 'Area Layout'}
          </h3>
        </div>

        <div className="relative">
          <img
            src={layout.imageUrl}
            alt="Layout"
            className="w-full h-64 object-cover"
          />

          {/* Highlighted Zone Overlay */}
          <div
            className="absolute border-2 border-red-500 bg-red-500 bg-opacity-10 rounded animate-pulse"
            style={{
              left: `${layout.highlightedZone.x}%`,
              top: `${layout.highlightedZone.y}%`,
              width: `${layout.highlightedZone.width}%`,
              height: `${layout.highlightedZone.height}%`,
            }}
          >
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-2 py-1 rounded shadow-lg whitespace-nowrap">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3" />
                <span className="text-xs font-semibold">
                  {language === 'es' ? 'Área Actual' : 'Current Area'}
                </span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="absolute bottom-2 right-2 bg-white bg-opacity-95 rounded p-2 shadow">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 border-2 border-red-500 bg-red-500 bg-opacity-10 rounded"></div>
              <span className="text-xs font-medium text-slate-700">
                {language === 'es' ? 'Ubicación' : 'Location'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Location Details */}
      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
        <p className="text-xs text-slate-700 leading-relaxed">
          {text}
        </p>
      </div>
    </div>
  );
};

export default UbicacionTab;

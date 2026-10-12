import type { AreaSpecification } from '../../../demo/enhancedTourData';
import { CheckCircle } from 'lucide-react';

interface EspecificacionesTabProps {
  specifications: AreaSpecification[];
  language: 'es' | 'en';
}

const EspecificacionesTab = ({ specifications, language }: EspecificacionesTabProps) => {
  return (
    <div className="space-y-4">
      {/* Specifications Grid */}
      <div className="grid md:grid-cols-2 gap-3">
        {specifications.map((spec, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm border border-slate-200 hover:border-blue-300 transition-colors"
          >
            <div className="p-3">
              <div className="flex items-start gap-3">
                {/* Icon */}
                {spec.icon && (
                  <div className="flex-shrink-0 text-2xl">
                    {spec.icon}
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                    {spec.key[language]}
                  </h4>
                  <p className="text-lg font-bold text-slate-900">
                    {spec.value}
                  </p>
                </div>

                {/* Check Icon */}
                <div className="flex-shrink-0">
                  <div className="bg-blue-50 rounded-full p-1">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Certification Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4 text-white">
        <h4 className="text-base font-bold mb-2">
          {language === 'es' ? 'Área Certificada' : 'Certified Area'}
        </h4>
        <p className="text-xs text-blue-100 mb-3">
          {language === 'es'
            ? 'Cumple con estándares internacionales de calidad y seguridad'
            : 'Meets international quality and safety standards'}
        </p>
        <div className="flex gap-2">
          <div className="bg-white bg-opacity-20 backdrop-blur rounded p-2 text-center flex-1">
            <div className="text-lg font-bold">ISO</div>
            <div className="text-xs">9001</div>
          </div>
          <div className="bg-white bg-opacity-20 backdrop-blur rounded p-2 text-center flex-1">
            <div className="text-lg font-bold">IATF</div>
            <div className="text-xs">16949</div>
          </div>
          <div className="bg-white bg-opacity-20 backdrop-blur rounded p-2 text-center flex-1">
            <div className="text-lg font-bold">ISO</div>
            <div className="text-xs">14001</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EspecificacionesTab;

import type { MultiLangText } from '../../../demo/tourData';
import { CheckCircle, Users, Zap } from 'lucide-react';

interface ResumenTabProps {
  content: MultiLangText;
  language: 'es' | 'en';
}

const ResumenTab = ({ content, language }: ResumenTabProps) => {
  const text = content[language];
  const paragraphs = text.split('\n\n').filter(p => p.trim());

  return (
    <div className="space-y-4">
      {/* Content */}
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <div className="prose max-w-none">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="text-sm text-slate-700 leading-relaxed mb-3 last:mb-0">
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      {/* Key Highlights */}
      <div className="grid md:grid-cols-3 gap-3">
        <div className="bg-white rounded-md p-3 border border-slate-200 hover:border-blue-300 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-semibold text-slate-900">{language === 'es' ? 'Operación 24/7' : '24/7 Operation'}</h4>
          </div>
          <p className="text-xs text-slate-600">
            {language === 'es'
              ? 'Producción continua garantizada'
              : 'Continuous production guaranteed'}
          </p>
        </div>

        <div className="bg-white rounded-md p-3 border border-slate-200 hover:border-blue-300 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-semibold text-slate-900">{language === 'es' ? 'Equipo Certificado' : 'Certified Team'}</h4>
          </div>
          <p className="text-xs text-slate-600">
            {language === 'es'
              ? 'Personal capacitado y certificado'
              : 'Trained and certified personnel'}
          </p>
        </div>

        <div className="bg-white rounded-md p-3 border border-slate-200 hover:border-blue-300 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-semibold text-slate-900">{language === 'es' ? 'Tecnología Avanzada' : 'Advanced Technology'}</h4>
          </div>
          <p className="text-xs text-slate-600">
            {language === 'es'
              ? 'Equipamiento de última generación'
              : 'State-of-the-art equipment'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResumenTab;

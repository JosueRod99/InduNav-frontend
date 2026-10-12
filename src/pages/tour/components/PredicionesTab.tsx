import type { MultiLangText } from '../../../demo/tourData';
import { TrendingUp, CheckCircle, AlertCircle, Target } from 'lucide-react';

interface PredicionesTabProps {
  content: MultiLangText;
  language: 'es' | 'en';
}

const PredicionesTab = ({ content, language }: PredicionesTabProps) => {
  const text = content[language];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
        <p className="text-xs text-slate-700 leading-relaxed">
          {text}
        </p>
      </div>

      {/* Forecast Cards */}
      <div className="grid md:grid-cols-3 gap-3">
        <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-blue-50 rounded p-1.5">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              +12%
            </span>
          </div>
          <h4 className="text-xs font-medium text-slate-600 mb-1">
            {language === 'es' ? 'Crecimiento Esperado' : 'Expected Growth'}
          </h4>
          <p className="text-2xl font-bold text-slate-900">Q3 2026</p>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'es' ? 'vs trimestre anterior' : 'vs previous quarter'}
          </p>
        </div>

        <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-emerald-50 rounded p-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
              {language === 'es' ? 'Estable' : 'Stable'}
            </span>
          </div>
          <h4 className="text-xs font-medium text-slate-600 mb-1">
            {language === 'es' ? 'Eficiencia Operativa' : 'Operational Efficiency'}
          </h4>
          <p className="text-2xl font-bold text-slate-900">98.5%</p>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'es' ? 'proyectado 2026' : 'projected 2026'}
          </p>
        </div>

        <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-orange-50 rounded p-1.5">
              <Target className="w-4 h-4 text-orange-600" />
            </div>
            <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
              {language === 'es' ? 'Optimizado' : 'Optimized'}
            </span>
          </div>
          <h4 className="text-xs font-medium text-slate-600 mb-1">
            {language === 'es' ? 'Reducción de Costos' : 'Cost Reduction'}
          </h4>
          <p className="text-2xl font-bold text-slate-900">8.2%</p>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'es' ? 'próximo año fiscal' : 'next fiscal year'}
          </p>
        </div>
      </div>

      {/* Trend Analysis */}
      <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-200">
        <h4 className="text-xs font-semibold text-slate-900 mb-3">
          {language === 'es' ? 'Análisis de Tendencias' : 'Trend Analysis'}
        </h4>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h5 className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              {language === 'es' ? 'Factores Positivos' : 'Positive Factors'}
            </h5>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-1.5 text-xs text-slate-600">
                <CheckCircle className="w-3 h-3 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>
                  {language === 'es'
                    ? 'Inversión en nueva tecnología automatizada'
                    : 'Investment in new automated technology'}
                </span>
              </li>
              <li className="flex items-start gap-1.5 text-xs text-slate-600">
                <CheckCircle className="w-3 h-3 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>
                  {language === 'es'
                    ? 'Capacitación continua del personal'
                    : 'Continuous staff training'}
                </span>
              </li>
              <li className="flex items-start gap-1.5 text-xs text-slate-600">
                <CheckCircle className="w-3 h-3 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>
                  {language === 'es'
                    ? 'Optimización de procesos lean'
                    : 'Lean process optimization'}
                </span>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h5 className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              {language === 'es' ? 'Áreas de Oportunidad' : 'Opportunity Areas'}
            </h5>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-1.5 text-xs text-slate-600">
                <AlertCircle className="w-3 h-3 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  {language === 'es'
                    ? 'Reducir tiempos de cambio'
                    : 'Reduce changeover times'}
                </span>
              </li>
              <li className="flex items-start gap-1.5 text-xs text-slate-600">
                <AlertCircle className="w-3 h-3 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  {language === 'es'
                    ? 'Mantenimiento predictivo'
                    : 'Predictive maintenance'}
                </span>
              </li>
              <li className="flex items-start gap-1.5 text-xs text-slate-600">
                <AlertCircle className="w-3 h-3 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  {language === 'es'
                    ? 'Expandir capacidad de almacenamiento'
                    : 'Expand storage capacity'}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Future Goals */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4 text-white">
        <h4 className="text-base font-bold mb-3">
          {language === 'es' ? 'Objetivos Estratégicos 2026-2027' : 'Strategic Goals 2026-2027'}
        </h4>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white bg-opacity-20 backdrop-blur rounded p-2 text-center">
            <div className="text-2xl font-bold mb-0.5">15%</div>
            <div className="text-xs text-blue-100">
              {language === 'es' ? 'Aumento Capacidad' : 'Capacity Increase'}
            </div>
          </div>
          <div className="bg-white bg-opacity-20 backdrop-blur rounded p-2 text-center">
            <div className="text-2xl font-bold mb-0.5">25%</div>
            <div className="text-xs text-blue-100">
              {language === 'es' ? 'Reducción CO₂' : 'CO₂ Reduction'}
            </div>
          </div>
          <div className="bg-white bg-opacity-20 backdrop-blur rounded p-2 text-center">
            <div className="text-2xl font-bold mb-0.5">100%</div>
            <div className="text-xs text-blue-100">
              {language === 'es' ? 'Digitalización' : 'Digitalization'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredicionesTab;

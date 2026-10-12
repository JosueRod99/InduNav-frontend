import type { MultiLangText } from '../../../demo/tourData';
import type { AreaMetric } from '../../../demo/enhancedTourData';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricasTabProps {
  content: MultiLangText;
  metrics: AreaMetric[];
  chartData: { month: string; value: number }[];
  language: 'es' | 'en';
}

const MetricasTab = ({ content, metrics, chartData, language }: MetricasTabProps) => {
  const text = content[language];
  const maxValue = Math.max(...chartData.map(d => d.value));

  return (
    <div className="space-y-4">
      {/* Overview */}
      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
        <p className="text-xs text-slate-700 leading-relaxed">
          {text}
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid md:grid-cols-2 gap-3">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-3 border border-slate-200">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="text-xs font-medium text-slate-600 mb-1">
                  {metric.label[language]}
                </h4>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold" style={{ color: metric.color }}>
                    {metric.value}
                  </span>
                  <span className="text-sm text-slate-500">{metric.unit}</span>
                </div>
              </div>

              {/* Trend Indicator */}
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
                metric.trend === 'up' ? 'bg-emerald-100 text-emerald-700' :
                metric.trend === 'down' ? 'bg-red-100 text-red-700' :
                'bg-slate-100 text-slate-700'
              }`}>
                {metric.trend === 'up' ? (
                  <TrendingUp className="w-3 h-3" />
                ) : metric.trend === 'down' ? (
                  <TrendingDown className="w-3 h-3" />
                ) : (
                  <Minus className="w-3 h-3" />
                )}
                <span className="text-xs font-semibold">
                  {metric.trend === 'up' ? '+' : metric.trend === 'down' ? '-' : '='}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            {metric.target && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>{language === 'es' ? 'Meta' : 'Target'}: {metric.target}{metric.unit}</span>
                  <span className="font-semibold">{Math.round((metric.value / metric.target) * 100)}%</span>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((metric.value / metric.target) * 100, 100)}%`,
                      backgroundColor: metric.color,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Trend Chart */}
      <div className="bg-white rounded-lg shadow-sm p-3 border border-slate-200">
        <h4 className="text-xs font-semibold text-slate-900 mb-3">
          {language === 'es' ? 'Tendencia (6 meses)' : '6-Month Trend'}
        </h4>

        <div className="space-y-2">
          {chartData.map((data, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-8 text-xs font-medium text-slate-700">
                {data.month}
              </div>
              <div className="flex-1 flex items-center gap-1.5">
                <div className="flex-1 bg-slate-100 rounded h-6 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded flex items-center justify-end pr-2 transition-all duration-500"
                    style={{ width: `${(data.value / maxValue) * 100}%` }}
                  >
                    <span className="text-white text-xs font-semibold">
                      {data.value}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chart Summary */}
        <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-bold text-blue-600">
              {Math.min(...chartData.map(d => d.value))}
            </div>
            <div className="text-xs text-slate-600">{language === 'es' ? 'Mín' : 'Min'}</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-700">
              {Math.round(chartData.reduce((sum, d) => sum + d.value, 0) / chartData.length)}
            </div>
            <div className="text-xs text-slate-600">{language === 'es' ? 'Prom' : 'Avg'}</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-800">
              {Math.max(...chartData.map(d => d.value))}
            </div>
            <div className="text-xs text-slate-600">{language === 'es' ? 'Máx' : 'Max'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricasTab;

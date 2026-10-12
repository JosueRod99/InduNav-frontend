import type { MultiLangText } from '../../../demo/tourData';
import type { AreaEmployee } from '../../../demo/enhancedTourData';
import { Mail, Phone, Clock } from 'lucide-react';

interface OrganigramaTabProps {
  content: MultiLangText;
  employees: AreaEmployee[];
  language: 'es' | 'en';
}

const OrganigramaTab = ({ content, employees, language }: OrganigramaTabProps) => {
  const text = content[language];

  return (
    <div className="space-y-4">
      {/* Overview Text */}
      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
        <p className="text-xs text-slate-700 leading-relaxed">
          {text}
        </p>
      </div>

      {/* Team Members */}
      <div className="space-y-3">
        {employees.map((employee, index) => (
          <div
            key={employee.id}
            className="bg-white rounded-lg shadow-sm border border-slate-200 hover:border-blue-300 transition-colors overflow-hidden"
          >
            {/* Colored Top Bar */}
            <div className={`h-1 ${index === 0 ? 'bg-blue-600' : index === 1 ? 'bg-slate-600' : 'bg-slate-400'}`}></div>

            <div className="p-3">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <img
                    src={employee.photo}
                    alt={employee.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-slate-200"
                  />
                  <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white ${
                    index === 0 ? 'bg-blue-600' : 'bg-slate-600'
                  } flex items-center justify-center`}>
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-bold text-slate-900 mb-0.5 truncate">
                    {employee.name}
                  </h5>
                  <p className="text-xs font-medium text-blue-700 mb-2">
                    {employee.position[language]}
                  </p>

                  {/* Contact Info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{employee.email}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span>{employee.phone}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Clock className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span>
                        {employee.yearsInCompany} {language === 'es' ? 'años' : 'years'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Team Stats */}
      <div className="bg-white rounded-lg p-3 border border-slate-200">
        <h4 className="text-xs font-semibold text-slate-900 mb-3">
          {language === 'es' ? 'Estadísticas del Equipo' : 'Team Statistics'}
        </h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-xl font-bold text-blue-700 mb-0.5">
              {employees.length}
            </div>
            <div className="text-xs text-slate-600">
              {language === 'es' ? 'Personal' : 'Personnel'}
            </div>
          </div>
          <div className="text-center border-l border-r border-slate-200">
            <div className="text-xl font-bold text-blue-700 mb-0.5">
              {Math.round(employees.reduce((sum, emp) => sum + emp.yearsInCompany, 0) / employees.length)}
            </div>
            <div className="text-xs text-slate-600">
              {language === 'es' ? 'Años Prom.' : 'Avg Years'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-blue-700 mb-0.5">
              100%
            </div>
            <div className="text-xs text-slate-600">
              {language === 'es' ? 'Certificado' : 'Certified'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganigramaTab;

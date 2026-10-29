import { useQuery } from '@tanstack/react-query';
import { Award, BadgeCheck } from 'lucide-react';
import { formatDate, getEmployeeCertifications, scopeLabel, STATUS_CLASSES, STATUS_LABELS } from '../../api/certifications';

// "Certificaciones" of an employee record: their own (people certifications) and the system ones
// they are covered by (whole company, their plant, their area).

const STATE = {
  valid: { label: 'Vigente', className: 'bg-green-100 text-green-800' },
  expiring: { label: 'Por vencer', className: 'bg-amber-100 text-amber-800' },
  expired: { label: 'Vencida', className: 'bg-red-100 text-red-800' },
};

const EmployeeCertifications = ({ employeeId }: { employeeId: string }) => {
  const { data } = useQuery({ queryKey: ['employee-certifications', employeeId], queryFn: () => getEmployeeCertifications(employeeId) });
  if (!data) return null;
  const empty = !data.own.length && !data.inherited.length;
  return (
    <div>
      <h3 className="mb-3 flex items-center gap-2 text-md font-semibold text-gray-900">
        <Award className="h-5 w-5 text-blue-600" />
        Certificaciones
      </h3>
      {empty ? (
        <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">Sin certificaciones.</p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 text-sm">
          {data.own.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <span className="flex min-w-0 items-center gap-2">
                <BadgeCheck className="h-4 w-4 flex-shrink-0 text-blue-600" />
                <span className="font-medium text-gray-900">{c.name}</span>
                {c.obtained_date && <span className="text-xs text-gray-500">desde {formatDate(c.obtained_date)}</span>}
              </span>
              <span className="flex items-center gap-2 text-xs">
                {c.expiry_date && <span className="text-gray-500">vence {formatDate(c.expiry_date)}</span>}
                {c.expiry_date && <span className={`rounded-full px-2 py-0.5 font-medium ${STATE[c.state].className}`}>{STATE[c.state].label}</span>}
              </span>
            </li>
          ))}
          {data.inherited.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <span className="flex min-w-0 items-center gap-2">
                <Award className="h-4 w-4 flex-shrink-0 text-amber-500" />
                <span className="font-medium text-gray-900">{c.name}</span>
                <span className="text-xs text-gray-500">por {c.scope === 'organization' ? 'la empresa' : scopeLabel(c).toLowerCase().replace(/^planta/, 'la planta').replace(/^área/, 'el área')}</span>
              </span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[c.effective_status]}`}>{STATUS_LABELS[c.effective_status]}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default EmployeeCertifications;

import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Award, BadgeCheck, Loader2 } from 'lucide-react';
import { formatDate, getAreaCertifications, scopeLabel, STATUS_CLASSES, STATUS_LABELS } from '../../../api/certifications';

// "Certificaciones" of an area: system certifications that cover it (whole company, its plant or the
// area itself) and how many of its people hold each people certification. They are managed in the
// plant's Certificaciones tab.

const CertificationsTab = ({ areaId, plantId }: { areaId: string; plantId?: string | null }) => {
  const { data, isLoading } = useQuery({ queryKey: ['area-certifications', areaId], queryFn: () => getAreaCertifications(areaId) });

  if (isLoading || !data) {
    return (
      <p className="flex items-center gap-2 py-6 text-gray-600">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando certificaciones…
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-gray-600">Certificaciones que cubren esta área y personal certificado.</p>
        {plantId && (
          <Link to={`/plants/${plantId}/certificaciones`} className="text-sm font-medium text-blue-600 hover:underline">
            Administrar en Certificaciones de la planta
          </Link>
        )}
      </div>

      <section>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Award className="h-4 w-4 text-amber-500" /> Del área, la planta y la empresa
        </h3>
        {data.system.length === 0 ? (
          <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">Ninguna certificación cubre esta área.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {data.system.map((c) => (
              <li key={c.id} className="rounded-lg border border-gray-200 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-500">{[scopeLabel(c), c.issuing_body].filter(Boolean).join(' · ')}</p>
                  </div>
                  <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[c.effective_status]}`}>{STATUS_LABELS[c.effective_status]}</span>
                </div>
                <p className="mt-2 text-xs text-gray-600">
                  Vence: {formatDate(c.expiry_date)} · Próxima auditoría: {formatDate(c.next_audit_date)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
          <BadgeCheck className="h-4 w-4 text-blue-600" /> Personal certificado del área
        </h3>
        {data.person.length === 0 ? (
          <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">Nadie del área tiene certificaciones de personal registradas.</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 text-sm">
            {data.person.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                <span className="font-medium text-gray-900">{p.name}</span>
                <span className="flex items-center gap-2 text-xs">
                  <span className="text-gray-700">
                    <strong>{p.holders}</strong> de {data.staff} persona{data.staff === 1 ? '' : 's'} del área
                  </span>
                  {p.expiring > 0 && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">{p.expiring} por vencer</span>}
                  {p.expired > 0 && <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-800">{p.expired} vencidas</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default CertificationsTab;

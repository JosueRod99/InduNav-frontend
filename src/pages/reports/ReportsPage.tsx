import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Award, BarChart3, FileText, Users } from 'lucide-react';
import { getOrganizations } from '../../api/organizations';
import { getPlants } from '../../api/plants';
import ScrollTabs from '../../components/ui/ScrollTabs';
import { useAuthStore } from '../../store/authStore';
import CertificationsReport from './CertificationsReport';
import DocumentsReport from './DocumentsReport';
import PersonnelReport from './PersonnelReport';
import VisitsReport from './VisitsReport';
import { selectClass } from './reportStyles';

// Reports to take the information out of the platform: filter, review and download in Excel.
// Platform admins pick the company; for everyone else it is their own. Tab in the URL (?tab=).

const TABS = [
  { id: 'documentos', label: 'Lista maestra de documentos', Icon: FileText },
  { id: 'certificaciones', label: 'Certificaciones', Icon: Award },
  { id: 'personal', label: 'Personal por área', Icon: Users },
  { id: 'visitas', label: 'Visitas a tours', Icon: BarChart3 },
] as const;

const ReportsPage = () => {
  const { user } = useAuthStore();
  const isPlatformAdmin = user?.role?.name === 'platform_admin';
  const [searchParams] = useSearchParams();
  const activeTab = TABS.find((t) => t.id === searchParams.get('tab'))?.id ?? TABS[0].id;
  const [organizationId, setOrganizationId] = useState('');
  const [plantId, setPlantId] = useState('');

  const { data: organizationsData } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => getOrganizations({ limit: 100 }),
    enabled: isPlatformAdmin,
  });
  const organizations = organizationsData?.organizations || [];
  // Platform admins start on the first active company
  useEffect(() => {
    if (isPlatformAdmin && !organizationId && organizations.length > 0) {
      setOrganizationId((organizations.find((o) => o.is_active) ?? organizations[0]).id);
    }
  }, [isPlatformAdmin, organizationId, organizations]);

  const ownOrganizationId = isPlatformAdmin ? organizationId : user?.organization_id || '';
  const { data: plantsData } = useQuery({
    queryKey: ['plants', ownOrganizationId],
    queryFn: () => getPlants({ limit: 100, organization_id: ownOrganizationId }),
    enabled: !!ownOrganizationId,
  });
  const plants = plantsData?.plants || [];
  const plant = plants.find((p) => p.id === plantId);
  const organizationName = organizations.find((o) => o.id === organizationId)?.name || plants[0]?.organization_name;

  const scope = { organization_id: isPlatformAdmin ? organizationId : undefined, plant_id: plantId || undefined };
  const scopeLabel = [organizationName, plant?.name || 'Todas las plantas'].filter(Boolean).join(' · ');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-gray-900">Reportes</h2>
          <p className="mt-1 text-sm text-gray-600">Consulta la información y descárgala en Excel. Lo que filtres es lo que se descarga.</p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
          {isPlatformAdmin && (
            <select
              value={organizationId}
              onChange={(e) => {
                setOrganizationId(e.target.value);
                setPlantId('');
              }}
              aria-label="Empresa"
              className={selectClass}
            >
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          )}
          <select value={plantId} onChange={(e) => setPlantId(e.target.value)} aria-label="Planta" className={selectClass}>
            <option value="">Todas las plantas</option>
            {plants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ScrollTabs label="Reportes">
        {TABS.map(({ id, label, Icon }) => (
          <Link
            key={id}
            to={`?tab=${id}`}
            replace
            aria-current={activeTab === id ? 'page' : undefined}
            className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              activeTab === id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </ScrollTabs>

      {!ownOrganizationId ? (
        <p className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">{isPlatformAdmin ? 'Cargando empresas…' : 'Tu usuario aún no tiene una empresa asignada.'}</p>
      ) : (
        // key: changing company or plant starts the report's filters fresh
        <div key={`${ownOrganizationId}-${plantId}`}>
          {activeTab === 'documentos' && <DocumentsReport scope={scope} scopeLabel={scopeLabel} />}
          {activeTab === 'certificaciones' && <CertificationsReport scope={scope} scopeLabel={scopeLabel} />}
          {activeTab === 'personal' && <PersonnelReport scope={scope} scopeLabel={scopeLabel} />}
          {activeTab === 'visitas' && <VisitsReport scope={scope} scopeLabel={scopeLabel} />}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;

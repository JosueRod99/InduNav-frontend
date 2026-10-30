import { lazy, Suspense, useEffect, useRef } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Factory, Loader2, MapPin } from 'lucide-react';
import { getPlant, getPlants } from '../../api/plants';
import PlantSummaryTab from './PlantSummaryTab';
import PlantSettingsTab from './PlantSettingsTab';
import ToursPage from '../tours/ToursPage'; // also a top-level page: no separate chunk
import { MANAGERS, PLANT_TABS, type PlantTab } from './plantTabs';
import { useAuthStore } from '../../store/authStore';
import { useBackTarget } from '../../hooks/useBackNavigation';

// Plant workspace: everything about one plant behind tabs (/plants/:plantId/:tab). The module
// pages render here with the plant fixed, so there are no repeated organization/plant filters.
// Each tab's code loads only when opened (and is prefetched when hovering its tab).

const loaders = {
  layout: () => import('../layouts/LayoutsPage'),
  areas: () => import('../areas/AreasPage'),
  equipos: () => import('../equipment/EquipmentPage'),
  productos: () => import('../products/ProductsPage'),
  personal: () => import('../employees/EmployeesPage'),
  organigrama: () => import('../org-chart/OrgChartPage'),
  procesos: () => import('../processes/ProcessesTab'),
  certificaciones: () => import('../certifications/PlantCertificationsTab'),
  documentos: () => import('../documents/PlantDocumentsTab'),
};

const LayoutsPage = lazy(loaders.layout);
const AreasPage = lazy(loaders.areas);
const EquipmentPage = lazy(loaders.equipos);
const ProductsPage = lazy(loaders.productos);
const EmployeesPage = lazy(loaders.personal);
const OrgChartPage = lazy(loaders.organigrama);
const ProcessesTab = lazy(loaders.procesos);
const PlantCertificationsTab = lazy(loaders.certificaciones);
const PlantDocumentsTab = lazy(loaders.documentos);



const prefetch = (tab: PlantTab) => {
  if (tab === 'personal') {
    void loaders.personal();
    void loaders.organigrama();
  } else void (loaders as Partial<Record<PlantTab, () => Promise<unknown>>>)[tab]?.(); // tabs without a separate chunk have no loader
};

const PlantWorkspacePage = () => {
  const { plantId, tab } = useParams<{ plantId: string; tab?: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const role = useAuthStore((state) => state.user?.role?.name) || '';
  const tabs = PLANT_TABS.filter((t) => !t.roles || (t.roles as readonly string[]).includes(role));
  const canSeeEmployeeList = MANAGERS.includes(role);
  // Opened from an organization's page: the breadcrumb leads back there instead of to all plants
  const origin = useBackTarget(plantId || '', { path: '/plants', label: 'Plantas' });
  const fromOrganization = origin.fromOrigin && origin.path.startsWith('/organizations/');

  const { data: plant, isLoading, error } = useQuery({
    queryKey: ['plant', plantId],
    queryFn: () => getPlant(plantId!),
    enabled: !!plantId,
    // A missing plant (404) or one of another company (403) will not appear by retrying
    retry: (count, err: any) => ![403, 404].includes(err?.response?.status) && count < 2,
  });
  // Other plants of the same organization, for the switcher
  const { data: siblings } = useQuery({
    queryKey: ['plants', plant?.organization_id],
    queryFn: () => getPlants({ organization_id: plant!.organization_id, limit: 100 }),
    enabled: !!plant?.organization_id,
  });

  useEffect(() => {
    if (plant?.name) document.title = `${plant.name} · InduNav`;
  }, [plant?.name]);

  // On small screens the tab bar scrolls: keep the active tab visible
  const activeTabRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    activeTabRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [tab, plant?.id]);

  const activeTab = tabs.find((t) => t.id === tab)?.id;
  if (!activeTab) return <Navigate to={`/plants/${plantId}/resumen`} replace />;

  if (isLoading) {
    return (
      <p className="flex items-center gap-2 text-gray-600">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando planta…
      </p>
    );
  }
  if (error || !plant) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-700">No se encontró la planta o no tienes acceso a ella.</p>
        <Link to="/plants" className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline">
          Volver a plantas
        </Link>
      </div>
    );
  }

  const scope = { plantId: plant.id, organizationId: plant.organization_id };
  const personalView = searchParams.get('vista') === 'organigrama' || !canSeeEmployeeList ? 'organigrama' : 'lista';
  const otherPlants = siblings?.plants || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <nav aria-label="Ruta" className="flex items-center gap-1 text-sm text-gray-500">
            <Link to={fromOrganization ? origin.path : '/plants'} className="hover:text-blue-700 hover:underline">
              {fromOrganization ? plant.organization_name || 'Empresa' : 'Plantas'}
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="truncate text-gray-700">{plant.name}</span>
          </nav>
          <h2 className="mt-0.5 flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Factory className="h-6 w-6 flex-shrink-0 text-green-600" />
            <span className="truncate">{plant.name}</span>
            {!plant.is_active && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">Inactiva</span>
            )}
          </h2>
          {plant.location && (
            <p className="mt-0.5 flex items-center gap-1 text-sm text-gray-600">
              <MapPin className="h-3.5 w-3.5" />
              {plant.location}
            </p>
          )}
        </div>

        {otherPlants.length > 1 && (
          <label className="text-xs text-gray-500">
            Cambiar de planta
            <select
              value={plant.id}
              // Same tab in the other plant
              onChange={(e) => navigate(`/plants/${e.target.value}/${activeTab}`)}
              className="mt-0.5 block w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 sm:w-56"
            >
              {otherPlants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {/* Tabs (scroll sideways on small screens) */}
      <div className="overflow-x-auto border-b border-gray-200">
        <nav className="-mb-px flex gap-1" aria-label="Secciones de la planta">
          {tabs.map(({ id, label, Icon }) => (
            <Link
              key={id}
              to={`/plants/${plant.id}/${id}`}
              onMouseEnter={() => prefetch(id)}
              onFocus={() => prefetch(id)}
              ref={activeTab === id ? activeTabRef : undefined}
              aria-current={activeTab === id ? 'page' : undefined}
              className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Content: key = plant, so switching plants starts each tab fresh */}
      <Suspense
        fallback={
          <p className="flex items-center gap-2 text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
          </p>
        }
      >
        <div key={plant.id}>
          {activeTab === 'resumen' && <PlantSummaryTab plant={plant} />}
          {activeTab === 'layout' && <LayoutsPage {...scope} />}
          {activeTab === 'areas' && <AreasPage {...scope} />}
          {activeTab === 'equipos' && <EquipmentPage {...scope} />}
          {activeTab === 'productos' && <ProductsPage {...scope} />}
          {activeTab === 'procesos' && <ProcessesTab plantId={plant.id} organizationId={plant.organization_id} />}
          {activeTab === 'certificaciones' && <PlantCertificationsTab plant={plant} />}
          {activeTab === 'documentos' && <PlantDocumentsTab plant={plant} />}
          {activeTab === 'personal' && (
            <div className="space-y-4">
              <div className={`flex rounded-lg border border-gray-300 bg-white p-0.5 text-sm font-medium w-fit ${canSeeEmployeeList ? '' : 'hidden'}`} role="group" aria-label="Vista del personal">
                {(
                  [
                    ['lista', 'Lista'],
                    ['organigrama', 'Organigrama'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setSearchParams(value === 'lista' ? {} : { vista: value }, { replace: true })}
                    aria-pressed={personalView === value}
                    className={`rounded-md px-3 py-1.5 ${personalView === value ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {personalView === 'lista' ? <EmployeesPage {...scope} /> : <OrgChartPage {...scope} />}
            </div>
          )}
          {activeTab === 'tours' && <ToursPage {...scope} />}
          {activeTab === 'configuracion' && <PlantSettingsTab plant={plant} />}
        </div>
      </Suspense>
    </div>
  );
};

export default PlantWorkspacePage;

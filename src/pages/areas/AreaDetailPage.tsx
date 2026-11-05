import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Award, FileText, GitBranch, Image, LayoutDashboard, LayoutGrid, Package, Shield, Users, Wrench } from 'lucide-react';
import { getArea, getPlantAreasOverview } from '../../api/areas';
// The same sections as the plant, scoped to this area
import EquipmentPage from '../equipment/EquipmentPage';
import ProductsPage from '../products/ProductsPage';
import ProcessesTab from '../processes/ProcessesTab';
import PlantCertificationsTab from '../certifications/PlantCertificationsTab';
import PlantDocumentsTab from '../documents/PlantDocumentsTab';
import EmployeesPage from '../employees/EmployeesPage';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

// Tab components
import GeneralTab from './tabs/GeneralTab';
import SafetyTab from './tabs/SafetyTab';
import GalleryTab from './tabs/GalleryTab';
import AreaLayoutTab from './tabs/AreaLayoutTab';
import PlantBreadcrumb from '../../components/layout/PlantBreadcrumb';
import { areaTypeLabel } from '../../constants/areaTypes';
import { personName } from '../../utils/personName';
import ScrollTabs from '../../components/ui/ScrollTabs';
import { useCan } from '../../hooks/usePermissions';

type TabType = 'general' | 'personal' | 'safety' | 'certifications' | 'documents' | 'gallery' | 'products' | 'processes' | 'equipment' | 'layout';

const AreaDetailPage = () => {
  const { areaId } = useParams<{ areaId: string }>();
  const navigate = useNavigate();
  // Active tab lives in the URL (?tab=layout) so it can be linked and survives navigating between areas
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as TabType) || 'general';
  const setActiveTab = (tab: TabType) => setSearchParams({ tab }, { replace: true });
  const can = useCan();

  // Fetch area details
  const { data: area, isLoading, error } = useQuery({
    queryKey: ['organizational-area', areaId],
    queryFn: () => getArea(areaId!, true),
    enabled: !!areaId,
  });

  // Real figures of the area, for the tab counts (only managers can read them: without them no counts)
  const { data: overview } = useQuery({
    queryKey: ['plant-areas-overview', area?.plant_id],
    queryFn: () => getPlantAreasOverview(area!.plant_id),
    enabled: !!area?.plant_id,
    retry: false,
  });
  const figures = overview?.find((a) => a.id === areaId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-600">Cargando información del área...</div>
      </div>
    );
  }

  if (error || !area) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-red-600 mb-4">Error al cargar el área</div>
        <Button onClick={() => navigate('/plants')} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Plantas
        </Button>
      </div>
    );
  }

  // Same order as the plant's tabs
  const tabs: { id: TabType; label: string; Icon: typeof Users; count?: number }[] = [
    { id: 'general', label: 'Resumen', Icon: LayoutDashboard },
    ...(can('layouts.read') ? [{ id: 'layout' as TabType, label: 'Layout', Icon: LayoutGrid }] : []),
    ...(can('equipment.read') ? [{ id: 'equipment' as TabType, label: 'Equipos', Icon: Wrench, count: figures?.equipment }] : []),
    ...(can('products.read') ? [{ id: 'products' as TabType, label: 'Productos', Icon: Package, count: figures?.products }] : []),
    ...(can('processes.read') ? [{ id: 'processes' as TabType, label: 'Procesos', Icon: GitBranch }] : []),
    ...(can('certifications.read') ? [{ id: 'certifications' as TabType, label: 'Certificaciones', Icon: Award }] : []),
    ...(can('documents.read', 'documents.read_public') ? [{ id: 'documents' as TabType, label: 'Documentos', Icon: FileText, count: figures?.documents }] : []),
    ...(can('employees.read') ? [{ id: 'personal' as TabType, label: 'Personal', Icon: Users, count: figures ? figures.employees + figures.headcount : undefined }] : []),
    ...(can('safety.read') ? [{ id: 'safety' as TabType, label: 'Seguridad', Icon: Shield }] : []),
    { id: 'gallery', label: 'Galería', Icon: Image },
  ];

  const scope = { plantId: area.plant_id, organizationId: area.organization_id, area: { id: area.id, name: area.name } };
  const renderTabContent = () => {
    if (!tabs.some((t) => t.id === activeTab)) return <GeneralTab area={area} />;
    switch (activeTab) {
      case 'general':
        return <GeneralTab area={area} />;
      case 'personal':
        return <EmployeesPage {...scope} />;
      case 'products':
        return <ProductsPage {...scope} />;
      case 'processes':
        return <ProcessesTab plantId={area.plant_id} organizationId={area.organization_id} area={scope.area} />;
      case 'equipment':
        return <EquipmentPage {...scope} />;
      case 'layout':
        return <AreaLayoutTab areaId={areaId!} area={area} />;
      case 'safety':
        return <SafetyTab areaId={areaId!} area={area} />;
      case 'certifications':
        return <PlantCertificationsTab plant={{ id: area.plant_id, organization_id: area.organization_id }} area={scope.area} />;
      case 'documents':
        return <PlantDocumentsTab plant={{ id: area.plant_id, organization_id: area.organization_id }} area={scope.area} />;
      case 'gallery':
        return <GalleryTab areaId={areaId!} area={area} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="min-w-0">
        <PlantBreadcrumb plantId={area.plant_id} tab="areas" current={area.name} />
        <h2 className="flex flex-wrap items-center gap-x-2 gap-y-1 text-2xl font-bold text-gray-900">
          {/* Dot and name stay together when the code and type wrap */}
          <span className="flex min-w-0 items-baseline gap-2">
            <span className="inline-block h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: area.color || '#94A3B8' }} aria-hidden />
            <span className="min-w-0">{area.name}</span>
          </span>
          <span className="flex flex-wrap items-center gap-1.5">
            {area.code && (
              <Badge variant="secondary" className="font-mono">
                {area.code}
              </Badge>
            )}
            <Badge variant={area.area_type === 'production' ? 'success' : 'default'}>{areaTypeLabel(area.area_type)}</Badge>
          </span>
        </h2>
        {area.description && <p className="mt-1 line-clamp-2 text-sm text-gray-600">{area.description}</p>}
        {area.supervisor && personName(area.supervisor).trim() && (
          <p className="mt-1 text-sm text-gray-600">
            Supervisor: <span className="font-medium text-gray-900">{personName(area.supervisor)}</span>
            {area.supervisor.position && <span className="text-gray-500"> · {area.supervisor.position}</span>}
          </p>
        )}
      </div>

      {/* Tabs (scroll sideways when they do not fit) */}
      <ScrollTabs label="Secciones del área">
        {tabs.map(({ id, label, Icon, count }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            aria-current={activeTab === id ? 'page' : undefined}
            className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              activeTab === id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            {count ? <span className={`rounded-full px-1.5 text-xs ${activeTab === id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{count}</span> : null}
          </button>
        ))}
      </ScrollTabs>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};

export default AreaDetailPage;

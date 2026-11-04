import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Edit, FileText, Image as ImageIcon, LayoutDashboard, MapPin, Package, Wrench } from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ScrollTabs from '../../components/ui/ScrollTabs';
import EquipmentModal from './EquipmentModal';
import EquipmentGalleryTab from './tabs/EquipmentGalleryTab';
import EquipmentAssignmentsTab from './tabs/EquipmentAssignmentsTab';
import EquipmentProductsTab from './tabs/EquipmentProductsTab';
import EquipmentSummaryTab from './tabs/EquipmentSummaryTab';
import PlantDocumentsTab from '../documents/PlantDocumentsTab';
import { getEquipmentById, getEquipmentImages, EQUIPMENT_TYPE_LABELS, EQUIPMENT_STATUS_LABELS } from '../../api/equipment';
import { getEquipmentProducts } from '../../api/productStepEquipment';
import { getPlantDocuments } from '../../api/areaDocuments';
import PlantBreadcrumb from '../../components/layout/PlantBreadcrumb';

type TabType = 'general' | 'location' | 'products' | 'documents' | 'gallery';

const EquipmentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  // Active tab lives in the URL (?tab=location) so it survives reloading and coming back
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as TabType) || 'general';
  const setActiveTab = (tab: TabType) => setSearchParams({ tab }, { replace: true });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: equipment, isLoading } = useQuery({
    queryKey: ['equipment', id],
    queryFn: () => getEquipmentById(id!),
    enabled: !!id,
  });

  // Counts of the tabs (same queries the tabs use)
  const { data: links = [] } = useQuery({ queryKey: ['equipment-products', id], queryFn: () => getEquipmentProducts(id!), enabled: !!id });
  const { data: images = [] } = useQuery({ queryKey: ['equipment-images', id], queryFn: () => getEquipmentImages(id!), enabled: !!id });
  const { data: library = [] } = useQuery({
    queryKey: ['plant-documents', equipment?.plant_id],
    queryFn: () => getPlantDocuments(equipment!.plant_id, { includeArchived: true }),
    enabled: !!equipment?.plant_id,
  });
  const documentCount = library.filter((d) => d.status !== 'archived' && d.shared_equipment?.some((e) => e.id === id)).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-600">Equipo no encontrado</div>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; Icon: typeof Wrench; count?: number }[] = [
    { id: 'general', label: 'Resumen', Icon: LayoutDashboard },
    { id: 'location', label: 'Ubicación', Icon: MapPin },
    { id: 'products', label: 'Productos', Icon: Package, count: new Set(links.map((l) => l.product_id)).size },
    { id: 'documents', label: 'Documentos', Icon: FileText, count: documentCount },
    { id: 'gallery', label: 'Galería', Icon: ImageIcon, count: images.length },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="min-w-0">
        <PlantBreadcrumb plantId={equipment.plant_id} tab="equipos" current={equipment.name} />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex w-full min-w-0 items-center gap-3 sm:w-auto sm:flex-1">
            {equipment.primary_image_url ? (
              <img src={equipment.primary_image_url} alt="" className="h-14 w-14 flex-shrink-0 rounded-lg border border-gray-200 object-cover" />
            ) : (
              <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-100">
                <Wrench className="h-6 w-6 text-gray-400" />
              </span>
            )}
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">{equipment.name}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-gray-600">
                <Badge variant="info" className="font-mono">
                  {equipment.code}
                </Badge>
                <Badge variant={equipment.status === 'active' ? 'success' : equipment.status === 'maintenance' ? 'warning' : equipment.status === 'out_of_service' ? 'error' : 'default'}>
                  {EQUIPMENT_STATUS_LABELS[equipment.status]}
                </Badge>
                <span>{EQUIPMENT_TYPE_LABELS[equipment.equipment_type]}</span>
              </div>
            </div>
          </div>
          <Button onClick={() => setIsEditModalOpen(true)} variant="outline" className="gap-2">
            <Edit className="h-4 w-4" />
            Editar equipo
          </Button>
        </div>
      </div>

      {/* Tabs (scroll sideways when they do not fit) */}
      <ScrollTabs label="Secciones del equipo">
        {tabs.map(({ id: tabId, label, Icon, count }) => (
          <button
            key={tabId}
            onClick={() => setActiveTab(tabId)}
            aria-current={activeTab === tabId ? 'page' : undefined}
            className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tabId ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            {count ? <span className={`rounded-full px-1.5 text-xs ${activeTab === tabId ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{count}</span> : null}
          </button>
        ))}
      </ScrollTabs>

      <div>
        {activeTab === 'general' && <EquipmentSummaryTab equipment={equipment} onEdit={() => setIsEditModalOpen(true)} />}
        {activeTab === 'location' && <EquipmentAssignmentsTab equipmentId={id!} equipment={equipment} />}
        {activeTab === 'products' && <EquipmentProductsTab equipmentId={id!} equipment={equipment} />}
        {activeTab === 'documents' && (
          <PlantDocumentsTab plant={{ id: equipment.plant_id, organization_id: equipment.organization_id }} equipment={{ id: equipment.id, name: equipment.name, code: equipment.code }} />
        )}
        {activeTab === 'gallery' && <EquipmentGalleryTab equipmentId={id!} equipment={equipment} />}
      </div>

      {isEditModalOpen && (
        <EquipmentModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} equipment={equipment} organizationId={equipment.organization_id} plantId={equipment.plant_id} />
      )}
    </div>
  );
};

export default EquipmentDetailPage;

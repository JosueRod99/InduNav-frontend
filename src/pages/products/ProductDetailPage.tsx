import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Edit, FileText, GitBranch, Image as ImageIcon, LayoutDashboard, Lock, Package, Wrench } from 'lucide-react';
import { getProcessSteps, getProduct, getProductImages } from '../../api/products';
import { getPlantDocuments } from '../../api/areaDocuments';
import { getProductEquipment } from '../../api/productStepEquipment';
import ScrollTabs from '../../components/ui/ScrollTabs';
import PlantDocumentsTab from '../documents/PlantDocumentsTab';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { PRODUCT_CATEGORY_LABELS, PRODUCT_STATUS_LABELS } from '../../api/products';
import ProductModal from './ProductModal';

// Tab components
import GeneralTab from './tabs/GeneralTab';
import ProcessTab from './tabs/ProcessTab';
import GalleryTab from './tabs/GalleryTab';
import ProductEquipmentTab from './tabs/ProductEquipmentTab';
import PlantBreadcrumb from '../../components/layout/PlantBreadcrumb';

type TabType = 'general' | 'process' | 'equipment' | 'documents' | 'gallery';

const ProductDetailPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  // Active tab lives in the URL (?tab=process) so it survives reloading and coming back
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as TabType) || 'general';
  const setActiveTab = (tab: TabType) => setSearchParams({ tab }, { replace: true });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch product details
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => getProduct(productId!, true),
    enabled: !!productId,
  });

  // Counts of the tabs (same queries the tabs use)
  const { data: steps = [] } = useQuery({ queryKey: ['process-steps', productId], queryFn: () => getProcessSteps(productId!), enabled: !!productId });
  const { data: links = [] } = useQuery({ queryKey: ['product-equipment', productId], queryFn: () => getProductEquipment(productId!), enabled: !!productId });
  const { data: library = [] } = useQuery({
    queryKey: ['plant-documents', product?.plant_id],
    queryFn: () => getPlantDocuments(product!.plant_id, { includeArchived: true }),
    enabled: !!product?.plant_id,
  });
  const documentCount = library.filter((d) => d.status !== 'archived' && d.shared_products?.some((p) => p.id === productId)).length;
  const { data: images = [] } = useQuery({ queryKey: ['product-images', productId], queryFn: () => getProductImages(productId!), enabled: !!productId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-600">Cargando información del producto...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-red-600 mb-4">Error al cargar el producto</div>
        <Button onClick={() => navigate('/plants')} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Plantas
        </Button>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; Icon: typeof Package; count?: number }[] = [
    { id: 'general', label: 'Resumen', Icon: LayoutDashboard },
    { id: 'process', label: 'Proceso', Icon: GitBranch, count: steps.length },
    { id: 'equipment', label: 'Equipos', Icon: Wrench, count: new Set(links.map((l) => l.equipment_id)).size },
    { id: 'documents', label: 'Documentos', Icon: FileText, count: documentCount },
    { id: 'gallery', label: 'Galería', Icon: ImageIcon, count: images.length },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralTab product={product} />;
      case 'process':
        return <ProcessTab productId={productId!} />;
      case 'equipment':
        return <ProductEquipmentTab productId={productId!} />;
      case 'documents':
        return <PlantDocumentsTab plant={{ id: product.plant_id, organization_id: product.organization_id }} product={{ id: product.id, name: product.name, sku: product.sku }} />;
      case 'gallery':
        return <GalleryTab productId={productId!} product={product} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="min-w-0">
        <PlantBreadcrumb plantId={product.plant_id} tab="productos" current={product.name} />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex w-full min-w-0 items-center gap-3 sm:w-auto sm:flex-1">
            {product.primary_image_url ? (
              <img src={product.primary_image_url} alt="" className="h-14 w-14 flex-shrink-0 rounded-lg border border-gray-200 object-cover" />
            ) : (
              <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-100">
                <Package className="h-6 w-6 text-gray-400" />
              </span>
            )}
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">{product.name}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-gray-600">
                <Badge variant="info" className="font-mono">
                  {product.sku}
                </Badge>
                <Badge variant={product.status === 'active' ? 'success' : product.status === 'discontinued' ? 'error' : 'warning'}>{PRODUCT_STATUS_LABELS[product.status]}</Badge>
                {product.is_private && (
                  <span className="inline-flex items-center gap-1 text-gray-500" title="No sale en los tours">
                    <Lock className="h-3.5 w-3.5" /> Privado
                  </span>
                )}
                <span>
                  {PRODUCT_CATEGORY_LABELS[product.category]} · Revisión {product.revision}
                </span>
              </div>
            </div>
          </div>
          <Button onClick={() => setIsEditModalOpen(true)} variant="outline" className="gap-2">
            <Edit className="h-4 w-4" />
            Editar producto
          </Button>
        </div>
      </div>

      {/* Tabs (scroll sideways when they do not fit) */}
      <ScrollTabs label="Secciones del producto">
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
      <div>{renderTabContent()}</div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <ProductModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          product={product}
          organizationId={product.organization_id}
          plantId={product.plant_id}
        />
      )}
    </div>
  );
};

export default ProductDetailPage;

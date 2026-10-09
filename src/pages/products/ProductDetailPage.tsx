import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Edit, Package } from 'lucide-react';
import { getProduct } from '../../api/products';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { PRODUCT_CATEGORY_LABELS, PRODUCT_STATUS_LABELS } from '../../api/products';
import ProductModal from './ProductModal';

// Tab components
import GeneralTab from './tabs/GeneralTab';
import ProcessTab from './tabs/ProcessTab';

type TabType = 'general' | 'process';

const ProductDetailPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch product details
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => getProduct(productId!, true),
    enabled: !!productId,
  });

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
        <Button onClick={() => navigate('/products')} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Productos
        </Button>
      </div>
    );
  }

  const tabs: Array<{ id: TabType; label: string }> = [
    { id: 'general', label: 'General' },
    { id: 'process', label: 'Proceso de Fabricación' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralTab product={product} />;
      case 'process':
        return <ProcessTab productId={productId!} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Button
              onClick={() => navigate('/products')}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <Badge variant="info" className="font-mono">
              {product.sku}
            </Badge>
            <Badge
              variant={
                product.status === 'active'
                  ? 'success'
                  : product.status === 'discontinued'
                  ? 'error'
                  : 'warning'
              }
            >
              {PRODUCT_STATUS_LABELS[product.status]}
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            {product.primary_image_url ? (
              <img
                src={product.primary_image_url}
                alt={product.name}
                className="h-20 w-20 rounded-lg object-cover border border-gray-200"
              />
            ) : (
              <div className="h-20 w-20 rounded-lg bg-gray-200 flex items-center justify-center border border-gray-300">
                <Package className="h-10 w-10 text-gray-400" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
              <p className="text-sm text-gray-600 mt-1">
                {PRODUCT_CATEGORY_LABELS[product.category]} • Revisión {product.revision}
              </p>
            </div>
          </div>
        </div>

        <Button onClick={() => setIsEditModalOpen(true)} className="gap-2">
          <Edit className="h-4 w-4" />
          Editar
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

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

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, ExternalLink, MapPin, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import {
  getProductsByArea,
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_STATUS_LABELS,
} from '../../../api/products';
import { getProcessSteps } from '../../../api/products';

interface ProductsTabProps {
  areaId: string;
  area: any;
}

const ProductsTab = ({ areaId, area }: ProductsTabProps) => {
  const navigate = useNavigate();
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  // Fetch products that use this area
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products-by-area', areaId],
    queryFn: () => getProductsByArea(areaId),
  });

  // Fetch process steps for expanded product
  const { data: processSteps = [] } = useQuery({
    queryKey: ['process-steps', expandedProductId],
    queryFn: () => getProcessSteps(expandedProductId!),
    enabled: !!expandedProductId,
  });

  const handleViewProduct = (productId: string) => {
    navigate(`/products/${productId}`);
  };

  const toggleExpand = (productId: string) => {
    setExpandedProductId(expandedProductId === productId ? null : productId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Cargando productos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Productos Fabricados en esta Área
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Productos que incluyen a "{area?.name}" en su proceso de fabricación
          </p>
        </div>
      </div>

      {/* Products List */}
      {products.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay productos en esta área
          </h3>
          <p className="text-gray-600 mb-4">
            Esta área no participa en ningún proceso de fabricación actualmente
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product) => {
            const isExpanded = expandedProductId === product.id;
            const relevantSteps = processSteps.filter(
              (step) => step.organizational_area_id === areaId
            );

            return (
              <div
                key={product.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Product Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    {/* Product Info */}
                    <div className="flex items-start gap-4 flex-1">
                      {/* Product Image */}
                      {product.primary_image_url ? (
                        <img
                          src={product.primary_image_url}
                          alt={product.name}
                          className="h-16 w-16 rounded-lg object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center border border-gray-300">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                      )}

                      {/* Product Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="text-lg font-medium text-gray-900 mb-1">
                              {product.name}
                            </h4>
                            <div className="flex items-center gap-2 mb-2">
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
                              <Badge variant="default">
                                {PRODUCT_CATEGORY_LABELS[product.category]}
                              </Badge>
                            </div>
                            {product.description && (
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {product.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleExpand(product.id)}
                      >
                        {isExpanded ? 'Ocultar Proceso' : 'Ver Proceso'}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleViewProduct(product.id)}
                        className="gap-2"
                      >
                        Ver Detalles
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expanded Process View */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50 p-6">
                    <h5 className="text-sm font-medium text-gray-900 mb-4">
                      Participación de esta área en el proceso:
                    </h5>

                    {relevantSteps.length === 0 ? (
                      <p className="text-sm text-gray-500">Cargando...</p>
                    ) : (
                      <div className="space-y-3">
                        {relevantSteps.map((step) => (
                          <div
                            key={step.id}
                            className="bg-white border border-gray-200 rounded-lg p-4"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0">
                                <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm">
                                  {step.step_number}
                                </div>
                              </div>
                              <div className="flex-1">
                                <h6 className="text-sm font-medium text-gray-900 mb-1">
                                  {step.step_name}
                                </h6>
                                {step.description && (
                                  <p className="text-sm text-gray-600 mb-2">
                                    {step.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    Paso {step.step_number} de{' '}
                                    {processSteps.length}
                                  </span>
                                  {step.estimated_duration_hours && (
                                    <span>
                                      {step.estimated_duration_hours} horas estimadas
                                    </span>
                                  )}
                                </div>
                                {step.notes && (
                                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                                    <strong>Nota:</strong> {step.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Full Process Flow Link */}
                        <div className="flex items-center justify-center pt-2">
                          <button
                            onClick={() => handleViewProduct(product.id)}
                            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2"
                          >
                            Ver proceso completo de fabricación
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {products.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Package className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900 mb-1">
                Resumen de Producción
              </h4>
              <p className="text-sm text-blue-800">
                Esta área participa en la fabricación de{' '}
                <strong>{products.length}</strong> producto
                {products.length !== 1 ? 's' : ''}.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsTab;

import { ExternalLink, FileText, Image as ImageIcon, Tag } from 'lucide-react';
import { type Product, PRODUCT_CATEGORY_LABELS, PRODUCT_STATUS_LABELS } from '../../../api/products';
import Badge from '../../../components/ui/Badge';
import SpecificationsEditor from '../components/SpecificationsEditor';

interface GeneralTabProps {
  product: Product;
}

const GeneralTab = ({ product }: GeneralTabProps) => {

  return (
    <div className="space-y-6">
      {/* Product Image */}
      {product.primary_image_url && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Imagen del Producto
          </h3>
          <div className="flex justify-center">
            <img
              src={product.primary_image_url}
              alt={product.name}
              className="max-w-md w-full h-auto rounded-lg shadow-sm"
            />
          </div>
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Información Básica</h3>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">SKU</dt>
            <dd className="mt-1 text-sm text-gray-900 font-mono">{product.sku}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Nombre</dt>
            <dd className="mt-1 text-sm text-gray-900">{product.name}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Categoría</dt>
            <dd className="mt-1">
              <Badge variant="info">{PRODUCT_CATEGORY_LABELS[product.category]}</Badge>
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Estado</dt>
            <dd className="mt-1">
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
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Revisión</dt>
            <dd className="mt-1 text-sm text-gray-900">{product.revision}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Visibilidad</dt>
            <dd className="mt-1">
              <Badge variant={product.is_private ? 'warning' : 'success'}>
                {product.is_private ? 'Privado' : 'Público'}
              </Badge>
            </dd>
          </div>

          {product.description && (
            <div className="md:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Descripción</dt>
              <dd className="mt-1 text-sm text-gray-900">{product.description}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Tags */}
      {product.tags && product.tags.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Etiquetas
          </h3>
          <div className="flex flex-wrap gap-2">
            {product.tags.map((tag, index) => (
              <Badge key={index} variant="default">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Technical Specifications Editor */}
      <SpecificationsEditor
        productId={product.id}
        specifications={product.specifications || {}}
      />

      {/* Technical Document */}
      {product.technical_document_url && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documento Técnico
          </h3>
          <a
            href={product.technical_document_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
          >
            <ExternalLink className="h-4 w-4" />
            Abrir documento técnico
          </a>
        </div>
      )}

      {/* Audit Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Información de Auditoría</h3>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Fecha de Creación</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(product.created_at).toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Última Actualización</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(product.updated_at).toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

export default GeneralTab;

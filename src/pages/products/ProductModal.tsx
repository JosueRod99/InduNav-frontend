import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import {
  createProduct,
  updateProduct,
  type Product,
  type ProductCategory,
  type ProductStatus,
  type CreateProductRequest,
  type UpdateProductRequest,
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_STATUS_LABELS,
} from '../../api/products';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  organizationId: string;
  plantId: string;
}

const ProductModal = ({
  isOpen,
  onClose,
  product,
  organizationId,
  plantId,
}: ProductModalProps) => {
  const queryClient = useQueryClient();

  // Form state
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [revision, setRevision] = useState('A');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProductCategory>('component');
  const [status, setStatus] = useState<ProductStatus>('active');
  const [primaryImageUrl, setPrimaryImageUrl] = useState('');
  const [technicalDocumentUrl, setTechnicalDocumentUrl] = useState('');
  const [tags, setTags] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  // Load product data if editing
  useEffect(() => {
    if (product) {
      setSku(product.sku);
      setName(product.name);
      setRevision(product.revision);
      setDescription(product.description || '');
      setCategory(product.category);
      setStatus(product.status);
      setPrimaryImageUrl(product.primary_image_url || '');
      setTechnicalDocumentUrl(product.technical_document_url || '');
      setTags(product.tags?.join(', ') || '');
      setIsPrivate(product.is_private);
    } else {
      // Reset form for new product
      setSku('');
      setName('');
      setRevision('A');
      setDescription('');
      setCategory('component');
      setStatus('active');
      setPrimaryImageUrl('');
      setTechnicalDocumentUrl('');
      setTags('');
      setIsPrivate(false);
    }
  }, [product]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateProductRequest) => createProduct(data),
    onSuccess: () => {
      toast.success('Producto creado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear producto');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductRequest }) =>
      updateProduct(id, data),
    onSuccess: () => {
      toast.success('Producto actualizado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', product?.id] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar producto');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!sku || !name) {
      toast.error('SKU y Nombre son requeridos');
      return;
    }

    // Parse tags
    const parsedTags = tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    if (product) {
      // Update existing product
      const updateData: UpdateProductRequest = {
        sku,
        name,
        revision,
        description: description || undefined,
        category,
        status,
        primary_image_url: primaryImageUrl || undefined,
        technical_document_url: technicalDocumentUrl || undefined,
        tags: parsedTags.length > 0 ? parsedTags : undefined,
        is_private: isPrivate,
      };

      updateMutation.mutate({ id: product.id, data: updateData });
    } else {
      // Create new product
      const createData: CreateProductRequest = {
        organization_id: organizationId,
        plant_id: plantId || organizationId, // Use organization_id as fallback if no plant selected
        sku,
        name,
        revision,
        description: description || undefined,
        category,
        status,
        primary_image_url: primaryImageUrl || undefined,
        technical_document_url: technicalDocumentUrl || undefined,
        tags: parsedTags.length > 0 ? parsedTags : undefined,
        is_private: isPrivate,
      };

      createMutation.mutate(createData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 !mt-0">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-gray-900">
            {product ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* SKU and Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="PROD-001"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nombre del producto"
                required
              />
            </div>
          </div>

          {/* Category, Status, and Revision */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.entries(PRODUCT_CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProductStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.entries(PRODUCT_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Revisión
              </label>
              <input
                type="text"
                value={revision}
                onChange={(e) => setRevision(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="A"
                maxLength={10}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descripción del producto..."
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Etiquetas
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Cliente-ABC, Línea-Automotriz (separadas por coma)"
            />
            <p className="mt-1 text-sm text-gray-500">
              Separar etiquetas con comas
            </p>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL de Imagen Principal
            </label>
            <input
              type="url"
              value={primaryImageUrl}
              onChange={(e) => setPrimaryImageUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://..."
            />
          </div>

          {/* Technical Document URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL de Documento Técnico
            </label>
            <input
              type="url"
              value={technicalDocumentUrl}
              onChange={(e) => setTechnicalDocumentUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://drive.google.com/..."
            />
          </div>

          {/* Is Private */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_private"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_private" className="ml-2 block text-sm text-gray-700">
              Producto privado (ocultar de tours públicos)
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : product ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Plus, ExternalLink, Trash2, Edit, Calendar, HardDrive } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import ProductDocumentModal from '../modals/ProductDocumentModal';
import {
  getProductDocuments,
  deleteProductDocument,
  type ProductDocument,
} from '../../../api/products';

interface ProductDocumentsProps {
  productId: string;
  organizationId: string;
  plantId: string;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  technical: 'Ficha Técnica',
  manual: 'Manual',
  certificate: 'Certificado',
  safety: 'Hoja de Seguridad',
  datasheet: 'Hoja de Datos',
  specification: 'Especificación',
};

const DOCUMENT_TYPE_COLORS: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  technical: 'info',
  manual: 'default',
  certificate: 'success',
  safety: 'warning',
  datasheet: 'info',
  specification: 'default',
};

const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (date: Date | null): string => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const ProductDocuments = ({ productId, organizationId, plantId }: ProductDocumentsProps) => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<ProductDocument | null>(null);

  // Fetch documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['product-documents', productId],
    queryFn: () => getProductDocuments(productId),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteProductDocument,
    onSuccess: () => {
      toast.success('Documento eliminado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['product-documents', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar documento');
    },
  });

  const handleDelete = (document: ProductDocument) => {
    if (window.confirm(`¿Estás seguro de eliminar "${document.document_name}"?`)) {
      deleteMutation.mutate(document.id);
    }
  };

  const handleEdit = (document: ProductDocument) => {
    setEditingDocument(document);
    setIsModalOpen(true);
  };

  const handleCreateNew = () => {
    setEditingDocument(null);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-600">Cargando documentos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documentación
        </h3>
        <Button onClick={handleCreateNew} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Agregar
        </Button>
      </div>

      {/* Documents List */}
      {documents.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600 mb-3">No hay documentos asociados</p>
          <Button onClick={handleCreateNew} variant="outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Agregar Primer Documento
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-start justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
            >
              {/* Document Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {doc.document_name}
                  </h4>
                  {doc.document_type && (
                    <Badge
                      variant={DOCUMENT_TYPE_COLORS[doc.document_type] || 'default'}
                      className="text-xs"
                    >
                      {DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}
                    </Badge>
                  )}
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  {doc.mime_type && (
                    <span className="flex items-center gap-1">
                      {doc.mime_type.split('/')[1]?.toUpperCase() || 'FILE'}
                    </span>
                  )}
                  {doc.file_size && (
                    <span className="flex items-center gap-1">
                      <HardDrive className="h-3 w-3" />
                      {formatFileSize(doc.file_size)}
                    </span>
                  )}
                  {doc.uploaded_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(doc.uploaded_date)}
                    </span>
                  )}
                </div>

                {/* Description */}
                {doc.description && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{doc.description}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 ml-3">
                <a
                  href={doc.document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                  title="Ver documento"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <button
                  onClick={() => handleEdit(doc)}
                  className="p-1.5 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  title="Editar"
                >
                  <Edit className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(doc)}
                  disabled={deleteMutation.isPending}
                  className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                  title="Eliminar"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Modal */}
      {isModalOpen && (
        <ProductDocumentModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingDocument(null);
          }}
          productId={productId}
          organizationId={organizationId}
          plantId={plantId}
          document={editingDocument}
        />
      )}
    </div>
  );
};

export default ProductDocuments;

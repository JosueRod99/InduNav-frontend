import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Plus, ExternalLink, Trash2, Edit, Calendar, HardDrive } from 'lucide-react';
import toast from 'react-hot-toast';
import Badge from '../../../components/ui/Badge';
import EquipmentDocumentModal from '../modals/EquipmentDocumentModal';
import {
  getEquipmentDocuments,
  deleteEquipmentDocument,
  type EquipmentDocument,
  type Equipment,
} from '../../../api/equipment';

interface EquipmentDocumentsTabProps {
  equipmentId: string;
  equipment?: Equipment;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  manual: 'Manual',
  warranty: 'Garantía',
  certificate: 'Certificado',
  technical: 'Ficha Técnica',
  maintenance: 'Plan de Mantenimiento',
  safety: 'Hoja de Seguridad',
  other: 'Otro',
};

const DOCUMENT_TYPE_COLORS: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  manual: 'default',
  warranty: 'success',
  certificate: 'success',
  technical: 'info',
  maintenance: 'warning',
  safety: 'error',
  other: 'default',
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

const EquipmentDocumentsTab = ({ equipmentId, equipment }: EquipmentDocumentsTabProps) => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<EquipmentDocument | null>(null);

  // Fetch documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['equipment-documents', equipmentId],
    queryFn: () => getEquipmentDocuments(equipmentId),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteEquipmentDocument,
    onSuccess: () => {
      toast.success('Documento eliminado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['equipment-documents', equipmentId] });
      queryClient.invalidateQueries({ queryKey: ['equipment', equipmentId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar documento');
    },
  });

  const handleDelete = (document: EquipmentDocument) => {
    if (window.confirm(`¿Estás seguro de eliminar "${document.document_name}"?`)) {
      deleteMutation.mutate(document.id);
    }
  };

  const handleEdit = (document: EquipmentDocument) => {
    setEditingDocument(document);
    setIsModalOpen(true);
  };

  const handleCreateNew = () => {
    setEditingDocument(null);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-600">
        Cargando documentos...
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <>
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sin Documentos</h3>
          <p className="text-gray-600 mb-4">
            Aún no hay documentos asociados a este equipo.
          </p>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Agregar Documento
          </button>
        </div>

        {equipment && (
          <EquipmentDocumentModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setEditingDocument(null);
            }}
            equipmentId={equipmentId}
            organizationId={equipment.organization_id}
            plantId={equipment.plant_id}
            document={editingDocument}
          />
        )}
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary and Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Documentación ({documents.length})
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Manuales, garantías, certificados y documentación técnica
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Agregar Documento
        </button>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all bg-white"
          >
            {/* Document Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <h4 className="text-sm font-semibold text-gray-900 truncate">
                  {doc.document_name}
                </h4>
              </div>

              {/* Type Badge */}
              {doc.document_type && (
                <div className="mb-2">
                  <Badge
                    variant={DOCUMENT_TYPE_COLORS[doc.document_type] || 'default'}
                    className="text-xs"
                  >
                    {DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}
                  </Badge>
                </div>
              )}

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-2">
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
                <p className="text-xs text-gray-600 line-clamp-2">{doc.description}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 ml-3">
              <a
                href={doc.document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                title="Ver documento"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
              <button
                onClick={() => handleEdit(doc)}
                className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                title="Editar"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(doc)}
                disabled={deleteMutation.isPending}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                title="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Document Modal */}
      {equipment && (
        <EquipmentDocumentModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingDocument(null);
          }}
          equipmentId={equipmentId}
          organizationId={equipment.organization_id}
          plantId={equipment.plant_id}
          document={editingDocument}
        />
      )}
    </div>
  );
};

export default EquipmentDocumentsTab;

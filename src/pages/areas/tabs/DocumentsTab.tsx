import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Upload, Trash2, Download, Eye, ExternalLink, GitBranch } from 'lucide-react';
import {
  getDocumentsByArea,
  deleteDocument,
  getFileIcon,
  formatFileSize,
  getCategoryLabel,
  getStatusLabel,
  getStatusColor,
  type AreaDocument,
} from '../../../api/areaDocuments';
import Badge from '../../../components/ui/Badge';
import UploadDocumentModal from '../modals/UploadDocumentModal';
import EditDocumentModal from '../modals/EditDocumentModal';
import NewDocumentVersionModal from '../modals/NewDocumentVersionModal';

interface DocumentsTabProps {
  areaId: string;
  area?: any;
}

const DocumentsTab = ({ areaId, area }: DocumentsTabProps) => {
  const queryClient = useQueryClient();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewVersionModalOpen, setIsNewVersionModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<AreaDocument | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showPrivate, setShowPrivate] = useState<boolean>(false);

  const { data: documents, isLoading } = useQuery({
    queryKey: ['area-documents', areaId, categoryFilter, statusFilter, searchQuery, showPrivate],
    queryFn: () =>
      getDocumentsByArea(areaId, {
        category: categoryFilter || undefined,
        status: statusFilter || undefined,
        search: searchQuery || undefined,
        includePrivate: showPrivate,
      }),
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['area-documents', areaId] });
    },
  });

  const handleDocumentClick = (document: AreaDocument) => {
    setSelectedDocument(document);
    setIsEditModalOpen(true);
  };

  const handleDownload = (document: AreaDocument) => {
    window.open(document.file_url, '_blank');
  };

  const handlePreview = (document: AreaDocument) => {
    window.open(document.file_url, '_blank');
  };

  const handleNewVersion = (document: AreaDocument) => {
    setSelectedDocument(document);
    setIsNewVersionModalOpen(true);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12 text-gray-600">Cargando documentos...</div>;
  }

  const hasActiveFilters = categoryFilter || statusFilter || searchQuery || showPrivate;
  const noResults = !documents || documents.length === 0;

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Documentos ({documents?.length || 0})
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Documentos del área con versionado automático
            </p>
          </div>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Subir Documento
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las Categorías</option>
            <option value="SOP">SOP</option>
            <option value="WORK_INSTRUCTION">Instrucción de Trabajo</option>
            <option value="MANUAL">Manual de Equipo</option>
            <option value="QUALITY_PROCEDURE">Procedimiento de Calidad</option>
            <option value="AUDIT_REPORT">Reporte de Auditoría</option>
            <option value="SAFETY_PROCEDURE">Procedimiento de Seguridad</option>
            <option value="MSDS">Hoja de Seguridad (MSDS)</option>
            <option value="RISK_ANALYSIS">Análisis de Riesgos</option>
            <option value="DIAGRAM">Diagrama/Plano</option>
            <option value="FORM_TEMPLATE">Formato/Plantilla</option>
            <option value="REPORT">Reporte General</option>
            <option value="OTHER">Otro</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los Estados</option>
            <option value="draft">Borrador</option>
            <option value="active">Activo</option>
            <option value="under_review">En Revisión</option>
            <option value="archived">Archivado</option>
          </select>

          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar documentos..."
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Show Private Toggle */}
          <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={showPrivate}
              onChange={(e) => setShowPrivate(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Mostrar privados</span>
          </label>
        </div>
      </div>

      {/* Documents Table or Empty State */}
      {noResults && !hasActiveFilters ? (
        // No documents at all
        <div className="bg-white border border-gray-200 rounded-lg p-12">
          <div className="text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sin Documentos</h3>
            <p className="text-gray-600 mb-4">Aún no hay documentos en esta área.</p>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Upload className="h-4 w-4" />
              Subir Primer Documento
            </button>
          </div>
        </div>
      ) : noResults && hasActiveFilters ? (
        // No results with active filters
        <div className="bg-white border border-gray-200 rounded-lg p-12">
          <div className="text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron documentos</h3>
            <p className="text-gray-600 mb-4">
              No hay documentos que coincidan con los filtros aplicados.
            </p>
            <button
              onClick={() => {
                setCategoryFilter('');
                setStatusFilter('');
                setSearchQuery('');
                setShowPrivate(false);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      ) : (
        // Documents table
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Versión
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tamaño
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents?.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl mt-1">{getFileIcon(doc.file_type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {doc.title}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {doc.file_name}
                        </div>
                        {doc.description && (
                          <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {doc.description}
                          </div>
                        )}
                        {doc.is_private && (
                          <Badge variant="warning" size="sm" className="mt-1">
                            Privado
                          </Badge>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{getCategoryLabel(doc.category)}</div>
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {doc.tags.slice(0, 2).map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {tag}
                          </span>
                        ))}
                        {doc.tags.length > 2 && (
                          <span className="text-xs text-gray-500">+{doc.tags.length - 2}</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">v{doc.version}</div>
                    {!doc.is_latest_version && (
                      <div className="text-xs text-gray-500">Versión anterior</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getStatusColor(doc.status)} size="sm">
                      {getStatusLabel(doc.status)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatFileSize(doc.file_size)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </div>
                    {doc.uploader && (
                      <div className="text-xs text-gray-500">
                        {doc.uploader.first_name} {doc.uploader.last_name}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handlePreview(doc)}
                        className="text-green-600 hover:text-green-900 transition-colors"
                        title="Ver archivo"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleNewVersion(doc)}
                        className="text-purple-600 hover:text-purple-900 transition-colors"
                        title="Nueva versión"
                      >
                        <GitBranch className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDocumentClick(doc)}
                        className="text-gray-600 hover:text-gray-900 transition-colors"
                        title="Ver detalles y editar"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('¿Estás seguro de que quieres archivar este documento?')) {
                            deleteDocumentMutation.mutate(doc.id);
                          }
                        }}
                        disabled={deleteDocumentMutation.isPending}
                        className="text-red-600 hover:text-red-900 transition-colors disabled:opacity-50"
                        title="Archivar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Modal */}
      <UploadDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        areaId={areaId}
        organizationId={area?.organization_id || ''}
        plantId={area?.plant_id || ''}
      />

      {/* Edit Document Modal */}
      <EditDocumentModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedDocument(null);
        }}
        document={selectedDocument}
        organizationId={area?.organization_id || ''}
        plantId={area?.plant_id || ''}
      />

      {/* New Version Modal */}
      <NewDocumentVersionModal
        isOpen={isNewVersionModalOpen}
        onClose={() => {
          setIsNewVersionModalOpen(false);
          setSelectedDocument(null);
        }}
        document={selectedDocument}
        organizationId={area?.organization_id || ''}
        plantId={area?.plant_id || ''}
      />
    </div>
  );
};

export default DocumentsTab;

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { X, Download, History, FileText, Upload, ExternalLink } from 'lucide-react';
import {
  updateDocument,
  getDocumentVersions,
  getFileIcon,
  formatFileSize,
  getCategoryLabel,
  getStatusLabel,
  type AreaDocument,
} from '../../../api/areaDocuments';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import NewDocumentVersionModal from './NewDocumentVersionModal';

interface EditDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: AreaDocument | null;
  organizationId: string;
  plantId: string;
}

const EditDocumentModal = ({ isOpen, onClose, document, organizationId, plantId }: EditDocumentModalProps) => {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('SOP');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState('active');
  const [isPrivate, setIsPrivate] = useState(false);
  const [effectiveDate, setEffectiveDate] = useState('');
  const [showVersions, setShowVersions] = useState(false);
  const [isNewVersionModalOpen, setIsNewVersionModalOpen] = useState(false);

  // Fetch versions when showing version history
  const { data: versions } = useQuery({
    queryKey: ['document-versions', document?.id],
    queryFn: () => getDocumentVersions(document!.id),
    enabled: showVersions && !!document,
  });

  // Initialize form with document data
  useEffect(() => {
    if (isOpen && document) {
      setTitle(document.title);
      setDescription(document.description || '');
      setCategory(document.category);
      setTags(document.tags?.join(', ') || '');
      setStatus(document.status);
      setIsPrivate(document.is_private);
      setEffectiveDate(document.effective_date ? document.effective_date.split('T')[0] : '');
    } else if (!isOpen) {
      // Reset when modal closes
      setTitle('');
      setDescription('');
      setCategory('SOP');
      setTags('');
      setStatus('active');
      setIsPrivate(false);
      setEffectiveDate('');
      setShowVersions(false);
    }
  }, [document, isOpen]);

  const updateDocumentMutation = useMutation({
    mutationFn: (data: any) => updateDocument(document!.id, data),
    onSuccess: () => {
      // Invalidar ambos queries (active y archived)
      queryClient.invalidateQueries({ queryKey: ['area-documents-active', document!.organizational_area_id] });
      queryClient.invalidateQueries({ queryKey: ['area-documents-archived', document!.organizational_area_id] });
      onClose();
    },
  });

  const handleUpdate = async () => {
    if (!document) return;

    const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);

    updateDocumentMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      tags: tagsArray.length > 0 ? tagsArray : undefined,
      status,
      is_private: isPrivate,
      effective_date: effectiveDate || undefined,
    });
  };

  const handleDownload = () => {
    if (document) {
      window.open(document.file_url, '_blank');
    }
  };

  if (!isOpen || !document) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 !mt-0">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between rounded-t-lg flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{getFileIcon(document.file_type)}</div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{document.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="primary" size="sm">v{document.version}</Badge>
                <span className="text-sm text-gray-500">{getCategoryLabel(document.category)}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          {/* File Info Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Información del Archivo</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Nombre:</span>
                <p className="text-gray-900 font-medium truncate">{document.file_name}</p>
              </div>
              <div>
                <span className="text-gray-600">Tamaño:</span>
                <p className="text-gray-900 font-medium">{formatFileSize(document.file_size)}</p>
              </div>
              <div>
                <span className="text-gray-600">Subido por:</span>
                <p className="text-gray-900 font-medium">
                  {document.uploader
                    ? `${document.uploader.first_name} ${document.uploader.last_name}`
                    : 'Desconocido'}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Fecha de subida:</span>
                <p className="text-gray-900 font-medium">
                  {new Date(document.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={handleDownload} variant="outline" size="sm" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Abrir
              </Button>
              <Button
                onClick={() => setShowVersions(!showVersions)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <History className="h-4 w-4" />
                {showVersions ? 'Ocultar Versiones' : 'Ver Versiones'}
              </Button>
              <Button
                onClick={() => setIsNewVersionModalOpen(true)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Nueva Versión
              </Button>
            </div>
          </div>

          {/* Version History */}
          {showVersions && versions && versions.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Historial de Versiones</h3>
              <div className="flex flex-col gap-2">
                {versions.map((ver) => {
                  console.log(ver);

                  return (
                    <div
                      key={ver.id}
                      className="bg-white rounded-md border border-gray-200 p-3 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Version Badge and File Size */}
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={ver.is_latest_version ? 'success' : 'default'} size="sm">
                              v{ver.version}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatFileSize(ver.file_size)}
                            </span>
                            {ver.is_latest_version && (
                              <span className="text-xs text-green-600 font-medium">• Versión Actual</span>
                            )}
                          </div>

                          {/* Description or placeholder */}
                          {ver.description ? (
                            <div className="mb-1">
                              <p className="text-sm text-gray-700 line-clamp-2">
                                {ver.description}
                              </p>
                            </div>
                          ) : (
                            <div className="mb-1">
                              <p className="text-xs text-gray-400 italic">
                                Sin nota de versión
                              </p>
                            </div>
                          )}

                          {/* Uploader */}
                          {ver.uploader && (
                            <p className="text-xs text-gray-500">
                              Subido por {ver.uploader.first_name} {ver.uploader.last_name}
                            </p>
                          )}
                        </div>

                        {/* Date and Action Button */}
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <span className="text-xs text-gray-500">
                            {new Date(ver.created_at).toLocaleDateString()}
                          </span>
                          <Button
                            onClick={() => window.open(ver.file_url, '_blank')}
                            variant="outline"
                            size="sm"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Edit Form */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-gray-900">Editar Información</h3>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category and Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría <span className="text-red-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Borrador</option>
                  <option value="active">Activo</option>
                  <option value="under_review">En Revisión</option>
                  <option value="archived">Archivado</option>
                </select>
              </div>
            </div>

            {/* Tags and Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (Opcional)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Ej: limpieza, turno-1, producción (separados por comas)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {/* Effective Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Efectiva (Opcional)
                </label>
                <input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>


            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción (Opcional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalles adicionales sobre el documento..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Private Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="mt-1 rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Documento Privado</span>
                <p className="text-xs text-gray-500">
                  Se excluirá automáticamente en tours públicos
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex items-center justify-end gap-3 rounded-b-lg flex-shrink-0">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={updateDocumentMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={updateDocumentMutation.isPending}
            className="gap-2"
          >
            {updateDocumentMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Actualizando...
              </>
            ) : (
              'Guardar Cambios'
            )}
          </Button>
        </div>
      </div>

      {/* New Version Modal */}
      <NewDocumentVersionModal
        isOpen={isNewVersionModalOpen}
        onClose={() => setIsNewVersionModalOpen(false)}
        document={document}
        organizationId={organizationId}
        plantId={plantId}
        onVersionCreated={() => {
          // Cerrar ambos modales cuando se crea exitosamente una nueva versión
          setIsNewVersionModalOpen(false);
          onClose();
        }}
      />
    </div>
  );
};

export default EditDocumentModal;

import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Upload, FileText, Check, Link } from 'lucide-react';
import { createDocument, getFileIcon } from '../../../api/areaDocuments';
import apiClient from '../../../api/client';
import Button from '../../../components/ui/Button';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  areaId: string;
  organizationId: string;
  plantId: string;
}

type DocumentSourceType = 'uploaded' | 'external_link';

const UploadDocumentModal = ({ isOpen, onClose, areaId, organizationId, plantId }: UploadDocumentModalProps) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documentSource, setDocumentSource] = useState<DocumentSourceType>('uploaded');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [status, setStatus] = useState(''); // Empty for placeholder
  const [effectiveDate, setEffectiveDate] = useState('');
  const [uploading, setUploading] = useState(false);

  const createDocumentMutation = useMutation({
    mutationFn: (data: any) => createDocument(areaId, data),
    onSuccess: () => {
      // Invalidar ambos queries (active y archived)
      queryClient.invalidateQueries({ queryKey: ['area-documents-active', areaId] });
      queryClient.invalidateQueries({ queryKey: ['area-documents-archived', areaId] });
      handleClose();
    },
  });

  const handleClose = () => {
    setDocumentSource('uploaded');
    setSelectedFile(null);
    setExternalUrl('');
    setTitle('');
    setCategory('');
    setDescription('');
    setTags('');
    setIsPrivate(false);
    setStatus('');
    setEffectiveDate('');
    setUploading(false);
    onClose();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'image/gif',
      ];

      if (!validTypes.includes(file.type)) {
        alert('Tipo de archivo no válido. Solo se permiten PDFs, Word, Excel e imágenes.');
        return;
      }

      // Validate file size (10MB for PDFs, 5MB for others)
      const maxSize = file.type === 'application/pdf' ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
      if (file.size > maxSize) {
        const maxSizeMB = file.type === 'application/pdf' ? 10 : 5;
        alert(`El archivo es demasiado grande. Tamaño máximo: ${maxSizeMB}MB`);
        return;
      }

      setSelectedFile(file);
      // Auto-fill title from filename if empty
      if (!title) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setTitle(nameWithoutExt);
      }
    }
  };

  const getFileNameFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const fileName = pathname.substring(pathname.lastIndexOf('/') + 1);
      return fileName || 'external-document';
    } catch {
      return 'external-document';
    }
  };

  const getMimeTypeFromUrl = (url: string): string => {
    const fileName = getFileNameFromUrl(url);
    const extension = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();

    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
    };

    return mimeTypes[extension] || 'application/octet-stream';
  };

  const handleUpload = async () => {
    // Validation
    if (documentSource === 'uploaded') {
      if (!selectedFile) {
        alert('Por favor selecciona un archivo.');
        return;
      }
    } else {
      if (!externalUrl.trim()) {
        alert('Por favor ingresa la URL del documento.');
        return;
      }
      // Validate URL format
      try {
        new URL(externalUrl.trim());
      } catch {
        alert('Por favor ingresa una URL válida.');
        return;
      }
    }

    if (!title.trim()) {
      alert('Por favor proporciona un título.');
      return;
    }

    if (!category) {
      alert('Por favor selecciona una categoría.');
      return;
    }

    if (!status) {
      alert('Por favor selecciona un estado inicial.');
      return;
    }

    setUploading(true);

    try {
      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);

      if (documentSource === 'uploaded') {
        // Step 1: Upload file to Cloudinary
        const formData = new FormData();
        formData.append('file', selectedFile!);
        formData.append('organization_id', organizationId);
        formData.append('plant_id', plantId);
        formData.append('area_id', areaId);

        const uploadResponse = await apiClient.post('/upload/document', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        // Step 2: Create document record
        await createDocumentMutation.mutateAsync({
          organizational_area_id: areaId,
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          tags: tagsArray.length > 0 ? tagsArray : undefined,
          document_type: 'uploaded',
          file_url: uploadResponse.data.url,
          file_name: selectedFile!.name,
          file_type: selectedFile!.type,
          file_size: selectedFile!.size,
          status: status,
          is_private: isPrivate,
          effective_date: effectiveDate || undefined,
        });
      } else {
        // External link - no upload needed
        const cleanUrl = externalUrl.trim();
        const fileName = getFileNameFromUrl(cleanUrl);
        const mimeType = getMimeTypeFromUrl(cleanUrl);

        await createDocumentMutation.mutateAsync({
          organizational_area_id: areaId,
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          tags: tagsArray.length > 0 ? tagsArray : undefined,
          document_type: 'external_link',
          file_url: cleanUrl,
          file_name: fileName,
          file_type: mimeType,
          status: status,
          is_private: isPrivate,
          effective_date: effectiveDate || undefined,
        });
      }
    } catch (error: any) {
      console.error('Error creating document:', error);
      alert('Error al crear el documento. Por favor intenta de nuevo.');
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 !mt-0">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between rounded-t-lg flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">Subir Documento</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={uploading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body - Horizontal Layout */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column - File Selection or URL Input */}
            <div>
              {documentSource === 'uploaded' ? (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Archivo <span className="text-red-500">*</span>
                  </label>

                  {!selectedFile ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="h-[320px] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                    >
                      <Upload className="h-10 w-10 text-gray-400 mb-3" />
                      <p className="text-gray-700 font-medium mb-2">Haz clic para seleccionar archivo</p>
                      <p className="text-sm text-gray-500 text-center px-4">
                        PDF, Word, Excel o Imágenes
                        <br />
                        Máx. 10MB para PDFs, 5MB para otros
                      </p>
                    </div>
                  ) : (
                    <div className="h-[320px] border-2 border-gray-200 rounded-lg flex flex-col items-center justify-center relative bg-gray-50">
                      <div className="text-6xl mb-4">{getFileIcon(selectedFile.type)}</div>
                      <p className="text-gray-900 font-medium text-center px-4 mb-2 truncate max-w-full">
                        {selectedFile.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>

                      <button
                        onClick={() => setSelectedFile(null)}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition-colors shadow-lg"
                        disabled={uploading}
                      >
                        <X className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-4 px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                        disabled={uploading}
                      >
                        Cambiar Archivo
                      </button>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={uploading}
                  />
                </>
              ) : (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL del Documento <span className="text-red-500">*</span>
                  </label>
                  <div className="h-[320px] flex flex-col">
                    <input
                      type="url"
                      value={externalUrl}
                      onChange={(e) => setExternalUrl(e.target.value)}
                      placeholder="https://drive.google.com/file/d/..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={uploading}
                    />
                    <div className="flex-1 mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <Link className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-blue-900 mb-2">Enlaces Externos Soportados</p>
                          <ul className="text-xs text-blue-700 space-y-1">
                            <li>• Google Drive (archivos públicos o compartidos)</li>
                            <li>• Microsoft OneDrive / SharePoint</li>
                            <li>• Dropbox</li>
                            <li>• URLs directas a documentos PDF</li>
                            <li>• Otros servicios de almacenamiento en la nube</li>
                          </ul>
                          <p className="text-xs text-blue-600 mt-3">
                            <strong>Nota:</strong> Asegúrate de que el enlace sea accesible para todos los usuarios que necesiten ver este documento.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Right Column - Form Fields */}
            <div className="flex flex-col gap-4">
              {/* Document Source Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ¿Cómo quieres agregar el documento? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setDocumentSource('uploaded')}
                    className={`border-2 rounded-lg p-3 text-left transition-all ${
                      documentSource === 'uploaded'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    disabled={uploading}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Upload className={`h-5 w-5 ${documentSource === 'uploaded' ? 'text-blue-600' : 'text-gray-400'}`} />
                      {documentSource === 'uploaded' && (
                        <div className="bg-blue-600 rounded-full p-1">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    <p className={`font-semibold text-sm mb-1 ${documentSource === 'uploaded' ? 'text-blue-900' : 'text-gray-900'}`}>
                      Subir Archivo
                    </p>
                    <p className="text-xs text-gray-600">
                      Desde tu computadora
                    </p>
                  </button>

                  <button
                    onClick={() => setDocumentSource('external_link')}
                    className={`border-2 rounded-lg p-3 text-left transition-all ${
                      documentSource === 'external_link'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    disabled={uploading}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Link className={`h-5 w-5 ${documentSource === 'external_link' ? 'text-blue-600' : 'text-gray-400'}`} />
                      {documentSource === 'external_link' && (
                        <div className="bg-blue-600 rounded-full p-1">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    <p className={`font-semibold text-sm mb-1 ${documentSource === 'external_link' ? 'text-blue-900' : 'text-gray-900'}`}>
                      Link Externo
                    </p>
                    <p className="text-xs text-gray-600">
                      Google Drive, etc.
                    </p>
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: SOP Limpieza de Área de Producción"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={uploading}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría <span className="text-red-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={uploading}
                >
                  <option value="" disabled>Selecciona una categoría</option>
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

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado Inicial <span className="text-red-500">*</span>
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={uploading}
                >
                  <option value="" disabled>Selecciona el estado inicial</option>
                  <option value="active">Activo - Disponible inmediatamente</option>
                  <option value="draft">Borrador - Requiere activación manual</option>
                  <option value="under_review">En Revisión - Pendiente de aprobación</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Los documentos activos estarán disponibles de inmediato
                </p>
              </div>

              {/* Tags */}
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
                  disabled={uploading}
                />
                <p className="text-xs text-gray-500 mt-1">Separa los tags con comas</p>
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
                  disabled={uploading}
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
                  disabled={uploading}
                />
              </div>

              {/* Private Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="mt-1 rounded text-blue-600 focus:ring-blue-500"
                  disabled={uploading}
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
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex items-center justify-end gap-3 rounded-b-lg flex-shrink-0">
          <Button
            onClick={handleClose}
            variant="outline"
            disabled={uploading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleUpload}
            disabled={
              (documentSource === 'uploaded' ? !selectedFile : !externalUrl.trim()) ||
              !title.trim() ||
              uploading
            }
            className="gap-2"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                {documentSource === 'uploaded' ? 'Subiendo...' : 'Creando...'}
              </>
            ) : (
              <>
                {documentSource === 'uploaded' ? (
                  <>
                    <Upload className="h-4 w-4" />
                    Subir Documento
                  </>
                ) : (
                  <>
                    <Link className="h-4 w-4" />
                    Vincular Documento
                  </>
                )}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UploadDocumentModal;

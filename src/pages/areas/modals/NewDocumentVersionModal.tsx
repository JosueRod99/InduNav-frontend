import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Upload, FileText, Link, Check } from 'lucide-react';
import { createDocumentVersion, getFileIcon, type AreaDocument } from '../../../api/areaDocuments';
import apiClient from '../../../api/client';
import Button from '../../../components/ui/Button';

interface NewDocumentVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: AreaDocument | null;
  organizationId: string;
  plantId: string;
  onVersionCreated?: () => void; // Optional callback cuando se crea exitosamente una versión
}

type DocumentSourceType = 'uploaded' | 'external_link';

const NewDocumentVersionModal = ({ isOpen, onClose, document, organizationId, plantId, onVersionCreated }: NewDocumentVersionModalProps) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documentSource, setDocumentSource] = useState<DocumentSourceType>('uploaded');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  const createVersionMutation = useMutation({
    mutationFn: (data: any) => createDocumentVersion(document!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['area-documents', document!.organizational_area_id] });
      queryClient.invalidateQueries({ queryKey: ['document-versions', document!.id] });
      handleClose();
      // Llamar callback si existe (para cerrar modal padre si viene desde EditDocumentModal)
      if (onVersionCreated) {
        onVersionCreated();
      }
    },
  });

  const handleClose = () => {
    setDocumentSource('uploaded');
    setSelectedFile(null);
    setExternalUrl('');
    setDescription('');
    setUploading(false);
    onClose();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type (same type as original)
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

      // Validate file size
      const maxSize = file.type === 'application/pdf' ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
      if (file.size > maxSize) {
        const maxSizeMB = file.type === 'application/pdf' ? 10 : 5;
        alert(`El archivo es demasiado grande. Tamaño máximo: ${maxSizeMB}MB`);
        return;
      }

      setSelectedFile(file);
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
    if (!document) {
      alert('Documento no encontrado.');
      return;
    }

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

    setUploading(true);

    try {
      if (documentSource === 'uploaded') {
        // Step 1: Upload file to Cloudinary
        const formData = new FormData();
        formData.append('file', selectedFile!);
        formData.append('organization_id', organizationId);
        formData.append('plant_id', plantId);
        formData.append('area_id', document.organizational_area_id);

        const uploadResponse = await apiClient.post('/upload/document', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        // Step 2: Create new version record
        await createVersionMutation.mutateAsync({
          document_type: 'uploaded',
          file_url: uploadResponse.data.url,
          file_name: selectedFile!.name,
          file_type: selectedFile!.type,
          file_size: selectedFile!.size,
          description: description.trim() || undefined,
          effective_date: new Date().toISOString(),
        });
      } else {
        // External link - no upload needed
        const cleanUrl = externalUrl.trim();
        const fileName = getFileNameFromUrl(cleanUrl);
        const mimeType = getMimeTypeFromUrl(cleanUrl);

        await createVersionMutation.mutateAsync({
          document_type: 'external_link',
          file_url: cleanUrl,
          file_name: fileName,
          file_type: mimeType,
          description: description.trim() || undefined,
          effective_date: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      console.error('Error creating document version:', error);
      alert('Error al crear nueva versión. Por favor intenta de nuevo.');
      setUploading(false);
    }
  };

  if (!isOpen || !document) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 !mt-0">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between rounded-t-lg flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Nueva Versión de Documento</h2>
            <p className="text-sm text-gray-600 mt-1">
              {document.title} <span className="text-gray-400">•</span> Versión actual: v{document.version}
            </p>
          </div>
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
                    Nuevo Archivo <span className="text-red-500">*</span>
                  </label>

                  {!selectedFile ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="h-[240px] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
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
                    <div className="h-[240px] border-2 border-gray-200 rounded-lg flex flex-col items-center justify-center relative bg-gray-50">
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
                  <div className="h-[240px] flex flex-col">
                    <input
                      type="url"
                      value={externalUrl}
                      onChange={(e) => setExternalUrl(e.target.value)}
                      placeholder="https://drive.google.com/file/d/..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={uploading}
                    />
                    <div className="flex-1 mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <Link className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-blue-900 mb-2">Nueva Versión con Enlace Externo</p>
                          <p className="text-xs text-blue-700">
                            Puedes actualizar la versión del documento con un enlace externo a Google Drive, SharePoint, Dropbox u otro servicio de almacenamiento en la nube.
                          </p>
                          <p className="text-xs text-blue-600 mt-2">
                            <strong>Nota:</strong> Asegúrate de que el enlace sea accesible para todos los usuarios.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Right Column - Info and Form */}
            <div className="flex flex-col gap-4">
              {/* Document Source Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ¿Cómo quieres actualizar el documento? <span className="text-red-500">*</span>
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
                      Archivo nuevo
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
                      URL externa
                    </p>
                  </button>
                </div>
              </div>

              {/* Current Document Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-3">Documento Original</h3>
                <div className="flex flex-col gap-2 text-sm">
                  <div>
                    <span className="text-blue-700">Título:</span>
                    <p className="text-blue-900 font-medium">{document.title}</p>
                  </div>
                  <div>
                    <span className="text-blue-700">Categoría:</span>
                    <p className="text-blue-900 font-medium">{document.category}</p>
                  </div>
                  <div>
                    <span className="text-blue-700">Versión Actual:</span>
                    <p className="text-blue-900 font-medium">v{document.version}</p>
                  </div>
                </div>
              </div>

              {/* Auto-increment info */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <FileText className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-900">Versionado Automático</p>
                    <p className="text-xs text-green-700 mt-1">
                      La nueva versión se creará automáticamente y se marcará como la versión actual.
                      El título, categoría y tags se mantendrán del documento original.
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción de Cambios (Opcional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej: Actualización con nuevas normas de seguridad..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  disabled={uploading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Describe qué cambió en esta nueva versión
                </p>
              </div>
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
              uploading
            }
            className="gap-2"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Creando Versión...
              </>
            ) : (
              <>
                {documentSource === 'uploaded' ? (
                  <>
                    <Upload className="h-4 w-4" />
                    Crear Nueva Versión
                  </>
                ) : (
                  <>
                    <Link className="h-4 w-4" />
                    Crear Nueva Versión
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

export default NewDocumentVersionModal;

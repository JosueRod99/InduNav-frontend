import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Upload, FileText } from 'lucide-react';
import { createDocumentVersion, getFileIcon, type AreaDocument } from '../../../api/areaDocuments';
import apiClient from '../../../api/client';
import Button from '../../../components/ui/Button';

interface NewDocumentVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: AreaDocument | null;
  organizationId: string;
  plantId: string;
}

const NewDocumentVersionModal = ({ isOpen, onClose, document, organizationId, plantId }: NewDocumentVersionModalProps) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  const createVersionMutation = useMutation({
    mutationFn: (data: any) => createDocumentVersion(document!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['area-documents', document!.organizational_area_id] });
      queryClient.invalidateQueries({ queryKey: ['document-versions', document!.id] });
      handleClose();
    },
  });

  const handleClose = () => {
    setSelectedFile(null);
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

  const handleUpload = async () => {
    if (!selectedFile || !document) {
      alert('Por favor selecciona un archivo.');
      return;
    }

    setUploading(true);

    try {
      // Step 1: Upload file to Cloudinary
      const formData = new FormData();
      formData.append('file', selectedFile);
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
        file_url: uploadResponse.data.url,
        file_name: selectedFile.name,
        file_type: selectedFile.type,
        file_size: selectedFile.size,
        description: description.trim() || undefined,
        effective_date: new Date().toISOString(),
      });
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
            {/* Left Column - File Selection */}
            <div>
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
            </div>

            {/* Right Column - Info and Form */}
            <div className="flex flex-col gap-4">
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
            disabled={!selectedFile || uploading}
            className="gap-2"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Creando Versión...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Crear Nueva Versión
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NewDocumentVersionModal;

import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Upload, Link as LinkIcon, FileText } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import apiClient from '../../../api/client';
import {
  createProductDocument,
  updateProductDocument,
  type ProductDocument,
  type CreateProductDocumentRequest,
  type UpdateProductDocumentRequest,
} from '../../../api/products';

interface ProductDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  organizationId: string;
  plantId: string;
  document?: ProductDocument | null;
}

const DOCUMENT_TYPES = [
  { value: 'technical', label: 'Ficha Técnica' },
  { value: 'manual', label: 'Manual' },
  { value: 'certificate', label: 'Certificado' },
  { value: 'safety', label: 'Hoja de Seguridad' },
  { value: 'datasheet', label: 'Hoja de Datos' },
  { value: 'specification', label: 'Especificación' },
];

type UploadMode = 'url' | 'file';

const ProductDocumentModal = ({
  isOpen,
  onClose,
  productId,
  organizationId,
  plantId,
  document,
}: ProductDocumentModalProps) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!document;

  const [uploadMode, setUploadMode] = useState<UploadMode>('url');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState<CreateProductDocumentRequest>({
    document_name: '',
    document_url: '',
    document_type: 'technical',
    description: '',
    file_size: undefined,
    mime_type: '',
    uploaded_date: new Date().toISOString().split('T')[0] as any,
  });

  useEffect(() => {
    if (document) {
      setFormData({
        document_name: document.document_name,
        document_url: document.document_url,
        document_type: document.document_type || 'technical',
        description: document.description || '',
        file_size: document.file_size || undefined,
        mime_type: document.mime_type || '',
        uploaded_date: document.uploaded_date
          ? new Date(document.uploaded_date).toISOString().split('T')[0] as any
          : new Date().toISOString().split('T')[0] as any,
      });
      setUploadMode('url'); // Always URL mode when editing
    } else {
      setFormData({
        document_name: '',
        document_url: '',
        document_type: 'technical',
        description: '',
        file_size: undefined,
        mime_type: '',
        uploaded_date: new Date().toISOString().split('T')[0] as any,
      });
      setUploadMode('url');
      setSelectedFile(null);
      setUploading(false);
    }
  }, [document, isOpen]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (payload: CreateProductDocumentRequest) =>
      createProductDocument(productId, payload),
    onSuccess: () => {
      toast.success('Documento agregado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['product-documents', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al agregar documento');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (payload: UpdateProductDocumentRequest) =>
      updateProductDocument(document!.id, payload),
    onSuccess: () => {
      toast.success('Documento actualizado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['product-documents', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar documento');
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-populate document name from filename if empty
      if (!formData.document_name) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setFormData((prev) => ({ ...prev, document_name: nameWithoutExt }));
      }
      // Set MIME type
      setFormData((prev) => ({ ...prev, mime_type: file.type }));
      // Set file size
      setFormData((prev) => ({ ...prev, file_size: file.size }));
    }
  };

  const handleUploadFile = async (): Promise<string> => {
    if (!selectedFile) {
      throw new Error('No se ha seleccionado ningún archivo');
    }

    setUploading(true);

    try {
      // Upload file to Cloudinary
      const formDataUpload = new FormData();
      formDataUpload.append('file', selectedFile);
      formDataUpload.append('organization_id', organizationId);
      formDataUpload.append('plant_id', plantId);

      const uploadResponse = await apiClient.post('/upload/document', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const fileUrl = uploadResponse.data.url;
      setUploading(false);
      return fileUrl;
    } catch (error: any) {
      setUploading(false);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.document_name.trim()) {
      toast.error('El nombre del documento es requerido');
      return;
    }

    // For URL mode, validate URL
    if (uploadMode === 'url' && !formData.document_url.trim()) {
      toast.error('La URL del documento es requerida');
      return;
    }

    // For file mode, validate file selection
    if (uploadMode === 'file' && !isEditing && !selectedFile) {
      toast.error('Por favor selecciona un archivo');
      return;
    }

    try {
      let documentUrl = formData.document_url;

      // If file mode and not editing, upload the file first
      if (uploadMode === 'file' && !isEditing && selectedFile) {
        documentUrl = await handleUploadFile();
      }

      const payload = {
        ...formData,
        document_url: documentUrl,
        file_size: formData.file_size || undefined,
        mime_type: formData.mime_type || undefined,
        description: formData.description || undefined,
      };

      if (isEditing) {
        updateMutation.mutate(payload);
      } else {
        createMutation.mutate(payload);
      }
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast.error(error.response?.data?.message || 'Error al subir el archivo');
    }
  };

  const handleChange = (field: keyof CreateProductDocumentRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Documento' : 'Agregar Documento'}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={uploading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending || uploading}
            className="gap-2"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Subiendo...
              </>
            ) : createMutation.isPending || updateMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                {isEditing ? 'Actualizando...' : 'Guardando...'}
              </>
            ) : (
              <>{isEditing ? 'Actualizar' : 'Agregar'}</>
            )}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Document Name */}
        <Input
          label="Nombre del Documento"
          value={formData.document_name}
          onChange={(e) => handleChange('document_name', e.target.value)}
          required
          placeholder="Ej: Ficha Técnica Rev. 3"
        />

        {/* Upload Mode Tabs (only show when creating) */}
        {!isEditing && (
          <div className="border-b border-gray-200">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUploadMode('url')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  uploadMode === 'url'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <LinkIcon className="h-4 w-4 inline mr-2" />
                URL del Documento
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('file')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  uploadMode === 'file'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Upload className="h-4 w-4 inline mr-2" />
                Subir Archivo
              </button>
            </div>
          </div>
        )}

        {/* Document URL Input (URL mode or editing) */}
        {(uploadMode === 'url' || isEditing) && (
          <Input
            label="URL del Documento"
            type="url"
            value={formData.document_url}
            onChange={(e) => handleChange('document_url', e.target.value)}
            required={uploadMode === 'url'}
            placeholder="https://..."
            helperText="URL de Cloudinary o cualquier servicio de almacenamiento"
          />
        )}

        {/* File Upload (File mode and not editing) */}
        {uploadMode === 'file' && !isEditing && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Archivo <span className="text-red-500">*</span>
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-colors"
            >
              {!selectedFile ? (
                <>
                  <FileText className="h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600 mb-1">Click para seleccionar un archivo</p>
                  <p className="text-xs text-gray-500">PDF, DOC, XLS, TXT, etc. hasta 50MB</p>
                </>
              ) : (
                <>
                  <FileText className="h-12 w-12 text-blue-500 mb-3" />
                  <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                    className="mt-2 text-xs text-red-600 hover:text-red-700"
                  >
                    Cambiar archivo
                  </button>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,.rar"
            />
          </div>
        )}

        {/* Document Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Documento
          </label>
          <select
            value={formData.document_type}
            onChange={(e) => handleChange('document_type', e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            {DOCUMENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción (opcional)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={2}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Descripción breve del documento..."
          />
        </div>

        {/* File Metadata - Only show in URL mode or when editing */}
        {(uploadMode === 'url' || isEditing) && (
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Tamaño (bytes)"
              type="number"
              value={formData.file_size || ''}
              onChange={(e) =>
                handleChange('file_size', e.target.value ? Number(e.target.value) : undefined)
              }
              placeholder="Ej: 2500000"
            />

            <Input
              label="Tipo MIME"
              value={formData.mime_type}
              onChange={(e) => handleChange('mime_type', e.target.value)}
              placeholder="Ej: application/pdf"
            />
          </div>
        )}

        {/* Show auto-populated metadata in file mode */}
        {uploadMode === 'file' && !isEditing && selectedFile && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-700 mb-2">Metadata del Archivo:</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div>
                <span className="font-medium">Tipo MIME:</span> {formData.mime_type || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Tamaño:</span>{' '}
                {formData.file_size ? (formData.file_size / 1024 / 1024).toFixed(2) + ' MB' : 'N/A'}
              </div>
            </div>
          </div>
        )}

        {/* Uploaded Date */}
        <Input
          label="Fecha de Carga"
          type="date"
          value={formData.uploaded_date as any}
          onChange={(e) => handleChange('uploaded_date', e.target.value)}
        />
      </form>
    </Modal>
  );
};

export default ProductDocumentModal;

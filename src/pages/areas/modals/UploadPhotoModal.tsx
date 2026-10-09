import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Upload, Image as ImageIcon, Check } from 'lucide-react';
import { createPhoto } from '../../../api/areaPhotos';
import apiClient from '../../../api/client';
import Button from '../../../components/ui/Button';

interface UploadPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  areaId: string;
  organizationId: string;
  plantId: string;
}

const UploadPhotoModal = ({ isOpen, onClose, areaId, organizationId, plantId }: UploadPhotoModalProps) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [photoType, setPhotoType] = useState<'main' | 'general'>('general');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  const createPhotoMutation = useMutation({
    mutationFn: (payload: any) => createPhoto(areaId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['area-photos', areaId] });
      queryClient.invalidateQueries({ queryKey: ['area', areaId] });
      handleClose();
    },
  });

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setCaption('');
    setPhotoType('general');
    setDescription('');
    setUploading(false);
    onClose();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);

    try {
      // Step 1: Upload image to Cloudinary
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('organization_id', organizationId);
      formData.append('plant_id', plantId);
      formData.append('image_type', 'areas');

      const uploadResponse = await apiClient.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const imageUrl = uploadResponse.data.url;

      // Step 2: Create photo record in database
      const metadata: any = {};
      if (description) {
        metadata.description = description;
      }

      await createPhotoMutation.mutateAsync({
        photo_url: imageUrl,
        caption: caption || null,
        photo_type: photoType === 'main' ? 'main' : 'general',
        is_cover: photoType === 'main',
        is_featured: false,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      });
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      alert('Error al subir la foto. Por favor intenta de nuevo.');
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 !mt-0">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
          <h2 className="text-xl font-semibold text-gray-900">Subir Foto</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={uploading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body - Horizontal Layout */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column - Image Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagen <span className="text-red-500">*</span>
              </label>
              {!previewUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg h-[400px] flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-colors"
                >
                  <Upload className="h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 mb-1">
                    Click para seleccionar una imagen
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF hasta 10MB
                  </p>
                </div>
              ) : (
                <div className="relative h-[400px]">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition-colors shadow-lg"
                    disabled={uploading}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
            </div>

            {/* Right Column - Form Fields */}
            <div className="space-y-4">
              {/* Caption */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Ej: Vista frontal del área de producción"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={uploading}
                />
              </div>

              {/* Photo Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Foto <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPhotoType('main')}
                    className={`border-2 rounded-lg p-3 text-left transition-all ${
                      photoType === 'main'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    disabled={uploading}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <ImageIcon className={`h-5 w-5 ${photoType === 'main' ? 'text-blue-600' : 'text-gray-400'}`} />
                      {photoType === 'main' && (
                        <div className="bg-blue-600 rounded-full p-1">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    <p className={`font-semibold text-sm mb-1 ${photoType === 'main' ? 'text-blue-900' : 'text-gray-900'}`}>
                      Principal
                    </p>
                    <p className="text-xs text-gray-600">
                      Portada del área
                    </p>
                  </button>

                  <button
                    onClick={() => setPhotoType('general')}
                    className={`border-2 rounded-lg p-3 text-left transition-all ${
                      photoType === 'general'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    disabled={uploading}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <ImageIcon className={`h-5 w-5 ${photoType === 'general' ? 'text-blue-600' : 'text-gray-400'}`} />
                      {photoType === 'general' && (
                        <div className="bg-blue-600 rounded-full p-1">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    <p className={`font-semibold text-sm mb-1 ${photoType === 'general' ? 'text-blue-900' : 'text-gray-900'}`}>
                      General
                    </p>
                    <p className="text-xs text-gray-600">
                      Galería
                    </p>
                  </button>
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
                  placeholder="Detalles adicionales sobre la foto..."
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  disabled={uploading}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 rounded-b-lg">
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
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Subir Foto
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UploadPhotoModal;

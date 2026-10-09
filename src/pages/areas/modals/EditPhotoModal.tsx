import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Upload, Image as ImageIcon, Check } from 'lucide-react';
import { updatePhoto, type AreaPhoto } from '../../../api/areaPhotos';
import apiClient from '../../../api/client';
import Button from '../../../components/ui/Button';

interface EditPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  photo: AreaPhoto | null;
  organizationId: string;
  plantId: string;
}

const EditPhotoModal = ({ isOpen, onClose, photo, organizationId, plantId }: EditPhotoModalProps) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [photoType, setPhotoType] = useState<'main' | 'general'>('general');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  // Initialize form with existing photo data when modal opens
  useEffect(() => {
    if (isOpen && photo) {
      setCaption(photo.caption || '');
      // Check both photo_type and is_cover to determine if it's main
      const isMainPhoto = photo.photo_type === 'main' || photo.is_cover === true;
      setPhotoType(isMainPhoto ? 'main' : 'general');
      setDescription(photo.metadata?.description || '');
      setPreviewUrl(photo.photo_url);
      setSelectedFile(null); // Reset selected file when photo changes
    } else if (!isOpen) {
      // Reset when modal closes
      setSelectedFile(null);
      setPreviewUrl(null);
      setCaption('');
      setPhotoType('general');
      setDescription('');
    }
  }, [photo, isOpen]);

  const updatePhotoMutation = useMutation({
    mutationFn: (payload: any) => updatePhoto(photo!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['area-photos', photo!.organizational_area_id] });
      queryClient.invalidateQueries({ queryKey: ['area', photo!.organizational_area_id] });
      handleClose();
    },
  });

  const handleClose = () => {
    // Reset all state to defaults
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

  const handleUpdate = async () => {
    if (!photo) return;

    setUploading(true);

    try {
      let newImageUrl: string | undefined = undefined;

      // Step 1: If new image is selected, upload to Cloudinary
      if (selectedFile) {
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

        newImageUrl = uploadResponse.data.url;
      }

      // Step 2: Update photo record in database
      const metadata: any = { ...photo.metadata };
      if (description) {
        metadata.description = description;
      } else {
        delete metadata.description;
      }

      const updatePayload: any = {
        caption: caption || null,
        photo_type: photoType === 'main' ? 'main' : 'general',
        is_cover: photoType === 'main',
        is_featured: false,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      };

      // Only include photo_url if a new image was uploaded
      if (newImageUrl) {
        updatePayload.photo_url = newImageUrl;
      }

      await updatePhotoMutation.mutateAsync(updatePayload);
    } catch (error: any) {
      console.error('Error updating photo:', error);
      alert('Error al actualizar la foto. Por favor intenta de nuevo.');
      setUploading(false);
    }
  };

  if (!isOpen || !photo) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 !mt-0">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
          <h2 className="text-xl font-semibold text-gray-900">Editar Foto</h2>
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
                Imagen
                {selectedFile && (
                  <span className="ml-2 text-xs text-blue-600">(Nueva imagen seleccionada)</span>
                )}
              </label>
              <div className="relative h-[400px] group">
                <img
                  src={previewUrl || photo.photo_url}
                  alt="Preview"
                  className="w-full h-full object-cover rounded-lg"
                />

                {/* Overlay to change image */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-lg flex items-center justify-center">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-gray-900 px-4 py-2 rounded-md flex items-center gap-2 shadow-lg"
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4" />
                    Cambiar Imagen
                  </button>
                </div>

                {selectedFile && (
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(photo.photo_url);
                    }}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition-colors shadow-lg"
                    disabled={uploading}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
              <p className="text-xs text-gray-500 mt-2">
                Pasa el cursor sobre la imagen para cambiarla
              </p>
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
            onClick={handleUpdate}
            disabled={uploading}
            className="gap-2"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Actualizando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditPhotoModal;

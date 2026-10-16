import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Upload, Star } from 'lucide-react';
import { createEquipmentImage } from '../../../api/equipment';
import apiClient from '../../../api/client';
import Button from '../../../components/ui/Button';

interface UploadEquipmentImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentId: string;
  organizationId: string;
  plantId: string;
}

const UploadEquipmentImageModal = ({
  isOpen,
  onClose,
  equipmentId,
  organizationId,
  plantId,
}: UploadEquipmentImageModalProps) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [uploading, setUploading] = useState(false);

  const createImageMutation = useMutation({
    mutationFn: (payload: any) => createEquipmentImage(equipmentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-images', equipmentId] });
      queryClient.invalidateQueries({ queryKey: ['equipment', equipmentId] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      handleClose();
    },
  });

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setCaption('');
    setIsPrimary(false);
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
      formData.append('image_type', 'products');

      const uploadResponse = await apiClient.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const imageUrl = uploadResponse.data.url;

      // Step 2: Create equipment image record in database
      await createImageMutation.mutateAsync({
        image_url: imageUrl,
        caption: caption || null,
        is_primary: isPrimary,
      });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert('Error al subir la imagen. Por favor intenta de nuevo.');
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 !mt-0">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
          <h2 className="text-xl font-semibold text-gray-900">Subir Imagen del Equipo</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={uploading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
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
                  className="border-2 border-dashed border-gray-300 rounded-lg h-[350px] flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-colors"
                >
                  <Upload className="h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 mb-1">
                    Click para seleccionar una imagen
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF hasta 10MB</p>
                </div>
              ) : (
                <div className="relative h-[350px]">
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
                  Descripción / Título
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Ej: Vista frontal, Vista del detalle, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={uploading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Opcional - Ayuda a identificar la imagen
                </p>
              </div>

              {/* Set as Primary */}
              <div className="border border-gray-200 rounded-lg p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrimary}
                    onChange={(e) => setIsPrimary(e.target.checked)}
                    disabled={uploading}
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium text-gray-900">
                        Establecer como imagen principal
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Esta imagen se mostrará como portada del equipo en las listas y
                      detalles
                    </p>
                  </div>
                </label>
              </div>

              {/* Info Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">
                  Consejos para mejores imágenes:
                </h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Usa buena iluminación para mostrar detalles</li>
                  <li>• Captura diferentes ángulos del equipo</li>
                  <li>• Incluye fotos de características importantes</li>
                  <li>• Mantén el fondo limpio y ordenado</li>
                  <li>• Asegúrate que la imagen esté enfocada</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 rounded-b-lg">
          <Button onClick={handleClose} variant="outline" disabled={uploading}>
            Cancelar
          </Button>
          <Button onClick={handleUpload} disabled={!selectedFile || uploading} className="gap-2">
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Subir Imagen
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UploadEquipmentImageModal;

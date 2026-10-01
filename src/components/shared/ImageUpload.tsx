import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { uploadImage, ImageType, type UploadOptions } from '../../api/upload';
import Button from '../ui/Button';

interface ImageUploadProps {
  onImageUploaded: (url: string, publicId: string) => void;
  organizationId?: string;
  plantId?: string;
  imageType: ImageType;
  customFolder?: string;
  currentImageUrl?: string;
  label?: string;
  helperText?: string;
  maxSizeMB?: number;
}

const ImageUpload = ({
  onImageUploaded,
  organizationId,
  plantId,
  imageType,
  customFolder,
  currentImageUrl,
  label = 'Subir Imagen',
  helperText = 'Arrastra una imagen aquí o haz clic para seleccionar',
  maxSizeMB = 10,
}: ImageUploadProps) => {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const options: UploadOptions = {
        imageType,
        organizationId,
        plantId,
        customFolder,
      };
      return uploadImage(file, options);
    },
    onSuccess: (data) => {
      toast.success('Imagen subida exitosamente');
      setPreview(data.url);
      onImageUploaded(data.url, data.public_id);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al subir imagen');
      setPreview(null);
    },
  });

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten archivos de imagen');
      return;
    }

    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast.error(`La imagen no puede ser mayor a ${maxSizeMB}MB`);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    uploadMutation.mutate(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageUploaded('', '');
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${uploadMutation.isPending ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={uploadMutation.isPending}
        />

        {uploadMutation.isPending ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-3" />
            <p className="text-sm text-gray-600">Subiendo imagen...</p>
          </div>
        ) : preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-64 object-contain rounded-lg"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <ImageIcon className="h-12 w-12 text-gray-400 mb-3" />
            <div className="flex items-center gap-2 mb-2">
              <Upload className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                {helperText}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              PNG, JPG, GIF hasta {maxSizeMB}MB
            </p>
          </div>
        )}
      </div>

      {preview && (
        <div className="mt-2 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemove}
            type="button"
          >
            Cambiar imagen
          </Button>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;

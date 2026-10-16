import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Image as ImageIcon, Upload, Star, Trash2, Edit2 } from 'lucide-react';
import {
  getEquipmentImages,
  deleteEquipmentImage,
  setPrimaryEquipmentImage,
  updateEquipmentImage,
  type EquipmentImage,
  type Equipment,
} from '../../../api/equipment';
import Badge from '../../../components/ui/Badge';
import UploadEquipmentImageModal from '../modals/UploadEquipmentImageModal';
import ViewEquipmentImageModal from '../modals/ViewEquipmentImageModal';

interface EquipmentGalleryTabProps {
  equipmentId: string;
  equipment?: Equipment;
}

const EquipmentGalleryTab = ({ equipmentId, equipment }: EquipmentGalleryTabProps) => {
  const queryClient = useQueryClient();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<EquipmentImage | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const { data: images = [], isLoading } = useQuery({
    queryKey: ['equipment-images', equipmentId],
    queryFn: () => getEquipmentImages(equipmentId),
  });

  const deleteImageMutation = useMutation({
    mutationFn: deleteEquipmentImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-images', equipmentId] });
      queryClient.invalidateQueries({ queryKey: ['equipment', equipmentId] });
    },
  });

  const setPrimaryMutation = useMutation({
    mutationFn: setPrimaryEquipmentImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-images', equipmentId] });
      queryClient.invalidateQueries({ queryKey: ['equipment', equipmentId] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
    },
  });

  const updateImageMutation = useMutation({
    mutationFn: ({ id, caption }: { id: string; caption: string }) =>
      updateEquipmentImage(id, { caption }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-images', equipmentId] });
    },
  });

  const handleImageClick = (image: EquipmentImage) => {
    setSelectedImage(image);
    setIsViewModalOpen(true);
  };

  const handleSetPrimary = (imageId: string) => {
    if (confirm('¿Establecer como imagen principal?')) {
      setPrimaryMutation.mutate(imageId);
    }
  };

  const handleDelete = (imageId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta imagen?')) {
      deleteImageMutation.mutate(imageId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-600">
        Cargando galería...
      </div>
    );
  }

  if (!images || images.length === 0) {
    return (
      <>
        <div className="text-center py-12">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sin Imágenes</h3>
          <p className="text-gray-600 mb-4">
            Aún no hay imágenes en la galería de este equipo.
          </p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Subir Imágenes
          </button>
        </div>

        <UploadEquipmentImageModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          equipmentId={equipmentId}
          organizationId={equipment?.organization_id || ''}
          plantId={equipment?.plant_id || ''}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary and Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Galería de Imágenes ({images.length})
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Imágenes del equipo ordenadas por preferencia
          </p>
        </div>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Upload className="h-4 w-4" />
          Subir Imágenes
        </button>
      </div>

      {/* Images Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => (
          <div
            key={image.id}
            className="group relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:shadow-lg"
            style={{
              borderColor: image.is_primary ? '#3b82f6' : '#e5e7eb',
            }}
          >
            <img
              src={image.image_url}
              alt={image.caption || 'Imagen del equipo'}
              onClick={() => handleImageClick(image)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 cursor-pointer"
              loading="lazy"
            />

            {/* Primary Badge */}
            {image.is_primary && (
              <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm rounded-md px-2 py-1 shadow-md">
                <Badge variant="info">
                  <Star className="h-3 w-3 inline mr-1" />
                  Principal
                </Badge>
              </div>
            )}

            {/* Hover Overlay with Actions */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-3">
                {/* Caption */}
                {image.caption && (
                  <p className="text-white text-sm font-medium line-clamp-2 mb-3">
                    {image.caption}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-2">
                  {!image.is_primary && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetPrimary(image.id);
                      }}
                      disabled={setPrimaryMutation.isPending}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-white/90 text-gray-700 rounded hover:bg-white transition-colors disabled:opacity-50"
                      title="Establecer como principal"
                    >
                      <Star className="h-3 w-3" />
                      Hacer Principal
                    </button>
                  )}

                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImageClick(image);
                      }}
                      className="p-1.5 bg-white/90 text-gray-700 rounded hover:bg-white transition-colors"
                      title="Ver y editar"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(image.id);
                      }}
                      disabled={deleteImageMutation.isPending}
                      className="p-1.5 bg-white/90 text-red-600 rounded hover:bg-white transition-colors disabled:opacity-50"
                      title="Eliminar imagen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      <UploadEquipmentImageModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        equipmentId={equipmentId}
        organizationId={equipment?.organization_id || ''}
        plantId={equipment?.plant_id || ''}
      />

      {/* View/Edit Image Modal */}
      <ViewEquipmentImageModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedImage(null);
        }}
        image={selectedImage}
        onUpdateCaption={(caption) => {
          if (selectedImage) {
            updateImageMutation.mutate({ id: selectedImage.id, caption });
          }
        }}
        onSetPrimary={() => {
          if (selectedImage) {
            handleSetPrimary(selectedImage.id);
          }
        }}
        onDelete={() => {
          if (selectedImage) {
            handleDelete(selectedImage.id);
            setIsViewModalOpen(false);
            setSelectedImage(null);
          }
        }}
      />
    </div>
  );
};

export default EquipmentGalleryTab;

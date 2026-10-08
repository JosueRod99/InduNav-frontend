import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Image as ImageIcon, Star, Upload, Grid3x3, List, Trash2 } from 'lucide-react';
import { getPhotosByArea, deletePhoto, type AreaPhoto } from '../../../api/areaPhotos';
import Badge from '../../../components/ui/Badge';
import UploadPhotoModal from '../modals/UploadPhotoModal';
import EditPhotoModal from '../modals/EditPhotoModal';

interface GalleryTabProps {
  areaId: string;
  area?: any;
}

const GalleryTab = ({ areaId, area }: GalleryTabProps) => {
  const queryClient = useQueryClient();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<AreaPhoto | null>(null);
  const [viewMode, setViewMode] = useState<'gallery' | 'table'>('table');

  const { data: photos, isLoading } = useQuery({
    queryKey: ['area-photos', areaId],
    queryFn: () => getPhotosByArea(areaId),
  });

  const deletePhotoMutation = useMutation({
    mutationFn: deletePhoto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['area-photos', areaId] });
    },
  });

  const handlePhotoClick = (photo: AreaPhoto) => {
    setSelectedPhoto(photo);
    setIsEditModalOpen(true);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12 text-gray-600">Cargando galería...</div>;
  }

  if (!photos || photos.length === 0) {
    return (
      <>
        <div className="text-center py-12">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sin Fotos</h3>
          <p className="text-gray-600 mb-4">Aún no hay fotos en la galería de esta área.</p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Subir Fotos
          </button>
        </div>

        <UploadPhotoModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          areaId={areaId}
          organizationId={area?.organization_id || ''}
          plantId={area?.plant_id || ''}
        />
      </>
    );
  }

  // Group photos by type
  const photosByType: Record<string, typeof photos> = {};
  photos.forEach((photo) => {
    if (!photosByType[photo.photo_type]) {
      photosByType[photo.photo_type] = [];
    }
    photosByType[photo.photo_type].push(photo);
  });

  const typeLabels: Record<string, string> = {
    main: 'Principal',
    general: 'General',
    before_improvement: 'Antes de Mejora',
    after_improvement: 'Después de Mejora',
    equipment: 'Equipo',
    layout: 'Layout',
    safety: 'Seguridad',
    product: 'Producto',
  };

  return (
    <div className="space-y-8">
      {/* Summary and Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Galería de Fotos ({photos.length})
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Fotos del área organizadas por categoría
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              onClick={() => setViewMode('gallery')}
              className={`px-4 py-2 text-sm font-medium border transition-colors ${
                viewMode === 'gallery'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              } rounded-l-md`}
            >
              <Grid3x3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 text-sm font-medium border-t border-b border-r transition-colors ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              } rounded-r-md`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Subir Fotos
          </button>
        </div>
      </div>

      {/* Gallery View */}
      {viewMode === 'gallery' && (
        <>
          {Object.entries(photosByType).map(([type, typePhotos]) => (
            <div key={type}>
              <h4 className="text-md font-semibold text-gray-900 mb-4">
                {typeLabels[type] || type} ({typePhotos.length})
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {typePhotos.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => handlePhotoClick(photo)}
                    className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-all hover:shadow-lg cursor-pointer"
                  >
                    <img
                      src={photo.thumbnail_url || photo.photo_url}
                      alt={photo.caption || 'Foto del área'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      loading="lazy"
                    />

                    {/* Badge de Portada - Siempre visible */}
                    {photo.is_cover && (
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-md px-2 py-1 shadow-md">
                        <Badge variant="primary" size="sm">
                          Portada
                        </Badge>
                      </div>
                    )}

                    {/* Overlay with info on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        {photo.caption && (
                          <p className="text-white text-sm font-medium line-clamp-2 mb-2">
                            {photo.caption}
                          </p>
                        )}
                        {photo.taken_by_employee && (
                          <p className="text-white/80 text-xs">
                            {photo.taken_by_employee.full_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vista Previa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Título
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {photos.map((photo) => (
                <tr key={photo.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <img
                      src={photo.thumbnail_url || photo.photo_url}
                      alt={photo.caption || 'Foto'}
                      onClick={() => handlePhotoClick(photo)}
                      className="h-16 w-16 object-cover rounded cursor-pointer hover:opacity-75 transition-opacity"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {photo.caption || 'Sin título'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(photo.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 max-w-xs truncate">
                      {photo.metadata?.description || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {photo.is_cover ? (
                      <Badge variant="primary" size="sm">
                        Portada
                      </Badge>
                    ) : (
                      <span className="text-sm text-gray-500">General</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        if (confirm('¿Estás seguro de que quieres eliminar esta foto?')) {
                          deletePhotoMutation.mutate(photo.id);
                        }
                      }}
                      disabled={deletePhotoMutation.isPending}
                      className="text-red-600 hover:text-red-900 transition-colors disabled:opacity-50"
                      title="Eliminar foto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Modal */}
      <UploadPhotoModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        areaId={areaId}
        organizationId={area?.organization_id || ''}
        plantId={area?.plant_id || ''}
      />

      {/* Edit Photo Modal */}
      <EditPhotoModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedPhoto(null);
        }}
        photo={selectedPhoto}
        organizationId={area?.organization_id || ''}
        plantId={area?.plant_id || ''}
      />
    </div>
  );
};

export default GalleryTab;

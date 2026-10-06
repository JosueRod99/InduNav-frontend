import { useQuery } from '@tanstack/react-query';
import { Image as ImageIcon, Star, Upload } from 'lucide-react';
import { getPhotosByArea } from '../../../api/areaPhotos';
import Badge from '../../../components/ui/Badge';

interface GalleryTabProps {
  areaId: string;
}

const GalleryTab = ({ areaId }: GalleryTabProps) => {
  const { data: photos, isLoading } = useQuery({
    queryKey: ['area-photos', areaId],
    queryFn: () => getPhotosByArea(areaId),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-12 text-gray-600">Cargando galería...</div>;
  }

  if (!photos || photos.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Sin Fotos</h3>
        <p className="text-gray-600 mb-4">Aún no hay fotos en la galería de esta área.</p>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
          <Upload className="h-4 w-4" />
          Subir Fotos
        </button>
      </div>
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
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Galería de Fotos ({photos.length})
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Fotos del área organizadas por categoría
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
          <Upload className="h-4 w-4" />
          Subir Fotos
        </button>
      </div>

      {/* Photos by Type */}
      {Object.entries(photosByType).map(([type, typePhotos]) => (
        <div key={type}>
          <h4 className="text-md font-semibold text-gray-900 mb-4">
            {typeLabels[type] || type} ({typePhotos.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {typePhotos.map((photo) => (
              <div
                key={photo.id}
                className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-all hover:shadow-lg cursor-pointer"
              >
                <img
                  src={photo.thumbnail_url || photo.photo_url}
                  alt={photo.caption || 'Foto del área'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  loading="lazy"
                />

                {/* Overlay with info */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    {photo.caption && (
                      <p className="text-white text-sm font-medium line-clamp-2 mb-2">
                        {photo.caption}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      {photo.taken_by_employee && (
                        <p className="text-white/80 text-xs">
                          {photo.taken_by_employee.full_name}
                        </p>
                      )}
                      {(photo.is_featured || photo.is_cover) && (
                        <div className="flex gap-1">
                          {photo.is_cover && (
                            <Badge variant="primary" size="sm">
                              Portada
                            </Badge>
                          )}
                          {photo.is_featured && (
                            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default GalleryTab;

import { useState, useEffect } from 'react';
import { X, Star, Trash2, Edit2, Check } from 'lucide-react';
import { type EquipmentImage } from '../../../api/equipment';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';

interface ViewEquipmentImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: EquipmentImage | null;
  onUpdateCaption: (caption: string) => void;
  onSetPrimary: () => void;
  onDelete: () => void;
}

const ViewEquipmentImageModal = ({
  isOpen,
  onClose,
  image,
  onUpdateCaption,
  onSetPrimary,
  onDelete,
}: ViewEquipmentImageModalProps) => {
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [caption, setCaption] = useState('');

  useEffect(() => {
    if (image) {
      setCaption(image.caption || '');
      setIsEditingCaption(false);
    }
  }, [image]);

  const handleSaveCaption = () => {
    onUpdateCaption(caption);
    setIsEditingCaption(false);
  };

  const handleCancelEdit = () => {
    setCaption(image?.caption || '');
    setIsEditingCaption(false);
  };

  if (!isOpen || !image) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4 !mt-0"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">Imagen del Equipo</h2>
            {image.is_primary && (
              <Badge variant="info">
                <Star className="h-3 w-3 inline mr-1" />
                Principal
              </Badge>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Image */}
            <div className="flex items-center justify-center bg-gray-50 rounded-lg p-4">
              <img
                src={image.image_url}
                alt={image.caption || 'Imagen del equipo'}
                className="max-w-full max-h-[500px] object-contain rounded-lg shadow-md"
              />
            </div>

            {/* Right Column - Details and Actions */}
            <div className="space-y-6">
              {/* Caption Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Descripción
                  </label>
                  {!isEditingCaption && (
                    <button
                      onClick={() => setIsEditingCaption(true)}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Edit2 className="h-3 w-3" />
                      Editar
                    </button>
                  )}
                </div>

                {isEditingCaption ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Agrega una descripción..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveCaption}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <Check className="h-3 w-3" />
                        Guardar
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md border border-gray-200">
                    {image.caption || (
                      <span className="text-gray-400 italic">Sin descripción</span>
                    )}
                  </p>
                )}
              </div>

              {/* Image Metadata */}
              <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-semibold text-gray-900">
                  Información de la Imagen
                </h4>

                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-gray-500">Estado</dt>
                    <dd className="text-gray-900 font-medium">
                      {image.is_primary ? 'Imagen Principal' : 'Galería'}
                    </dd>
                  </div>

                  {image.width && image.height && (
                    <div>
                      <dt className="text-gray-500">Dimensiones</dt>
                      <dd className="text-gray-900 font-medium">
                        {image.width} × {image.height}
                      </dd>
                    </div>
                  )}

                  {image.file_size && (
                    <div>
                      <dt className="text-gray-500">Tamaño</dt>
                      <dd className="text-gray-900 font-medium">
                        {(image.file_size / 1024).toFixed(2)} KB
                      </dd>
                    </div>
                  )}

                  {image.mime_type && (
                    <div>
                      <dt className="text-gray-500">Tipo</dt>
                      <dd className="text-gray-900 font-medium uppercase">
                        {image.mime_type.split('/')[1]}
                      </dd>
                    </div>
                  )}

                  <div className="col-span-2">
                    <dt className="text-gray-500">Subida</dt>
                    <dd className="text-gray-900 font-medium">
                      {new Date(image.created_at).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900">Acciones</h4>

                {!image.is_primary && (
                  <button
                    onClick={onSetPrimary}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Star className="h-4 w-4" />
                    Establecer como Imagen Principal
                  </button>
                )}

                <button
                  onClick={onDelete}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar Imagen
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 flex-shrink-0">
          <Button onClick={onClose} variant="outline">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ViewEquipmentImageModal;

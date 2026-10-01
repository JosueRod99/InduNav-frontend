import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import ImageUpload from '../../components/shared/ImageUpload';
import { ImageType } from '../../api/upload';
import { createLayout, updateLayout, type PlantLayout } from '../../api/layouts';
import { useAuthStore } from '../../store/authStore';

interface LayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  layout?: PlantLayout | null;
  plantId: string;
  floorLevel: number;
}

const LayoutModal = ({ isOpen, onClose, layout, plantId, floorLevel }: LayoutModalProps) => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isEditing = !!layout;

  const [formData, setFormData] = useState({
    layout_name: '',
    layout_image_url: '',
    floor_level: 0,
  });

  useEffect(() => {
    if (layout) {
      setFormData({
        layout_name: layout.layout_name,
        layout_image_url: layout.layout_image_url || '',
        floor_level: layout.floor_level,
      });
    } else {
      setFormData({
        layout_name: `Layout Piso ${floorLevel === 0 ? 'Planta Baja' : floorLevel === -1 ? 'Sótano' : floorLevel}`,
        layout_image_url: '',
        floor_level: floorLevel,
      });
    }
  }, [layout, floorLevel]);

  const createMutation = useMutation({
    mutationFn: createLayout,
    onSuccess: () => {
      toast.success('Layout creado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['layouts'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear layout');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateLayout(id, data),
    onSuccess: () => {
      toast.success('Layout actualizado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['layouts'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar layout');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.layout_name.trim()) {
      toast.error('El nombre del layout es requerido');
      return;
    }

    if (!formData.layout_image_url) {
      toast.error('Debes subir una imagen del plano 2D');
      return;
    }

    const payload = {
      plant_id: plantId,
      layout_name: formData.layout_name,
      layout_image_url: formData.layout_image_url,
      floor_level: formData.floor_level,
    };

    if (isEditing && layout) {
      updateMutation.mutate({ id: layout.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleImageUploaded = (url: string) => {
    setFormData({ ...formData, layout_image_url: url });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full z-[10000]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              {isEditing ? 'Editar Layout' : 'Nuevo Layout'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Layout Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Layout *
              </label>
              <input
                type="text"
                value={formData.layout_name}
                onChange={(e) => setFormData({ ...formData, layout_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: Planta Baja Principal"
                required
              />
            </div>

            {/* Floor Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Piso
              </label>
              <select
                value={formData.floor_level}
                onChange={(e) => setFormData({ ...formData, floor_level: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={-1}>Sótano</option>
                <option value={0}>Planta Baja</option>
                <option value={1}>Piso 1</option>
                <option value={2}>Piso 2</option>
                <option value={3}>Piso 3</option>
                <option value={4}>Piso 4</option>
                <option value={5}>Piso 5</option>
              </select>
            </div>

            {/* Image Upload */}
            <div>
              <ImageUpload
                onImageUploaded={handleImageUploaded}
                organizationId={user?.organization_id || undefined}
                plantId={plantId}
                imageType={ImageType.LAYOUT}
                currentImageUrl={formData.layout_image_url}
                label="Plano 2D del Layout *"
                helperText="Arrastra el plano de la planta aquí o haz clic para seleccionar"
                maxSizeMB={10}
              />
              <p className="mt-2 text-xs text-gray-500">
                Sube una imagen del plano arquitectónico 2D de esta planta. Se recomienda PNG o JPG.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                isLoading={createMutation.isPending || updateMutation.isPending}
              >
                {isEditing ? 'Actualizar' : 'Crear Layout'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LayoutModal;

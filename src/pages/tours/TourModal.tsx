import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { createTour, updateTour, type CreateTourRequest } from '../../api/tours';
import { getPlants } from '../../api/plants';
import type { Tour } from '../../types';

interface TourModalProps {
  isOpen: boolean;
  onClose: () => void;
  tour?: Tour | null;
}

const TourModal = ({ isOpen, onClose, tour }: TourModalProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateTourRequest>({
    plant_id: '',
    title: '',
    description: '',
    slug: '',
    is_public: false,
  });

  const isEditing = !!tour;

  // Fetch plants for selector
  const { data: plantsData } = useQuery({
    queryKey: ['plants'],
    queryFn: () => getPlants({ limit: 100 }),
  });

  useEffect(() => {
    if (tour) {
      setFormData({
        plant_id: tour.plant_id,
        title: tour.title,
        description: tour.description || '',
        slug: tour.slug,
        is_public: tour.is_public,
      });
    } else {
      setFormData({
        plant_id: '',
        title: '',
        description: '',
        slug: '',
        is_public: false,
      });
    }
  }, [tour]);

  const createMutation = useMutation({
    mutationFn: createTour,
    onSuccess: () => {
      toast.success('Tour creado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['tours'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear tour');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; payload: CreateTourRequest }) =>
      updateTour(data.id, data.payload),
    onSuccess: () => {
      toast.success('Tour actualizado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['tours'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar tour');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.plant_id) {
      toast.error('Selecciona una planta');
      return;
    }

    if (isEditing && tour) {
      updateMutation.mutate({ id: tour.id, payload: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Tour' : 'Nuevo Tour'}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="plant_id" className="block text-sm font-medium text-gray-700 mb-1">
            Planta <span className="text-red-500">*</span>
          </label>
          <select
            id="plant_id"
            name="plant_id"
            value={formData.plant_id}
            onChange={handleChange}
            disabled={isEditing}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
          >
            <option value="">Seleccionar planta</option>
            {plantsData?.plants.map((plant) => (
              <option key={plant.id} value={plant.id}>
                {plant.name}
              </option>
            ))}
          </select>
          {isEditing && (
            <p className="mt-1 text-xs text-gray-500">
              No se puede cambiar la planta de un tour existente
            </p>
          )}
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Título <span className="text-red-500">*</span>
          </label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Nombre del tour"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Descripción del tour"
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
            Slug
          </label>
          <Input
            id="slug"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            placeholder="nombre-tour"
          />
          <p className="mt-1 text-xs text-gray-500">
            Se generará automáticamente si se deja vacío
          </p>
        </div>

        <div className="flex items-center">
          <input
            id="is_public"
            name="is_public"
            type="checkbox"
            checked={formData.is_public}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="is_public" className="ml-2 block text-sm text-gray-700">
            Tour público (visible sin autenticación)
          </label>
        </div>
      </form>
    </Modal>
  );
};

export default TourModal;

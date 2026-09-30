import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { createPlant, updatePlant, type CreatePlantRequest } from '../../api/plants';
import { getOrganizations } from '../../api/organizations';
import type { Plant } from '../../types';

interface PlantModalProps {
  isOpen: boolean;
  onClose: () => void;
  plant?: Plant | null;
}

const PlantModal = ({ isOpen, onClose, plant }: PlantModalProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreatePlantRequest>({
    organization_id: '',
    name: '',
    slug: '',
    location: '',
    timezone: 'America/Mexico_City',
  });

  const isEditing = !!plant;

  // Fetch organizations for selector
  const { data: orgsData } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => getOrganizations({ limit: 100 }),
  });

  useEffect(() => {
    if (plant) {
      setFormData({
        organization_id: plant.organization_id,
        name: plant.name,
        slug: plant.slug,
        location: plant.location || '',
        timezone: plant.timezone,
      });
    } else {
      setFormData({
        organization_id: '',
        name: '',
        slug: '',
        location: '',
        timezone: 'America/Mexico_City',
      });
    }
  }, [plant]);

  const createMutation = useMutation({
    mutationFn: createPlant,
    onSuccess: () => {
      toast.success('Planta creada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['plants'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear planta');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; payload: CreatePlantRequest }) =>
      updatePlant(data.id, data.payload),
    onSuccess: () => {
      toast.success('Planta actualizada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['plants'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar planta');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.organization_id) {
      toast.error('Selecciona una organización');
      return;
    }

    if (isEditing && plant) {
      updateMutation.mutate({ id: plant.id, payload: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Planta' : 'Nueva Planta'}
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
          <label htmlFor="organization_id" className="block text-sm font-medium text-gray-700 mb-1">
            Organización <span className="text-red-500">*</span>
          </label>
          <select
            id="organization_id"
            name="organization_id"
            value={formData.organization_id}
            onChange={handleChange}
            disabled={isEditing}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
          >
            <option value="">Seleccionar organización</option>
            {orgsData?.organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
          {isEditing && (
            <p className="mt-1 text-xs text-gray-500">
              No se puede cambiar la organización de una planta existente
            </p>
          )}
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre <span className="text-red-500">*</span>
          </label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Nombre de la planta"
            required
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
            placeholder="nombre-planta"
          />
          <p className="mt-1 text-xs text-gray-500">
            Se generará automáticamente si se deja vacío
          </p>
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Ubicación
          </label>
          <Input
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Ciudad, País"
          />
        </div>

        <div>
          <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
            Zona Horaria <span className="text-red-500">*</span>
          </label>
          <select
            id="timezone"
            name="timezone"
            value={formData.timezone}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
            <option value="America/Cancun">Cancún (GMT-5)</option>
            <option value="America/Monterrey">Monterrey (GMT-6)</option>
            <option value="America/Tijuana">Tijuana (GMT-8)</option>
            <option value="America/New_York">New York (GMT-5)</option>
            <option value="America/Los_Angeles">Los Angeles (GMT-8)</option>
            <option value="America/Chicago">Chicago (GMT-6)</option>
            <option value="Europe/Madrid">Madrid (GMT+1)</option>
            <option value="Europe/London">London (GMT+0)</option>
          </select>
        </div>
      </form>
    </Modal>
  );
};

export default PlantModal;

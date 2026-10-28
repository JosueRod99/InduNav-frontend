import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { createOrganization, updateOrganization, type CreateOrganizationRequest } from '../../api/organizations';
import type { Organization } from '../../types';

// Default for new organizations; adjustable per organization according to its plan
const DEFAULT_TOUR_PUBLICATIONS = 20;

interface OrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization?: Organization | null;
}

const OrganizationModal = ({ isOpen, onClose, organization }: OrganizationModalProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateOrganizationRequest>({
    name: '',
    slug: '',
    plan: 'free',
    tour_publications_per_month: DEFAULT_TOUR_PUBLICATIONS,
  });

  const isEditing = !!organization;

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name,
        slug: organization.slug,
        plan: organization.plan,
        logo_url: organization.logo_url || undefined,
        tour_publications_per_month: organization.tour_publications_per_month ?? DEFAULT_TOUR_PUBLICATIONS,
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        plan: 'free',
        tour_publications_per_month: DEFAULT_TOUR_PUBLICATIONS,
      });
    }
  }, [organization]);

  const createMutation = useMutation({
    mutationFn: createOrganization,
    onSuccess: () => {
      toast.success('Organización creada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear organización');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; payload: CreateOrganizationRequest }) =>
      updateOrganization(data.id, data.payload),
    onSuccess: () => {
      toast.success('Organización actualizada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar organización');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing && organization) {
      updateMutation.mutate({ id: organization.id, payload: formData });
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
      title={isEditing ? 'Editar Organización' : 'Nueva Organización'}
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
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre <span className="text-red-500">*</span>
          </label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Nombre de la organización"
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
            placeholder="nombre-organizacion"
          />
          <p className="mt-1 text-xs text-gray-500">
            Se generará automáticamente si se deja vacío
          </p>
        </div>

        <div>
          <label htmlFor="plan" className="block text-sm font-medium text-gray-700 mb-1">
            Plan
          </label>
          <select
            id="plan"
            name="plan"
            value={formData.plan}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>

        <div>
          <label htmlFor="tour_publications_per_month" className="block text-sm font-medium text-gray-700 mb-1">
            Publicaciones de tours con narración por mes
          </label>
          <Input
            id="tour_publications_per_month"
            name="tour_publications_per_month"
            type="number"
            min={0}
            step={1}
            value={formData.tour_publications_per_month ?? DEFAULT_TOUR_PUBLICATIONS}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                tour_publications_per_month: e.target.value === '' ? 0 : Math.max(0, Math.floor(Number(e.target.value))),
              }))
            }
          />
          <p className="mt-1 text-xs text-gray-500">
            Se comparten entre todos los tours de la organización. Solo cuentan las publicaciones que generan audio
            nuevo, y el conteo vuelve a 0 automáticamente el día 1 de cada mes (hora de México).
          </p>
        </div>

        <div>
          <label htmlFor="logo_url" className="block text-sm font-medium text-gray-700 mb-1">
            URL del Logo
          </label>
          <Input
            id="logo_url"
            name="logo_url"
            type="url"
            value={formData.logo_url || ''}
            onChange={handleChange}
            placeholder="https://..."
          />
        </div>
      </form>
    </Modal>
  );
};

export default OrganizationModal;

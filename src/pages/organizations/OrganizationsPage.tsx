import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import OrganizationModal from './OrganizationModal';
import { getOrganizations, deleteOrganization } from '../../api/organizations';
import { useIsPlatformAdmin } from '../../hooks/usePermissions';
import type { Organization } from '../../types';

const OrganizationsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const queryClient = useQueryClient();
  const isPlatformAdmin = useIsPlatformAdmin();

  // Fetch organizations
  const { data, isLoading, error } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => getOrganizations({ limit: 100 }),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteOrganization,
    onSuccess: () => {
      toast.success('Organización eliminada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar organización');
    },
  });

  const handleCreate = () => {
    setSelectedOrganization(null);
    setIsModalOpen(true);
  };

  const handleEdit = (organization: Organization) => {
    setSelectedOrganization(organization);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta organización?')) {
      deleteMutation.mutate(id);
    }
  };

  const getPlanBadge = (plan: string) => {
    const variants: Record<string, 'default' | 'info' | 'warning'> = {
      free: 'default',
      pro: 'info',
      enterprise: 'warning',
    };
    return <Badge variant={variants[plan] || 'default'}>{plan.toUpperCase()}</Badge>;
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Organizaciones</h2>
          <p className="mt-1 text-sm text-gray-600">
            Gestiona las organizaciones del sistema
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Organización
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">Cargando...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-red-500">Error al cargar organizaciones</p>
        </div>
      ) : !data?.organizations || data.organizations.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay organizaciones</h3>
          <p className="mt-1 text-sm text-gray-500">
            Comienza creando una nueva organización.
          </p>
          <div className="mt-6">
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Organización
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organización
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
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
              {data.organizations.map((org) => (
                <tr key={org.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {org.logo_url ? (
                        <img
                          src={org.logo_url}
                          alt={org.name}
                          className="h-10 w-10 rounded-full"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-gray-500" />
                        </div>
                      )}
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{org.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{org.slug}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPlanBadge(org.plan)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={org.is_active ? 'success' : 'error'}>
                      {org.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {isPlatformAdmin && (
                      <>
                        <button
                          onClick={() => handleEdit(org)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          title="Editar organización"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(org.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar organización"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <OrganizationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        organization={selectedOrganization}
      />
    </div>
  );
};

export default OrganizationsPage;

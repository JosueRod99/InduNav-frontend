import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Factory, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import PlantModal from './PlantModal';
import { getPlants, deletePlant } from '../../api/plants';
import { getOrganizations } from '../../api/organizations';
import type { Plant } from '../../types';

const PlantsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>('');
  const queryClient = useQueryClient();

  // Fetch organizations for filter
  const { data: orgsData } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => getOrganizations({ limit: 100 }),
  });

  // Fetch plants with optional organization filter
  const { data, isLoading, error } = useQuery({
    queryKey: ['plants', selectedOrgFilter],
    queryFn: () =>
      getPlants({
        limit: 100,
        organization_id: selectedOrgFilter || undefined,
      }),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deletePlant,
    onSuccess: () => {
      toast.success('Planta eliminada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['plants'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar planta');
    },
  });

  const handleCreate = () => {
    setSelectedPlant(null);
    setIsModalOpen(true);
  };

  const handleEdit = (plant: Plant) => {
    setSelectedPlant(plant);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta planta?')) {
      deleteMutation.mutate(id);
    }
  };

  // Get organization name by ID
  const getOrganizationName = (orgId: string) => {
    const org = orgsData?.organizations.find((o) => o.id === orgId);
    return org?.name || 'N/A';
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Plantas</h2>
          <p className="mt-1 text-sm text-gray-600">
            Gestiona las plantas industriales
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Planta
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex gap-4">
          <div className="w-64">
            <label htmlFor="org-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Filtrar por Organización
            </label>
            <select
              id="org-filter"
              value={selectedOrgFilter}
              onChange={(e) => setSelectedOrgFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Todas las organizaciones</option>
              {orgsData?.organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">Cargando...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-red-500">Error al cargar plantas</p>
        </div>
      ) : !data?.plants || data.plants.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Factory className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay plantas</h3>
          <p className="mt-1 text-sm text-gray-500">
            Comienza creando una nueva planta.
          </p>
          <div className="mt-6">
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Planta
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Planta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organización
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ubicación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zona Horaria
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
              {data.plants.map((plant) => (
                <tr key={plant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Factory className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{plant.name}</div>
                        <div className="text-sm text-gray-500">{plant.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {getOrganizationName(plant.organization_id)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {plant.location ? (
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="h-4 w-4 mr-1" />
                        {plant.location}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{plant.timezone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={plant.is_active ? 'success' : 'error'}>
                      {plant.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(plant)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(plant.id)}
                      className="text-red-600 hover:text-red-900"
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

      {/* Modal */}
      <PlantModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        plant={selectedPlant}
      />
    </div>
  );
};

export default PlantsPage;

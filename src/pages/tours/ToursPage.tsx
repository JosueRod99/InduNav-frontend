import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Map, EyeOff, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import TourModal from './TourModal';
import { getTours, deleteTour } from '../../api/tours';
import { getPlants } from '../../api/plants';
import type { Tour } from '../../types';

const ToursPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [selectedPlantFilter, setSelectedPlantFilter] = useState<string>('');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  // Fetch plants for filter
  const { data: plantsData } = useQuery({
    queryKey: ['plants'],
    queryFn: () => getPlants({ limit: 100 }),
  });

  // Fetch tours with filters
  const { data, isLoading, error } = useQuery({
    queryKey: ['tours', selectedPlantFilter, visibilityFilter],
    queryFn: () =>
      getTours({
        limit: 100,
        plant_id: selectedPlantFilter || undefined,
        is_public: visibilityFilter === 'all' ? undefined : visibilityFilter === 'public',
      }),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteTour,
    onSuccess: () => {
      toast.success('Tour eliminado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['tours'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar tour');
    },
  });

  const handleCreate = () => {
    setSelectedTour(null);
    setIsModalOpen(true);
  };

  const handleEdit = (tour: Tour) => {
    setSelectedTour(tour);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este tour?')) {
      deleteMutation.mutate(id);
    }
  };

  // Get plant name by ID
  const getPlantName = (plantId: string) => {
    const plant = plantsData?.plants.find((p) => p.id === plantId);
    return plant?.name || 'N/A';
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tours</h2>
          <p className="mt-1 text-sm text-gray-600">
            Crea y gestiona tours virtuales
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Tour
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex gap-4">
          <div className="w-64">
            <label htmlFor="plant-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Filtrar por Planta
            </label>
            <select
              id="plant-filter"
              value={selectedPlantFilter}
              onChange={(e) => setSelectedPlantFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Todas las plantas</option>
              {plantsData?.plants.map((plant) => (
                <option key={plant.id} value={plant.id}>
                  {plant.name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-64">
            <label htmlFor="visibility-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Visibilidad
            </label>
            <select
              id="visibility-filter"
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="all">Todos</option>
              <option value="public">Públicos</option>
              <option value="private">Privados</option>
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
          <p className="text-red-500">Error al cargar tours</p>
        </div>
      ) : !data?.tours || data.tours.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Map className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay tours</h3>
          <p className="mt-1 text-sm text-gray-500">
            Comienza creando un nuevo tour virtual.
          </p>
          <div className="mt-6">
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Tour
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tour
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Planta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Visibilidad
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
              {data.tours.map((tour) => (
                <tr key={tour.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                        <Map className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{tour.title}</div>
                        <div className="text-sm text-gray-500">{tour.slug}</div>
                        {tour.description && (
                          <div className="text-xs text-gray-400 mt-1 line-clamp-1">
                            {tour.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{getPlantName(tour.plant_id)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {tour.is_public ? (
                      <Badge variant="info" className="gap-1">
                        <Globe className="h-3 w-3" />
                        Público
                      </Badge>
                    ) : (
                      <Badge variant="default" className="gap-1">
                        <EyeOff className="h-3 w-3" />
                        Privado
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={tour.is_active ? 'success' : 'error'}>
                      {tour.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(tour)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(tour.id)}
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
      <TourModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tour={selectedTour}
      />
    </div>
  );
};

export default ToursPage;

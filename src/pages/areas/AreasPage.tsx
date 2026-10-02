import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Building2, Map, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import AreaTreeView from '../../components/areas/AreaTreeView';
import AreaBreadcrumb from '../../components/areas/AreaBreadcrumb';
import AreaModal from './AreaModal';
import {
  getAreaTree,
  getArea,
  getAreaPath,
  getAreaStatistics,
  deleteArea,
  type AreaTreeNode,
  type OrganizationalArea,
  type AreaStatistics,
} from '../../api/areas';
import { getRepresentationsByArea } from '../../api/areaRepresentations';
import { getOrganizations } from '../../api/organizations';
import { getPlants } from '../../api/plants';

const AreasPage = () => {
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [selectedPlant, setSelectedPlant] = useState<string>('');
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<OrganizationalArea | null>(null);
  const [parentForNewArea, setParentForNewArea] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch organizations
  const { data: organizationsData } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => getOrganizations({ limit: 100 }),
  });

  // Fetch plants for selected organization
  const { data: plantsData } = useQuery({
    queryKey: ['plants', selectedOrg],
    queryFn: () => getPlants({ organization_id: selectedOrg || undefined, limit: 100 }),
    enabled: !!selectedOrg,
  });

  // Fetch area tree
  const { data: areasTree, isLoading: isLoadingTree } = useQuery({
    queryKey: ['areas-tree', selectedOrg, selectedPlant],
    queryFn: () =>
      getAreaTree({
        organization_id: selectedOrg,
        plant_id: selectedPlant || undefined,
      }),
    enabled: !!selectedOrg,
  });

  // Fetch selected area details
  const { data: selectedArea } = useQuery({
    queryKey: ['area', selectedAreaId],
    queryFn: () => getArea(selectedAreaId!, true),
    enabled: !!selectedAreaId,
  });

  // Fetch breadcrumb path for selected area
  const { data: areaPath } = useQuery({
    queryKey: ['area-path', selectedAreaId],
    queryFn: () => getAreaPath(selectedAreaId!),
    enabled: !!selectedAreaId,
  });

  // Fetch statistics for selected area
  const { data: areaStats } = useQuery({
    queryKey: ['area-statistics', selectedAreaId],
    queryFn: () => getAreaStatistics(selectedAreaId!),
    enabled: !!selectedAreaId,
  });

  // Fetch physical representations for selected area
  const { data: areaRepresentations = [] } = useQuery({
    queryKey: ['area-representations', selectedAreaId],
    queryFn: () => getRepresentationsByArea(selectedAreaId!),
    enabled: !!selectedAreaId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteArea,
    onSuccess: () => {
      toast.success('Área eliminada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['areas-tree'] });
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      setSelectedAreaId(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar área');
    },
  });

  const handleAreaClick = (area: AreaTreeNode) => {
    setSelectedAreaId(area.id);
  };

  const handleEdit = () => {
    if (selectedArea) {
      setEditingArea(selectedArea);
      setParentForNewArea(null);
      setIsModalOpen(true);
    }
  };

  const handleDelete = () => {
    if (selectedArea && window.confirm(`¿Estás seguro de eliminar el área "${selectedArea.name}"?`)) {
      deleteMutation.mutate(selectedArea.id);
    }
  };

  const handleCreateRoot = () => {
    setEditingArea(null);
    setParentForNewArea(null);
    setIsModalOpen(true);
  };

  const handleCreateSubArea = () => {
    if (selectedAreaId) {
      setEditingArea(null);
      setParentForNewArea(selectedAreaId);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingArea(null);
    setParentForNewArea(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Áreas Organizacionales</h2>
          <p className="mt-1 text-sm text-gray-600">
            Gestiona la estructura de áreas de tu organización
          </p>
        </div>

        {selectedOrg && selectedPlant && (
          <Button onClick={handleCreateRoot} className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva Área Raíz
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="org-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Organización
            </label>
            <select
              id="org-filter"
              value={selectedOrg}
              onChange={(e) => {
                setSelectedOrg(e.target.value);
                setSelectedPlant('');
                setSelectedAreaId(null);
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Seleccionar organización</option>
              {organizationsData?.organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          {selectedOrg && (
            <div>
              <label htmlFor="plant-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Planta
              </label>
              <select
                id="plant-filter"
                value={selectedPlant}
                onChange={(e) => {
                  setSelectedPlant(e.target.value);
                  setSelectedAreaId(null);
                }}
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
          )}
        </div>
      </div>

      {/* Main Content */}
      {selectedOrg && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tree View */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Vista de Árbol</h3>
              <p className="text-sm text-gray-600 mt-1">
                {isLoadingTree
                  ? 'Cargando...'
                  : `${areasTree?.length || 0} área${areasTree?.length !== 1 ? 's' : ''} raíz`}
              </p>
            </div>

            <div className="p-4">
              {isLoadingTree ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : !areasTree || areasTree.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                  {!selectedPlant ? (
                    <>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Selecciona una planta</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Primero selecciona una planta para crear áreas
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No hay áreas</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Crea la primera área para comenzar
                      </p>
                      <div className="mt-6">
                        <Button onClick={handleCreateRoot} className="gap-2">
                          <Plus className="h-4 w-4" />
                          Nueva Área
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <AreaTreeView
                  areas={areasTree}
                  onAreaClick={handleAreaClick}
                  selectedAreaId={selectedAreaId || undefined}
                  showEmployeeCount={true}
                />
              )}
            </div>
          </div>

          {/* Detail Panel */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Detalles del Área</h3>
            </div>

            {selectedArea ? (
              <div className="p-4 space-y-4">
                {/* Breadcrumb */}
                {areaPath && areaPath.length > 0 && (
                  <div className="pb-4 border-b border-gray-200">
                    <AreaBreadcrumb
                      path={areaPath}
                      onAreaClick={(area) => setSelectedAreaId(area.id)}
                    />
                  </div>
                )}

                {/* Area Info */}
                <div>
                  <div className="flex items-start gap-3 mb-3">
                    {selectedArea.color && (
                      <div
                        className="w-6 h-6 rounded-full mt-1"
                        style={{ backgroundColor: selectedArea.color }}
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold text-gray-900">{selectedArea.name}</h4>
                      {selectedArea.code && (
                        <p className="text-sm text-gray-500">Código: {selectedArea.code}</p>
                      )}
                    </div>
                  </div>

                  {selectedArea.description && (
                    <p className="text-sm text-gray-600 mb-3">{selectedArea.description}</p>
                  )}

                  {/* Statistics */}
                  {areaStats && (
                    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="text-blue-600 font-semibold">{areaStats.employee_count}</p>
                        <p className="text-gray-600">Empleados</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded">
                        <p className="text-green-600 font-semibold">{areaStats.sub_area_count}</p>
                        <p className="text-gray-600">Sub-áreas</p>
                      </div>
                      {selectedArea.capacity && (
                        <div className="bg-yellow-50 p-3 rounded">
                          <p className="text-yellow-600 font-semibold">{selectedArea.capacity}</p>
                          <p className="text-gray-600">Capacidad</p>
                        </div>
                      )}
                      {selectedArea.square_meters && (
                        <div className="bg-purple-50 p-3 rounded">
                          <p className="text-purple-600 font-semibold">{selectedArea.square_meters} m²</p>
                          <p className="text-gray-600">Área</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Additional Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tipo:</span>
                      <span className="font-medium">{selectedArea.area_type}</span>
                    </div>
                    {selectedArea.cost_center && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Centro de Costo:</span>
                        <span className="font-medium">{selectedArea.cost_center}</span>
                      </div>
                    )}
                    {selectedArea.supervisor && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Supervisor:</span>
                        <span className="font-medium">
                          {selectedArea.supervisor.first_name} {selectedArea.supervisor.last_name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Physical Representations */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-semibold text-gray-900">Representaciones Físicas</h5>
                    <Badge variant="default" className="text-xs">
                      {areaRepresentations.length}
                    </Badge>
                  </div>

                  {areaRepresentations.length === 0 ? (
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <Map className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-xs text-gray-600">
                        No hay representaciones físicas
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Dibuja esta área en un layout para crear su geometría
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {areaRepresentations.map((rep) => (
                        <div
                          key={rep.id}
                          className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {rep.layout?.layout_name || 'Layout sin nombre'}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                Piso {rep.floor_level === 0 ? 'Planta Baja' : rep.floor_level}
                              </p>
                              {rep.display_name && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Nombre display: {rep.display_name}
                                </p>
                              )}
                            </div>
                            <Link
                              to="/layouts"
                              className="text-blue-600 hover:text-blue-700 transition-colors"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <Button
                    onClick={handleCreateSubArea}
                    variant="secondary"
                    className="w-full gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Crear Sub-Área
                  </Button>
                  <Button onClick={handleEdit} variant="secondary" className="w-full gap-2">
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    onClick={handleDelete}
                    variant="danger"
                    className="w-full gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Building2 className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                <p>Selecciona un área para ver los detalles</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Area Modal */}
      {isModalOpen && (
        <AreaModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          area={editingArea}
          organizationId={selectedOrg}
          plantId={selectedPlant || ''}
          parentAreaId={parentForNewArea}
        />
      )}
    </div>
  );
};

export default AreasPage;

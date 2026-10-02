import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Pencil, Trash2, Plus, Square, Upload, PenTool } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import LayoutMap from './LayoutMap';
import LinkAreaModal from './LinkAreaModal';
import LayoutModal from './LayoutModal';
import { getPlants } from '../../api/plants';
import { getLayouts } from '../../api/layouts';
import { getAreasByLayout } from '../../api/areaRepresentations';
import { deleteRepresentation, updateRepresentation, type AreaPhysicalRepresentation } from '../../api/areaRepresentations';
import { useAuthStore } from '../../store/authStore';

const LayoutsPage = () => {
  const [selectedPlantId, setSelectedPlantId] = useState<string>('');
  const [selectedFloor, setSelectedFloor] = useState<number>(0);
  const [selectedArea, setSelectedArea] = useState<AreaPhysicalRepresentation | null>(null);
  const [isLinkAreaModalOpen, setIsLinkAreaModalOpen] = useState(false);
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false);
  const [drawMode, setDrawMode] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [drawnCoordinates, setDrawnCoordinates] = useState<number[][] | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Fetch plants
  const { data: plantsData } = useQuery({
    queryKey: ['plants'],
    queryFn: () => getPlants({ limit: 100 }),
  });

  // Fetch layouts for selected plant
  const { data: layouts } = useQuery({
    queryKey: ['layouts', selectedPlantId, selectedFloor],
    queryFn: () => getLayouts({ plant_id: selectedPlantId || undefined, floor_level: selectedFloor }),
    enabled: !!selectedPlantId,
  });

  const currentLayout = layouts?.[0];

  // Get selected plant's organization_id
  const selectedPlant = plantsData?.plants.find(p => p.id === selectedPlantId);
  const organizationId = selectedPlant?.organization_id || user?.organization_id || '';

  // Fetch area representations for current layout
  const { data: areaRepresentations = [] } = useQuery({
    queryKey: ['layout-areas', currentLayout?.id, selectedFloor],
    queryFn: () => getAreasByLayout(currentLayout!.id, selectedFloor),
    enabled: !!currentLayout?.id,
  });

  // Delete representation mutation
  const deleteMutation = useMutation({
    mutationFn: deleteRepresentation,
    onSuccess: () => {
      toast.success('Representación de área eliminada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['layout-areas'] });
      queryClient.invalidateQueries({ queryKey: ['area-representations'] });
      setSelectedArea(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar representación');
    },
  });

  // Update representation geometry mutation
  const updateMutation = useMutation({
    mutationFn: (data: { id: string; geometry: any }) =>
      updateRepresentation(data.id, { geometry: data.geometry }),
    onSuccess: () => {
      toast.success('Geometría actualizada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['layout-areas'] });
      queryClient.invalidateQueries({ queryKey: ['area-representations'] });
      setSelectedArea(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar geometría');
    },
  });

  const handleAreaClick = (area: AreaPhysicalRepresentation) => {
    setSelectedArea(area);
  };

  const handleDeleteArea = () => {
    if (selectedArea && window.confirm('¿Estás seguro de eliminar esta representación física del área?')) {
      deleteMutation.mutate(selectedArea.id);
    }
  };

  const handleStartDrawing = () => {
    setDrawMode(true);
    setEditMode(false);
    setSelectedArea(null);
  };

  const handleStartEditing = () => {
    if (selectedArea) {
      setEditMode(true);
      setDrawMode(false);
    }
  };

  const handleAreaDrawn = (coordinates: number[][]) => {
    setDrawnCoordinates(coordinates);
    setDrawMode(false);
    setEditMode(false);
    setIsLinkAreaModalOpen(true);
  };

  const handleAreaEdited = async (coordinates: number[][]) => {
    if (!selectedArea) return;

    // Convert Leaflet coordinates [lat, lng] to GeoJSON [lng, lat]
    const geoJsonCoords = coordinates.map(coord => [coord[1], coord[0]]);
    const closedCoords = [...geoJsonCoords, geoJsonCoords[0]];

    const updatedGeometry = {
      type: 'Polygon' as const,
      coordinates: [closedCoords],
    };

    updateMutation.mutate({ id: selectedArea.id, geometry: updatedGeometry });
    setEditMode(false);
  };

  const handleCloseModal = () => {
    setIsLinkAreaModalOpen(false);
    setDrawnCoordinates(null);
    setSelectedArea(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Layout 2D</h2>
            <p className="mt-1 text-sm text-gray-600">
              Diseña y gestiona distribuciones de planta en 2D
            </p>
          </div>

          {selectedPlantId && (
            <div className="flex gap-2">
              {!drawMode && !editMode ? (
                <>
                  <Button
                    onClick={() => setIsLayoutModalOpen(true)}
                    className="gap-2"
                    variant={currentLayout ? "outline" : "primary"}
                  >
                    <Upload className="h-4 w-4" />
                    {currentLayout ? 'Editar Layout' : 'Subir Layout'}
                  </Button>
                  {currentLayout && (
                    <Button onClick={handleStartDrawing} className="gap-2">
                      <PenTool className="h-4 w-4" />
                      Dibujar Área
                    </Button>
                  )}
                </>
              ) : drawMode ? (
                <Button onClick={() => setDrawMode(false)} variant="outline">
                  Cancelar Dibujo
                </Button>
              ) : (
                <Button onClick={() => setEditMode(false)} variant="outline">
                  Cancelar Edición
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="mt-4 flex gap-4">
          <div className="w-64">
            <label htmlFor="plant-select" className="block text-sm font-medium text-gray-700 mb-1">
              Seleccionar Planta
            </label>
            <select
              id="plant-select"
              value={selectedPlantId}
              onChange={(e) => setSelectedPlantId(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Seleccionar planta</option>
              {plantsData?.plants.map((plant) => (
                <option key={plant.id} value={plant.id}>
                  {plant.name}
                </option>
              ))}
            </select>
          </div>

          {selectedPlantId && (
            <div className="w-48">
              <label htmlFor="floor-select" className="block text-sm font-medium text-gray-700 mb-1">
                Piso
              </label>
              <select
                id="floor-select"
                value={selectedFloor}
                onChange={(e) => setSelectedFloor(parseInt(e.target.value))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value={0}>Planta Baja</option>
                <option value={1}>Piso 1</option>
                <option value={2}>Piso 2</option>
                <option value={3}>Piso 3</option>
                <option value={-1}>Sótano</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {!selectedPlantId ? (
        <div className="bg-white rounded-lg shadow p-8 text-center flex-1 flex items-center justify-center">
          <div>
            <MapPin className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Selecciona una planta</h3>
            <p className="mt-1 text-sm text-gray-500">
              Elige una planta para ver y editar su layout
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex gap-4">
          {/* Map */}
          <div className="flex-1 bg-white rounded-lg shadow overflow-hidden">
            <LayoutMap
              imageUrl={currentLayout?.layout_image_url || null}
              areas={areaRepresentations}
              onAreaClick={handleAreaClick}
              selectedAreaId={selectedArea?.id}
              drawMode={drawMode}
              editMode={editMode}
              editingArea={editMode ? selectedArea : null}
              onAreaDrawn={handleAreaDrawn}
              onAreaEdited={handleAreaEdited}
              onCancelDraw={() => setDrawMode(false)}
              onCancelEdit={() => setEditMode(false)}
            />
          </div>

          {/* Sidebar */}
          <div className="w-80 bg-white rounded-lg shadow p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Áreas ({areaRepresentations.length})
            </h3>

            {areaRepresentations.length === 0 ? (
              <div className="text-center py-8">
                <Square className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No hay áreas</p>
                <p className="text-xs text-gray-400 mt-1">
                  Dibuja un área para vincularla
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {areaRepresentations.map((areaRep) => {
                  const area = areaRep.organizational_area;
                  const displayName = areaRep.display_name || area?.name || 'Sin nombre';
                  const displayColor = areaRep.display_color || area?.color || '#3B82F6';

                  return (
                    <div
                      key={areaRep.id}
                      onClick={() => setSelectedArea(areaRep)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedArea?.id === areaRep.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: displayColor }}
                        />
                        <span className="font-medium text-sm text-gray-900">
                          {displayName}
                        </span>
                      </div>

                      {area?.code && (
                        <p className="text-xs text-gray-600 mb-1">Código: {area.code}</p>
                      )}

                      {area && (
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="text-xs">
                            {area.area_type}
                          </Badge>
                          {area.full_path_name && (
                            <span className="text-xs text-gray-500 truncate">
                              {area.full_path_name}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {selectedArea && !drawMode && !editMode && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Representación Seleccionada
                </h4>

                {/* Show organizational area info */}
                {selectedArea.organizational_area && (
                  <div className="mb-3 p-2 bg-gray-50 rounded text-xs">
                    <p className="font-medium text-gray-700">
                      {selectedArea.organizational_area.name}
                    </p>
                    {selectedArea.organizational_area.full_path_name && (
                      <p className="text-gray-500 mt-1">
                        {selectedArea.organizational_area.full_path_name}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Button
                    onClick={handleStartEditing}
                    className="w-full gap-2 justify-center"
                    variant="outline"
                  >
                    <PenTool className="h-4 w-4" />
                    Editar Geometría
                  </Button>
                  <Button
                    onClick={handleDeleteArea}
                    className="w-full gap-2 justify-center bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar Representación
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Link Area Modal */}
      {drawnCoordinates && organizationId && (
        <LinkAreaModal
          isOpen={isLinkAreaModalOpen}
          onClose={handleCloseModal}
          organizationId={organizationId}
          plantId={selectedPlantId}
          layoutId={currentLayout?.id || null}
          floorLevel={selectedFloor}
          coordinates={drawnCoordinates}
        />
      )}

      {/* Layout Modal */}
      <LayoutModal
        isOpen={isLayoutModalOpen}
        onClose={() => setIsLayoutModalOpen(false)}
        layout={currentLayout}
        plantId={selectedPlantId}
        floorLevel={selectedFloor}
      />
    </div>
  );
};

export default LayoutsPage;

import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Trash2, Square, Upload, PenTool, LayoutGrid, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import LayoutMap from './LayoutMap';
import LabelModeToggle, { useLabelMode } from './LabelModeToggle';
import LinkAreaModal from './LinkAreaModal';
import LayoutModal from './LayoutModal';
import { getPlants } from '../../api/plants';
import { getLayouts } from '../../api/layouts';
import { getAreasByLayout, getRepresentationsByArea } from '../../api/areaRepresentations';
import { floorLabel, sortFloors } from '../../utils/floors';
import { deleteRepresentation, updateRepresentation, type AreaGeometry, type AreaPhysicalRepresentation } from '../../api/areaRepresentations';
import { useAuthStore } from '../../store/authStore';
import type { PlantScopedProps } from '../plants/plantScope';
import { useNavigateWithBack } from '../../hooks/useBackNavigation';
import { addZone, removeZone, replaceZone, ringFromLeaflet, zoneAsPolygon, zonesOf } from '../../utils/areaGeometry';
import SectionHeader from '../../components/ui/SectionHeader';

const LayoutsPage = ({ plantId }: PlantScopedProps = {}) => {
  const embedded = !!plantId; // inside the plant workspace: fixed plant, no org/plant selectors

  const [selectedPlantId, setSelectedPlantId] = useState<string>(plantId ?? '');
  const [selectedFloor, setSelectedFloor] = useState<number>(0);
  const [selectedArea, setSelectedArea] = useState<AreaPhysicalRepresentation | null>(null);
  const [selectedZone, setSelectedZone] = useState(0); // zone of the selected area (areas can have several)
  const [isLinkAreaModalOpen, setIsLinkAreaModalOpen] = useState(false);
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false);
  const [drawMode, setDrawMode] = useState(false);
  const [addingZone, setAddingZone] = useState(false); // drawing another zone of the selected area
  const [editMode, setEditMode] = useState(false);
  const [drawnCoordinates, setDrawnCoordinates] = useState<number[][] | null>(null);
  // Names on the map (always / on hover) and the area under the mouse, shared by map and list
  const [labelMode, setLabelMode] = useLabelMode();
  const [hovered, setHovered] = useState<{ id: string; from: 'map' | 'list' } | null>(null);
  const listRows = useRef(new Map<string, HTMLDivElement>());
  useEffect(() => {
    if (hovered?.from === 'map') listRows.current.get(hovered.id)?.scrollIntoView({ block: 'nearest' });
  }, [hovered]);
  const queryClient = useQueryClient();
  const navigate = useNavigateWithBack(); // detail pages opened from here return here
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

  // Other floors where the selected area is drawn (same area, not a duplicate)
  const { data: selectedAreaDrawings = [] } = useQuery({
    queryKey: ['area-representations', selectedArea?.organizational_area_id],
    queryFn: () => getRepresentationsByArea(selectedArea!.organizational_area_id),
    enabled: !!selectedArea,
  });
  const otherFloors = sortFloors(
    selectedAreaDrawings
      .filter((r) => r.layout && !r.layout.organizational_area_id && r.floor_level !== selectedFloor)
      .map((r) => r.floor_level)
  );

  const goToFloor = (level: number) => {
    setSelectedArea(null);
    setDrawMode(false);
    setEditMode(false);
    setAddingZone(false);
    setSelectedFloor(level);
  };

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

  // Update representation geometry mutation (edit, add or remove a zone)
  const updateMutation = useMutation({
    mutationFn: (data: { id: string; geometry: AreaGeometry; message: string }) =>
      updateRepresentation(data.id, { geometry: data.geometry }),
    onSuccess: (_, data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['layout-areas'] });
      queryClient.invalidateQueries({ queryKey: ['area-representations'] });
      setSelectedArea(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar geometría');
    },
  });

  const handleAreaClick = (area: AreaPhysicalRepresentation, zoneIndex: number) => {
    setSelectedArea(area);
    setSelectedZone(zoneIndex);
  };

  const handleDeleteArea = () => {
    const zones = selectedArea ? zonesOf(selectedArea.geometry).length : 0;
    const message =
      zones > 1
        ? `¿Quitar ${selectedArea!.display_name || selectedArea!.organizational_area?.name} del plano? Se borran sus ${zones} zonas; el área sigue existiendo.`
        : '¿Estás seguro de eliminar esta representación física del área?';
    if (selectedArea && window.confirm(message)) {
      deleteMutation.mutate(selectedArea.id);
    }
  };

  const handleStartDrawing = () => {
    setDrawMode(true);
    setEditMode(false);
    setAddingZone(false);
    setSelectedArea(null);
  };

  const handleStartAddingZone = () => {
    if (!selectedArea) return;
    setAddingZone(true);
    setDrawMode(true);
    setEditMode(false);
  };

  const cancelDrawing = () => {
    setDrawMode(false);
    setAddingZone(false);
  };

  const handleDeleteZone = () => {
    if (!selectedArea) return;
    if (!window.confirm(`¿Eliminar la zona ${selectedZone + 1} de ${selectedAreaName}? Las demás zonas del área se conservan.`)) return;
    updateMutation.mutate({ id: selectedArea.id, geometry: removeZone(selectedArea.geometry, selectedZone), message: 'Zona eliminada' });
  };

  const handleStartEditing = () => {
    if (selectedArea) {
      setEditMode(true);
      setDrawMode(false);
    }
  };

  const handleAreaDrawn = (coordinates: number[][]) => {
    if (addingZone && selectedArea) {
      cancelDrawing();
      updateMutation.mutate({ id: selectedArea.id, geometry: addZone(selectedArea.geometry, ringFromLeaflet(coordinates)), message: 'Zona agregada' });
      return;
    }
    setDrawnCoordinates(coordinates);
    setDrawMode(false);
    setEditMode(false);
    setIsLinkAreaModalOpen(true);
  };

  const handleAreaEdited = async (coordinates: number[][]) => {
    if (!selectedArea) return;
    // Only the edited zone changes; the other zones of the area stay as they are
    updateMutation.mutate({
      id: selectedArea.id,
      geometry: replaceZone(selectedArea.geometry, selectedZone, ringFromLeaflet(coordinates)),
      message: 'Forma actualizada',
    });
    setEditMode(false);
  };

  const selectedAreaName = selectedArea?.display_name || selectedArea?.organizational_area?.name || 'el área';
  const selectedZoneCount = selectedArea ? zonesOf(selectedArea.geometry).length : 0;

  const handleCloseModal = () => {
    setIsLinkAreaModalOpen(false);
    setDrawnCoordinates(null);
    setSelectedArea(null);
  };

  return (
    <div className={`flex flex-col ${embedded ? 'lg:h-[calc(100vh-17rem)] lg:min-h-[32rem]' : 'lg:h-[calc(100vh-8rem)]'}`}>
      {/* Header */}
      <div className="mb-6">
        <SectionHeader
          title={embedded ? 'Layout' : 'Layout 2D'}
          description={embedded ? 'Plano de cada piso con las áreas dibujadas encima.' : 'Diseña y gestiona distribuciones de planta en 2D'}
          actions={
            selectedPlantId && (
              !drawMode && !editMode ? (
                <>
                  {areaRepresentations.length > 0 && <LabelModeToggle value={labelMode} onChange={setLabelMode} />}
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
                <Button onClick={cancelDrawing} variant="outline">
                  Cancelar Dibujo
                </Button>
              ) : (
                <Button onClick={() => setEditMode(false)} variant="outline">
                  Cancelar Edición
                </Button>
              )
            )
          }
        />

        {/* Filters */}
        <div className="mt-4 flex flex-wrap gap-4">
          {!embedded && (
            <div className="w-full sm:w-64">
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
          )}

          {selectedPlantId && (
            <div className="w-full sm:w-48">
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
        <div className="flex flex-col gap-4 lg:min-h-0 lg:flex-1 lg:flex-row">
          {/* Map (fixed height when stacked on small screens; fills the page from lg up) */}
          <div className="h-[420px] min-w-0 bg-white rounded-lg shadow overflow-hidden sm:h-[520px] lg:h-auto lg:flex-1">
            <LayoutMap
              imageUrl={currentLayout?.layout_image_url || null}
              areas={areaRepresentations}
              onAreaClick={handleAreaClick}
              selectedAreaId={selectedArea?.id}
              selectedZoneIndex={selectedZone}
              showAreaLabels
              labelMode={labelMode}
              highlightedId={drawMode || editMode ? null : hovered?.id ?? null}
              onShapeHover={(id) => !drawMode && !editMode && setHovered(id ? { id, from: 'map' } : null)}
              drawMode={drawMode}
              drawTitle={addingZone ? `Nueva zona de ${selectedAreaName}` : undefined}
              editMode={editMode}
              editingArea={
                editMode && selectedArea
                  ? {
                    id: selectedArea.id,
                    geometry: zoneAsPolygon(selectedArea.geometry, selectedZone),
                    zoneIndex: selectedZone,
                    name: selectedArea.display_name || selectedArea.organizational_area?.name,
                    color: selectedArea.display_color || selectedArea.organizational_area?.color || undefined,
                  }
                  : null
              }
              onAreaDrawn={handleAreaDrawn}
              onAreaEdited={handleAreaEdited}
              onCancelDraw={cancelDrawing}
              onCancelEdit={() => setEditMode(false)}
            />
          </div>

          {/* Sidebar */}
          <div className="w-full bg-white rounded-lg shadow p-4 lg:w-80 lg:overflow-y-auto">
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
                  const zoneCount = zonesOf(areaRep.geometry).length;

                  return (
                    <div
                      key={areaRep.id}
                      ref={(el) => {
                        if (el) listRows.current.set(areaRep.id, el);
                        else listRows.current.delete(areaRep.id);
                      }}
                      onClick={() => handleAreaClick(areaRep, 0)}
                      onMouseEnter={() => setHovered({ id: areaRep.id, from: 'list' })}
                      onMouseLeave={() => setHovered(null)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedArea?.id === areaRep.id
                        ? 'border-blue-500 bg-blue-50'
                        : hovered?.id === areaRep.id
                          ? 'border-blue-300 bg-gray-50'
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
                        {zoneCount > 1 && (
                          <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{zoneCount} zonas</span>
                        )}
                      </div>

                      {area?.code && (
                        <p className="text-xs text-gray-600 mb-1">Código: {area.code}</p>
                      )}

                      {area && (
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="text-xs">
                            {area.area_type}
                          </Badge>
                          {(area as any).full_path_name && (
                            <span className="text-xs text-gray-500 truncate">
                              {(area as any).full_path_name}
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
                    {(selectedArea.organizational_area as any).full_path_name && (
                      <p className="text-gray-500 mt-1">
                        {(selectedArea.organizational_area as any).full_path_name}
                      </p>
                    )}
                  </div>
                )}

                {otherFloors.length > 0 && (
                  <p className="mb-3 flex flex-wrap items-center gap-1 text-xs text-gray-600">
                    También en:
                    {otherFloors.map((level) => (
                      <button
                        key={level}
                        onClick={() => goToFloor(level)}
                        className="rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-700 hover:bg-blue-100"
                      >
                        {floorLabel(level)}
                      </button>
                    ))}
                  </p>
                )}

                {selectedZoneCount > 1 && (
                  <p className="mb-3 text-xs text-gray-600">
                    Zona <strong>{selectedZone + 1}</strong> de {selectedZoneCount} seleccionada (resaltada en el plano). Da clic en otra zona
                    del área para elegirla.
                  </p>
                )}

                <div className="space-y-2">
                  <Button
                    onClick={() => navigate(`/areas/${selectedArea.organizational_area_id}?tab=layout&floor=${selectedFloor}`)}
                    className="w-full gap-2 justify-center"
                  >
                    <LayoutGrid className="h-4 w-4" />
                    Abrir layout interno
                  </Button>
                  <Button
                    onClick={handleStartEditing}
                    className="w-full gap-2 justify-center"
                    variant="outline"
                  >
                    <PenTool className="h-4 w-4" />
                    {selectedZoneCount > 1 ? `Editar zona ${selectedZone + 1}` : 'Editar Geometría'}
                  </Button>
                  <Button onClick={handleStartAddingZone} className="w-full gap-2 justify-center" variant="outline">
                    <Plus className="h-4 w-4" />
                    Agregar otra zona
                  </Button>
                  {selectedZoneCount > 1 && (
                    <Button
                      onClick={handleDeleteZone}
                      className="w-full gap-2 justify-center border-red-300 text-red-700 hover:bg-red-50"
                      variant="outline"
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar zona {selectedZone + 1}
                    </Button>
                  )}
                  <Button
                    onClick={handleDeleteArea}
                    className="w-full gap-2 justify-center bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    {selectedZoneCount > 1 ? 'Quitar el área del plano' : 'Eliminar Representación'}
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

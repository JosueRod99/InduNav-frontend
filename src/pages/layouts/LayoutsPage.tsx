import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { MapPin, Upload, PenTool, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import LayoutMap from './LayoutMap';
import LabelModeToggle, { useLabelMode } from './LabelModeToggle';
import LinkAreaModal from './LinkAreaModal';
import LayoutModal from './LayoutModal';
import LayoutAreaList from './LayoutAreaList';
import SelectedAreaPanel from './SelectedAreaPanel';
import { getPlants } from '../../api/plants';
import { getLayouts, getPlantCoverage, type AreaCoverage } from '../../api/layouts';
import {
  createRepresentation,
  deleteRepresentation,
  getAreasByLayout,
  leafletToGeoJSON,
  updateRepresentation,
  type AreaGeometry,
  type AreaPhysicalRepresentation,
} from '../../api/areaRepresentations';
import { floorLabel, sortFloors } from '../../utils/floors';
import { useAuthStore } from '../../store/authStore';
import type { PlantScopedProps } from '../plants/plantScope';
import { useBackState, useNavigateWithBack } from '../../hooks/useBackNavigation';
import { addZone, removeZone, replaceZone, ringFromLeaflet, zoneAsPolygon, zonesOf } from '../../utils/areaGeometry';
import SectionHeader from '../../components/ui/SectionHeader';

// Floors offered by "+ Piso" (those without a plan yet)
const FLOOR_CHOICES = [-2, -1, 0, 1, 2, 3, 4, 5];

const LayoutsPage = ({ plantId }: PlantScopedProps = {}) => {
  const embedded = !!plantId; // inside the plant workspace: fixed plant, no org/plant selectors

  const [selectedPlantId, setSelectedPlantId] = useState<string>(plantId ?? '');
  // ?floor=N&area=<id>[&draw=1] (from the "Áreas" tab): open that floor with the area selected, or drawing it
  const [searchParams, setSearchParams] = useSearchParams();
  const [chosenFloor, setChosenFloor] = useState<number | null>(() => {
    const floor = searchParams.get('floor');
    return floor !== null && Number.isInteger(Number(floor)) ? Number(floor) : null;
  });
  const [selectedId, setSelectedId] = useState<string | null>(null); // selected area drawing
  const [selectedZone, setSelectedZone] = useState(0); // zone of the selected area (areas can have several)
  const [isLinkAreaModalOpen, setIsLinkAreaModalOpen] = useState(false);
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false);
  const [drawMode, setDrawMode] = useState(false);
  const [addingZone, setAddingZone] = useState<AreaPhysicalRepresentation | null>(null); // drawing another zone of this area
  const [drawingFor, setDrawingFor] = useState<AreaCoverage | null>(null); // drawing an area picked from "Sin dibujar"
  const [editMode, setEditMode] = useState(false);
  const [drawnCoordinates, setDrawnCoordinates] = useState<number[][] | null>(null);
  const [addingFloor, setAddingFloor] = useState(false);
  // Names on the map (always / on hover) and the area under the mouse, shared by map and list
  const [labelMode, setLabelMode] = useLabelMode();
  const [hovered, setHovered] = useState<{ id: string; from: 'map' | 'list' } | null>(null);
  const listRows = useRef(new Map<string, HTMLElement>());
  useEffect(() => {
    if (hovered?.from === 'map') listRows.current.get(hovered.id)?.scrollIntoView({ block: 'nearest' });
  }, [hovered]);
  const queryClient = useQueryClient();
  const navigate = useNavigateWithBack(); // detail pages opened from here return here
  const backState = useBackState();
  const { user } = useAuthStore();

  const { data: plantsData } = useQuery({
    queryKey: ['plants'],
    queryFn: () => getPlants({ limit: 100 }),
  });

  // Plans of every floor of the plant: the floor tabs
  const { data: plantLayouts = [] } = useQuery({
    queryKey: ['layouts', selectedPlantId, 'all-floors'],
    queryFn: () => getLayouts({ plant_id: selectedPlantId }),
    enabled: !!selectedPlantId,
  });
  const floorsWithPlan = sortFloors(plantLayouts.map((l) => l.floor_level));
  const selectedFloor = chosenFloor ?? (floorsWithPlan.includes(0) ? 0 : floorsWithPlan[0] ?? 0);
  const floorTabs = sortFloors([...floorsWithPlan, selectedFloor]);
  const currentLayout = plantLayouts.find((l) => l.floor_level === selectedFloor);

  const selectedPlant = plantsData?.plants.find((p) => p.id === selectedPlantId);
  const organizationId = selectedPlant?.organization_id || user?.organization_id || '';

  const { data: areaRepresentations = [] } = useQuery({
    queryKey: ['layout-areas', currentLayout?.id, selectedFloor],
    queryFn: () => getAreasByLayout(currentLayout!.id, selectedFloor),
    enabled: !!currentLayout?.id,
  });

  // Where every area of the plant is drawn (counter, "En otros pisos", "Sin dibujar")
  const { data: coverage = [] } = useQuery({
    queryKey: ['layout-coverage', selectedPlantId],
    queryFn: () => getPlantCoverage(selectedPlantId),
    enabled: !!selectedPlantId,
  });

  const selectedArea = areaRepresentations.find((r) => r.id === selectedId) || null;
  const selectedAreaName = selectedArea?.display_name || selectedArea?.organizational_area?.name || 'el área';
  const selectedZoneCount = selectedArea ? zonesOf(selectedArea.geometry).length : 0;
  const zone = Math.min(selectedZone, Math.max(0, selectedZoneCount - 1));
  const otherFloors = selectedArea
    ? sortFloors(
        (coverage.find((a) => a.id === selectedArea.organizational_area_id)?.drawn || [])
          .filter((d) => !d.inside_area_id && d.floor_level !== selectedFloor)
          .map((d) => d.floor_level)
      )
    : [];

  const refreshDrawings = () => {
    queryClient.invalidateQueries({ queryKey: ['layout-areas'] });
    queryClient.invalidateQueries({ queryKey: ['area-representations'] });
    queryClient.invalidateQueries({ queryKey: ['layout-coverage'] });
  };

  const resetModes = () => {
    setDrawMode(false);
    setEditMode(false);
    setAddingZone(null);
    setDrawingFor(null);
  };

  const goToFloor = (level: number) => {
    setSelectedId(null);
    resetModes();
    setChosenFloor(level);
  };

  const deleteMutation = useMutation({
    mutationFn: deleteRepresentation,
    onSuccess: () => {
      toast.success('Área quitada del plano');
      refreshDrawings();
      setSelectedId(null);
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Error al quitar el área'),
  });

  // Edit, add or remove a zone (the selection stays, with the fresh shape)
  const updateMutation = useMutation({
    mutationFn: (data: { id: string; geometry: AreaGeometry; message: string; zone?: number }) =>
      updateRepresentation(data.id, { geometry: data.geometry }),
    onSuccess: (_, data) => {
      toast.success(data.message);
      refreshDrawings();
      if (data.zone !== undefined) setSelectedZone(data.zone);
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Error al actualizar la forma'),
  });

  // An area picked from "Sin dibujar": the drawing is linked to it right away
  const drawForMutation = useMutation({
    mutationFn: ({ area, coordinates }: { area: AreaCoverage; coordinates: number[][] }) =>
      createRepresentation(area.id, { layout_id: currentLayout!.id, geometry: leafletToGeoJSON(coordinates), floor_level: selectedFloor }),
    onSuccess: (rep, { area }) => {
      toast.success(`${area.name} dibujada en el plano`);
      refreshDrawings();
      setSelectedId(rep.id);
      setSelectedZone(0);
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'No se pudo guardar el dibujo'),
  });

  // Area asked in the URL: once its floor and drawings are loaded, select it (or start drawing it)
  const askedArea = searchParams.get('area');
  useEffect(() => {
    if (!askedArea || !coverage.length) return;
    const area = coverage.find((a) => a.id === askedArea);
    const clear = () =>
      setSearchParams(
        (params) => {
          ['area', 'floor', 'draw'].forEach((key) => params.delete(key));
          return params;
        },
        { replace: true }
      );
    if (!area) return clear();
    if (searchParams.get('draw') === '1') {
      if (!currentLayout) return; // wait for the floor plan
      handleDrawFor(area);
      return clear();
    }
    const floors = area.drawn.filter((d) => !d.inside_area_id).map((d) => d.floor_level);
    if (!floors.length) return clear(); // not on any floor plan
    if (!floors.includes(selectedFloor)) {
      setChosenFloor(sortFloors(floors)[0]);
      return; // runs again with that floor's drawings
    }
    const rep = areaRepresentations.find((r) => r.organizational_area_id === askedArea);
    if (rep) {
      setSelectedId(rep.id);
      setSelectedZone(0);
      clear();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [askedArea, coverage, areaRepresentations, currentLayout, selectedFloor]);

  const handleAreaClick = (area: AreaPhysicalRepresentation, zoneIndex: number) => {
    // While drawing or editing, a click on another area is a point of the drawing, not a new selection
    if (drawMode || editMode) return;
    setSelectedId(area.id);
    setSelectedZone(zoneIndex);
  };

  const handleDeleteArea = () => {
    if (!selectedArea) return;
    const message =
      selectedZoneCount > 1
        ? `¿Quitar ${selectedAreaName} del plano? Se borran sus ${selectedZoneCount} zonas; el área sigue existiendo.`
        : `¿Quitar ${selectedAreaName} del plano? El área sigue existiendo, solo se borra su dibujo.`;
    if (window.confirm(message)) deleteMutation.mutate(selectedArea.id);
  };

  const handleStartDrawing = () => {
    resetModes();
    setSelectedId(null);
    setDrawMode(true);
  };

  const handleDrawFor = (area: AreaCoverage) => {
    resetModes();
    setSelectedId(null);
    setDrawingFor(area);
    setDrawMode(true);
  };

  const handleStartAddingZone = () => {
    if (!selectedArea) return;
    resetModes();
    setAddingZone(selectedArea); // the zone goes to this area, whatever happens to the selection meanwhile
    setDrawMode(true);
  };

  const handleDeleteZone = () => {
    if (!selectedArea) return;
    if (!window.confirm(`¿Eliminar la zona ${zone + 1} de ${selectedAreaName}? Las demás zonas del área se conservan.`)) return;
    updateMutation.mutate({ id: selectedArea.id, geometry: removeZone(selectedArea.geometry, zone), message: 'Zona eliminada', zone: 0 });
  };

  const handleAreaDrawn = (coordinates: number[][]) => {
    if (addingZone) {
      const target = areaRepresentations.find((r) => r.id === addingZone.id) || addingZone;
      resetModes();
      setSelectedId(target.id);
      updateMutation.mutate({
        id: target.id,
        geometry: addZone(target.geometry, ringFromLeaflet(coordinates)),
        message: 'Zona agregada',
        zone: zonesOf(target.geometry).length, // the new zone is the last one
      });
      return;
    }
    if (drawingFor) {
      const area = drawingFor;
      resetModes();
      drawForMutation.mutate({ area, coordinates });
      return;
    }
    setDrawnCoordinates(coordinates);
    resetModes();
    setIsLinkAreaModalOpen(true);
  };

  const handleAreaEdited = (coordinates: number[][]) => {
    if (!selectedArea) return;
    // Only the edited zone changes; the other zones of the area stay as they are
    updateMutation.mutate({ id: selectedArea.id, geometry: replaceZone(selectedArea.geometry, zone, ringFromLeaflet(coordinates)), message: 'Forma actualizada' });
    setEditMode(false);
  };

  const handleCloseModal = () => {
    setIsLinkAreaModalOpen(false);
    setDrawnCoordinates(null);
    queryClient.invalidateQueries({ queryKey: ['layout-coverage'] });
  };

  const drawTitle = addingZone
    ? `Nueva zona de ${addingZone.display_name || addingZone.organizational_area?.name || 'el área'}`
    : drawingFor
      ? `Dibujando: ${drawingFor.name}`
      : undefined;

  return (
    <div className={`flex flex-col ${embedded ? 'lg:h-[calc(100vh-17rem)] lg:min-h-[32rem]' : 'lg:h-[calc(100vh-8rem)]'}`}>
      {/* Header */}
      <div className="mb-4">
        <SectionHeader
          title={embedded ? 'Layout' : 'Layout 2D'}
          description={embedded ? 'Plano de cada piso con las áreas dibujadas encima.' : 'Diseña y gestiona distribuciones de planta en 2D'}
          actions={
            selectedPlantId &&
            (!drawMode && !editMode ? (
              <>
                {areaRepresentations.length > 0 && <LabelModeToggle value={labelMode} onChange={setLabelMode} />}
                <Button onClick={() => setIsLayoutModalOpen(true)} className="gap-2" variant={currentLayout ? 'outline' : 'primary'}>
                  <Upload className="h-4 w-4" />
                  {currentLayout ? 'Cambiar plano' : 'Subir plano'}
                </Button>
                {currentLayout && (
                  <Button onClick={handleStartDrawing} className="gap-2">
                    <PenTool className="h-4 w-4" />
                    Dibujar Área
                  </Button>
                )}
              </>
            ) : drawMode ? (
              <Button onClick={resetModes} variant="outline">
                Cancelar Dibujo
              </Button>
            ) : (
              <Button onClick={() => setEditMode(false)} variant="outline">
                Cancelar Edición
              </Button>
            ))
          }
        />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {!embedded && (
            <select
              id="plant-select"
              aria-label="Planta"
              value={selectedPlantId}
              onChange={(e) => {
                setSelectedPlantId(e.target.value);
                goToFloor(0);
                setChosenFloor(null);
              }}
              className="w-full sm:w-64"
            >
              <option value="">Seleccionar planta</option>
              {plantsData?.plants.map((plant) => (
                <option key={plant.id} value={plant.id}>
                  {plant.name}
                </option>
              ))}
            </select>
          )}

          {/* Floors: only those with a plan, plus "+ Piso" */}
          {selectedPlantId && (
            <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Piso">
              {floorTabs.map((level) => {
                const hasPlan = floorsWithPlan.includes(level);
                return (
                  <button
                    key={level}
                    role="tab"
                    aria-selected={level === selectedFloor}
                    onClick={() => goToFloor(level)}
                    className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                      level === selectedFloor ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {floorLabel(level)}
                    {!hasPlan && <span className="ml-1 text-xs opacity-80">(sin plano)</span>}
                  </button>
                );
              })}
              {addingFloor ? (
                <select
                  autoFocus
                  aria-label="Piso a agregar"
                  defaultValue=""
                  onChange={(e) => {
                    setAddingFloor(false);
                    if (e.target.value === '') return;
                    goToFloor(Number(e.target.value));
                    setIsLayoutModalOpen(true);
                  }}
                  onBlur={() => setAddingFloor(false)}
                  className="w-40 text-sm"
                >
                  <option value="">Elige el piso…</option>
                  {FLOOR_CHOICES.filter((level) => !floorsWithPlan.includes(level)).map((level) => (
                    <option key={level} value={level}>
                      {floorLabel(level)}
                    </option>
                  ))}
                </select>
              ) : (
                <button
                  onClick={() => setAddingFloor(true)}
                  disabled={drawMode || editMode}
                  className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-400 px-3 py-1 text-sm font-medium text-gray-600 hover:border-blue-400 hover:text-blue-700 disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" /> Piso
                </button>
              )}
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
            <p className="mt-1 text-sm text-gray-500">Elige una planta para ver y editar su layout</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 lg:min-h-0 lg:flex-1 lg:flex-row">
          {/* Map (fixed height when stacked on small screens; fills the page from lg up) */}
          <div className="relative h-[420px] min-w-0 bg-white rounded-lg shadow overflow-hidden sm:h-[520px] lg:h-auto lg:flex-1">
            <LayoutMap
              imageUrl={currentLayout?.layout_image_url || null}
              areas={areaRepresentations}
              onAreaClick={handleAreaClick}
              selectedAreaId={selectedArea?.id}
              selectedZoneIndex={zone}
              showAreaLabels
              numberZones
              mapControls
              labelMode={labelMode}
              highlightedId={drawMode || editMode ? null : hovered?.id ?? null}
              onShapeHover={(id) => !drawMode && !editMode && setHovered(id ? { id, from: 'map' } : null)}
              drawMode={drawMode}
              drawTitle={drawTitle}
              editMode={editMode}
              editingArea={
                editMode && selectedArea
                  ? {
                      id: selectedArea.id,
                      geometry: zoneAsPolygon(selectedArea.geometry, zone),
                      zoneIndex: zone,
                      name: selectedZoneCount > 1 ? `${selectedAreaName} · zona ${zone + 1}` : selectedAreaName,
                      color: selectedArea.display_color || selectedArea.organizational_area?.color || undefined,
                    }
                  : null
              }
              onAreaDrawn={handleAreaDrawn}
              onAreaEdited={handleAreaEdited}
              onCancelDraw={resetModes}
              onCancelEdit={() => setEditMode(false)}
            />
            {!currentLayout && (
              <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/80">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900">{floorLabel(selectedFloor)} no tiene plano todavía</p>
                  <Button onClick={() => setIsLayoutModalOpen(true)} className="mt-3 gap-2">
                    <Upload className="h-4 w-4" /> Subir plano
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: the selected area first, then the list */}
          <div className="w-full space-y-4 bg-white rounded-lg shadow p-4 lg:w-80 lg:overflow-y-auto">
            {selectedArea && !drawMode && !editMode && (
              <SelectedAreaPanel
                rep={selectedArea}
                zoneIndex={zone}
                zoneCount={selectedZoneCount}
                otherFloors={otherFloors}
                canEdit
                backState={backState}
                onSelectZone={setSelectedZone}
                onGoToFloor={goToFloor}
                onOpenInternal={() => navigate(`/areas/${selectedArea.organizational_area_id}?tab=layout&floor=${selectedFloor}`)}
                onEditZone={() => {
                  resetModes();
                  setEditMode(true);
                }}
                onAddZone={handleStartAddingZone}
                onDeleteZone={handleDeleteZone}
                onRemove={handleDeleteArea}
                onClose={() => setSelectedId(null)}
              />
            )}
            <LayoutAreaList
              drawn={areaRepresentations}
              coverage={coverage}
              floor={selectedFloor}
              selectedId={selectedArea?.id ?? null}
              hoveredId={hovered?.id ?? null}
              onSelect={(rep) => handleAreaClick(rep, 0)}
              onHover={(id) => setHovered(id ? { id, from: 'list' } : null)}
              onDraw={currentLayout && !drawMode && !editMode ? handleDrawFor : undefined}
              onGoToFloor={goToFloor}
              rowRef={(id, el) => (el ? listRows.current.set(id, el) : listRows.current.delete(id))}
            />
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

      {/* Plan of the floor */}
      <LayoutModal
        isOpen={isLayoutModalOpen}
        onClose={() => {
          setIsLayoutModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ['layouts', selectedPlantId] });
        }}
        layout={currentLayout}
        plantId={selectedPlantId}
        floorLevel={selectedFloor}
      />
    </div>
  );
};

export default LayoutsPage;

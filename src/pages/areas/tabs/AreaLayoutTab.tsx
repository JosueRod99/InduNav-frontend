import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  PenTool,
  Trash2,
  Square,
  Wrench,
  ImageIcon,
  LayoutGrid,
  ExternalLink,
  MapPin,
  Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import LabelModeToggle, { useLabelMode } from '../../layouts/LabelModeToggle';
import LayoutMap, { type EditableShape, type MapFootprint } from '../../layouts/LayoutMap';
import LinkAreaModal from '../../layouts/LinkAreaModal';
import AreaLayoutBackgroundModal from '../modals/AreaLayoutBackgroundModal';
import PlaceEquipmentModal from '../modals/PlaceEquipmentModal';
import { useAuthStore } from '../../../store/authStore';
import { getAreaLayouts, recropAreaLayout } from '../../../api/layouts';
import { floorLabel, sortFloors } from '../../../utils/floors';
import {
  getAreasByLayout,
  getRepresentationsByArea,
  updateRepresentation,
  deleteRepresentation,
  leafletToGeoJSON,
  type AreaGeometry,
  type AreaPhysicalRepresentation,
} from '../../../api/areaRepresentations';
import {
  getAreaEquipment,
  getLayoutFootprints,
  updateFootprint,
  deleteFootprint,
  EQUIPMENT_STATUS_COLORS,
  EQUIPMENT_STATUS_LABELS,
  type EquipmentFootprint,
} from '../../../api/equipment';
import { computePlantCrop, cropMissesZones, liveOutlines, plantImageBoundsForCrop, type AreaLayoutData } from '../../../utils/areaLayout';
import { useNavigateWithBack } from '../../../hooks/useBackNavigation';
import { addZone, removeZone, replaceZone, ringFromLeaflet, zoneAsPolygon, zonesOf } from '../../../utils/areaGeometry';

interface AreaLayoutTabProps {
  areaId: string;
  area: any;
}

// Same roles that can manage equipment (footprint endpoints require them)
const EDITOR_ROLES = ['platform_admin', 'org_owner'];

type Selection =
  | { kind: 'area'; item: AreaPhysicalRepresentation; zoneIndex: number }
  | { kind: 'equipment'; item: EquipmentFootprint }
  | null;

const AreaLayoutTab = ({ areaId, area }: AreaLayoutTabProps) => {
  const navigate = useNavigateWithBack(); // detail pages opened from here return here
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const canEdit = !!user?.role && EDITOR_ROLES.includes(user.role.name);

  const [selection, setSelection] = useState<Selection>(null);
  const [drawMode, setDrawMode] = useState(false);
  const [addingZone, setAddingZone] = useState(false); // drawing another zone of the selected subarea
  const [editMode, setEditMode] = useState(false);
  const [drawnCoordinates, setDrawnCoordinates] = useState<number[][] | null>(null);
  const [drawnKind, setDrawnKind] = useState<'choose' | 'area' | 'equipment' | null>(null);
  const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false);
  const [colorByStatus, setColorByStatus] = useState(true);
  // Names on the map: always, or only on hover (like the tour map)
  const [labelMode, changeLabelMode] = useLabelMode();
  // Shape under the mouse, shared by the map and the side list
  const [hovered, setHovered] = useState<{ id: string; from: 'map' | 'list' } | null>(null);
  const listRows = useRef(new Map<string, HTMLButtonElement>());
  useEffect(() => {
    if (hovered?.from === 'map') listRows.current.get(hovered.id)?.scrollIntoView({ block: 'nearest' });
  }, [hovered]);
  const rowHover = (id: string) => ({
    onMouseEnter: () => setHovered({ id, from: 'list' }),
    onMouseLeave: () => setHovered(null),
    ref: (el: HTMLButtonElement | null) => {
      if (el) listRows.current.set(id, el);
      else listRows.current.delete(id);
    },
  });

  // ---------- Data ----------
  // One internal layout per floor the area is on
  const { data: areaLayouts = [], isLoading: isLoadingLayout } = useQuery({
    queryKey: ['area-layout', areaId],
    queryFn: () => getAreaLayouts(areaId),
  });

  // Where this area is drawn on the plant layouts (source for the crop background), by floor
  const { data: representations = [] } = useQuery({
    queryKey: ['area-representations', areaId],
    queryFn: () => getRepresentationsByArea(areaId),
  });
  const plantRepresentations = representations.filter((r) => r.layout && !r.layout.organizational_area_id);
  const floors = sortFloors([...plantRepresentations.map((r) => r.floor_level), ...areaLayouts.map((l) => l.floor_level)]);
  // ?floor=N (from the plant layout of that floor) opens that floor's internal layout
  const [searchParams] = useSearchParams();
  const [chosenFloor, setChosenFloor] = useState<number | null>(() => {
    const fromUrl = searchParams.get('floor');
    return fromUrl !== null && Number.isInteger(Number(fromUrl)) ? Number(fromUrl) : null;
  });
  const floor = chosenFloor !== null && floors.includes(chosenFloor) ? chosenFloor : floors[0] ?? 0;
  const layout = areaLayouts.find((l) => l.floor_level === floor) || null;
  const plantRepresentation = plantRepresentations.find((r) => r.floor_level === floor) || null;

  const changeFloor = (level: number) => {
    setSelection(null);
    setDrawMode(false);
    setEditMode(false);
    setAddingZone(false);
    setChosenFloor(level);
  };

  const { data: subAreas = [] } = useQuery({
    queryKey: ['layout-areas', layout?.id],
    queryFn: () => getAreasByLayout(layout!.id),
    enabled: !!layout?.id,
  });

  const { data: footprints = [] } = useQuery({
    queryKey: ['layout-footprints', layout?.id],
    queryFn: () => getLayoutFootprints(layout!.id),
    enabled: !!layout?.id,
  });

  const { data: areaEquipment = [] } = useQuery({
    queryKey: ['area-equipment', areaId],
    queryFn: () => getAreaEquipment(areaId),
  });

  const placedIds = new Set(footprints.map((f) => f.equipment_id));
  const unplacedEquipment = areaEquipment.filter((a) => !placedIds.has(a.equipment_id));

  // ---------- Background ----------
  const layoutData = (layout?.layout_data || {}) as AreaLayoutData;
  const background = useMemo(() => {
    if (layoutData.source === 'plant_crop' && layoutData.crop) {
      // Prefer the live plant image so a replaced plant plan shows up here too
      const plantImage =
        (plantRepresentation?.layout?.id === layoutData.plant_layout_id &&
          plantRepresentation?.layout?.layout_image_url) ||
        layoutData.plant_image_url ||
        null;
      return { imageUrl: plantImage, imageBounds: plantImageBoundsForCrop(layoutData.crop) };
    }
    if (layoutData.source === 'image') {
      return { imageUrl: layout?.layout_image_url || null, imageBounds: undefined };
    }
    return { imageUrl: null, imageBounds: undefined };
  }, [layoutData, layout?.layout_image_url, plantRepresentation]);

  const mapFootprints: MapFootprint[] = footprints.map((f) => ({
    id: f.id,
    geometry: f.geometry,
    label: f.equipment_code || f.equipment_name || 'Equipo',
    color: f.display_color,
    status: f.equipment_status,
  }));

  // ---------- Mutations ----------
  const invalidateDrawings = () => {
    queryClient.invalidateQueries({ queryKey: ['layout-areas', layout?.id] });
    queryClient.invalidateQueries({ queryKey: ['layout-footprints', layout?.id] });
  };

  const updateGeometryMutation = useMutation({
    mutationFn: async ({ sel, coordinates }: { sel: NonNullable<Selection>; coordinates: number[][] }) => {
      // Subareas: only the edited zone changes; the other zones stay as they are
      if (sel.kind === 'area') await updateRepresentation(sel.item.id, { geometry: replaceZone(sel.item.geometry, sel.zoneIndex, ringFromLeaflet(coordinates)) });
      else await updateFootprint(sel.item.id, { geometry: leafletToGeoJSON(coordinates) });
    },
    onSuccess: () => {
      toast.success('Forma actualizada');
      invalidateDrawings();
      setSelection(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar la forma');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (sel: NonNullable<Selection>) => {
      if (sel.kind === 'area') await deleteRepresentation(sel.item.id);
      else await deleteFootprint(sel.item.id);
    },
    onSuccess: () => {
      toast.success('Dibujo eliminado');
      invalidateDrawings();
      setSelection(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar');
    },
  });

  // An area zone added on the plant plan can fall outside the stored crop
  const recropMutation = useMutation({
    mutationFn: () => {
      const { crop, outlines } = computePlantCrop(plantRepresentation!.geometry);
      return recropAreaLayout(layout!.id, crop, outlines);
    },
    onSuccess: () => {
      toast.success('Recorte ajustado: se ven todas las zonas del área');
      queryClient.invalidateQueries({ queryKey: ['area-layout', areaId] });
      invalidateDrawings();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'No se pudo ajustar el recorte');
    },
  });

  // ---------- Handlers ----------
  const startDrawing = () => {
    setSelection(null);
    setEditMode(false);
    setAddingZone(false);
    setDrawMode(true);
  };

  const cancelDrawing = () => {
    setDrawMode(false);
    setAddingZone(false);
  };

  const zoneMutation = useMutation({
    mutationFn: ({ id, geometry }: { id: string; geometry: AreaGeometry; message: string }) => updateRepresentation(id, { geometry }),
    onSuccess: (_, { message }) => {
      toast.success(message);
      invalidateDrawings();
      setSelection(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al guardar la zona');
    },
  });

  const handleDeleteZone = () => {
    if (selection?.kind !== 'area') return;
    const name = selection.item.organizational_area?.name || 'la subárea';
    if (!window.confirm(`¿Eliminar la zona ${selection.zoneIndex + 1} de ${name}? Las demás zonas se conservan.`)) return;
    zoneMutation.mutate({ id: selection.item.id, geometry: removeZone(selection.item.geometry, selection.zoneIndex), message: 'Zona eliminada' });
  };

  const handleDrawn = (coordinates: number[][]) => {
    if (addingZone && selection?.kind === 'area') {
      cancelDrawing();
      zoneMutation.mutate({ id: selection.item.id, geometry: addZone(selection.item.geometry, ringFromLeaflet(coordinates)), message: 'Zona agregada' });
      return;
    }
    setDrawMode(false);
    setDrawnCoordinates(coordinates);
    setDrawnKind(unplacedEquipment.length > 0 ? 'choose' : 'area');
  };

  const closeDrawnFlow = () => {
    setDrawnCoordinates(null);
    setDrawnKind(null);
  };

  const handleEdited = (coordinates: number[][]) => {
    setEditMode(false);
    if (selection) updateGeometryMutation.mutate({ sel: selection, coordinates });
  };

  const handleDelete = () => {
    if (!selection) return;
    const message =
      selection.kind === 'area'
        ? '¿Quitar esta subárea del layout? El área sigue existiendo, solo se borra su dibujo.'
        : '¿Quitar este equipo del layout? Seguirá asignado al área como "Por colocar".';
    if (window.confirm(message)) deleteMutation.mutate(selection);
  };

  const editingShape: EditableShape | null =
    editMode && selection
      ? selection.kind === 'area'
        ? {
            id: selection.item.id,
            geometry: zoneAsPolygon(selection.item.geometry, selection.zoneIndex),
            zoneIndex: selection.zoneIndex,
            name: selection.item.organizational_area?.name,
            color: selection.item.display_color || selection.item.organizational_area?.color || undefined,
          }
        : {
            id: selection.item.id,
            geometry: selection.item.geometry,
            name: selection.item.equipment_name,
            color: selection.item.display_color || undefined,
          }
      : null;

  // ---------- Render ----------
  if (isLoadingLayout) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Cargando layout...</div>
      </div>
    );
  }

  const backgroundModal = (
    <AreaLayoutBackgroundModal
      isOpen={isBackgroundModalOpen}
      onClose={() => setIsBackgroundModalOpen(false)}
      area={area}
      layout={layout || null}
      plantRepresentation={plantRepresentation}
      floorLevel={floor}
    />
  );

  // Areas on several floors: one internal layout per floor
  const floorTabs = floors.length > 1 && (
    <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Piso">
      <span className="text-sm text-gray-600">Piso:</span>
      {floors.map((level) => (
        <button
          key={level}
          role="tab"
          aria-selected={level === floor}
          onClick={() => changeFloor(level)}
          className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
            level === floor ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {floorLabel(level)}
        </button>
      ))}
    </div>
  );

  if (!layout) {
    return (
      <div className="space-y-4">
        {floorTabs}
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <LayoutGrid className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {floors.length > 1 ? `Esta área no tiene layout interno en ${floorLabel(floor)}` : 'Esta área no tiene layout interno'}
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Crea un layout para dibujar sus subáreas y el espacio que ocupa cada herramienta o máquina.
          </p>
          {canEdit ? (
            <Button onClick={() => setIsBackgroundModalOpen(true)} className="gap-2">
              <PenTool className="h-4 w-4" />
              Crear Layout
            </Button>
          ) : (
            <p className="text-sm text-gray-500">Pide a un administrador que lo cree.</p>
          )}
          {backgroundModal}
        </div>
      </div>
    );
  }

  const isBusy = drawMode || editMode;
  const selectedZoneCount = selection?.kind === 'area' ? zonesOf(selection.item.geometry).length : 0;

  return (
    <div className="space-y-4">
      {floorTabs}
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Layout de {area?.name}</h3>
          <p className="text-sm text-gray-600">
            {subAreas.length} subárea{subAreas.length !== 1 && 's'} · {footprints.length} equipo
            {footprints.length !== 1 && 's'} colocado{footprints.length !== 1 && 's'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(subAreas.length > 0 || footprints.length > 0) && (
            <LabelModeToggle value={labelMode} onChange={changeLabelMode} />
          )}
          {footprints.length > 0 && (
            <div className="flex items-center rounded-lg border border-gray-300 p-0.5 text-xs font-medium">
              {[
                { value: true, label: 'Por estado' },
                { value: false, label: 'Personalizado' },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setColorByStatus(opt.value)}
                  className={`px-2.5 py-1.5 rounded-md transition-colors ${
                    colorByStatus === opt.value ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Color de los equipos en el mapa"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        {canEdit && (
          <div className="flex gap-2">
            {isBusy ? (
              <Button
                variant="outline"
                onClick={() => {
                  setDrawMode(false);
                  setEditMode(false);
                }}
              >
                Cancelar
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsBackgroundModalOpen(true)} className="gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Fondo
                </Button>
                <Button onClick={startDrawing} className="gap-2">
                  <PenTool className="h-4 w-4" />
                  Dibujar
                </Button>
              </>
            )}
          </div>
        )}
        </div>
      </div>

      {cropMissesZones(layoutData, plantRepresentation?.geometry) && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-900">
            Una zona de <strong>{area?.name}</strong> queda fuera del recorte de este plano (se dibujó después en la planta).
            {canEdit && ' Al ajustarlo, las subáreas y los equipos ya colocados se conservan en su lugar.'}
          </p>
          {canEdit && (
            <Button size="sm" onClick={() => recropMutation.mutate()} isLoading={recropMutation.isPending} disabled={isBusy}>
              Ajustar recorte
            </Button>
          )}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Map */}
        {/* Fixed height when stacked (flex-1 alone would collapse it to 0 in the column layout) */}
        <div className="h-[420px] w-full min-w-0 bg-white rounded-lg border border-gray-200 overflow-hidden sm:h-[520px] lg:h-[600px] lg:flex-1">
          <LayoutMap
            imageUrl={background.imageUrl}
            imageBounds={background.imageBounds}
            outlines={liveOutlines(layoutData, plantRepresentation?.geometry)}
            areas={subAreas}
            onAreaClick={(item, zoneIndex) => !isBusy && setSelection({ kind: 'area', item, zoneIndex })}
            selectedAreaId={selection?.kind === 'area' ? selection.item.id : null}
            selectedZoneIndex={selection?.kind === 'area' ? selection.zoneIndex : null}
            footprints={mapFootprints}
            onFootprintClick={(fp) => {
              const item = footprints.find((f) => f.id === fp.id);
              if (item && !isBusy) setSelection({ kind: 'equipment', item });
            }}
            selectedFootprintId={selection?.kind === 'equipment' ? selection.item.id : null}
            colorByStatus={colorByStatus}
            showAreaLabels
            labelMode={labelMode}
            highlightedId={isBusy ? null : hovered?.id ?? null}
            onShapeHover={(id) => !isBusy && setHovered(id ? { id, from: 'map' } : null)}
            drawMode={drawMode}
            drawTitle={
              addingZone && selection?.kind === 'area'
                ? `Nueva zona de ${selection.item.organizational_area?.name || 'la subárea'}`
                : 'Dibujando subárea o equipo'
            }
            editMode={editMode}
            editingArea={editingShape}
            onAreaDrawn={handleDrawn}
            onAreaEdited={handleEdited}
            onCancelDraw={cancelDrawing}
            onCancelEdit={() => setEditMode(false)}
          />
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 bg-white rounded-lg border border-gray-200 p-4 overflow-y-auto lg:h-[600px] space-y-6">
          {/* Selection actions */}
          {selection && !isBusy && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
              <p className="text-sm font-semibold text-blue-900">
                {selection.kind === 'area'
                  ? selection.item.organizational_area?.name
                  : selection.item.equipment_name}
              </p>
              {selection.kind === 'area' && selectedZoneCount > 1 && (
                <p className="text-xs text-blue-900/80">
                  Zona {selection.zoneIndex + 1} de {selectedZoneCount} (resaltada). Da clic en otra zona para elegirla.
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 justify-center"
                onClick={() =>
                  navigate(
                    selection.kind === 'area'
                      ? `/areas/${selection.item.organizational_area_id}?tab=layout`
                      : `/equipment/${selection.item.equipment_id}`
                  )
                }
              >
                <ExternalLink className="h-4 w-4" />
                {selection.kind === 'area' ? 'Abrir subárea' : 'Ver equipo'}
              </Button>
              {canEdit && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 justify-center"
                    onClick={() => {
                      setDrawMode(false);
                      setEditMode(true);
                    }}
                  >
                    <PenTool className="h-4 w-4" />
                    {selectedZoneCount > 1 ? `Editar puntos de la zona ${selection.kind === 'area' ? selection.zoneIndex + 1 : ''}` : 'Editar puntos'}
                  </Button>
                  {selection.kind === 'area' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 justify-center"
                      onClick={() => {
                        setEditMode(false);
                        setAddingZone(true);
                        setDrawMode(true);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Agregar otra zona
                    </Button>
                  )}
                  {selection.kind === 'area' && selectedZoneCount > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 justify-center border-red-300 text-red-700 hover:bg-red-50"
                      onClick={handleDeleteZone}
                      disabled={zoneMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar zona {selection.zoneIndex + 1}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className="w-full gap-2 justify-center bg-red-600 hover:bg-red-700"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                    Quitar del layout
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Sub-areas */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Subáreas ({subAreas.length})</h4>
            {subAreas.length === 0 ? (
              <div className="text-center py-4">
                <Square className="mx-auto h-6 w-6 text-gray-300" />
                <p className="text-xs text-gray-500 mt-1">Sin subáreas dibujadas</p>
              </div>
            ) : (
              <div className="space-y-1">
                {subAreas.map((rep) => (
                  <button
                    key={rep.id}
                    {...rowHover(rep.id)}
                    onClick={() => !isBusy && setSelection({ kind: 'area', item: rep, zoneIndex: 0 })}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm transition-colors ${
                      selection?.kind === 'area' && selection.item.id === rep.id
                        ? 'bg-blue-50 text-blue-900'
                        : hovered?.id === rep.id
                        ? 'bg-gray-100 text-gray-900'
                        : 'hover:bg-gray-50 text-gray-800'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded flex-shrink-0"
                      style={{
                        backgroundColor: rep.display_color || rep.organizational_area?.color || '#3B82F6',
                      }}
                    />
                    <span className="truncate">{rep.display_name || rep.organizational_area?.name}</span>
                    {zonesOf(rep.geometry).length > 1 && (
                      <span className="ml-auto flex-shrink-0 text-xs text-gray-500">{zonesOf(rep.geometry).length} zonas</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Equipment */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Equipos colocados ({footprints.length})</h4>
            {footprints.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-2">Ningún equipo dibujado</p>
            ) : (
              <div className="space-y-1">
                {footprints.map((fp) => (
                  <button
                    key={fp.id}
                    {...rowHover(fp.id)}
                    onClick={() => !isBusy && setSelection({ kind: 'equipment', item: fp })}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm transition-colors ${
                      selection?.kind === 'equipment' && selection.item.id === fp.id
                        ? 'bg-blue-50 text-blue-900'
                        : hovered?.id === fp.id
                        ? 'bg-gray-100 text-gray-900'
                        : 'hover:bg-gray-50 text-gray-800'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: fp.equipment_status
                          ? EQUIPMENT_STATUS_COLORS[fp.equipment_status]
                          : '#94A3B8',
                      }}
                      title={fp.equipment_status && EQUIPMENT_STATUS_LABELS[fp.equipment_status]}
                    />
                    <span className="font-mono text-xs text-gray-500">{fp.equipment_code}</span>
                    <span className="truncate">{fp.equipment_name}</span>
                    {fp.equipment_status && fp.equipment_status !== 'active' && (
                      <span
                        className="ml-auto text-[10px] font-medium whitespace-nowrap"
                        style={{ color: EQUIPMENT_STATUS_COLORS[fp.equipment_status] }}
                      >
                        {EQUIPMENT_STATUS_LABELS[fp.equipment_status]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {unplacedEquipment.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Por colocar ({unplacedEquipment.length})
                </h4>
                <div className="space-y-1">
                  {unplacedEquipment.map((a) => (
                    <div key={a.equipment_id} className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600">
                      <MapPin className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                      <span className="font-mono text-xs text-gray-500">{a.equipment_code}</span>
                      <span className="truncate">{a.equipment_name}</span>
                    </div>
                  ))}
                </div>
                {canEdit && (
                  <p className="text-xs text-gray-500 mt-2">
                    Usa "Dibujar" y elige "Equipo" para marcar el espacio que ocupa.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* After drawing: choose what the shape is */}
      <Modal
        isOpen={drawnKind === 'choose'}
        onClose={closeDrawnFlow}
        title="¿Qué dibujaste?"
        size="sm"
      >
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setDrawnKind('area')}
            className="flex flex-col items-center gap-2 rounded-lg border-2 border-gray-200 p-4 hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <Square className="h-8 w-8 text-blue-600" />
            <span className="text-sm font-medium text-gray-900">Subárea</span>
          </button>
          <button
            onClick={() => setDrawnKind('equipment')}
            className="flex flex-col items-center gap-2 rounded-lg border-2 border-gray-200 p-4 hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <Wrench className="h-8 w-8 text-slate-700" />
            <span className="text-sm font-medium text-gray-900">Equipo</span>
          </button>
        </div>
      </Modal>

      {drawnCoordinates && drawnKind === 'area' && (
        <LinkAreaModal
          isOpen
          onClose={closeDrawnFlow}
          organizationId={area.organization_id}
          plantId={area.plant_id}
          layoutId={layout.id}
          floorLevel={layout.floor_level}
          coordinates={drawnCoordinates}
          parentArea={{ id: areaId, name: area.name }}
        />
      )}

      {drawnCoordinates && drawnKind === 'equipment' && (
        <PlaceEquipmentModal
          isOpen
          onClose={closeDrawnFlow}
          layoutId={layout.id}
          coordinates={drawnCoordinates}
          unplacedEquipment={unplacedEquipment}
        />
      )}

      {backgroundModal}
    </div>
  );
};

export default AreaLayoutTab;

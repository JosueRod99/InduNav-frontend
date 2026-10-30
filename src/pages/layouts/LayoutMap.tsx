import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapContainer, ImageOverlay, Polygon, Polyline, Rectangle, Tooltip, useMap } from 'react-leaflet';
import { Check, Crosshair, Maximize, Minimize, RotateCcw, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import type { AreaPhysicalRepresentation, GeoJSONPolygon } from '../../api/areaRepresentations';
import Button from '../../components/ui/Button';
import { zonesOf } from '../../utils/areaGeometry';
import {
  EQUIPMENT_STATUS_COLORS,
  EQUIPMENT_STATUS_LABELS,
  type EquipmentStatus,
} from '../../api/equipment';

// Any polygon that can be edited point by point (one zone of an area, or an equipment footprint)
export interface EditableShape {
  id: string;
  geometry: GeoJSONPolygon;
  zoneIndex?: number; // zone of the area being edited (areas can have several zones)
  color?: string;
  name?: string;
}

// Equipment footprint drawn on an area internal layout
export interface MapFootprint {
  id: string;
  geometry: GeoJSONPolygon;
  label: string;
  color?: string | null;
  status?: EquipmentStatus;
}

// Border dash per status so the state is readable without relying only on color
const STATUS_DASH: Partial<Record<EquipmentStatus, string>> = {
  maintenance: '6 4',
  out_of_service: '2 4',
};

interface LayoutMapProps {
  imageUrl: string | null;
  imageBounds?: L.LatLngBoundsExpression; // defaults to the full 0–1000 canvas
  outlines?: number[][][] | null; // boundary of each zone of the parent area, GeoJSON [x, y]
  outline?: number[][] | null; // single boundary (the demo tour still passes this)
  areas: AreaPhysicalRepresentation[];
  onAreaClick?: (area: AreaPhysicalRepresentation, zoneIndex: number) => void;
  selectedAreaId?: string | null;
  selectedZoneIndex?: number | null; // zone of the selected area to outline thicker (areas with several zones)
  footprints?: MapFootprint[];
  onFootprintClick?: (footprint: MapFootprint) => void;
  selectedFootprintId?: string | null;
  colorByStatus?: boolean; // fill footprints by equipment status instead of their own color
  statusLabels?: Record<EquipmentStatus, string>; // legend texts (defaults to Spanish labels)
  showAreaLabels?: boolean; // name label on each area
  numberZones?: boolean; // areas with several zones: "Logística · zona 2" on each zone (editors)
  mapControls?: boolean; // "fit view" and full screen buttons
  // 'permanent': labels always visible. 'hover': only on hover, or when the shape is
  // highlighted/selected (touch screens have no hover)
  labelMode?: 'permanent' | 'hover';
  highlightedId?: string | null; // area or footprint highlighted from outside (e.g. a side list)
  onShapeHover?: (id: string | null) => void;
  scrollWheelZoom?: boolean; // disable inside scrollable pages (public tour)
  route?: number[][] | null; // dashed path through points, GeoJSON [x, y] (e.g. tour stop order)
  drawMode?: boolean;
  drawTitle?: string;
  editMode?: boolean;
  editingArea?: EditableShape | null;
  onAreaDrawn?: (coordinates: number[][]) => void;
  onAreaEdited?: (coordinates: number[][]) => void;
}

const CANVAS_BOUNDS: L.LatLngBoundsExpression = [[0, 0], [1000, 1000]];
const GRID_LINES = Array.from({ length: 11 }, (_, i) => i * 100);
const DEFAULT_FOOTPRINT_COLOR = '#334155';
// Large ring around the canvas; with the area outline as a hole it masks the outside
const OUTSIDE_MASK_RING: L.LatLngExpression[] = [[-5000, -5000], [-5000, 6000], [6000, 6000], [6000, -5000]];

const toLeaflet = (coords: number[][]) => coords.map((c) => [c[1], c[0]] as L.LatLngExpression);

// Part of a shape's React key: Leaflet does not move a permanent tooltip when the polygon's points
// change, so a reshaped polygon is mounted again and its name label lands on the new position
const shapeKey = (ring: number[][]) => `${ring.length}:${ring.reduce((sum, [x, y]) => sum + x * 3 + y, 0).toFixed(2)}`;

// Component to fit the map to the layout canvas
function MapBoundsHandler() {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(L.latLngBounds(CANVAS_BOUNDS as L.LatLngBoundsLiteral), { padding: [8, 8] });
  }, [map]);

  return null;
}

// Enter / Escape / Backspace while drawing or editing points (not while typing in a field)
const useDrawingKeys = (active: boolean, keys: { finish: () => void; cancel: () => void; undo: () => void }) => {
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (e.key === 'Enter') keys.finish();
      else if (e.key === 'Escape') keys.cancel();
      else if (e.key === 'Backspace') {
        e.preventDefault();
        keys.undo();
      } else return;
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
};

const KeysHint = () => (
  <p className="text-[11px] text-gray-500">
    Teclas: <kbd className="rounded border border-gray-300 px-1">Enter</kbd> terminar · <kbd className="rounded border border-gray-300 px-1">Esc</kbd> cancelar ·{' '}
    <kbd className="rounded border border-gray-300 px-1">⌫</kbd> deshacer
  </p>
);

// "Fit view" and full screen, top right of the map
function MapControls({ container, bounds }: { container: React.RefObject<HTMLDivElement>; bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  const [fullscreen, setFullscreen] = useState(false);
  useEffect(() => {
    const onChange = () => {
      setFullscreen(document.fullscreenElement === container.current);
      setTimeout(() => map.invalidateSize(), 50);
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, [map, container]);

  const buttonClass =
    'flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50';
  return (
    <div className="absolute right-3 top-3 z-[1000] flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className={buttonClass}
        title="Ajustar vista"
        aria-label="Ajustar vista"
        onClick={() => map.fitBounds(L.latLngBounds(bounds as L.LatLngBoundsLiteral), { padding: [8, 8] })}
      >
        <Crosshair className="h-4 w-4" />
      </button>
      {document.fullscreenEnabled && (
        <button
          type="button"
          className={buttonClass}
          title={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          aria-label={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          onClick={() => (fullscreen ? document.exitFullscreen() : container.current?.requestFullscreen())}
        >
          {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}

// Component to handle drawing mode with editable points
function DrawingHandler({
  drawMode,
  title = 'Dibujando Área',
  onAreaDrawn,
  onCancel
}: {
  drawMode: boolean;
  title?: string;
  onAreaDrawn?: (coordinates: number[][]) => void;
  onCancel?: () => void;
}) {
  const map = useMap();
  const [points, setPoints] = useState<L.LatLng[]>([]);
  const polygonRef = useRef<L.Polygon | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const isFinishingRef = useRef(false);

  // Clear all markers and polygon
  const clearDrawing = () => {
    markersRef.current.forEach(marker => map.removeLayer(marker));
    markersRef.current = [];
    if (polygonRef.current) {
      map.removeLayer(polygonRef.current);
      polygonRef.current = null;
    }
  };

  // Update polygon display
  const updatePolygon = (pts: L.LatLng[]) => {
    if (polygonRef.current) {
      map.removeLayer(polygonRef.current);
    }

    if (pts.length >= 2) {
      polygonRef.current = L.polygon(pts, {
        color: '#3B82F6',
        fillColor: '#3B82F6',
        fillOpacity: 0.3,
        weight: 2,
      }).addTo(map);
    }
  };

  // Update markers and polygon when points array length changes
  useEffect(() => {
    if (!drawMode) {
      isFinishingRef.current = false;
      clearDrawing();
      setPoints([]);
      return;
    }

    // Clear old markers
    markersRef.current.forEach(marker => map.removeLayer(marker));
    markersRef.current = [];

    // Create new markers
    points.forEach((point, index) => {
      const marker = L.marker(point, {
        draggable: true,
        icon: L.divIcon({
          className: 'draw-point-marker',
          html: `<div style="
            background: #3B82F6;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            cursor: move;
          "><div style="
            position: absolute;
            top: -20px;
            left: 50%;
            transform: translateX(-50%);
            background: #1E40AF;
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
            white-space: nowrap;
          ">${index + 1}</div></div>`,
        }),
      }).addTo(map);

      // Store index in marker for drag handler
      (marker as any)._pointIndex = index;

      // Handle dragging - update polygon in real-time
      marker.on('drag', () => {
        const allLatLngs = markersRef.current.map(m => m.getLatLng());
        if (polygonRef.current && allLatLngs.length >= 2) {
          polygonRef.current.setLatLngs(allLatLngs);
        }
      });

      markersRef.current.push(marker);
    });

    // Update polygon
    updatePolygon(points);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points.length, drawMode, map]);

  // Handle map clicks to add points
  useEffect(() => {
    if (!drawMode) {
      return;
    }

    const handleClick = (e: L.LeafletMouseEvent) => {
      // Don't add points if we're in the process of finishing
      if (isFinishingRef.current) {
        return;
      }

      // Only add point if the click is directly on the map, not on UI elements
      const target = e.originalEvent.target as HTMLElement;

      // Check if click was on a UI element (button, panel, etc)
      if (target.closest('.draw-point-marker') ||
          target.closest('button') ||
          target.closest('.absolute')) {
        return;
      }

      setPoints(prev => [...prev, e.latlng]);
    };

    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
    };
  }, [drawMode, map]);

  // Cleanup on unmount or when draw mode is disabled
  useEffect(() => {
    return () => {
      clearDrawing();
    };
  }, []);

  // Handle finish button
  const handleFinish = () => {
    if (points.length >= 3) {
      // Set flag to prevent more points from being added
      isFinishingRef.current = true;

      const coordinates = points.map(p => [p.lat, p.lng]);

      // Use setTimeout to ensure the flag is set before any click events
      setTimeout(() => {
        onAreaDrawn?.(coordinates);
        setPoints([]);
        clearDrawing();
        isFinishingRef.current = false;
      }, 0);
    }
  };

  // Handle undo last point
  const handleUndo = () => {
    setPoints(prev => prev.slice(0, -1));
  };

  // Handle cancel
  const handleCancel = () => {
    isFinishingRef.current = false;
    setPoints([]);
    clearDrawing();
    onCancel?.();
  };

  useDrawingKeys(drawMode, { finish: handleFinish, cancel: handleCancel, undo: handleUndo });

  // Render control panel
  if (!drawMode) return null;

  return (
    <div
      className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 z-[1000] max-w-sm"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCancel();
          }}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div className="text-xs text-gray-600 space-y-1">
          <p>• <strong>Click</strong> en el mapa para agregar puntos</p>
          <p>• <strong>Arrastra</strong> los puntos para ajustar</p>
          <p>• Mínimo <strong>3 puntos</strong> para crear el área</p>
          <KeysHint />
        </div>

        <div className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded-lg">
          <span className="text-sm font-medium text-blue-900">Puntos: {points.length}</span>
          {points.length >= 3 && (
            <span className="text-xs text-green-600 font-medium">✓ Listo para finalizar</span>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleUndo();
            }}
            disabled={points.length === 0}
            variant="outline"
            size="sm"
            className="flex-1 gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Deshacer
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleFinish();
            }}
            disabled={points.length < 3}
            variant="primary"
            size="sm"
            className="flex-1 gap-1"
          >
            <Check className="h-3 w-3" />
            Finalizar
          </Button>
        </div>
      </div>
    </div>
  );
}

// Component to handle editing mode
function EditingHandler({
  editMode,
  editingArea,
  onAreaEdited,
  onCancel
}: {
  editMode: boolean;
  editingArea: EditableShape | null;
  onAreaEdited?: (coordinates: number[][]) => void;
  onCancel?: () => void;
}) {
  const map = useMap();
  const [points, setPoints] = useState<L.LatLng[]>([]);
  const polygonRef = useRef<L.Polygon | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Load the points once when editing starts (or switches to another shape/zone). Keyed by id and
  // zone, not by the object: callers build a new object on every render, and a background refetch
  // re-rendering them must not wipe the points being edited.
  const editKey = editMode && editingArea ? `${editingArea.id}:${editingArea.zoneIndex ?? 0}` : null;
  useEffect(() => {
    if (!editMode || !editingArea) {
      setPoints([]);
      return;
    }

    // Convert area coordinates to Leaflet format
    if (editingArea.geometry?.coordinates?.[0]) {
      const coords = editingArea.geometry.coordinates[0];
      // Remove the closing point (last point is same as first in GeoJSON)
      const uniqueCoords = coords.slice(0, -1);
      // Convert from GeoJSON [lng, lat] to Leaflet [lat, lng]
      const leafletPoints = uniqueCoords.map(coord => L.latLng(coord[1], coord[0]));
      setPoints(leafletPoints);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editKey]);

  // Clear all markers and polygon
  const clearDrawing = () => {
    markersRef.current.forEach(marker => map.removeLayer(marker));
    markersRef.current = [];
    if (polygonRef.current) {
      map.removeLayer(polygonRef.current);
      polygonRef.current = null;
    }
  };

  // Update polygon display
  const updatePolygon = (pts: L.LatLng[]) => {
    if (polygonRef.current) {
      map.removeLayer(polygonRef.current);
    }

    if (pts.length >= 2) {
      polygonRef.current = L.polygon(pts, {
        color: editingArea?.color || '#3B82F6',
        fillColor: editingArea?.color || '#3B82F6',
        fillOpacity: 0.3,
        weight: 2,
      }).addTo(map);
    }
  };

  // Update markers and polygon when points change
  useEffect(() => {
    if (!editMode) {
      clearDrawing();
      return;
    }

    // Clear old markers
    markersRef.current.forEach(marker => map.removeLayer(marker));
    markersRef.current = [];

    // Create new markers
    points.forEach((point, index) => {
      const marker = L.marker(point, {
        draggable: true,
        icon: L.divIcon({
          className: 'edit-point-marker',
          html: `<div style="
            background: ${editingArea?.color || '#3B82F6'};
            width: 14px;
            height: 14px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            cursor: move;
            position: relative;
          "><div style="
            position: absolute;
            top: -22px;
            left: 50%;
            transform: translateX(-50%);
            background: #1E40AF;
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
            white-space: nowrap;
          ">${index + 1}</div><button style="
            position: absolute;
            top: -22px;
            right: -24px;
            background: #EF4444;
            color: white;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            border: none;
            font-size: 10px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          " class="delete-point-btn" data-index="${index}">×</button></div>`,
        }),
      }).addTo(map);

      // Store index in marker
      (marker as any)._pointIndex = index;

      // Handle dragging - update polygon in real-time
      marker.on('drag', () => {
        const allLatLngs = markersRef.current.map(m => m.getLatLng());
        if (polygonRef.current && allLatLngs.length >= 2) {
          polygonRef.current.setLatLngs(allLatLngs);
        }
      });

      // Handle drag end - update state with new position
      marker.on('dragend', () => {
        const allLatLngs = markersRef.current.map(m => m.getLatLng());
        setPoints(allLatLngs);
      });

      markersRef.current.push(marker);
    });

    // Update polygon
    updatePolygon(points);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points.length, editMode, map]);

  // Handle map clicks to add new points
  useEffect(() => {
    if (!editMode) {
      return;
    }

    const handleClick = (e: L.LeafletMouseEvent) => {
      // Only add point if the click is directly on the map, not on UI elements
      const target = e.originalEvent.target as HTMLElement;

      // Check if click was on a UI element (button, panel, marker, etc)
      if (target.closest('.edit-point-marker') ||
          target.closest('button') ||
          target.closest('.absolute')) {
        return;
      }

      // Add new point at clicked location
      setPoints(prev => [...prev, e.latlng]);
    };

    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
    };
  }, [editMode, map]);

  // Handle delete point button clicks
  useEffect(() => {
    if (!editMode) return;

    const handleDeleteClick = (e: any) => {
      const btn = e.target.closest('.delete-point-btn');
      if (btn) {
        e.stopPropagation();
        const index = parseInt(btn.getAttribute('data-index'));
        setPoints(prev => prev.filter((_, i) => i !== index));
      }
    };

    document.addEventListener('click', handleDeleteClick);
    return () => document.removeEventListener('click', handleDeleteClick);
  }, [editMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearDrawing();
    };
  }, []);

  // Handle finish button
  const handleFinish = () => {
    if (points.length >= 3) {
      const coordinates = points.map(p => [p.lat, p.lng]);

      setTimeout(() => {
        onAreaEdited?.(coordinates);
        setPoints([]);
        clearDrawing();
      }, 0);
    }
  };

  // Handle undo last point
  const handleUndo = () => {
    setPoints(prev => prev.slice(0, -1));
  };

  // Handle cancel
  const handleCancel = () => {
    setPoints([]);
    clearDrawing();
    onCancel?.();
  };

  useDrawingKeys(editMode, { finish: handleFinish, cancel: handleCancel, undo: handleUndo });

  // Render control panel
  if (!editMode) return null;

  return (
    <div
      className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 z-[1000] max-w-sm"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Editando: {editingArea?.name || 'Sin nombre'}</h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCancel();
          }}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div className="text-xs text-gray-600 space-y-1">
          <p>• <strong>Click</strong> en el mapa para agregar puntos</p>
          <p>• <strong>Arrastra</strong> los puntos para ajustar</p>
          <p>• <strong>Click en ×</strong> para eliminar un punto</p>
          <p>• Mínimo <strong>3 puntos</strong> requeridos</p>
          <KeysHint />
        </div>

        <div className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded-lg">
          <span className="text-sm font-medium text-blue-900">Puntos: {points.length}</span>
          {points.length >= 3 && (
            <span className="text-xs text-green-600 font-medium">✓ Listo para guardar</span>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleUndo();
            }}
            disabled={points.length === 0}
            variant="outline"
            size="sm"
            className="flex-1 gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Deshacer
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleFinish();
            }}
            disabled={points.length < 3}
            variant="primary"
            size="sm"
            className="flex-1 gap-1"
          >
            <Check className="h-3 w-3" />
            Guardar
          </Button>
        </div>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            handleCancel();
          }}
          variant="outline"
          size="sm"
          className="w-full"
        >
          Cancelar Edición
        </Button>
      </div>
    </div>
  );
}

interface ExtendedLayoutMapProps extends LayoutMapProps {
  onCancelDraw?: () => void;
  onCancelEdit?: () => void;
}

const LayoutMap = ({
  imageUrl,
  imageBounds = CANVAS_BOUNDS,
  outlines,
  outline,
  areas,
  onAreaClick,
  selectedAreaId,
  selectedZoneIndex = null,
  footprints = [],
  onFootprintClick,
  selectedFootprintId,
  colorByStatus = false,
  statusLabels = EQUIPMENT_STATUS_LABELS,
  showAreaLabels = false,
  numberZones = false,
  mapControls = false,
  labelMode = 'permanent',
  highlightedId = null,
  onShapeHover,
  scrollWheelZoom = true,
  route = null,
  drawMode,
  drawTitle,
  editMode,
  editingArea,
  onAreaDrawn,
  onAreaEdited,
  onCancelDraw,
  onCancelEdit
}: ExtendedLayoutMapProps) => {
  const parentZones = (outlines || (outline ? [outline] : [])).filter((ring) => ring.length >= 3);
  const isEditing = (id: string, zoneIndex = 0) =>
    editMode && editingArea?.id === id && (editingArea.zoneIndex ?? 0) === zoneIndex;
  const hoverHandlers = (id: string) =>
    onShapeHover
      ? { mouseover: () => onShapeHover(id), mouseout: () => onShapeHover(null) }
      : {};

  const statusCounts = footprints.reduce<Partial<Record<EquipmentStatus, number>>>((acc, fp) => {
    if (fp.status) acc[fp.status] = (acc[fp.status] || 0) + 1;
    return acc;
  }, {});

  const wrapperRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={wrapperRef} className="relative w-full h-full bg-white">
      <MapContainer
        center={[500, 500]}
        zoom={0}
        minZoom={-2}
        maxZoom={3}
        // Fractional zoom so the canvas fills the container instead of snapping to a smaller level
        zoomSnap={0.1}
        zoomDelta={0.5}
        crs={L.CRS.Simple}
        className="w-full h-full"
        zoomControl={true}
        attributionControl={false}
        scrollWheelZoom={scrollWheelZoom}
      >
        <MapBoundsHandler />
        {mapControls && <MapControls container={wrapperRef} bounds={CANVAS_BOUNDS} />}
        <DrawingHandler
          drawMode={drawMode || false}
          title={drawTitle}
          onAreaDrawn={onAreaDrawn}
          onCancel={onCancelDraw}
        />
        <EditingHandler
          editMode={editMode || false}
          editingArea={editingArea || null}
          onAreaEdited={onAreaEdited}
          onCancel={onCancelEdit}
        />

        {imageUrl ? (
          <ImageOverlay url={imageUrl} bounds={imageBounds} />
        ) : (
          <>
            {/* Blank canvas with a reference grid */}
            <Rectangle
              bounds={CANVAS_BOUNDS}
              pathOptions={{ color: '#E5E7EB', weight: 1, fillColor: '#FFFFFF', fillOpacity: 1 }}
              interactive={false}
            />
            {GRID_LINES.map((v) => (
              <Polyline
                key={`h${v}`}
                positions={[[v, 0], [v, 1000]]}
                pathOptions={{ color: '#F1F5F9', weight: 1 }}
                interactive={false}
              />
            ))}
            {GRID_LINES.map((v) => (
              <Polyline
                key={`v${v}`}
                positions={[[0, v], [1000, v]]}
                pathOptions={{ color: '#F1F5F9', weight: 1 }}
                interactive={false}
              />
            ))}
          </>
        )}

        {/* Dim everything outside the parent area (every zone is a hole) so the view focuses on it */}
        {parentZones.length > 0 && (
          <Polygon
            positions={[OUTSIDE_MASK_RING, ...parentZones.map(toLeaflet)]}
            pathOptions={{ stroke: false, fillColor: '#F8FAFC', fillOpacity: 0.7 }}
            interactive={false}
          />
        )}

        {/* Boundary of each zone of the parent area (area internal layouts) */}
        {parentZones.map((ring, i) => (
          <Polygon
            key={`outline-${i}`}
            positions={toLeaflet(ring)}
            pathOptions={{ color: '#1E3A8A', weight: 3, dashArray: '8 6', fill: false }}
            interactive={false}
          />
        ))}

        {/* Every zone of an area is drawn with the area's color and its own name label */}
        {areas.flatMap((area) => {
          const zones = zonesOf(area.geometry);
          return zones.map((ring, zoneIndex) => {
            // Don't render the zone being edited (EditingHandler handles it)
            if (isEditing(area.id, zoneIndex)) return null;

            // Get color from display_color, or fall back to organizational area color
            const areaColor = area.display_color || area.organizational_area?.color || '#3B82F6';
            const isHighlighted = highlightedId === area.id;
            const isActive = selectedAreaId === area.id || isHighlighted;
            const isSelectedZone = selectedAreaId === area.id && selectedZoneIndex === zoneIndex;
            const labelPermanent = labelMode === 'permanent' || isActive;

            return (
              <Polygon
                key={`${area.id}-${zoneIndex}-${shapeKey(ring)}`}
                positions={toLeaflet(ring)}
                pathOptions={{
                  color: areaColor,
                  fillColor: areaColor,
                  fillOpacity: isActive ? 0.6 : 0.3,
                  weight: isHighlighted || isSelectedZone ? 4 : isActive ? 3 : 2,
                }}
                eventHandlers={{
                  click: () => onAreaClick?.(area, zoneIndex),
                  ...hoverHandlers(area.id),
                }}
              >
                {showAreaLabels && (
                  // key forces a remount: Leaflet does not toggle `permanent` on an existing tooltip
                  <Tooltip
                    key={labelPermanent ? 'permanent' : 'hover'}
                    permanent={labelPermanent}
                    direction="center"
                    className="area-name-label"
                  >
                    {area.display_name || area.organizational_area?.name}
                    {numberZones && zones.length > 1 && <span className="font-normal opacity-75"> · zona {zoneIndex + 1}</span>}
                  </Tooltip>
                )}
              </Polygon>
            );
          });
        })}

        {/* Route through the areas (tour order) */}
        {route && route.length >= 2 && (
          <Polyline
            positions={toLeaflet(route)}
            pathOptions={{ color: '#1D4ED8', weight: 3, dashArray: '6 8', lineCap: 'round' }}
            interactive={false}
          />
        )}

        {/* Equipment footprints: dark solid border + label, drawn above areas */}
        {footprints.map((fp) => {
          if (!fp.geometry?.coordinates?.[0] || isEditing(fp.id)) return null;
          const statusColor = fp.status ? EQUIPMENT_STATUS_COLORS[fp.status] : undefined;
          const color = (colorByStatus && statusColor) || fp.color || DEFAULT_FOOTPRINT_COLOR;
          const isSelected = selectedFootprintId === fp.id;
          const isHighlighted = highlightedId === fp.id;
          const labelPermanent = labelMode === 'permanent' || isSelected || isHighlighted;

          return (
            <Polygon
              key={`${fp.id}-${shapeKey(fp.geometry.coordinates[0])}`}
              positions={toLeaflet(fp.geometry.coordinates[0])}
              pathOptions={{
                color: isSelected ? '#F59E0B' : isHighlighted ? '#2563EB' : '#0F172A',
                fillColor: color,
                fillOpacity: isSelected || isHighlighted ? 0.85 : 0.65,
                weight: isSelected || isHighlighted ? 3 : 2,
                dashArray: colorByStatus && fp.status ? STATUS_DASH[fp.status] : undefined,
              }}
              eventHandlers={{
                click: () => onFootprintClick?.(fp),
                ...hoverHandlers(fp.id),
              }}
            >
              <Tooltip
                key={labelPermanent ? 'permanent' : 'hover'}
                permanent={labelPermanent}
                direction="center"
                className={`equipment-footprint-label ${
                  colorByStatus && fp.status ? `status-${fp.status}` : ''
                }`}
              >
                {fp.label}
              </Tooltip>
            </Polygon>
          );
        })}
      </MapContainer>

      {/* Status legend */}
      {colorByStatus && footprints.length > 0 && !drawMode && !editMode && (
        <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 rounded-lg shadow-md border border-gray-200 px-3 py-2 space-y-1">
          {(Object.keys(EQUIPMENT_STATUS_COLORS) as EquipmentStatus[])
            .filter((status) => statusCounts[status])
            .map((status) => (
              <div key={status} className="flex items-center gap-2 text-xs text-gray-700">
                <span
                  className="w-3 h-3 rounded-sm border border-slate-900/40"
                  style={{ backgroundColor: EQUIPMENT_STATUS_COLORS[status] }}
                />
                <span>{statusLabels[status]}</span>
                <span className="ml-auto pl-2 font-semibold text-gray-900">{statusCounts[status]}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default LayoutMap;

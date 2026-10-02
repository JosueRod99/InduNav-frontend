import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapContainer, ImageOverlay, Polygon, useMap } from 'react-leaflet';
import { Check, RotateCcw, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import type { AreaPhysicalRepresentation } from '../../api/areaRepresentations';
import Button from '../../components/ui/Button';

interface LayoutMapProps {
  imageUrl: string | null;
  areas: AreaPhysicalRepresentation[];
  onAreaClick?: (area: AreaPhysicalRepresentation) => void;
  selectedAreaId?: string | null;
  drawMode?: boolean;
  editMode?: boolean;
  editingArea?: AreaPhysicalRepresentation | null;
  onAreaDrawn?: (coordinates: number[][]) => void;
  onAreaEdited?: (coordinates: number[][]) => void;
}

// Component to handle map bounds based on image
function MapBoundsHandler({ imageUrl }: { imageUrl: string | null }) {
  const map = useMap();

  useEffect(() => {
    if (imageUrl) {
      // Set default bounds for the map
      const bounds = L.latLngBounds([[0, 0], [1000, 1000]]);
      map.fitBounds(bounds);
    }
  }, [imageUrl, map]);

  return null;
}

// Component to handle drawing mode with editable points
function DrawingHandler({
  drawMode,
  onAreaDrawn,
  onCancel
}: {
  drawMode: boolean;
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

      // Debug: Log coordinates being sent
      console.log('🎨 Drawing finished with points:', {
        pointsCount: points.length,
        coordinates: coordinates,
        firstPoint: coordinates[0],
        lastPoint: coordinates[coordinates.length - 1],
      });

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

  // Render control panel
  if (!drawMode) return null;

  return (
    <div
      className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 z-[1000] max-w-sm"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Dibujando Área</h3>
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
  editingArea: AreaPhysicalRepresentation | null;
  onAreaEdited?: (coordinates: number[][]) => void;
  onCancel?: () => void;
}) {
  const map = useMap();
  const [points, setPoints] = useState<L.LatLng[]>([]);
  const polygonRef = useRef<L.Polygon | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Load points from editing area
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
  }, [editMode, editingArea]);

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
      console.log('✏️ Editing finished with points:', {
        pointsCount: points.length,
        coordinates: coordinates,
      });

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

  // Render control panel
  if (!editMode) return null;

  return (
    <div
      className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 z-[1000] max-w-sm"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Editando Área: {editingArea?.name}</h3>
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
  areas,
  onAreaClick,
  selectedAreaId,
  drawMode,
  editMode,
  editingArea,
  onAreaDrawn,
  onAreaEdited,
  onCancelDraw,
  onCancelEdit
}: ExtendedLayoutMapProps) => {
  const bounds: L.LatLngBoundsExpression = [[0, 0], [1000, 1000]];

  // Debug: Log areas when they change
  useEffect(() => {
    if (areas.length > 0) {
      console.log('📍 Areas loaded from DB:', areas.map(area => ({
        name: area.organizational_area?.name || area.display_name,
        geometryType: area.geometry?.type,
        coordinatesCount: area.geometry?.coordinates?.[0]?.length,
        firstCoord: area.geometry?.coordinates?.[0]?.[0],
        lastCoord: area.geometry?.coordinates?.[0]?.[area.geometry?.coordinates?.[0]?.length - 1],
      })));
    }
  }, [areas]);

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[500, 500]}
        zoom={0}
        minZoom={-2}
        maxZoom={2}
        crs={L.CRS.Simple}
        className="w-full h-full"
        zoomControl={true}
        attributionControl={false}
      >
        <MapBoundsHandler imageUrl={imageUrl} />
        <DrawingHandler
          drawMode={drawMode || false}
          onAreaDrawn={onAreaDrawn}
          onCancel={onCancelDraw}
        />
        <EditingHandler
          editMode={editMode || false}
          editingArea={editingArea || null}
          onAreaEdited={onAreaEdited}
          onCancel={onCancelEdit}
        />

        {imageUrl && (
          <ImageOverlay
            url={imageUrl}
            bounds={bounds}
          />
        )}

        {areas.map((area) => {
          if (!area.geometry?.coordinates?.[0]) return null;

          // Don't render the area being edited (EditingHandler handles it)
          if (editMode && editingArea && area.id === editingArea.id) {
            return null;
          }

          // Log original coordinates from DB
          const dbCoords = area.geometry.coordinates[0];

          // Convert from GeoJSON [lng, lat] to Leaflet [lat, lng]
          const coordinates = dbCoords.map((coord: number[]) =>
            [coord[1], coord[0]] as L.LatLngExpression
          );

          // Debug log for comparison
          const areaName = area.organizational_area?.name || area.display_name;
          if (areaName === 'test2') {
            console.log('🔍 Converting test2 area:', {
              dbFormat: 'GeoJSON [lng, lat]',
              leafletFormat: 'Leaflet [lat, lng]',
              allPointsDB: dbCoords,
              allPointsLeaflet: coordinates,
            });
          }

          // Get color from display_color, or fall back to organizational area color
          const areaColor = area.display_color || area.organizational_area?.color || '#3B82F6';

          return (
            <Polygon
              key={area.id}
              positions={coordinates}
              pathOptions={{
                color: areaColor,
                fillColor: areaColor,
                fillOpacity: selectedAreaId === area.id ? 0.6 : 0.3,
                weight: selectedAreaId === area.id ? 3 : 2,
              }}
              eventHandlers={{
                click: () => onAreaClick?.(area),
              }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
};

export default LayoutMap;

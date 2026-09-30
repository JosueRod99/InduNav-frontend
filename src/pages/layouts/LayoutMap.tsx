import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapContainer, ImageOverlay, Polygon, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { PlantArea } from '../../api/layouts';

interface LayoutMapProps {
  imageUrl: string | null;
  areas: PlantArea[];
  onAreaClick?: (area: PlantArea) => void;
  selectedAreaId?: string | null;
  drawMode?: boolean;
  onAreaDrawn?: (coordinates: number[][]) => void;
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

// Component to handle drawing mode
function DrawingHandler({ drawMode, onAreaDrawn }: { drawMode: boolean; onAreaDrawn?: (coordinates: number[][]) => void }) {
  const map = useMap();
  const [points, setPoints] = useState<L.LatLng[]>([]);
  const polygonRef = useRef<L.Polygon | null>(null);

  useEffect(() => {
    if (!drawMode) {
      setPoints([]);
      if (polygonRef.current) {
        map.removeLayer(polygonRef.current);
        polygonRef.current = null;
      }
      return;
    }

    const handleClick = (e: L.LeafletMouseEvent) => {
      if (!drawMode) return;

      const newPoints = [...points, e.latlng];
      setPoints(newPoints);

      if (polygonRef.current) {
        map.removeLayer(polygonRef.current);
      }

      if (newPoints.length >= 2) {
        polygonRef.current = L.polygon(newPoints, {
          color: '#3B82F6',
          fillColor: '#3B82F6',
          fillOpacity: 0.3,
        }).addTo(map);
      }

      if (newPoints.length >= 3) {
        L.marker(newPoints[0], {
          icon: L.divIcon({
            className: 'finish-marker',
            html: '<div style="background: #3B82F6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
          }),
        }).addTo(map);
      }
    };

    const handleDblClick = (e: L.LeafletMouseEvent) => {
      if (!drawMode || points.length < 3) return;

      L.DomEvent.stop(e);

      const coordinates = points.map(p => [p.lat, p.lng]);
      onAreaDrawn?.(coordinates);

      setPoints([]);
      if (polygonRef.current) {
        map.removeLayer(polygonRef.current);
        polygonRef.current = null;
      }
    };

    map.on('click', handleClick);
    map.on('dblclick', handleDblClick);

    return () => {
      map.off('click', handleClick);
      map.off('dblclick', handleDblClick);
    };
  }, [drawMode, points, map, onAreaDrawn]);

  return null;
}

const LayoutMap = ({ imageUrl, areas, onAreaClick, selectedAreaId, drawMode, onAreaDrawn }: LayoutMapProps) => {
  const bounds: L.LatLngBoundsExpression = [[0, 0], [1000, 1000]];

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
        <DrawingHandler drawMode={drawMode || false} onAreaDrawn={onAreaDrawn} />

        {imageUrl && (
          <ImageOverlay
            url={imageUrl}
            bounds={bounds}
          />
        )}

        {areas.map((area) => {
          if (!area.geometry?.coordinates?.[0]) return null;

          const coordinates = area.geometry.coordinates[0].map((coord: number[]) =>
            [coord[1], coord[0]] as L.LatLngExpression
          );

          return (
            <Polygon
              key={area.id}
              positions={coordinates}
              pathOptions={{
                color: area.color || '#3B82F6',
                fillColor: area.color || '#3B82F6',
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

      {drawMode && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 z-[1000]">
          <p className="text-sm font-medium text-gray-900 mb-2">Modo Dibujo Activado</p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Click para agregar puntos</li>
            <li>• Doble click para finalizar</li>
            <li>• Mínimo 3 puntos</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default LayoutMap;

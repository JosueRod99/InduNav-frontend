import type { GeoJSONPolygon } from '../api/areaRepresentations';

// Todos los layouts usan el mismo lienzo de Leaflet (CRS.Simple) de 0 a 1000
export const LAYOUT_SIZE = 1000;

// Margen alrededor del contorno del área al recortar el plano de planta
const CROP_PADDING = 0.08;

export interface PlantCrop {
  x: number; // esquina inferior-izquierda del recorte en coordenadas de la planta
  y: number;
  scale: number; // unidades del área por unidad de la planta
}

/**
 * layout_data de un layout interno.
 * source=plant_crop: el fondo es el plano de la planta recortado al contorno del área.
 * source=image: el fondo es una imagen propia (layout_image_url).
 * source=blank: sin imagen, solo cuadrícula y contorno.
 */
export interface AreaLayoutData {
  source: 'plant_crop' | 'image' | 'blank';
  plant_layout_id?: string;
  plant_image_url?: string | null;
  crop?: PlantCrop;
  outline?: number[][]; // contorno del área en coordenadas del layout interno, GeoJSON [x, y]
}

/**
 * Calcula el recorte cuadrado que encierra el contorno del área en la planta,
 * y el contorno transformado al lienzo del layout interno.
 */
export const computePlantCrop = (plantGeometry: GeoJSONPolygon) => {
  const ring = plantGeometry.coordinates[0];
  const xs = ring.map((c) => c[0]);
  const ys = ring.map((c) => c[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const size = Math.max(maxX - minX, maxY - minY, 1) * (1 + CROP_PADDING * 2);
  const crop: PlantCrop = {
    x: (minX + maxX) / 2 - size / 2,
    y: (minY + maxY) / 2 - size / 2,
    scale: LAYOUT_SIZE / size,
  };

  const outline = ring.map(([x, y]) => [(x - crop.x) * crop.scale, (y - crop.y) * crop.scale]);

  return { crop, outline };
};

/**
 * Bounds de Leaflet ([lat, lng] = [y, x]) donde colocar la imagen completa de la planta
 * para que el recorte quede alineado con el lienzo 0–1000 del área.
 */
export const plantImageBoundsForCrop = (crop: PlantCrop): [[number, number], [number, number]] => [
  [-crop.y * crop.scale, -crop.x * crop.scale],
  [(LAYOUT_SIZE - crop.y) * crop.scale, (LAYOUT_SIZE - crop.x) * crop.scale],
];

/**
 * Contorno por defecto cuando el área no está dibujada en la planta: un recuadro con margen.
 */
export const defaultOutline = (): number[][] => {
  const m = LAYOUT_SIZE * CROP_PADDING;
  const M = LAYOUT_SIZE - m;
  return [
    [m, m],
    [M, m],
    [M, M],
    [m, M],
    [m, m],
  ];
};

import type { AreaGeometry } from '../api/areaRepresentations';
import { zonesBounds, zonesOf } from './areaGeometry';

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
  outlines?: number[][][]; // un contorno por zona (áreas con varias zonas); tiene prioridad sobre outline
}

type LayoutData = Partial<AreaLayoutData> | null | undefined;

/** Contornos guardados del layout interno (los layouts anteriores solo tienen `outline`) */
export const storedOutlines = (data: LayoutData): number[][][] | null =>
  data?.outlines?.length ? data.outlines : data?.outline?.length ? [data.outline] : null;

/** Zonas del área en la planta, llevadas al lienzo del layout interno con su recorte */
export const outlinesForCrop = (plantGeometry: AreaGeometry, crop: PlantCrop): number[][][] =>
  zonesOf(plantGeometry).map((ring) => ring.map(([x, y]) => [(x - crop.x) * crop.scale, (y - crop.y) * crop.scale]));

/**
 * Contornos a mostrar en un layout interno recortado de la planta: se calculan en vivo desde el
 * dibujo actual del área en la planta, así una zona agregada o editada después se ve sin rehacer
 * el recorte. Sin dibujo en la planta se usan los contornos guardados.
 */
export const liveOutlines = (data: LayoutData, plantGeometry: AreaGeometry | null | undefined) =>
  data?.source === 'plant_crop' && data.crop && plantGeometry ? outlinesForCrop(plantGeometry, data.crop) : storedOutlines(data);

/** ¿Alguna zona queda (aunque sea en parte) fuera del lienzo del recorte? */
export const cropMissesZones = (data: LayoutData, plantGeometry: AreaGeometry | null | undefined) => {
  if (data?.source !== 'plant_crop' || !data.crop || !plantGeometry) return false;
  const outside = (v: number) => v < -0.5 || v > LAYOUT_SIZE + 0.5;
  return outlinesForCrop(plantGeometry, data.crop).some((ring) => ring.some(([x, y]) => outside(x) || outside(y)));
};

/**
 * Calcula el recorte cuadrado que encierra todas las zonas del área en la planta,
 * y sus contornos transformados al lienzo del layout interno.
 */
export const computePlantCrop = (plantGeometry: AreaGeometry) => {
  const { minX, maxX, minY, maxY } = zonesBounds(zonesOf(plantGeometry));

  const size = Math.max(maxX - minX, maxY - minY, 1) * (1 + CROP_PADDING * 2);
  const crop: PlantCrop = {
    x: (minX + maxX) / 2 - size / 2,
    y: (minY + maxY) / 2 - size / 2,
    scale: LAYOUT_SIZE / size,
  };

  const outlines = outlinesForCrop(plantGeometry, crop);

  return { crop, outline: outlines[0], outlines };
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

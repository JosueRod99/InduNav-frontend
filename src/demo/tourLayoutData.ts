// Demo layout data for the public tour (/tour/:slug).
// Static so the demo works without backend. Shapes follow the same model as the real system
// (plant layout + area internal layout + equipment footprints), so the viewer can later be fed
// from the API (tours phase 2).
//
// All coordinates are written in the SVG space of /demo/plant-layout.svg (0–1000, y down) and
// converted to the Leaflet/GeoJSON space used by LayoutMap (y up) by `rect()`.

import type { MultiLangText } from './tourData';
import type { EquipmentStatus, EquipmentType } from '../api/equipment';

export const DEMO_PLANT_IMAGE_URL = '/demo/plant-layout.svg';

export interface DemoShape {
  id: string;
  name: MultiLangText;
  polygon: number[][]; // GeoJSON ring [x, y], y up, closed
  color?: string;
}

export interface DemoEquipment {
  id: string;
  code: string;
  name: MultiLangText;
  type: EquipmentType;
  status: EquipmentStatus;
  polygon: number[][];
  usedIn: MultiLangText[]; // product + process step where it is used
}

export interface DemoAreaLayout {
  areaId: string; // matches tourData area ids
  plantPolygon: number[][];
  subAreas: DemoShape[];
  equipment: DemoEquipment[];
}

// Rectangle from SVG coords (x1,y1 top-left → x2,y2 bottom-right) to a closed GeoJSON ring (y up)
const rect = (x1: number, y1: number, x2: number, y2: number): number[][] => [
  [x1, 1000 - y1],
  [x2, 1000 - y1],
  [x2, 1000 - y2],
  [x1, 1000 - y2],
  [x1, 1000 - y1],
];

const t = (es: string, en: string): MultiLangText => ({ es, en });

const PRODUCT_A = (step: string, stepEn: string) => t(`Producto A · ${step}`, `Product A · ${stepEn}`);
const PRODUCT_B = (step: string, stepEn: string) => t(`Producto B · ${step}`, `Product B · ${stepEn}`);
const ALL_PRODUCTS = (step: string, stepEn: string) =>
  t(`Producto A y B · ${step}`, `Products A & B · ${stepEn}`);

export const DEMO_AREA_LAYOUTS: DemoAreaLayout[] = [
  {
    areaId: 'recepcion',
    plantPolygon: rect(250, 610, 430, 910),
    subAreas: [
      { id: 'rec-bahias', name: t('Bahías de descarga', 'Unloading bays'), polygon: rect(252, 612, 318, 908), color: '#0EA5E9' },
      { id: 'rec-inspeccion', name: t('Inspección de entrada', 'Incoming inspection'), polygon: rect(324, 612, 428, 720), color: '#8B5CF6' },
      { id: 'rec-temporal', name: t('Almacén temporal', 'Temporary storage'), polygon: rect(324, 726, 428, 908), color: '#F59E0B' },
    ],
    equipment: [
      { id: 'eq-mont-01', code: 'MONT-01', name: t('Montacargas eléctrico 2.5 t', 'Electric forklift 2.5 t'), type: 'vehicle', status: 'active', polygon: rect(266, 650, 304, 690), usedIn: [ALL_PRODUCTS('Recepción de materia prima', 'Raw material receiving')] },
      { id: 'eq-mont-02', code: 'MONT-02', name: t('Montacargas eléctrico 2.5 t', 'Electric forklift 2.5 t'), type: 'vehicle', status: 'maintenance', polygon: rect(266, 800, 304, 840), usedIn: [ALL_PRODUCTS('Recepción de materia prima', 'Raw material receiving')] },
      { id: 'eq-bas-01', code: 'BAS-01', name: t('Báscula de piso 3 t', 'Floor scale 3 t'), type: 'machinery', status: 'active', polygon: rect(340, 630, 390, 670), usedIn: [ALL_PRODUCTS('Inspección de entrada', 'Incoming inspection')] },
      { id: 'eq-rfid-01', code: 'RFID-01', name: t('Portal lector RFID', 'RFID reader gate'), type: 'computer', status: 'active', polygon: rect(396, 680, 420, 712), usedIn: [ALL_PRODUCTS('Registro de lotes', 'Lot registration')] },
    ],
  },
  {
    areaId: 'produccion',
    plantPolygon: rect(250, 70, 630, 550),
    subAreas: [
      { id: 'prod-l1', name: t('Línea 1 · SMT', 'Line 1 · SMT'), polygon: rect(262, 82, 618, 200), color: '#2563EB' },
      { id: 'prod-l2', name: t('Línea 2 · Ensamble', 'Line 2 · Assembly'), polygon: rect(262, 212, 618, 330), color: '#16A34A' },
      { id: 'prod-laser', name: t('Celda de soldadura láser', 'Laser welding cell'), polygon: rect(262, 342, 433, 538), color: '#EA580C' },
      { id: 'prod-pruebas', name: t('Pruebas en línea', 'In-line testing'), polygon: rect(441, 342, 618, 538), color: '#9333EA' },
    ],
    equipment: [
      { id: 'eq-smt-01', code: 'SMT-01', name: t('Colocadora SMT de alta velocidad', 'High-speed SMT placer'), type: 'machinery', status: 'active', polygon: rect(290, 110, 380, 170), usedIn: [PRODUCT_A('Paso 2 · Montaje SMT', 'Step 2 · SMT mounting')] },
      { id: 'eq-smt-02', code: 'SMT-02', name: t('Colocadora SMT de alta velocidad', 'High-speed SMT placer'), type: 'machinery', status: 'maintenance', polygon: rect(395, 110, 485, 170), usedIn: [PRODUCT_B('Paso 2 · Montaje SMT', 'Step 2 · SMT mounting')] },
      { id: 'eq-horno-01', code: 'HRN-01', name: t('Horno de reflujo', 'Reflow oven'), type: 'machinery', status: 'active', polygon: rect(500, 115, 605, 165), usedIn: [PRODUCT_A('Paso 3 · Soldadura por reflujo', 'Step 3 · Reflow soldering'), PRODUCT_B('Paso 3 · Soldadura por reflujo', 'Step 3 · Reflow soldering')] },
      { id: 'eq-cobot-01', code: 'COBOT-01', name: t('Robot colaborativo de ensamble', 'Collaborative assembly robot'), type: 'machinery', status: 'active', polygon: rect(298, 240, 343, 300), usedIn: [PRODUCT_A('Paso 4 · Ensamble final', 'Step 4 · Final assembly')] },
      { id: 'eq-cobot-02', code: 'COBOT-02', name: t('Robot colaborativo de ensamble', 'Collaborative assembly robot'), type: 'machinery', status: 'out_of_service', polygon: rect(380, 240, 425, 300), usedIn: [PRODUCT_B('Paso 4 · Ensamble final', 'Step 4 · Final assembly')] },
      { id: 'eq-atorn-01', code: 'ATR-01', name: t('Atornillador automático', 'Automatic screwdriver'), type: 'tool', status: 'active', polygon: rect(470, 250, 500, 290), usedIn: [ALL_PRODUCTS('Paso 4 · Ensamble final', 'Step 4 · Final assembly')] },
      { id: 'eq-laser-01', code: 'LSR-01', name: t('Soldadora láser de fibra', 'Fiber laser welder'), type: 'machinery', status: 'active', polygon: rect(290, 390, 380, 480), usedIn: [PRODUCT_B('Paso 5 · Sellado láser', 'Step 5 · Laser sealing')] },
      { id: 'eq-aoi-01', code: 'AOI-01', name: t('Inspección óptica automática', 'Automated optical inspection'), type: 'machinery', status: 'active', polygon: rect(462, 380, 530, 440), usedIn: [ALL_PRODUCTS('Paso 6 · Inspección en línea', 'Step 6 · In-line inspection')] },
      { id: 'eq-ict-01', code: 'ICT-01', name: t('Probador en circuito', 'In-circuit tester'), type: 'machinery', status: 'active', polygon: rect(545, 380, 605, 440), usedIn: [ALL_PRODUCTS('Paso 6 · Inspección en línea', 'Step 6 · In-line inspection')] },
    ],
  },
  {
    areaId: 'calidad',
    plantPolygon: rect(470, 610, 630, 910),
    subAreas: [
      { id: 'cal-dim', name: t('Laboratorio dimensional', 'Dimensional lab'), polygon: rect(472, 612, 628, 720), color: '#0891B2' },
      { id: 'cal-func', name: t('Laboratorio funcional', 'Functional lab'), polygon: rect(472, 726, 628, 816), color: '#4F46E5' },
      { id: 'cal-clima', name: t('Cámara climática', 'Climatic chamber'), polygon: rect(472, 822, 628, 908), color: '#DB2777' },
    ],
    equipment: [
      { id: 'eq-cmm-01', code: 'CMM-01', name: t('Máquina de medición por coordenadas', 'Coordinate measuring machine'), type: 'machinery', status: 'active', polygon: rect(492, 632, 572, 692), usedIn: [ALL_PRODUCTS('Paso 7 · Liberación dimensional', 'Step 7 · Dimensional release')] },
      { id: 'eq-calib-01', code: 'CAL-03', name: t('Juego de calibradores digitales', 'Digital caliper set'), type: 'tool', status: 'active', polygon: rect(588, 640, 616, 668), usedIn: [ALL_PRODUCTS('Paso 7 · Liberación dimensional', 'Step 7 · Dimensional release')] },
      { id: 'eq-vib-01', code: 'VIB-01', name: t('Mesa de vibración', 'Vibration table'), type: 'machinery', status: 'active', polygon: rect(492, 744, 562, 800), usedIn: [PRODUCT_A('Paso 8 · Prueba de durabilidad', 'Step 8 · Durability test')] },
      { id: 'eq-clim-01', code: 'CLIM-01', name: t('Cámara de temperatura −40 a 150 °C', 'Temperature chamber −40 to 150 °C'), type: 'machinery', status: 'maintenance', polygon: rect(500, 836, 600, 896), usedIn: [ALL_PRODUCTS('Paso 8 · Prueba climática', 'Step 8 · Climatic test')] },
    ],
  },
  {
    areaId: 'almacen',
    plantPolygon: rect(670, 70, 950, 690),
    subAreas: [
      { id: 'alm-racks', name: t('Racks de alta densidad', 'High-density racks'), polygon: rect(672, 72, 948, 470), color: '#64748B' },
      { id: 'alm-agv', name: t('Pasillo AGV', 'AGV aisle'), polygon: rect(672, 476, 948, 526), color: '#0EA5E9' },
      { id: 'alm-prep', name: t('Preparación de embarques', 'Shipment preparation'), polygon: rect(672, 532, 948, 688), color: '#F59E0B' },
    ],
    equipment: [
      { id: 'eq-agv-01', code: 'AGV-01', name: t('Vehículo de guiado automático', 'Automated guided vehicle'), type: 'vehicle', status: 'active', polygon: rect(700, 488, 740, 516), usedIn: [ALL_PRODUCTS('Almacenaje de producto terminado', 'Finished goods storage')] },
      { id: 'eq-agv-02', code: 'AGV-02', name: t('Vehículo de guiado automático', 'Automated guided vehicle'), type: 'vehicle', status: 'active', polygon: rect(860, 488, 900, 516), usedIn: [ALL_PRODUCTS('Almacenaje de producto terminado', 'Finished goods storage')] },
      { id: 'eq-mont-03', code: 'MONT-03', name: t('Montacargas retráctil', 'Reach truck'), type: 'vehicle', status: 'out_of_service', polygon: rect(700, 610, 740, 650), usedIn: [ALL_PRODUCTS('Preparación de embarque', 'Shipment preparation')] },
      { id: 'eq-wms-01', code: 'WMS-01', name: t('Terminal WMS', 'WMS terminal'), type: 'computer', status: 'active', polygon: rect(900, 600, 930, 630), usedIn: [ALL_PRODUCTS('Preparación de embarque', 'Shipment preparation')] },
    ],
  },
  {
    areaId: 'embarque',
    plantPolygon: rect(670, 710, 950, 910),
    subAreas: [
      { id: 'emb-doc', name: t('Documentación', 'Documentation'), polygon: rect(672, 712, 760, 830), color: '#8B5CF6' },
      { id: 'emb-cons', name: t('Consolidación de carga', 'Load consolidation'), polygon: rect(766, 712, 948, 830), color: '#16A34A' },
      { id: 'emb-andenes', name: t('Andenes de carga', 'Loading docks'), polygon: rect(672, 836, 948, 908), color: '#0EA5E9' },
    ],
    equipment: [
      { id: 'eq-emp-01', code: 'EMP-01', name: t('Emplayadora de pallets', 'Pallet stretch wrapper'), type: 'machinery', status: 'active', polygon: rect(790, 740, 840, 790), usedIn: [ALL_PRODUCTS('Embalaje final', 'Final packing')] },
      { id: 'eq-mont-04', code: 'MONT-04', name: t('Montacargas de combustión 3 t', 'Combustion forklift 3 t'), type: 'vehicle', status: 'active', polygon: rect(870, 850, 910, 890), usedIn: [ALL_PRODUCTS('Carga a transporte', 'Truck loading')] },
      { id: 'eq-imp-01', code: 'IMP-01', name: t('Impresora de etiquetas de embarque', 'Shipping label printer'), type: 'computer', status: 'active', polygon: rect(690, 740, 720, 770), usedIn: [ALL_PRODUCTS('Embalaje final', 'Final packing')] },
    ],
  },
];

export const getDemoAreaLayout = (areaId: string): DemoAreaLayout | undefined =>
  DEMO_AREA_LAYOUTS.find((layout) => layout.areaId === areaId);

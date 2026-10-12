// Enhanced Tour Data with Rich Visual Content
import type { MultiLangText } from './tourData';

export interface AreaEmployee {
  id: string;
  name: string;
  position: MultiLangText;
  photo: string;
  email: string;
  phone: string;
  yearsInCompany: number;
}

export interface AreaMetric {
  label: MultiLangText;
  value: number;
  unit: string;
  target?: number;
  trend: 'up' | 'down' | 'stable';
  color: string;
}

export interface AreaSpecification {
  key: MultiLangText;
  value: string;
  icon?: string;
}

export interface AreaProduct {
  id: string;
  name: string;
  image: string;
  sku: string;
  description: MultiLangText;
  specifications: Record<string, string>;
}

export interface AreaLayout {
  imageUrl: string;
  highlightedZone: {
    x: number; // percentage from left
    y: number; // percentage from top
    width: number; // percentage
    height: number; // percentage
  };
}

export interface EnhancedAreaData {
  areaId: string;
  employees: AreaEmployee[];
  metrics: AreaMetric[];
  specifications: AreaSpecification[];
  products: AreaProduct[];
  layout: AreaLayout;
  chartData: {
    production: { month: string; value: number }[];
    quality: { category: string; percentage: number }[];
  };
}

// Enhanced data for each area
export const ENHANCED_AREA_DATA: Record<string, EnhancedAreaData> = {
  recepcion: {
    areaId: 'recepcion',
    employees: [
      {
        id: '1',
        name: 'María González',
        position: { es: 'Jefa de Recepción', en: 'Reception Manager' },
        photo: 'https://i.pravatar.cc/150?img=1',
        email: 'maria.gonzalez@plantaabc.com',
        phone: '+52 33 1234 5678',
        yearsInCompany: 8,
      },
      {
        id: '2',
        name: 'Carlos Mendoza',
        position: { es: 'Supervisor de Turno A', en: 'Shift A Supervisor' },
        photo: 'https://i.pravatar.cc/150?img=13',
        email: 'carlos.mendoza@plantaabc.com',
        phone: '+52 33 1234 5679',
        yearsInCompany: 5,
      },
      {
        id: '3',
        name: 'Ana López',
        position: { es: 'Inspector de Calidad', en: 'Quality Inspector' },
        photo: 'https://i.pravatar.cc/150?img=5',
        email: 'ana.lopez@plantaabc.com',
        phone: '+52 33 1234 5680',
        yearsInCompany: 3,
      },
    ],
    metrics: [
      {
        label: { es: 'Toneladas Procesadas/Día', en: 'Tons Processed/Day' },
        value: 50,
        unit: 'ton',
        target: 55,
        trend: 'up',
        color: '#3b82f6',
      },
      {
        label: { es: 'Tiempo Promedio Descarga', en: 'Avg Unloading Time' },
        value: 45,
        unit: 'min',
        target: 40,
        trend: 'stable',
        color: '#10b981',
      },
      {
        label: { es: 'Tasa de Rechazo', en: 'Rejection Rate' },
        value: 0.5,
        unit: '%',
        target: 1,
        trend: 'down',
        color: '#ef4444',
      },
      {
        label: { es: 'Precisión de Inventario', en: 'Inventory Accuracy' },
        value: 99.2,
        unit: '%',
        target: 99,
        trend: 'up',
        color: '#8b5cf6',
      },
    ],
    specifications: [
      {
        key: { es: 'Área Total', en: 'Total Area' },
        value: '500 m²',
        icon: '📏',
      },
      {
        key: { es: 'Bahías de Descarga', en: 'Unloading Bays' },
        value: '3',
        icon: '🚚',
      },
      {
        key: { es: 'Capacidad de Almacenamiento', en: 'Storage Capacity' },
        value: '100 toneladas',
        icon: '📦',
      },
      {
        key: { es: 'Horario de Operación', en: 'Operating Hours' },
        value: '24/7',
        icon: '🕐',
      },
      {
        key: { es: 'Personal Total', en: 'Total Staff' },
        value: '15 empleados',
        icon: '👥',
      },
      {
        key: { es: 'Equipos de Montacargas', en: 'Forklift Equipment' },
        value: '8 unidades',
        icon: '🏗️',
      },
    ],
    products: [
      {
        id: 'p1',
        name: 'Materia Prima A',
        image: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=400',
        sku: 'MP-A-001',
        description: {
          es: 'Componentes electrónicos certificados',
          en: 'Certified electronic components',
        },
        specifications: {
          'Peso por pallet': '500 kg',
          'Temperatura de almacenamiento': '15-25°C',
          'Certificación': 'ISO 9001',
        },
      },
      {
        id: 'p2',
        name: 'Componente B',
        image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400',
        sku: 'COMP-B-002',
        description: {
          es: 'Plásticos de ingeniería especiales',
          en: 'Special engineering plastics',
        },
        specifications: {
          'Resistencia térmica': '-40°C a +150°C',
          'Densidad': '1.2 g/cm³',
          'Certificación': 'RoHS',
        },
      },
    ],
    layout: {
      imageUrl: 'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=800',
      highlightedZone: {
        x: 20,
        y: 30,
        width: 35,
        height: 40,
      },
    },
    chartData: {
      production: [
        { month: 'Ene', value: 45 },
        { month: 'Feb', value: 47 },
        { month: 'Mar', value: 48 },
        { month: 'Abr', value: 49 },
        { month: 'May', value: 50 },
        { month: 'Jun', value: 52 },
      ],
      quality: [
        { category: 'Aprobado', percentage: 99.5 },
        { category: 'Rechazado', percentage: 0.5 },
      ],
    },
  },

  produccion: {
    areaId: 'produccion',
    employees: [
      {
        id: '4',
        name: 'Carlos Ramírez',
        position: { es: 'Gerente de Producción', en: 'Production Manager' },
        photo: 'https://i.pravatar.cc/150?img=12',
        email: 'carlos.ramirez@plantaabc.com',
        phone: '+52 33 1234 5681',
        yearsInCompany: 12,
      },
      {
        id: '5',
        name: 'Roberto Silva',
        position: { es: 'Jefe de Línea 1', en: 'Line 1 Supervisor' },
        photo: 'https://i.pravatar.cc/150?img=14',
        email: 'roberto.silva@plantaabc.com',
        phone: '+52 33 1234 5682',
        yearsInCompany: 6,
      },
      {
        id: '6',
        name: 'Patricia Morales',
        position: { es: 'Técnica Especializada', en: 'Specialized Technician' },
        photo: 'https://i.pravatar.cc/150?img=10',
        email: 'patricia.morales@plantaabc.com',
        phone: '+52 33 1234 5683',
        yearsInCompany: 4,
      },
    ],
    metrics: [
      {
        label: { es: 'OEE (Eficiencia General)', en: 'OEE (Overall Efficiency)' },
        value: 87,
        unit: '%',
        target: 92,
        trend: 'up',
        color: '#3b82f6',
      },
      {
        label: { es: 'Unidades/Día', en: 'Units/Day' },
        value: 8500,
        unit: 'units',
        target: 10000,
        trend: 'up',
        color: '#10b981',
      },
      {
        label: { es: 'Tiempo de Ciclo', en: 'Cycle Time' },
        value: 3.2,
        unit: 'min',
        target: 3.0,
        trend: 'down',
        color: '#f59e0b',
      },
      {
        label: { es: 'Tasa de Defectos', en: 'Defect Rate' },
        value: 95,
        unit: 'PPM',
        target: 100,
        trend: 'down',
        color: '#ef4444',
      },
    ],
    specifications: [
      {
        key: { es: 'Área de Producción', en: 'Production Area' },
        value: '3,000 m²',
        icon: '📏',
      },
      {
        key: { es: 'Líneas de Producción', en: 'Production Lines' },
        value: '15',
        icon: '🏭',
      },
      {
        key: { es: 'Robots Colaborativos', en: 'Collaborative Robots' },
        value: '24 cobots',
        icon: '🤖',
      },
      {
        key: { es: 'Temperatura Controlada', en: 'Controlled Temperature' },
        value: '22°C ±2',
        icon: '🌡️',
      },
      {
        key: { es: 'Humedad Controlada', en: 'Controlled Humidity' },
        value: '45% ±5',
        icon: '💧',
      },
      {
        key: { es: 'Operadores por Turno', en: 'Operators per Shift' },
        value: '45',
        icon: '👷',
      },
    ],
    products: [
      {
        id: 'p3',
        name: 'Producto A',
        image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400',
        sku: 'PROD-A-100',
        description: {
          es: 'Componente electrónico de alta precisión',
          en: 'High-precision electronic component',
        },
        specifications: {
          'Dimensiones': '50x30x10 mm',
          'Peso': '25 g',
          'Certificación': 'ISO 9001, IATF 16949',
        },
      },
      {
        id: 'p4',
        name: 'Producto B',
        image: 'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=400',
        sku: 'PROD-B-200',
        description: {
          es: 'Sub-ensamble automotriz',
          en: 'Automotive sub-assembly',
        },
        specifications: {
          'Ciclos de prueba': '100,000',
          'Temperatura operación': '-40°C a +125°C',
          'Vida útil': '10 años',
        },
      },
    ],
    layout: {
      imageUrl: 'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=800',
      highlightedZone: {
        x: 15,
        y: 25,
        width: 60,
        height: 50,
      },
    },
    chartData: {
      production: [
        { month: 'Ene', value: 8000 },
        { month: 'Feb', value: 8200 },
        { month: 'Mar', value: 8300 },
        { month: 'Abr', value: 8400 },
        { month: 'May', value: 8500 },
        { month: 'Jun', value: 8600 },
      ],
      quality: [
        { category: 'Primera Vez', percentage: 98.5 },
        { category: 'Retrabajo', percentage: 1.4 },
        { category: 'Scrap', percentage: 0.1 },
      ],
    },
  },

  // Simplified data for remaining areas (you can expand these similarly)
  calidad: {
    areaId: 'calidad',
    employees: [
      {
        id: '7',
        name: 'Ana Martínez',
        position: { es: 'Directora de Calidad', en: 'Quality Director' },
        photo: 'https://i.pravatar.cc/150?img=5',
        email: 'ana.martinez@plantaabc.com',
        phone: '+52 33 1234 5684',
        yearsInCompany: 10,
      },
    ],
    metrics: [
      {
        label: { es: 'Inspecciones/Día', en: 'Inspections/Day' },
        value: 500,
        unit: 'tests',
        target: 500,
        trend: 'stable',
        color: '#3b82f6',
      },
      {
        label: { es: 'Aprobación Primera Vez', en: 'First-Time Approval' },
        value: 98.5,
        unit: '%',
        target: 98,
        trend: 'up',
        color: '#10b981',
      },
    ],
    specifications: [
      {
        key: { es: 'Área de Laboratorio', en: 'Laboratory Area' },
        value: '800 m²',
        icon: '🔬',
      },
      {
        key: { es: 'Equipos de Medición', en: 'Measurement Equipment' },
        value: '25',
        icon: '📐',
      },
    ],
    products: [],
    layout: {
      imageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800',
      highlightedZone: { x: 30, y: 35, width: 40, height: 30 },
    },
    chartData: {
      production: [
        { month: 'Ene', value: 480 },
        { month: 'Feb', value: 490 },
        { month: 'Mar', value: 495 },
        { month: 'Abr', value: 498 },
        { month: 'May', value: 500 },
        { month: 'Jun', value: 505 },
      ],
      quality: [
        { category: 'Aprobado', percentage: 98.5 },
        { category: 'Rechazado', percentage: 1.5 },
      ],
    },
  },

  almacen: {
    areaId: 'almacen',
    employees: [
      {
        id: '8',
        name: 'Roberto Sánchez',
        position: { es: 'Jefe de Almacén', en: 'Warehouse Manager' },
        photo: 'https://i.pravatar.cc/150?img=8',
        email: 'roberto.sanchez@plantaabc.com',
        phone: '+52 33 1234 5685',
        yearsInCompany: 7,
      },
    ],
    metrics: [
      {
        label: { es: 'Precisión Inventario', en: 'Inventory Accuracy' },
        value: 99.8,
        unit: '%',
        target: 99.5,
        trend: 'up',
        color: '#3b82f6',
      },
      {
        label: { es: 'Rotación Anual', en: 'Annual Turnover' },
        value: 12,
        unit: 'times',
        target: 12,
        trend: 'stable',
        color: '#10b981',
      },
    ],
    specifications: [
      {
        key: { es: 'Capacidad Total', en: 'Total Capacity' },
        value: '50,000 unidades',
        icon: '📦',
      },
      {
        key: { es: 'Posiciones de Almacenaje', en: 'Storage Positions' },
        value: '5,000',
        icon: '🗄️',
      },
    ],
    products: [],
    layout: {
      imageUrl: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800',
      highlightedZone: { x: 10, y: 20, width: 70, height: 60 },
    },
    chartData: {
      production: [
        { month: 'Ene', value: 33000 },
        { month: 'Feb', value: 34000 },
        { month: 'Mar', value: 34500 },
        { month: 'Abr', value: 35000 },
        { month: 'May', value: 35000 },
        { month: 'Jun', value: 36000 },
      ],
      quality: [
        { category: 'Disponible', percentage: 70 },
        { category: 'Reservado', percentage: 30 },
      ],
    },
  },

  embarque: {
    areaId: 'embarque',
    employees: [
      {
        id: '9',
        name: 'Laura Hernández',
        position: { es: 'Coordinadora de Embarques', en: 'Shipping Coordinator' },
        photo: 'https://i.pravatar.cc/150?img=9',
        email: 'laura.hernandez@plantaabc.com',
        phone: '+52 33 1234 5686',
        yearsInCompany: 5,
      },
    ],
    metrics: [
      {
        label: { es: 'On-Time Delivery', en: 'On-Time Delivery' },
        value: 98.2,
        unit: '%',
        target: 98,
        trend: 'up',
        color: '#3b82f6',
      },
      {
        label: { es: 'Embarques/Día', en: 'Shipments/Day' },
        value: 150,
        unit: 'shipments',
        target: 150,
        trend: 'stable',
        color: '#10b981',
      },
    ],
    specifications: [
      {
        key: { es: 'Andenes de Carga', en: 'Loading Docks' },
        value: '8',
        icon: '🚛',
      },
      {
        key: { es: 'Países de Exportación', en: 'Export Countries' },
        value: '25',
        icon: '🌍',
      },
    ],
    products: [],
    layout: {
      imageUrl: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=800',
      highlightedZone: { x: 25, y: 40, width: 50, height: 35 },
    },
    chartData: {
      production: [
        { month: 'Ene', value: 140 },
        { month: 'Feb', value: 145 },
        { month: 'Mar', value: 148 },
        { month: 'Abr', value: 149 },
        { month: 'May', value: 150 },
        { month: 'Jun', value: 152 },
      ],
      quality: [
        { category: 'A Tiempo', percentage: 98.2 },
        { category: 'Retrasado', percentage: 1.8 },
      ],
    },
  },
};

export const getEnhancedAreaData = (areaId: string): EnhancedAreaData | undefined => {
  return ENHANCED_AREA_DATA[areaId];
};

// Demo Tour Data - Hardcoded for presentation
// This data is completely separate from the database

export interface MultiLangText {
  es: string;
  en: string;
}

export interface DemoResponsible {
  name: string;
  position?: MultiLangText;
  photo: string;
}

export interface DemoKeypoint {
  question: MultiLangText;
  answer: MultiLangText;
}

export interface DemoAreaTab {
  resumen: MultiLangText;
  ubicacion: MultiLangText;
  organigrama: MultiLangText;
  costos: MultiLangText;
  predicciones: MultiLangText;
}

export interface DemoArea {
  id: string;
  order: number;
  name: MultiLangText;
  image: string;
  shortDescription: MultiLangText;
  responsible: DemoResponsible;
  tabs: DemoAreaTab;
  keypoints: DemoKeypoint[];
  products: string[];
  safety: MultiLangText;
}

export interface DemoTour {
  id: string;
  slug: string;
  title: MultiLangText;
  description: MultiLangText;
  plant: string;
  coverImage: string;
  duration: MultiLangText;
  isActive: boolean;
  areas: DemoArea[];
}

// Main demo tour data
export const DEMO_TOURS: DemoTour[] = [
  {
    id: 'proceso-productivo',
    slug: 'proceso-productivo',
    title: {
      es: 'Tour del Proceso Productivo',
      en: 'Production Process Tour',
    },
    description: {
      es: 'Conoce nuestro proceso de manufactura completo desde la recepción de materiales hasta el embarque del producto final',
      en: 'Learn about our complete manufacturing process from material reception to final product shipment',
    },
    plant: 'Planta ABC - Guadalajara',
    coverImage: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800',
    duration: {
      es: '15-20 minutos',
      en: '15-20 minutes',
    },
    isActive: true,
    areas: [
      {
        id: 'recepcion',
        order: 1,
        name: {
          es: 'Recepción de Materiales',
          en: 'Material Reception',
        },
        image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800',
        shortDescription: {
          es: 'Primera etapa: verificación y almacenamiento de materia prima',
          en: 'First stage: raw material verification and storage',
        },
        responsible: {
          name: 'María González',
          position: {
            es: 'Jefa de Recepción',
            en: 'Reception Manager',
          },
          photo: 'https://i.pravatar.cc/150?img=1',
        },
        tabs: {
          resumen: {
            es: 'En esta área recibimos toda la materia prima que utilizamos en nuestro proceso productivo. Contamos con un equipo especializado que verifica la calidad, cantidad y documentación de cada envío. Utilizamos sistemas automatizados de registro y almacenamiento para garantizar la trazabilidad completa de todos los materiales.',
            en: 'In this area we receive all raw materials used in our production process. We have a specialized team that verifies the quality, quantity, and documentation of each shipment. We use automated registration and storage systems to ensure complete traceability of all materials.',
          },
          ubicacion: {
            es: 'Ubicada en el primer piso del edificio A, con acceso directo desde el patio de maniobras. Cuenta con 500m² de espacio de almacenamiento temporal y 3 bahías de descarga.',
            en: 'Located on the first floor of building A, with direct access from the maneuvering yard. It has 500m² of temporary storage space and 3 unloading bays.',
          },
          organigrama: {
            es: 'El área cuenta con 1 jefe de área, 2 supervisores de turno, 8 operadores de montacargas y 4 inspectores de calidad. Reporta directamente a la Gerencia de Operaciones.',
            en: 'The area has 1 area manager, 2 shift supervisors, 8 forklift operators, and 4 quality inspectors. Reports directly to Operations Management.',
          },
          costos: {
            es: 'Procesamos un promedio de 50 toneladas de material por día. El tiempo promedio de descarga es de 45 minutos por camión. Tasa de rechazo: 0.5%.',
            en: 'We process an average of 50 tons of material per day. Average unloading time is 45 minutes per truck. Rejection rate: 0.5%.',
          },
          predicciones: {
            es: 'Se espera un incremento del 20% en el volumen de recepción para el próximo trimestre debido a nuevos contratos.',
            en: 'A 20% increase in reception volume is expected for the next quarter due to new contracts.',
          },
        },
        keypoints: [
          {
            question: {
              es: '¿Qué materiales se reciben en esta área?',
              en: 'What materials are received in this area?',
            },
            answer: {
              es: 'Recibimos principalmente componentes electrónicos, plásticos de ingeniería y metales especiales. Todo material viene certificado con documentación de origen y pruebas de calidad.',
              en: 'We mainly receive electronic components, engineering plastics, and special metals. All materials come certified with origin documentation and quality tests.',
            },
          },
          {
            question: {
              es: '¿Cómo se verifica la calidad de los materiales?',
              en: 'How is material quality verified?',
            },
            answer: {
              es: 'Realizamos inspecciones visuales, pruebas dimensionales y análisis de certificados. Los materiales críticos pasan por pruebas de laboratorio adicionales antes de ser aprobados.',
              en: 'We perform visual inspections, dimensional tests, and certificate analysis. Critical materials undergo additional laboratory tests before approval.',
            },
          },
          {
            question: {
              es: '¿Cuál es el tiempo de procesamiento?',
              en: 'What is the processing time?',
            },
            answer: {
              es: 'Desde que llega el camión hasta que el material está disponible en el almacén son aproximadamente 2 horas, incluyendo todas las verificaciones.',
              en: 'From truck arrival to material availability in warehouse is approximately 2 hours, including all verifications.',
            },
          },
        ],
        products: ['Materia Prima A', 'Componente B', 'Material C'],
        safety: {
          es: 'Uso de casco, calzado de seguridad y chaleco reflectante obligatorio. Prohibido el paso a personal no autorizado.',
          en: 'Hard hat, safety shoes, and reflective vest required. Unauthorized personnel prohibited.',
        },
      },
      {
        id: 'produccion',
        order: 2,
        name: {
          es: 'Área de Producción',
          en: 'Production Area',
        },
        image: 'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=800',
        shortDescription: {
          es: 'Ensamblaje y fabricación de componentes principales',
          en: 'Assembly and manufacturing of main components',
        },
        responsible: {
          name: 'Carlos Ramírez',
          position: {
            es: 'Gerente de Producción',
            en: 'Production Manager',
          },
          photo: 'https://i.pravatar.cc/150?img=12',
        },
        tabs: {
          resumen: {
            es: 'El corazón de nuestra operación. Aquí se ensamblan los componentes principales utilizando tecnología de vanguardia. Contamos con 15 líneas de producción altamente automatizadas que operan 24/7 en tres turnos. Nuestro equipo está certificado en manufactura esbelta y mejora continua.',
            en: 'The heart of our operation. Main components are assembled here using cutting-edge technology. We have 15 highly automated production lines operating 24/7 in three shifts. Our team is certified in lean manufacturing and continuous improvement.',
          },
          ubicacion: {
            es: 'Edificio B, pisos 1 y 2. 3,000m² de espacio de producción con ambiente controlado (temperatura 22°C ±2, humedad 45% ±5).',
            en: 'Building B, floors 1 and 2. 3,000m² of production space with controlled environment (temperature 22°C ±2, humidity 45% ±5).',
          },
          organigrama: {
            es: '1 gerente de producción, 3 jefes de línea, 12 técnicos especializados, 45 operadores de producción por turno.',
            en: '1 production manager, 3 line supervisors, 12 specialized technicians, 45 production operators per shift.',
          },
          costos: {
            es: 'Capacidad instalada: 10,000 unidades/día. Producción actual: 8,500 unidades/día. Eficiencia general (OEE): 87%. Tiempo de ciclo promedio: 3.2 minutos.',
            en: 'Installed capacity: 10,000 units/day. Current production: 8,500 units/day. Overall Efficiency (OEE): 87%. Average cycle time: 3.2 minutes.',
          },
          predicciones: {
            es: 'Meta de incrementar OEE a 92% mediante implementación de TPM (Mantenimiento Productivo Total) en el Q2.',
            en: 'Goal to increase OEE to 92% through TPM (Total Productive Maintenance) implementation in Q2.',
          },
        },
        keypoints: [
          {
            question: {
              es: '¿Qué productos se fabrican aquí?',
              en: 'What products are manufactured here?',
            },
            answer: {
              es: 'Ensamblamos componentes electrónicos de alta precisión para la industria automotriz y aeroespacial. Cada producto pasa por 12 estaciones de trabajo con controles de calidad integrados.',
              en: 'We assemble high-precision electronic components for automotive and aerospace industries. Each product goes through 12 workstations with integrated quality controls.',
            },
          },
          {
            question: {
              es: '¿Qué tecnologías se utilizan?',
              en: 'What technologies are used?',
            },
            answer: {
              es: 'Utilizamos robots colaborativos (cobots), sistemas de visión artificial, soldadura láser automatizada y sistemas MES para tracking en tiempo real.',
              en: 'We use collaborative robots (cobots), artificial vision systems, automated laser welding, and MES systems for real-time tracking.',
            },
          },
          {
            question: {
              es: '¿Cómo se garantiza la calidad?',
              en: 'How is quality guaranteed?',
            },
            answer: {
              es: 'Implementamos control de calidad en proceso (IPQC) en cada estación. Todos los productos son 100% inspeccionados mediante sistemas automatizados. Tasa de defectos: <100 PPM.',
              en: 'We implement in-process quality control (IPQC) at each station. All products are 100% inspected through automated systems. Defect rate: <100 PPM.',
            },
          },
        ],
        products: ['Producto A', 'Producto B', 'Producto C', 'Producto D'],
        safety: {
          es: 'Equipo de protección completo. Líneas amarillas de seguridad. Prohibido cruzar mientras las máquinas están en operación.',
          en: 'Complete protective equipment. Yellow safety lines. Crossing prohibited while machines are in operation.',
        },
      },
      {
        id: 'calidad',
        order: 3,
        name: {
          es: 'Control de Calidad',
          en: 'Quality Control',
        },
        image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800',
        shortDescription: {
          es: 'Laboratorio de pruebas y certificación de productos',
          en: 'Testing laboratory and product certification',
        },
        responsible: {
          name: 'Ana Martínez',
          position: {
            es: 'Directora de Calidad',
            en: 'Quality Director',
          },
          photo: 'https://i.pravatar.cc/150?img=5',
        },
        tabs: {
          resumen: {
            es: 'Laboratorio certificado ISO 9001 y ISO 17025 donde realizamos pruebas exhaustivas a todos nuestros productos. Contamos con equipos de medición de última generación y personal altamente capacitado. Realizamos pruebas dimensionales, funcionales, de durabilidad y climáticas.',
            en: 'ISO 9001 and ISO 17025 certified laboratory where we perform exhaustive testing on all our products. We have state-of-the-art measurement equipment and highly trained personnel. We perform dimensional, functional, durability, and climatic tests.',
          },
          ubicacion: {
            es: 'Edificio C, área climatizada. 800m² distribuidos en laboratorio dimensional, laboratorio funcional, y cámara climática.',
            en: 'Building C, climate-controlled area. 800m² distributed in dimensional laboratory, functional laboratory, and climatic chamber.',
          },
          organigrama: {
            es: '1 directora de calidad, 2 jefes de laboratorio, 8 ingenieros de calidad, 6 técnicos de metrología.',
            en: '1 quality director, 2 laboratory supervisors, 8 quality engineers, 6 metrology technicians.',
          },
          costos: {
            es: 'Procesamos 500 inspecciones diarias. Tiempo promedio de certificación: 4 horas. Tasa de aprobación primera vez: 98.5%.',
            en: 'We process 500 inspections daily. Average certification time: 4 hours. First-time approval rate: 98.5%.',
          },
          predicciones: {
            es: 'Implementación de IA para detección automática de defectos reducirá tiempo de inspección en 30%.',
            en: 'AI implementation for automatic defect detection will reduce inspection time by 30%.',
          },
        },
        keypoints: [
          {
            question: {
              es: '¿Qué tipo de pruebas se realizan?',
              en: 'What type of tests are performed?',
            },
            answer: {
              es: 'Pruebas dimensionales con CMM, pruebas funcionales, pruebas de vibración, pruebas de temperatura extrema (-40°C a +150°C), y pruebas de vida acelerada.',
              en: 'Dimensional tests with CMM, functional tests, vibration tests, extreme temperature tests (-40°C to +150°C), and accelerated life tests.',
            },
          },
          {
            question: {
              es: '¿Cómo se mantiene la trazabilidad?',
              en: 'How is traceability maintained?',
            },
            answer: {
              es: 'Cada producto tiene un código QR único que registra todas las pruebas realizadas, resultados, operadores involucrados y equipo utilizado. Sistema integrado con blockchain para garantizar inmutabilidad.',
              en: 'Each product has a unique QR code that records all tests performed, results, operators involved, and equipment used. System integrated with blockchain to ensure immutability.',
            },
          },
        ],
        products: ['Todos los productos del catálogo'],
        safety: {
          es: 'Lentes de seguridad y bata de laboratorio obligatorios. Prohibido consumir alimentos.',
          en: 'Safety glasses and lab coat required. Food consumption prohibited.',
        },
      },
      {
        id: 'almacen',
        order: 4,
        name: {
          es: 'Almacén de Producto Terminado',
          en: 'Finished Product Warehouse',
        },
        image: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=800',
        shortDescription: {
          es: 'Almacenamiento y preparación para embarque',
          en: 'Storage and shipment preparation',
        },
        responsible: {
          name: 'Roberto Sánchez',
          position: {
            es: 'Jefe de Almacén',
            en: 'Warehouse Manager',
          },
          photo: 'https://i.pravatar.cc/150?img=8',
        },
        tabs: {
          resumen: {
            es: 'Almacén automatizado con sistema WMS (Warehouse Management System) que controla 5,000 posiciones de almacenaje. Utilizamos AGVs (vehículos guiados automáticamente) para movimiento interno. Sistema FIFO estricto para garantizar rotación de inventario.',
            en: 'Automated warehouse with WMS (Warehouse Management System) controlling 5,000 storage positions. We use AGVs (Automated Guided Vehicles) for internal movement. Strict FIFO system to ensure inventory rotation.',
          },
          ubicacion: {
            es: 'Edificio D, 2,500m² en dos niveles con racks de almacenaje de alta densidad. Área de preparación de embarques de 500m².',
            en: 'Building D, 2,500m² on two levels with high-density storage racks. 500m² shipment preparation area.',
          },
          organigrama: {
            es: '1 jefe de almacén, 2 supervisores de turno, 10 operadores de montacargas, 8 preparadores de pedidos.',
            en: '1 warehouse manager, 2 shift supervisors, 10 forklift operators, 8 order pickers.',
          },
          costos: {
            es: 'Capacidad: 50,000 unidades. Inventario actual: 35,000 unidades. Rotación: 12 veces/año. Precisión de inventario: 99.8%.',
            en: 'Capacity: 50,000 units. Current inventory: 35,000 units. Turnover: 12 times/year. Inventory accuracy: 99.8%.',
          },
          predicciones: {
            es: 'Expansión planificada agregará 2,000 posiciones adicionales en Q3 para soportar crecimiento de demanda.',
            en: 'Planned expansion will add 2,000 additional positions in Q3 to support demand growth.',
          },
        },
        keypoints: [
          {
            question: {
              es: '¿Cómo funciona el sistema automatizado?',
              en: 'How does the automated system work?',
            },
            answer: {
              es: 'El WMS asigna automáticamente ubicaciones óptimas basándose en rotación, peso y dimensiones. Los AGVs transportan pallets sin intervención humana siguiendo rutas optimizadas por IA.',
              en: 'WMS automatically assigns optimal locations based on rotation, weight, and dimensions. AGVs transport pallets without human intervention following AI-optimized routes.',
            },
          },
          {
            question: {
              es: '¿Qué controles de seguridad existen?',
              en: 'What security controls exist?',
            },
            answer: {
              es: 'Sistema de videovigilancia 24/7, control de acceso biométrico, sensores de temperatura y humedad, y sistema contra incendios con detección temprana.',
              en: '24/7 video surveillance system, biometric access control, temperature and humidity sensors, and early detection fire system.',
            },
          },
        ],
        products: ['Producto Final A', 'Producto Final B', 'Producto Final C'],
        safety: {
          es: 'Casco y calzado de seguridad obligatorio. Respetar señalización de tráfico interno. Prohibido el paso bajo cargas suspendidas.',
          en: 'Hard hat and safety shoes required. Respect internal traffic signage. Passage under suspended loads prohibited.',
        },
      },
      {
        id: 'embarque',
        order: 5,
        name: {
          es: 'Área de Embarque',
          en: 'Shipping Area',
        },
        image: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=800',
        shortDescription: {
          es: 'Consolidación y despacho de pedidos',
          en: 'Order consolidation and dispatch',
        },
        responsible: {
          name: 'Laura Hernández',
          position: {
            es: 'Coordinadora de Embarques',
            en: 'Shipping Coordinator',
          },
          photo: 'https://i.pravatar.cc/150?img=9',
        },
        tabs: {
          resumen: {
            es: 'Última estación antes de que nuestros productos lleguen al cliente. Aquí consolidamos pedidos, realizamos la documentación aduanal y coordinamos con transportistas. Procesamos embarques nacionales e internacionales con rastreo en tiempo real.',
            en: 'Last station before our products reach the customer. Here we consolidate orders, perform customs documentation, and coordinate with carriers. We process domestic and international shipments with real-time tracking.',
          },
          ubicacion: {
            es: 'Planta baja edificio D, con 8 andenes de carga. Conexión directa a autopista. Oficina de documentación anexa.',
            en: 'Ground floor building D, with 8 loading docks. Direct highway connection. Attached documentation office.',
          },
          organigrama: {
            es: '1 coordinadora de embarques, 1 especialista en comercio exterior, 6 operadores de montacargas, 4 documentadores.',
            en: '1 shipping coordinator, 1 foreign trade specialist, 6 forklift operators, 4 documentation clerks.',
          },
          costos: {
            es: 'Procesamos 150 embarques/día. Tiempo promedio de carga: 30 minutos. On-time delivery: 98.2%. Daños en tránsito: <0.1%.',
            en: 'We process 150 shipments/day. Average loading time: 30 minutes. On-time delivery: 98.2%. Damages in transit: <0.1%.',
          },
          predicciones: {
            es: 'Integración con blockchain para documentación aduanal reducirá tiempos de liberación en 40%.',
            en: 'Blockchain integration for customs documentation will reduce clearance times by 40%.',
          },
        },
        keypoints: [
          {
            question: {
              es: '¿A qué países exportan?',
              en: 'Which countries do you export to?',
            },
            answer: {
              es: 'Exportamos a 25 países en América, Europa y Asia. Principales destinos: USA (40%), Canadá (15%), Alemania (12%), China (10%).',
              en: 'We export to 25 countries in America, Europe, and Asia. Main destinations: USA (40%), Canada (15%), Germany (12%), China (10%).',
            },
          },
          {
            question: {
              es: '¿Cómo rastrean los embarques?',
              en: 'How do you track shipments?',
            },
            answer: {
              es: 'Sistema TMS integrado con GPS en todas las unidades. Clientes reciben notificaciones automáticas de cada etapa del envío y pueden consultar ubicación en tiempo real.',
              en: 'Integrated TMS system with GPS in all units. Customers receive automatic notifications of each shipment stage and can check location in real time.',
            },
          },
        ],
        products: ['Embarques consolidados de todos los productos'],
        safety: {
          es: 'Chaleco reflectante obligatorio. Mantener distancia segura durante maniobras. Prohibido el paso mientras se carga/descarga.',
          en: 'Reflective vest required. Maintain safe distance during maneuvers. Passage prohibited during loading/unloading.',
        },
      },
    ],
  },
  // Tours adicionales (desactivados para el demo)
  {
    id: 'seguridad-industrial',
    slug: 'seguridad-industrial',
    title: {
      es: 'Tour de Seguridad Industrial',
      en: 'Industrial Safety Tour',
    },
    description: {
      es: 'Conoce nuestros protocolos y sistemas de seguridad',
      en: 'Learn about our safety protocols and systems',
    },
    plant: 'Planta ABC - Guadalajara',
    coverImage: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800',
    duration: {
      es: '10 minutos',
      en: '10 minutes',
    },
    isActive: false,
    areas: [],
  },
  {
    id: 'calidad',
    slug: 'calidad',
    title: {
      es: 'Tour de Calidad',
      en: 'Quality Tour',
    },
    description: {
      es: 'Descubre cómo garantizamos la excelencia en cada producto',
      en: 'Discover how we guarantee excellence in every product',
    },
    plant: 'Planta ABC - Guadalajara',
    coverImage: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800',
    duration: {
      es: '12 minutos',
      en: '12 minutes',
    },
    isActive: false,
    areas: [],
  },
];

// Helper function to get text in current language
export const getText = (text: MultiLangText, lang: 'es' | 'en' = 'es'): string => {
  return text[lang];
};

// Get tour by slug
export const getTourBySlug = (slug: string): DemoTour | undefined => {
  return DEMO_TOURS.find((tour) => tour.slug === slug);
};

// Get area by ID within a tour
export const getAreaById = (tour: DemoTour, areaId: string): DemoArea | undefined => {
  return tour.areas.find((area) => area.id === areaId);
};

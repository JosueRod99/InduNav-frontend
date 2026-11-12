import { EQUIPMENT_STATUS_LABELS, EQUIPMENT_TYPE_LABELS } from '../../api/equipment';
import { tr, type TourLanguageInfo } from '../../api/tourView';
import type { Translations } from '../../api/tourBuilder';

// Fixed texts of the tour viewer. Spanish and English live here; any other language keeps its own
// in languages.ui_texts (Idiomas > Catálogo) and what it lacks is shown in English.
// {name} marks a value. Keys ending in _one / _other are the singular and plural of the same text;
// a language without that difference only needs _other.

const EN = {
  section_summary: 'Summary',
  section_location: 'Location',
  section_personnel: 'Team',
  section_processes: 'Processes',
  section_safety: 'Safety',
  section_equipment: 'Equipment',
  section_products: 'Products',
  section_gallery: 'Gallery',
  section_documents: 'Documents',
  section_certifications: 'Certifications',
  section_highlights: 'Key figures',
  section_custom: 'Section',

  start_tour: 'Start tour',
  start_again: 'Start over',
  continue_at: 'Continue at {area} ({position}/{total})',
  what_you_will_see: 'What you will see',
  areas_one: '{count} area',
  areas_other: '{count} areas',
  no_areas: 'This tour has no areas yet.',
  language: 'Language',

  previous_area: 'Previous area',
  next_area: 'Next area',
  tour_start: 'Tour start',
  start: 'Start',
  finish_tour: 'Finish tour',
  tour_completed: 'Tour completed!',
  thanks_for_visiting: 'Thank you for visiting {tour}.',
  areas_visited: 'Areas you visited',
  back_to_start: 'Start over',
  back_to_editor: 'Back to editor',
  in_charge: 'In charge',
  no_content: 'This area has no visible content yet.',

  narration_only_in: 'Narration available in {language} only.',
  narration_in: 'Narration in {language}',
  narration_on_publish: 'Narration will be generated when the tour is published.',
  no_narration: 'This area has no narration.',
  machine_translation: 'Machine translation: it may contain errors.',
  live_in_original: 'Some plant data is shown in {language}.',
  safety_machine_translation: 'This safety information was translated automatically. If in doubt, follow the instructions of plant staff.',
  play_narration: 'Play narration',
  pause_narration: 'Pause narration',
  narration_position: 'Narration position',
  back_10_seconds: 'Back 10 seconds',
  forward_10_seconds: 'Forward 10 seconds',
  playback_speed: 'Playback speed',
  speed_change: 'Speed {speed}x, change',

  about_company: 'About the company',
  mission: 'Mission',
  vision: 'Vision',
  our_values: 'Our values',
  company_documents: 'Company documents',
  the_plant: 'The plant',
  plant_documents: 'Plant documents',
  directions: 'Directions',
  view_photo: 'View photo {number}',
  previous_photo: 'Previous photo',
  next_photo: 'Next photo',
  close: 'Close',

  faq: 'FAQ',
  questions_one: '{count} question',
  questions_other: '{count} questions',
  people_working_one: 'People working here: {count}',
  people_working_other: 'People working here: {count}',
  primary_assignment: 'Primary assignment',
  step: 'Step {number}',
  step_of: 'Step {number} of {total}',
  in_this_area: 'In this area',
  required_ppe: 'Required protective equipment',
  area_hazards: 'Area hazards',
  severity_low: 'Low',
  severity_medium: 'Medium',
  severity_high: 'High',
  severity_critical: 'Critical',
  assembly_point: 'Assembly point',
  restricted_access: 'Restricted access',
  open: 'Open',
  certification_in_progress: 'Certification in progress',
  valid_until: 'Valid until {date}',
  people_certified_one: '{count} person certified in {name}',
  people_certified_other: '{count} people certified in {name}',

  equipment_status_active: 'Active',
  equipment_status_maintenance: 'Under maintenance',
  equipment_status_out_of_service: 'Out of service',
  equipment_status_retired: 'Retired',
  equipment_type_tool: 'Tool',
  equipment_type_machinery: 'Machinery',
  equipment_type_vehicle: 'Vehicle',
  equipment_type_computer: 'Computer equipment',
  equipment_type_other: 'Other',

  floor: 'Floor',
  floor_ground: 'Ground floor',
  floor_upper: 'Floor {number}',
  floor_basement: 'Basement',
  floor_basement_number: 'Basement {number}',
  area_on_floors: 'This area spans {count} floors:',
  tour_areas: 'Tour areas',
  current_area: 'Current area',
  you_are_here: 'You are here',
  zones: 'Zones',
  machines: 'Machines',
  zones_count: '{count} zones',
  machines_count: '{count} machines',
  unavailable_count: '{count} unavailable',
  view_area_interior: 'View area interior',
  go_to_area: 'Go to this tour area',
  no_machines_in_zone: 'No machines in this zone',
  machines_in_zone: 'Machines in this zone',
  used_in: 'Used in',
  plant_layout: 'Plant Layout',
  plant: 'Plant',
  interior: 'Inside',
  interior_of: 'Inside: {area}',
  back_to_list: 'Back to list',
};

export type ViewerTextKey = keyof typeof EN;
type PluralKey = { [K in ViewerTextKey]: K extends `${infer Base}_other` ? Base : never }[ViewerTextKey];

const ES: Record<ViewerTextKey, string> = {
  section_summary: 'Resumen',
  section_location: 'Ubicación',
  section_personnel: 'Personal',
  section_processes: 'Procesos',
  section_safety: 'Seguridad',
  section_equipment: 'Equipos',
  section_products: 'Productos',
  section_gallery: 'Galería',
  section_documents: 'Documentos',
  section_certifications: 'Certificaciones',
  section_highlights: 'Datos destacados',
  section_custom: 'Sección',

  start_tour: 'Iniciar recorrido',
  start_again: 'Empezar',
  continue_at: 'Continuar en {area} ({position}/{total})',
  what_you_will_see: 'Qué vas a conocer',
  areas_one: '{count} área',
  areas_other: '{count} áreas',
  no_areas: 'Este tour todavía no tiene áreas.',
  language: 'Idioma',

  previous_area: 'Área anterior',
  next_area: 'Siguiente área',
  tour_start: 'Inicio del recorrido',
  start: 'Inicio',
  finish_tour: 'Finalizar recorrido',
  tour_completed: '¡Recorrido terminado!',
  thanks_for_visiting: 'Gracias por recorrer {tour}.',
  areas_visited: 'Áreas que visitaste',
  back_to_start: 'Volver al inicio',
  back_to_editor: 'Volver al editor',
  in_charge: 'Responsable',
  no_content: 'Esta área todavía no tiene contenido visible.',

  narration_only_in: 'Narración disponible solo en {language}.',
  narration_in: 'Narración en {language}',
  narration_on_publish: 'La narración de esta área se generará al publicar.',
  no_narration: 'Esta área no tiene narración.',
  machine_translation: 'Traducción automática: puede contener errores.',
  live_in_original: 'Algunos datos de la planta se muestran en {language}.',
  safety_machine_translation: 'Esta información de seguridad se tradujo automáticamente. Ante cualquier duda, sigue las indicaciones del personal de la planta.',
  play_narration: 'Reproducir narración',
  pause_narration: 'Pausar narración',
  narration_position: 'Posición de la narración',
  back_10_seconds: 'Retroceder 10 segundos',
  forward_10_seconds: 'Adelantar 10 segundos',
  playback_speed: 'Velocidad de reproducción',
  speed_change: 'Velocidad {speed}x, cambiar',

  about_company: 'Conoce a la empresa',
  mission: 'Misión',
  vision: 'Visión',
  our_values: 'Nuestros valores',
  company_documents: 'Documentos de la empresa',
  the_plant: 'La planta',
  plant_documents: 'Documentos de la planta',
  directions: 'Cómo llegar',
  view_photo: 'Ver foto {number}',
  previous_photo: 'Foto anterior',
  next_photo: 'Foto siguiente',
  close: 'Cerrar',

  faq: 'Preguntas frecuentes',
  questions_one: '{count} pregunta',
  questions_other: '{count} preguntas',
  people_working_one: 'Aquí trabaja {count} persona',
  people_working_other: 'Aquí trabajan {count} personas',
  primary_assignment: 'Asignación principal',
  step: 'Paso {number}',
  step_of: 'Paso {number} de {total}',
  in_this_area: 'En esta área',
  required_ppe: 'Equipo de protección requerido',
  area_hazards: 'Riesgos del área',
  severity_low: 'Bajo',
  severity_medium: 'Medio',
  severity_high: 'Alto',
  severity_critical: 'Crítico',
  assembly_point: 'Punto de reunión',
  restricted_access: 'Acceso restringido',
  open: 'Abrir',
  certification_in_progress: 'En proceso de certificación',
  valid_until: 'Vigente hasta {date}',
  people_certified_one: '{count} persona certificada en {name}',
  people_certified_other: '{count} personas certificadas en {name}',

  equipment_status_active: EQUIPMENT_STATUS_LABELS.active,
  equipment_status_maintenance: EQUIPMENT_STATUS_LABELS.maintenance,
  equipment_status_out_of_service: EQUIPMENT_STATUS_LABELS.out_of_service,
  equipment_status_retired: EQUIPMENT_STATUS_LABELS.retired,
  equipment_type_tool: EQUIPMENT_TYPE_LABELS.tool,
  equipment_type_machinery: EQUIPMENT_TYPE_LABELS.machinery,
  equipment_type_vehicle: EQUIPMENT_TYPE_LABELS.vehicle,
  equipment_type_computer: EQUIPMENT_TYPE_LABELS.computer,
  equipment_type_other: EQUIPMENT_TYPE_LABELS.other,

  floor: 'Piso',
  floor_ground: 'Planta Baja',
  floor_upper: 'Piso {number}',
  floor_basement: 'Sótano',
  floor_basement_number: 'Sótano {number}',
  area_on_floors: 'Esta área está en {count} pisos:',
  tour_areas: 'Áreas del recorrido',
  current_area: 'Área actual',
  you_are_here: 'Estás aquí',
  zones: 'Zonas',
  machines: 'Equipos',
  zones_count: '{count} zonas',
  machines_count: '{count} equipos',
  unavailable_count: '{count} no disponibles',
  view_area_interior: 'Ver interior del área',
  go_to_area: 'Ir a esta área del tour',
  no_machines_in_zone: 'Sin equipos en esta zona',
  machines_in_zone: 'Equipos en esta zona',
  used_in: 'Se usa en',
  plant_layout: 'Plano de la Planta',
  plant: 'Planta',
  interior: 'Interior',
  interior_of: 'Interior: {area}',
  back_to_list: 'Volver a la lista',
};

export const VIEWER_TEXT_KEYS = Object.keys(EN) as ViewerTextKey[];
export const viewerTextInEnglish = (key: ViewerTextKey) => EN[key];
export const viewerTextInSpanish = (key: ViewerTextKey) => ES[key];

const placeholdersOf = (text: string) => text.match(/\{\w+\}/g) ?? [];

/** Values the translation of a text lost: the viewer would show less than it should */
export const missingPlaceholders = (key: ViewerTextKey, text: string) =>
  placeholdersOf(EN[key]).filter((placeholder) => !text.includes(placeholder));

// Language and alphabet: pt-BR reads pt, but zh-TW (traditional) does not read zh (simplified)
const readingOf = (code: string) => {
  try {
    const { language, script } = new Intl.Locale(code).maximize();
    return `${language}-${script}`;
  } catch {
    return code;
  }
};

/** The language a visitor starts in: the first of their browser the tour has, else the one it was written in */
export const startingLanguage = (languages: string[], sourceLanguage: string, browserLanguages: readonly string[] = navigator.languages) => {
  for (const wanted of browserLanguages) {
    const match = languages.find((l) => l === wanted) ?? languages.find((l) => readingOf(l) === readingOf(wanted));
    if (match) return match;
  }
  return languages.includes(sourceLanguage) ? sourceLanguage : languages[0] || sourceLanguage;
};

type Values = Record<string, string | number>;

const fill = (text: string, values: Values = {}) =>
  text.replace(/\{(\w+)\}/g, (placeholder, name) => (name in values ? String(values[name]) : placeholder));

const DATE_LOCALES: Record<string, string> = { es: 'es-MX', en: 'en-US' };

export const createViewerTexts = (language: string, sourceLanguage: string, options: TourLanguageInfo[] = []) => {
  const own = language === 'es' ? ES : language === 'en' ? EN : (options.find((o) => o.code === language)?.ui_texts ?? {}) as Partial<Record<ViewerTextKey, string>>;

  const t = (key: ViewerTextKey, values?: Values) => fill(own[key] || EN[key], values);

  return {
    language,
    sourceLanguage,
    t,
    /** Singular or plural. A language without singular uses its plural before falling back to English */
    tn: (base: PluralKey, count: number, values?: Values) => {
      const one = `${base}_one` as ViewerTextKey;
      const other = `${base}_other` as ViewerTextKey;
      const text = count === 1 ? own[one] || own[other] || EN[one] : own[other] || EN[other];
      return fill(text, { count, ...values });
    },
    /** A text written for the tour: in this language, else the one it was written in */
    text: (translations: Translations | undefined | null) => tr(translations, language, sourceLanguage),
    languageName: (code: string) => options.find((o) => o.code === code)?.native_name || code.toUpperCase(),
    formatDate: (date: string, format: Intl.DateTimeFormatOptions) => new Date(date).toLocaleDateString(DATE_LOCALES[language] || language, format),
    floorName: (level: number) => {
      if (level === 0) return t('floor_ground');
      if (level === -1) return t('floor_basement');
      return level < 0 ? t('floor_basement_number', { number: -level }) : t('floor_upper', { number: level });
    },
  };
};

export type ViewerTexts = ReturnType<typeof createViewerTexts>;

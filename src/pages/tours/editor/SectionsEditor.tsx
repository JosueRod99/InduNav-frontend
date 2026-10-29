import { useState } from 'react';
import {
  AlertTriangle,
  Award,
  BarChart3,
  ChevronDown,
  ChevronUp,
  FileText,
  Image as ImageIcon,
  MapPin,
  Package,
  PenLine,
  Plus,
  Shield,
  Trash2,
  Users,
  Wrench,
  BookOpen,
  CopyCheck,
  GitBranch,
  type LucideIcon,
} from 'lucide-react';
import SortableList, { moveItem } from '../../../components/ui/SortableList';
import {
  LIVE_SECTION_KEYS,
  MULTI_INSTANCE_SECTION_KEYS,
  getSectionBlocks,
  newBlockId,
  sectionInstanceId,
  SECTION_DESCRIPTIONS,
  SECTION_LABELS,
  type SectionCounts,
  type TourLanguage,
  type TourSection,
  type TourSectionKey,
} from '../../../api/tourBuilder';
import TranslatedField from './TranslatedField';
import LiveSectionPreview from './LiveSectionPreview';
import BlocksEditor from './BlocksEditor';
import type { TourViewStop } from '../../../api/tourView';
import {
  CUSTOM_SECTION_ICONS,
  DEFAULT_CUSTOM_SECTION_ICON,
  type CustomSectionIcon,
} from '../../../components/tours/customSectionIcons';

const SECTION_ICONS: Record<TourSectionKey, LucideIcon> = {
  summary: FileText,
  location: MapPin,
  personnel: Users,
  safety: Shield,
  equipment: Wrench,
  products: Package,
  processes: GitBranch,
  gallery: ImageIcon,
  documents: BookOpen,
  certifications: Award,
  highlights: BarChart3,
  custom: PenLine,
};

const sectionId = (s: TourSection) => sectionInstanceId(s);

interface SectionsEditorProps {
  sections: TourSection[];
  onChange: (sections: TourSection[]) => void;
  language: TourLanguage;
  counts?: SectionCounts | null; // live item counts of the stop's area
  allowCustom?: boolean; // the tour template only orders built-in sections
  liveData?: TourViewStop; // what the live sections will show (stop editor only)
  areaId?: string | null;
  /** Stop editor: show/hide one built-in section in every stop of the tour at once */
  onApplyVisibilityToAll?: (key: TourSectionKey, visible: boolean) => void;
}

const SectionsEditor = ({
  sections,
  onChange,
  language,
  counts,
  allowCustom = true,
  liveData,
  areaId = null,
  onApplyVisibilityToAll,
}: SectionsEditorProps) => {
  // Expanded row: custom sections open their editor, live sections a quick look at their data
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const canPreviewLive = counts !== undefined;

  const update = (index: number, patch: Partial<TourSection>) =>
    onChange(sections.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const addCustom = () => {
    const id = `s${Date.now().toString(36)}`;
    onChange([
      ...sections,
      {
        key: 'custom',
        visible: true,
        id,
        title: { es: 'Nueva sección' },
        icon: DEFAULT_CUSTOM_SECTION_ICON,
        blocks: [{ type: 'text', id: newBlockId(), body: {} }],
      },
    ]);
    setExpandedId(`custom:${id}`);
  };

  const removeOwnSection = (index: number) => {
    if (window.confirm('¿Eliminar esta sección propia y todo su contenido?')) {
      onChange(sections.filter((_, i) => i !== index));
    }
  };

  const countLabel = (key: TourSectionKey) => {
    if (!counts || !LIVE_SECTION_KEYS.includes(key)) return null;
    const value = counts[key];
    if (key === 'location') return value ? 'Dibujada en el plano' : 'Sin dibujo en el plano';
    return typeof value === 'number' ? `${value} ${value === 1 ? 'elemento' : 'elementos'}` : null;
  };

  const isEmpty = (key: TourSectionKey) => !!counts && LIVE_SECTION_KEYS.includes(key) && !counts[key];

  // Unknown section types (e.g. saved by an older version) are skipped instead of breaking the editor
  const known = sections.filter((s) => s.key in SECTION_ICONS);

  return (
    <div className="space-y-3">
      <SortableList
        items={known}
        getKey={sectionId}
        onMove={(from, to) => onChange(moveItem(known, from, to))}
        className="space-y-1.5"
        renderItem={(section, knownIndex) => {
          const index = sections.indexOf(known[knownIndex]);
          const isCustom = section.key === 'custom';
          const isOwn = isCustom; // authored sections that can appear several times
          const Icon = isCustom
            ? CUSTOM_SECTION_ICONS[section.icon || DEFAULT_CUSTOM_SECTION_ICON].Icon
            : SECTION_ICONS[section.key];
          const id = sectionId(section);
          const empty = section.visible && isEmpty(section.key);
          const isLive = LIVE_SECTION_KEYS.includes(section.key);
          const isExpanded = expandedId === id;
          const count = countLabel(section.key);

          return (
            <div
              className={`rounded-lg border bg-white ${
                section.visible ? 'border-gray-200' : 'border-dashed border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={section.visible}
                  onChange={(e) => update(index, { visible: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  aria-label={`Mostrar ${SECTION_LABELS[section.key]}`}
                />
                <Icon className={`h-4 w-4 flex-shrink-0 ${section.visible ? 'text-blue-600' : 'text-gray-400'}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-sm font-medium ${section.visible ? 'text-gray-900' : 'text-gray-500'}`}>
                      {isOwn ? section.title?.[language] || section.title?.es || SECTION_LABELS[section.key] : SECTION_LABELS[section.key]}
                    </span>
                    {isCustom && (
                      <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-700">Propia</span>
                    )}
                    {isCustom && (() => {
                      const blocks = getSectionBlocks(section);
                      const charts = blocks.filter((b) => b.type === 'chart').length;
                      const texts = blocks.length - charts;
                      return (
                        <span className="text-xs text-gray-500">
                          · {texts} {texts === 1 ? 'texto' : 'textos'}
                          {charts > 0 && `, ${charts} ${charts === 1 ? 'gráfica' : 'gráficas'}`}
                        </span>
                      );
                    })()}
                    {LIVE_SECTION_KEYS.includes(section.key) && (
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">En vivo</span>
                    )}
                    {count && <span className={`text-xs ${empty ? 'text-amber-600' : 'text-gray-500'}`}>· {count}</span>}
                  </div>
                  <p className="truncate text-xs text-gray-500">
                    {empty ? (
                      <span className="inline-flex items-center gap-1 text-amber-600">
                        <AlertTriangle className="h-3 w-3" />
                        El área no tiene datos para esta sección; no se mostrará al visitante
                      </span>
                    ) : (
                      SECTION_DESCRIPTIONS[section.key]
                    )}
                  </p>
                </div>
                {!isOwn && onApplyVisibilityToAll && (
                  <button
                    type="button"
                    onClick={() => onApplyVisibilityToAll(section.key, section.visible)}
                    className="inline-flex flex-shrink-0 items-center gap-1 rounded px-1.5 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                    title={`${section.visible ? 'Mostrar' : 'Ocultar'} ${SECTION_LABELS[section.key]} en todas las paradas (después se puede cambiar en cada una)`}
                    aria-label={`${section.visible ? 'Mostrar' : 'Ocultar'} ${SECTION_LABELS[section.key]} en todas las paradas`}
                  >
                    <CopyCheck className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">En todas</span>
                  </button>
                )}
                {(isOwn || (isLive && canPreviewLive)) && (
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : id)}
                    className="rounded p-1 text-gray-500 hover:bg-gray-100"
                    aria-expanded={isExpanded}
                    aria-label={
                      isOwn
                        ? isExpanded ? 'Cerrar edición' : 'Editar sección'
                        : isExpanded ? 'Ocultar contenido' : 'Ver qué se mostrará'
                    }
                    title={isOwn ? undefined : 'Ver qué se mostrará'}
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                )}
                {isOwn && (
                  <>
                    <button
                      type="button"
                      onClick={() => removeOwnSection(index)}
                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      aria-label="Eliminar sección"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>

              {isLive && isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50/60 px-3 pb-3 pt-3">
                  <LiveSectionPreview sectionKey={section.key} stop={liveData} areaId={areaId} />
                </div>
              )}

              {isCustom && isExpanded && (
                <div className="space-y-3 border-t border-gray-100 px-3 pb-3 pt-3">
                  <div>
                    <p className="mb-1.5 text-sm font-medium text-gray-700">Icono</p>
                    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Icono de la sección">
                      {(Object.keys(CUSTOM_SECTION_ICONS) as CustomSectionIcon[]).map((iconKey) => {
                        const { Icon: OptionIcon, label } = CUSTOM_SECTION_ICONS[iconKey];
                        const selected = (section.icon || DEFAULT_CUSTOM_SECTION_ICON) === iconKey;
                        return (
                          <button
                            key={iconKey}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => update(index, { icon: iconKey })}
                            className={`flex h-9 w-9 items-center justify-center rounded-md border-2 transition-colors ${
                              selected ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                            }`}
                            title={label}
                            aria-label={label}
                          >
                            <OptionIcon className="h-4 w-4" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <TranslatedField
                    label="Título"
                    value={section.title}
                    language={language}
                    onChange={(title) => update(index, { title })}
                    maxLength={500}
                  />
                  <BlocksEditor
                    blocks={getSectionBlocks(section)}
                    language={language}
                    // Saving blocks replaces the legacy single body
                    onChange={(blocks) => update(index, { blocks, body: undefined })}
                  />
                </div>
              )}
            </div>
          );
        }}
      />

      {allowCustom && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={addCustom}
            className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-blue-300 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
          >
            <Plus className="h-4 w-4" />
            Agregar sección propia
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Applies the order and visibility of the built-in sections of `structure` to `target`,
 * keeping the target's own custom sections and charts (stop-specific content) at the end.
 */
export const applyStructure = (structure: TourSection[], target: TourSection[]): TourSection[] => {
  const isOwn = (s: TourSection) => MULTI_INSTANCE_SECTION_KEYS.includes(s.key);
  const builtIn = structure.filter((s) => !isOwn(s)).map(({ key, visible }) => ({ key, visible }));
  return [...builtIn, ...target.filter(isOwn)];
};

export default SectionsEditor;

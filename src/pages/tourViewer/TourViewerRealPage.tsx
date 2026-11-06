import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Award,
  Flag,
  Globe,
  Home,
  Play,
  RotateCcw,
  BarChart3,
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Package,
  PenLine,
  Shield,
  User,
  Users,
  GitBranch,
  Volume2,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { sectionInstanceId, type TourLanguage, type TourSection, type TourSectionKey } from '../../api/tourBuilder';
import { getTourPreview, type TourView } from '../../api/tourView';
import {
  CertificationsSection,
  CustomSection,
  DocumentsSection,
  EquipmentSection,
  GallerySection,
  HighlightsSection,
  PersonnelSection,
  ProcessesSection,
  ProductsSection,
  SafetySection,
  StopFaq,
  SummarySection,
} from './sections/StopSections';
import { CUSTOM_SECTION_ICONS, DEFAULT_CUSTOM_SECTION_ICON } from '../../components/tours/customSectionIcons';
import LocationSection from './sections/LocationSection';
import { CompanySection, PlantSection } from './sections/CompanySections';
import NarrationPlayer from './components/NarrationPlayer';
import { useVisitTracking, type VisitSource } from './useVisitTracking';
import { isPageReload, tourProgress } from './tourProgress';
import { avatarUrl } from '../../utils/avatarUrl';
import { createViewerTexts } from './viewerTexts';
import { useViewerTexts, ViewerTextsProvider } from './useViewerTexts';

// Viewer of REAL tours (separate from the demo at /tour/:slug, which is not touched).
// Step 3: draft preview for the editor. Step 4 adds the public route reading the published version.

const SECTION_ICONS: Record<TourSectionKey, LucideIcon> = {
  summary: FileText,
  location: MapPin,
  personnel: Users,
  processes: GitBranch,
  safety: Shield,
  equipment: Wrench,
  products: Package,
  gallery: ImageIcon,
  documents: BookOpen,
  certifications: Award,
  highlights: BarChart3,
  custom: PenLine,
};

const sectionId = (s: TourSection) => sectionInstanceId(s);

// More languages than this do not fit in the header as buttons
const MAX_LANGUAGE_BUTTONS = 3;

/** Language picker. With many languages, the phone's own list over a small label (it shows their names) */
const LanguageSelector = ({ languages, onChange }: { languages: TourLanguage[]; onChange: (language: TourLanguage) => void }) => {
  const { language, t, languageName } = useViewerTexts();

  if (languages.length <= MAX_LANGUAGE_BUTTONS) {
    return (
      <div className="flex flex-shrink-0 rounded-md bg-slate-100 p-0.5" role="group" aria-label={t('language')}>
        {languages.map((l) => (
          <button
            key={l}
            onClick={() => onChange(l)}
            title={languageName(l)}
            aria-pressed={language === l}
            className={`rounded px-1.5 py-0.5 text-[11px] font-semibold sm:px-2 ${language === l ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'}`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="relative flex flex-shrink-0 items-center gap-1 rounded-md bg-slate-100 px-1.5 py-1 text-[11px] font-semibold text-blue-700 focus-within:ring-2 focus-within:ring-blue-400 hover:bg-slate-200">
      <Globe className="h-3.5 w-3.5" />
      {language.toUpperCase()}
      <ChevronDown className="h-3 w-3 text-slate-500" />
      <select
        value={language}
        onChange={(e) => onChange(e.target.value)}
        aria-label={t('language')}
        className="absolute inset-0 h-full min-h-0 w-full cursor-pointer opacity-0"
      >
        {languages.map((l) => (
          <option key={l} value={l}>
            {languageName(l)}
          </option>
        ))}
      </select>
    </div>
  );
};

const TourViewerRealPage = () => {
  const { tourId } = useParams<{ tourId: string }>();
  const navigate = useNavigate();

  const { data: view, isLoading, error } = useQuery({
    queryKey: ['tour-preview', tourId],
    queryFn: () => getTourPreview(tourId!),
    enabled: !!tourId,
    refetchOnWindowFocus: true, // the editor may be open in another tab
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Cargando tour…
      </div>
    );
  }

  if (error || !view) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50">
        <p className="text-slate-700">No se pudo cargar el tour.</p>
        <button onClick={() => navigate('/tours')} className="text-sm font-medium text-blue-600 hover:underline">
          Volver a Tours
        </button>
      </div>
    );
  }

  return <TourExperience view={view} onExit={() => navigate(`/tours/${tourId}/edit`)} />;
};

interface TourExperienceProps {
  view: TourView;
  onExit?: () => void; // preview only: back to the editor
  initialStopIndex?: number | null; // open directly at a stop (stop QR codes, ?stop=N)
  source?: VisitSource; // how the visitor arrived (visit stats)
}

export const TourExperience = ({ view, onExit = () => {}, initialStopIndex = null, source = 'link' }: TourExperienceProps) => {
  const validInitialStop =
    initialStopIndex !== null && initialStopIndex >= 0 && initialStopIndex < view.stops.length ? initialStopIndex : null;
  const progress = useMemo(() => tourProgress(view.tour.id, !!view.is_preview), [view.tour.id, view.is_preview]);
  const canUseLanguage = (value?: string): value is TourLanguage => view.tour.languages.includes(value as TourLanguage);
  // A QR code wins when arriving by it; its ?stop=N stays in the URL, so a reload does not count
  const [arrivalStop] = useState(() => (isPageReload() ? null : validInitialStop));
  // Reloading this tab keeps going; coming back later goes through the cover (see tourProgress)
  const [restored] = useState(() => {
    if (arrivalStop !== null || !progress.isThisTabInside()) return null;
    const saved = progress.read();
    const index = view.stops.findIndex((s) => s.id === saved?.stopId);
    return saved && index >= 0 ? { ...saved, index } : null;
  });
  const [stopIndex, setStopIndex] = useState(arrivalStop ?? restored?.index ?? 0);
  const [language, setLanguage] = useState<TourLanguage>(
    canUseLanguage(restored?.language) ? restored.language : view.tour.languages[0] || 'es'
  );
  const [activeSection, setActiveSection] = useState<string | null>(restored?.section ?? null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [started, setStarted] = useState(arrivalStop !== null || restored !== null); // false = cover screen (step 0)
  const [finished, setFinished] = useState(false); // end-of-tour screen
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  // The area list is fixed-positioned under the header and kept inside the screen on phones
  const toggleMenu = () => {
    if (!menuOpen) {
      const button = menuButtonRef.current?.getBoundingClientRect();
      const header = menuButtonRef.current?.closest('header')?.getBoundingClientRect();
      if (button && header) {
        const width = Math.min(288, window.innerWidth - 16);
        setMenuPosition({ top: header.bottom + 4, left: Math.max(8, Math.min(button.right - width, window.innerWidth - width - 8)) });
      }
    }
    setMenuOpen(!menuOpen);
  };

  const stops = view.stops;
  const stop = stops[stopIndex];
  const texts = useMemo(
    () => createViewerTexts(language, view.tour.source_language, view.tour.language_options),
    [language, view.tour.source_language, view.tour.language_options]
  );
  const { t, tn, text, languageName } = texts;

  // Browsers pick the glyphs and fonts of Japanese and Chinese from this (index.css)
  useEffect(() => {
    const previous = document.documentElement.lang;
    document.documentElement.lang = language;
    return () => {
      document.documentElement.lang = previous;
    };
  }, [language]);

  // Keep the selected tab valid when the stop or its sections change
  // Unknown section types are skipped instead of breaking the viewer
  const sections = (stop?.sections || []).filter((s) => s.key in SECTION_ICONS);
  const currentSection = sections.find((s) => sectionId(s) === activeSection) || sections[0];

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => !menuRef.current?.contains(e.target as Node) && setMenuOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  /** Back to the tour cover (step 0) */
  const goToCover = () => {
    setStarted(false);
    setFinished(false);
    setStopIndex(0);
    setActiveSection(null);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goTo = (index: number, keepSection = false) => {
    if (index < 0 || index >= stops.length || (index === stopIndex && started && !finished)) return;
    setStarted(true);
    setFinished(false);
    setStopIndex(index);
    if (!keepSection) setActiveSection(null);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToArea = (areaId: string) => goTo(stops.findIndex((s) => s.area_id === areaId), true);

  // Remember the place while inside the tour; finishing it forgets it
  const currentSectionId = currentSection ? sectionId(currentSection) : null;
  useEffect(() => {
    if (finished) progress.clear();
    else if (!started) progress.leaveThisTab();
    else if (stop) progress.save({ stopId: stop.id, section: currentSectionId, language });
  }, [progress, started, finished, stop, currentSectionId, language]);

  // On the cover: the place to continue from. The first area needs no offer, starting is the same
  const savedProgress = !started ? progress.read() : null;
  const resumeIndex = savedProgress ? stops.findIndex((s) => s.id === savedProgress.stopId) : -1;
  const resume = savedProgress && resumeIndex > 0 ? { ...savedProgress, index: resumeIndex } : null;
  const continueTour = () => {
    if (!resume) return;
    if (canUseLanguage(resume.language)) setLanguage(resume.language);
    setActiveSection(resume.section);
    goTo(resume.index, true);
  };

  const tourTitle = text(view.tour.title);
  // Without narration in the selected language, visitors hear the one it was written in (same as texts)
  const audioUrl = stop?.audio?.[language] || stop?.audio?.[view.tour.source_language] || null;
  const audioFallback = audioUrl && !stop?.audio?.[language] ? view.tour.source_language : null;

  // Anonymous visit stats (published tours only, never the editor preview)
  const { onNarration } = useVisitTracking({
    enabled: !view.is_preview,
    tourId: view.tour.id,
    publicCode: view.tour.public_code,
    source,
    entryStopId: source === 'qr' && validInitialStop !== null ? stops[validInitialStop]?.id ?? null : null,
    language,
    stopId: started && !finished ? stop?.id ?? null : null,
    finished,
  });

  const renderSection = useMemo(
    () => (section: TourSection) => {
      switch (section.key) {
        case 'summary':
          return <SummarySection stop={stop} />;
        case 'location':
          return <LocationSection view={view} stop={stop} onGoToArea={goToArea} />;
        case 'personnel':
          return <PersonnelSection stop={stop} />;
        case 'safety':
          return <SafetySection stop={stop} />;
        case 'equipment':
          return <EquipmentSection stop={stop} />;
        case 'products':
          return <ProductsSection stop={stop} />;
        case 'processes':
          return <ProcessesSection stop={stop} />;
        case 'gallery':
          return <GallerySection stop={stop} />;
        case 'documents':
          return <DocumentsSection stop={stop} />;
        case 'certifications':
          return <CertificationsSection stop={stop} />;
        case 'highlights':
          return <HighlightsSection stop={stop} />;
        case 'custom':
          return <CustomSection section={section} />;
        default:
          return null;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stop, view]
  );

  return (
    <ViewerTextsProvider texts={texts}>
    <div className="min-h-screen bg-slate-50">
      {view.is_preview && (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-amber-100 px-4 py-2 text-xs text-amber-900">
          <span className="flex items-center gap-1.5">
            <Eye className="h-4 w-4" />
            <strong>Vista previa del borrador.</strong> Así lo verán tus visitantes. La narración en audio se genera al
            publicar.
          </span>
          <button onClick={onExit} className="font-semibold underline hover:no-underline">
            Volver al editor
          </button>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-6 sm:py-2.5">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {view.is_preview && (
              <button onClick={onExit} className="rounded-md p-1 text-slate-500 hover:bg-slate-100" aria-label="Volver al editor">
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            {view.tour.organization.logo_url && (
              <img src={view.tour.organization.logo_url} alt="" className="hidden h-8 w-8 rounded object-contain sm:block" />
            )}
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-base font-bold text-blue-700">{tourTitle}</p>
              <p className="hidden truncate text-[11px] text-slate-500 sm:block">
                {view.tour.organization.name} · {view.tour.plant_name}
              </p>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-1 sm:flex-none sm:gap-2">
            {stops.length > 0 && (
              <div ref={menuRef} className="flex flex-shrink-0 items-center gap-0.5">
                <button
                  onClick={() => (stopIndex === 0 || finished ? goToCover() : goTo(stopIndex - 1))}
                  disabled={!started}
                  className="rounded-md p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                  aria-label={t('previous_area')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  ref={menuButtonRef}
                  onClick={toggleMenu}
                  className={`flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-slate-700 ${menuOpen ? 'bg-slate-100' : 'hover:bg-slate-100'}`}
                  aria-haspopup="listbox"
                  aria-expanded={menuOpen}
                >
                  {started ? `${stopIndex + 1}/${stops.length}` : tn('areas', stops.length)}
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                </button>
                <button
                  onClick={() => (started ? goTo(stopIndex + 1) : goTo(0))}
                  disabled={started && stopIndex === stops.length - 1}
                  className="rounded-md p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                  aria-label={t('next_area')}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                {menuOpen && (
                  <div
                    role="listbox"
                    className="fixed z-50 max-h-[60vh] w-72 max-w-[calc(100vw-1rem)] overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl"
                    style={{ top: menuPosition.top, left: menuPosition.left }}
                  >
                    <button
                      role="option"
                      aria-selected={!started}
                      onClick={() => (started ? goToCover() : setMenuOpen(false))}
                      className={`flex w-full items-center gap-3 border-b border-slate-100 px-3 py-2 text-left ${!started ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                    >
                      <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${!started ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <Home className="h-3.5 w-3.5" />
                      </span>
                      <span className={`flex-1 text-sm ${!started ? 'font-semibold text-blue-700' : 'text-slate-800'}`}>
                        {t('tour_start')}
                      </span>
                      {!started && <Check className="h-4 w-4 text-blue-600" />}
                    </button>
                    {stops.map((s, i) => (
                      <button
                        key={s.id}
                        role="option"
                        aria-selected={started && i === stopIndex}
                        onClick={() => (started && i === stopIndex ? setMenuOpen(false) : goTo(i))}
                        className={`flex w-full items-center gap-3 px-3 py-2 text-left ${i === stopIndex ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                      >
                        <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${i === stopIndex ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          {i + 1}
                        </span>
                        <span className={`min-w-0 flex-1 truncate text-sm ${i === stopIndex ? 'font-semibold text-blue-700' : 'text-slate-800'}`}>
                          {text(s.title) || s.area?.name}
                        </span>
                        {i === stopIndex && <Check className="h-4 w-4 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {started && !finished && audioUrl && (
              <NarrationPlayer key={audioUrl} src={audioUrl} fallbackLanguage={audioFallback} onListen={onNarration} />
            )}

            {view.tour.languages.length > 1 && <LanguageSelector languages={view.tour.languages} onChange={setLanguage} />}
          </div>
        </div>
        <p className="truncate px-3 pb-1.5 text-xs font-bold text-blue-700 sm:hidden">{tourTitle}</p>
        {stops.length > 0 && (
          <div className="h-1 bg-slate-100">
            <div
              className="h-full bg-blue-600 transition-all duration-500"
              style={{ width: `${started ? ((stopIndex + 1) / stops.length) * 100 : 0}%` }}
            />
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-3 py-5 sm:px-6">
        {!stop ? (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center text-slate-600">
            {t('no_areas')}
          </div>
        ) : !started ? (
          <TourCover
            view={view}
            onStart={() => goTo(0)}
            onOpenStop={goTo}
            resume={resume && { title: text(stops[resume.index].title) || stops[resume.index].area?.name || '', position: resume.index + 1 }}
            onContinue={continueTour}
          />
        ) : finished ? (
          <section className="rounded-xl border border-slate-200 bg-white p-6 text-center sm:p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <Flag className="h-7 w-7 text-green-600" />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-slate-900">{t('tour_completed')}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {t('thanks_for_visiting', { tour: tourTitle })}
            </p>
            <div className="mx-auto mt-6 max-w-md text-left">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t('areas_visited')}
              </p>
              <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {stops.map((s, i) => (
                  <li key={s.id}>
                    <button onClick={() => goTo(i)} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-50">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-600 text-xs font-semibold text-white">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-800">{text(s.title) || s.area?.name}</span>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <button
                onClick={goToCover}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <RotateCcw className="h-4 w-4" />
                {t('back_to_start')}
              </button>
              {view.is_preview && (
                <button onClick={onExit} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  {t('back_to_editor')}
                </button>
              )}
            </div>
          </section>
        ) : (
          <>
            {/* Stop hero */}
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="grid md:grid-cols-2">
                <div className="relative aspect-video bg-gradient-to-br from-blue-600 to-slate-800 md:aspect-auto md:min-h-[16rem]">
                  {stop.image_url && <img src={stop.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />}
                  <span className="absolute left-3 top-3 rounded-md bg-blue-600 px-2 py-0.5 text-xs font-bold text-white shadow">
                    {stopIndex + 1}/{stops.length}
                  </span>
                </div>
                {/* Like the demo: the info column has a max height and scrolls (e.g. when the FAQ is open) */}
                <div className="max-h-96 space-y-4 overflow-y-auto p-5">
                  <div>
                    <h1 className="text-2xl font-bold text-blue-700">{text(stop.title) || stop.area?.name}</h1>
                    {stop.area?.description && <p className="mt-1 text-sm text-slate-600">{stop.area.description}</p>}
                  </div>
                  {stop.responsible && (
                    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      {stop.responsible.avatar_url ? (
                        <img src={avatarUrl(stop.responsible.avatar_url, 44)!} alt="" className="h-11 w-11 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white">
                          <User className="h-5 w-5 text-slate-400" />
                        </div>
                      )}
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">{t('in_charge')}</p>
                        <p className="text-sm font-semibold text-slate-900">{stop.responsible.name}</p>
                        {stop.responsible.position && <p className="text-xs text-slate-600">{stop.responsible.position}</p>}
                      </div>
                    </div>
                  )}
                  <StopFaq stop={stop} />
                  {audioUrl ? (
                    audioFallback && (
                      <p className="flex items-center gap-2 text-xs text-slate-500">
                        <Volume2 className="h-4 w-4 flex-shrink-0 text-slate-400" />
                        {t('narration_only_in', { language: languageName(audioFallback) })}
                      </p>
                    )
                  ) : (
                    <p className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600">
                      <Volume2 className="h-4 w-4 flex-shrink-0 text-slate-400" />
                      {view.is_preview
                        ? t('narration_on_publish')
                        : t('no_narration')}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Sections */}
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              {sections.length === 0 ? (
                <p className="p-8 text-center text-sm text-slate-500">
                  {t('no_content')}
                </p>
              ) : (
                <>
                  <div className="overflow-x-auto border-b border-slate-200">
                    <div className="flex">
                      {sections.map((s) => {
                        const TabIcon =
                          s.key === 'custom' ? CUSTOM_SECTION_ICONS[s.icon || DEFAULT_CUSTOM_SECTION_ICON].Icon : SECTION_ICONS[s.key];
                        const isActive = currentSection && sectionId(s) === sectionId(currentSection);
                        const sectionName = t(`section_${s.key}`);
                        const label = s.key === 'custom' ? text(s.title) || sectionName : sectionName;
                        return (
                          <button
                            key={sectionId(s)}
                            onClick={() => setActiveSection(sectionId(s))}
                            className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-xs font-medium transition-colors ${
                              isActive ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                          >
                            <TabIcon className="h-4 w-4" />
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="p-4 sm:p-5">{currentSection && renderSection(currentSection)}</div>
                </>
              )}
            </section>

            {/* Bottom navigation */}
            <nav className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
              <button
                onClick={() => (stopIndex === 0 ? goToCover() : goTo(stopIndex - 1))}
                className="flex min-w-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{stopIndex > 0 ? text(stops[stopIndex - 1].title) : t('start')}</span>
              </button>
              {stopIndex < stops.length - 1 ? (
                <button
                  onClick={() => goTo(stopIndex + 1)}
                  className="flex min-w-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <span className="truncate">{text(stops[stopIndex + 1].title)}</span>
                  <ChevronRight className="h-4 w-4 flex-shrink-0" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    setFinished(true);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  <Flag className="h-4 w-4" />
                  {t('finish_tour')}
                </button>
              )}
            </nav>
          </>
        )}
      </main>
    </div>
    </ViewerTextsProvider>
  );
};

/** Step 0: tour cover with the general info and the "start" button */
const TourCover = ({
  view,
  onStart,
  onOpenStop,
  resume,
  onContinue,
}: {
  view: TourView;
  onStart: () => void;
  onOpenStop: (index: number) => void;
  resume: { title: string; position: number } | null;
  onContinue: () => void;
}) => {
  const { t, tn, text, languageName } = useViewerTexts();
  const company = view.tour.organization.profile;
  // Tour cover, else the plant's (or company's) cover photo, else the first area photo
  const cover = view.tour.cover_image_url || company?.plant_cover_url || view.stops.find((s) => s.image_url)?.image_url || null;
  const description = text(view.tour.description);
  const tagline = text(company?.tagline);

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 to-slate-900 text-white">
        {cover && <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/55 to-slate-900/20" />
        <div className="relative flex min-h-[22rem] flex-col justify-end gap-4 p-6 sm:min-h-[26rem] sm:p-10">
          {view.tour.organization.name && (
            <div className="flex items-center gap-2">
              {view.tour.organization.logo_url && (
                <img src={view.tour.organization.logo_url} alt="" className="h-9 w-9 rounded bg-white/90 object-contain p-1" />
              )}
              <span className="text-sm font-medium text-white/90">
                {view.tour.organization.name} · {view.tour.plant_name}
                {tagline && <span className="block text-xs font-normal text-white/75">{tagline}</span>}
              </span>
            </div>
          )}
          <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">{text(view.tour.title)}</h1>
          {description && <p className="max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">{description}</p>}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 backdrop-blur">
              <MapPin className="h-3.5 w-3.5" />
              {tn('areas', view.stops.length)}
            </span>
            {view.tour.languages.length > 1 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 backdrop-blur">
                <Globe className="h-3.5 w-3.5" />
                {view.tour.languages.map(languageName).join(' · ')}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {resume && (
              <button
                onClick={onContinue}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-blue-700 shadow-lg transition-transform hover:scale-[1.02] hover:bg-blue-50"
              >
                <Play className="h-5 w-5 flex-shrink-0" />
                {t('continue_at', { area: resume.title, position: resume.position, total: view.stops.length })}
              </button>
            )}
            <button
              onClick={onStart}
              className={
                resume
                  ? 'inline-flex items-center gap-2 rounded-xl border border-white/60 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-white/10'
                  : 'inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-blue-700 shadow-lg transition-transform hover:scale-[1.02] hover:bg-blue-50'
              }
            >
              {!resume && <Play className="h-5 w-5" />}
              {resume ? t('start_again') : t('start_tour')}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          {t('what_you_will_see')}
        </h2>
        <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {view.stops.map((s, i) => (
            <li key={s.id}>
              <button
                onClick={() => onOpenStop(i)}
                className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-2.5 text-left transition-colors hover:border-blue-300 hover:bg-blue-50/40"
              >
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {i + 1}
                </span>
                {s.image_url && <img src={s.image_url} alt="" className="h-10 w-14 flex-shrink-0 rounded object-cover" />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-900">{text(s.title) || s.area?.name}</span>
                  {s.area?.description && <span className="block truncate text-xs text-slate-500">{s.area.description}</span>}
                </span>
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-400" />
              </button>
            </li>
          ))}
        </ol>
      </section>

      <CompanySection view={view} />
      <PlantSection view={view} />
    </div>
  );
};

export default TourViewerRealPage;

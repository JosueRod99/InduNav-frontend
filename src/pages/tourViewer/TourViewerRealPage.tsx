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
  Volume2,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { sectionInstanceId, type TourLanguage, type TourSection, type TourSectionKey } from '../../api/tourBuilder';
import { getTourPreview, tr, type TourView } from '../../api/tourView';
import {
  CertificationsSection,
  CustomSection,
  DocumentsSection,
  EquipmentSection,
  GallerySection,
  HighlightsSection,
  PersonnelSection,
  ProductsSection,
  SafetySection,
  StopFaq,
  SummarySection,
} from './sections/StopSections';
import { CUSTOM_SECTION_ICONS, DEFAULT_CUSTOM_SECTION_ICON } from '../../components/tours/customSectionIcons';
import LocationSection from './sections/LocationSection';

// Viewer of REAL tours (separate from the demo at /tour/:slug, which is not touched).
// Step 3: draft preview for the editor. Step 4 adds the public route reading the published version.

const SECTION_META: Record<TourSectionKey, { es: string; en: string; Icon: LucideIcon }> = {
  summary: { es: 'Resumen', en: 'Summary', Icon: FileText },
  location: { es: 'Ubicación', en: 'Location', Icon: MapPin },
  personnel: { es: 'Personal', en: 'Team', Icon: Users },
  safety: { es: 'Seguridad', en: 'Safety', Icon: Shield },
  equipment: { es: 'Equipos', en: 'Equipment', Icon: Wrench },
  products: { es: 'Productos', en: 'Products', Icon: Package },
  gallery: { es: 'Galería', en: 'Gallery', Icon: ImageIcon },
  documents: { es: 'Documentos', en: 'Documents', Icon: BookOpen },
  certifications: { es: 'Certificaciones', en: 'Certifications', Icon: Award },
  highlights: { es: 'Datos destacados', en: 'Key figures', Icon: BarChart3 },
  custom: { es: 'Sección', en: 'Section', Icon: PenLine },
};

const sectionId = (s: TourSection) => sectionInstanceId(s);

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
}

export const TourExperience = ({ view, onExit = () => {}, initialStopIndex = null }: TourExperienceProps) => {
  const validInitialStop =
    initialStopIndex !== null && initialStopIndex >= 0 && initialStopIndex < view.stops.length ? initialStopIndex : null;
  const [stopIndex, setStopIndex] = useState(validInitialStop ?? 0);
  const [language, setLanguage] = useState<TourLanguage>(view.tour.languages[0] || 'es');
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [started, setStarted] = useState(validInitialStop !== null); // false = cover screen (step 0)
  const [finished, setFinished] = useState(false); // end-of-tour screen
  const menuRef = useRef<HTMLDivElement>(null);

  const stops = view.stops;
  const stop = stops[stopIndex];
  const lang = (es: string, en: string) => (language === 'es' ? es : en);

  // Keep the selected tab valid when the stop or its sections change
  // Unknown section types are skipped instead of breaking the viewer
  const sections = (stop?.sections || []).filter((s) => s.key in SECTION_META);
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

  const tourTitle = tr(view.tour.title, language);
  // Without narration in the selected language, visitors hear the Spanish one (same as texts)
  const audioUrl = stop?.audio?.[language] || stop?.audio?.es || null;
  const audioIsFallback = !!audioUrl && !stop?.audio?.[language];

  const renderSection = useMemo(
    () => (section: TourSection) => {
      switch (section.key) {
        case 'summary':
          return <SummarySection stop={stop} language={language} />;
        case 'location':
          return <LocationSection view={view} stop={stop} language={language} onGoToArea={goToArea} />;
        case 'personnel':
          return <PersonnelSection stop={stop} language={language} />;
        case 'safety':
          return <SafetySection stop={stop} language={language} />;
        case 'equipment':
          return <EquipmentSection stop={stop} language={language} />;
        case 'products':
          return <ProductsSection stop={stop} language={language} />;
        case 'gallery':
          return <GallerySection stop={stop} />;
        case 'documents':
          return <DocumentsSection stop={stop} language={language} />;
        case 'certifications':
          return <CertificationsSection stop={stop} language={language} />;
        case 'highlights':
          return <HighlightsSection stop={stop} language={language} />;
        case 'custom':
          return <CustomSection section={section} language={language} />;
        default:
          return null;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stop, language, view]
  );

  return (
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
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-2.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {view.is_preview && (
              <button onClick={onExit} className="rounded-md p-1 text-slate-500 hover:bg-slate-100" aria-label="Volver al editor">
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            {view.tour.organization.logo_url && (
              <img src={view.tour.organization.logo_url} alt="" className="hidden h-8 w-8 rounded object-contain sm:block" />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-blue-700 sm:text-base">{tourTitle}</p>
              <p className="hidden truncate text-[11px] text-slate-500 sm:block">
                {view.tour.organization.name} · {view.tour.plant_name}
              </p>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            {stops.length > 0 && (
              <div ref={menuRef} className="relative flex items-center gap-0.5">
                <button
                  onClick={() => (stopIndex === 0 || finished ? goToCover() : goTo(stopIndex - 1))}
                  disabled={!started}
                  className="rounded-md p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                  aria-label={lang('Área anterior', 'Previous area')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className={`flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-slate-700 ${menuOpen ? 'bg-slate-100' : 'hover:bg-slate-100'}`}
                  aria-haspopup="listbox"
                  aria-expanded={menuOpen}
                >
                  {started ? `${stopIndex + 1}/${stops.length}` : `${stops.length} ${lang('áreas', 'areas')}`}
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                </button>
                <button
                  onClick={() => (started ? goTo(stopIndex + 1) : goTo(0))}
                  disabled={started && stopIndex === stops.length - 1}
                  className="rounded-md p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                  aria-label={lang('Siguiente área', 'Next area')}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                {menuOpen && (
                  <div role="listbox" className="absolute right-0 top-full z-50 mt-1 max-h-[60vh] w-72 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl">
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
                        {lang('Inicio del recorrido', 'Tour start')}
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
                          {tr(s.title, language) || s.area?.name}
                        </span>
                        {i === stopIndex && <Check className="h-4 w-4 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {view.tour.languages.length > 1 && (
              <div className="flex rounded-md bg-slate-100 p-0.5">
                {view.tour.languages.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLanguage(l)}
                    className={`rounded px-2 py-0.5 text-[11px] font-semibold ${language === l ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'}`}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
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
            {lang('Este tour todavía no tiene áreas.', 'This tour has no areas yet.')}
          </div>
        ) : !started ? (
          <TourCover view={view} language={language} onStart={() => goTo(0)} onOpenStop={goTo} />
        ) : finished ? (
          <section className="rounded-xl border border-slate-200 bg-white p-6 text-center sm:p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <Flag className="h-7 w-7 text-green-600" />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-slate-900">{lang('¡Recorrido terminado!', 'Tour completed!')}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {lang(`Gracias por recorrer ${tourTitle}.`, `Thank you for visiting ${tourTitle}.`)}
            </p>
            <div className="mx-auto mt-6 max-w-md text-left">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {lang('Áreas que visitaste', 'Areas you visited')}
              </p>
              <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {stops.map((s, i) => (
                  <li key={s.id}>
                    <button onClick={() => goTo(i)} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-50">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-600 text-xs font-semibold text-white">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-800">{tr(s.title, language) || s.area?.name}</span>
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
                {lang('Volver al inicio', 'Start over')}
              </button>
              {view.is_preview && (
                <button onClick={onExit} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  {lang('Volver al editor', 'Back to editor')}
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
                <div className="space-y-4 p-5">
                  <div>
                    <h1 className="text-2xl font-bold text-blue-700">{tr(stop.title, language) || stop.area?.name}</h1>
                    {stop.area?.description && <p className="mt-1 text-sm text-slate-600">{stop.area.description}</p>}
                  </div>
                  {stop.responsible && (
                    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      {stop.responsible.avatar_url ? (
                        <img src={stop.responsible.avatar_url} alt="" className="h-11 w-11 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white">
                          <User className="h-5 w-5 text-slate-400" />
                        </div>
                      )}
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">{lang('Responsable', 'In charge')}</p>
                        <p className="text-sm font-semibold text-slate-900">{stop.responsible.name}</p>
                        {stop.responsible.position && <p className="text-xs text-slate-600">{stop.responsible.position}</p>}
                      </div>
                    </div>
                  )}
                  <StopFaq stop={stop} language={language} />
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600">
                    <Volume2 className="h-4 w-4 text-slate-400" />
                    {audioUrl ? (
                      <div className="w-full">
                        <audio key={audioUrl} controls src={audioUrl} className="h-8 w-full" />
                        {audioIsFallback && <p className="mt-1 text-[11px] text-slate-500">Narration available in Spanish only.</p>}
                      </div>
                    ) : view.is_preview ? (
                      lang('La narración de esta área se generará al publicar.', 'Narration will be generated when the tour is published.')
                    ) : (
                      lang('Esta área no tiene narración.', 'This area has no narration.')
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Sections */}
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              {sections.length === 0 ? (
                <p className="p-8 text-center text-sm text-slate-500">
                  {lang('Esta área todavía no tiene contenido visible.', 'This area has no visible content yet.')}
                </p>
              ) : (
                <>
                  <div className="overflow-x-auto border-b border-slate-200">
                    <div className="flex">
                      {sections.map((s) => {
                        const meta = SECTION_META[s.key];
                        const TabIcon =
                          s.key === 'custom' ? CUSTOM_SECTION_ICONS[s.icon || DEFAULT_CUSTOM_SECTION_ICON].Icon : meta.Icon;
                        const isActive = currentSection && sectionId(s) === sectionId(currentSection);
                        const label =
                          s.key === 'custom' ? tr(s.title, language) || meta[language] : meta[language];
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
                <span className="truncate">{stopIndex > 0 ? tr(stops[stopIndex - 1].title, language) : lang('Inicio', 'Start')}</span>
              </button>
              {stopIndex < stops.length - 1 ? (
                <button
                  onClick={() => goTo(stopIndex + 1)}
                  className="flex min-w-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <span className="truncate">{tr(stops[stopIndex + 1].title, language)}</span>
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
                  {lang('Finalizar recorrido', 'Finish tour')}
                </button>
              )}
            </nav>
          </>
        )}
      </main>
    </div>
  );
};

/** Step 0: tour cover with the general info and the "start" button */
const TourCover = ({
  view,
  language,
  onStart,
  onOpenStop,
}: {
  view: TourView;
  language: TourLanguage;
  onStart: () => void;
  onOpenStop: (index: number) => void;
}) => {
  const lang = (es: string, en: string) => (language === 'es' ? es : en);
  const cover = view.tour.cover_image_url || view.stops.find((s) => s.image_url)?.image_url || null;
  const description = tr(view.tour.description, language);

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
              </span>
            </div>
          )}
          <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">{tr(view.tour.title, language)}</h1>
          {description && <p className="max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">{description}</p>}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 backdrop-blur">
              <MapPin className="h-3.5 w-3.5" />
              {view.stops.length} {lang(view.stops.length === 1 ? 'área' : 'áreas', view.stops.length === 1 ? 'area' : 'areas')}
            </span>
            {view.tour.languages.length > 1 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 backdrop-blur">
                <Globe className="h-3.5 w-3.5" />
                {view.tour.languages.map((l) => l.toUpperCase()).join(' · ')}
              </span>
            )}
          </div>
          <div>
            <button
              onClick={onStart}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-blue-700 shadow-lg transition-transform hover:scale-[1.02] hover:bg-blue-50"
            >
              <Play className="h-5 w-5" />
              {lang('Iniciar recorrido', 'Start tour')}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          {lang('Qué vas a conocer', 'What you will see')}
        </h2>
        <ol className="grid gap-2 sm:grid-cols-2">
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
                  <span className="block truncate text-sm font-semibold text-slate-900">{tr(s.title, language) || s.area?.name}</span>
                  {s.area?.description && <span className="block truncate text-xs text-slate-500">{s.area.description}</span>}
                </span>
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-400" />
              </button>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
};

export default TourViewerRealPage;

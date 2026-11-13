import { confirmar } from '../../components/ui/ConfirmDialog';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CloudOff,
  Copy,
  ExternalLink,
  Eye,
  BarChart3,
  Loader2,
  Rocket,
  Share2,
  Volume2,
  FlaskConical,
  Languages,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import { moveItem } from '../../components/ui/SortableList';
import { useAutosave, type AutosaveStatus } from '../../hooks/useAutosave';
import {
  addTourStop,
  deleteTourStop,
  getStopSectionCounts,
  getTourBuilder,
  reorderTourStops,
  updateTourSettings,
  updateTourStop,
  SECTION_LABELS,
  type BuilderStop,
  type TourSection,
  type TourSectionKey,
  type TourBuilderData,
  type TourLanguage,
  type UpdateStopPayload,
  type UpdateTourSettingsPayload,
} from '../../api/tourBuilder';
import { getTourPreview } from '../../api/tourView';
import { getLiveTexts, getPublishEstimate, markTranslationsSeen, saveLiveTranslation, translateTour, type TourLiveTexts } from '../../api/tourBuilder';
import { pendingTranslations } from '../../utils/translationState';
import { SourceLanguageContext, TranslationMetaContext } from './editor/sourceLanguage';
import StopNarrationEditor from './editor/StopNarrationEditor';
import StopsPanel from './editor/StopsPanel';
import StopContentEditor from './editor/StopContentEditor';
import SectionsEditor, { applyStructure } from './editor/SectionsEditor';
import TourSettingsEditor from './editor/TourSettingsEditor';
import LiveTextsEditor from './editor/LiveTextsEditor';
import LanguageFlag from '../../components/ui/LanguageFlag';
import AddStopModal from './editor/AddStopModal';
import PublishTourModal from './modals/PublishTourModal';
import ShareTourModal from './modals/ShareTourModal';
import { toursListPath } from './toursReturn';
import { useCan } from '../../hooks/usePermissions';

type EditorTab = 'content' | 'sections' | 'narration' | 'live';

const STATUS_PRIORITY: AutosaveStatus[] = ['error', 'saving', 'pending', 'saved', 'idle'];

const SaveIndicator = ({ status }: { status: AutosaveStatus }) => {
  if (status === 'idle') return null;
  const config = {
    pending: { Icon: Loader2, text: 'Cambios por guardar…', className: 'text-gray-500', spin: false },
    saving: { Icon: Loader2, text: 'Guardando…', className: 'text-gray-500', spin: true },
    saved: { Icon: Check, text: 'Guardado', className: 'text-green-600', spin: false },
    error: { Icon: CloudOff, text: 'No se pudo guardar', className: 'text-red-600', spin: false },
  }[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${config.className}`} role="status">
      <config.Icon className={`h-3.5 w-3.5 ${config.spin ? 'animate-spin' : ''}`} />
      {config.text}
    </span>
  );
};

const TourEditorPage = () => {
  const { tourId } = useParams<{ tourId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const queryKey = ['tour-builder', tourId];

  const [selectedStopId, setSelectedStopId] = useState<string | null | undefined>(undefined);
  const [pickedLanguage, setLanguage] = useState<TourLanguage | null>(null);
  const [searchParams] = useSearchParams();
  // The alert on Inicio opens the plant data directly
  const [tab, setTab] = useState<EditorTab>(searchParams.get('tab') === 'live' ? 'live' : 'content');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const canPublish = useCan()('tours.publish');

  // Opening the tour turns off its "translated automatically" alert on Inicio, for this user
  useEffect(() => {
    if (!tourId) return;
    markTranslationsSeen(tourId)
      .then(() => queryClient.invalidateQueries({ queryKey: ['translation-alerts'] }))
      .catch(() => undefined);
  }, [tourId, queryClient]);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  // While editing, the cache is the source of truth: no background refetch over typed text
  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => getTourBuilder(tourId!),
    enabled: !!tourId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
  const sourceCode = data?.tour.source_language ?? 'es';

  const tour = data?.tour;
  const stops = data?.stops || [];

  // Select the first stop (or the tour settings) once loaded
  useEffect(() => {
    if (data && selectedStopId === undefined) setSelectedStopId(data.stops[0]?.id ?? null);
  }, [data, selectedStopId]);

  const selectedStop = stops.find((s) => s.id === selectedStopId) || null;

  const setBuilder = (updater: (prev: TourBuilderData) => TourBuilderData) =>
    queryClient.setQueryData<TourBuilderData>(queryKey, (prev) => (prev ? updater(prev) : prev));

  const markUnpublished = () =>
    setBuilder((prev) => ({ ...prev, tour: { ...prev.tour, has_unpublished_changes: true } }));

  // ---------- Autosave ----------
  const stopAutosave = useAutosave<{ id: string } & UpdateStopPayload>(async ({ id, ...payload }) => {
    await updateTourStop(id, payload);
    markUnpublished();
  });

  const settingsAutosave = useAutosave<UpdateTourSettingsPayload>(async (payload) => {
    await updateTourSettings(tourId!, payload);
    markUnpublished();
  });

  const saveStatus = STATUS_PRIORITY.find((s) => s === stopAutosave.status || s === settingsAutosave.status) || 'idle';

  useEffect(() => {
    if (stopAutosave.status === 'error' || settingsAutosave.status === 'error') {
      const refused = stopAutosave.status === 'error' ? stopAutosave.errorMessage : settingsAutosave.errorMessage;
      toast.error(refused || 'No se pudieron guardar los últimos cambios. Revisa tu conexión.');
    }
  }, [stopAutosave.status, stopAutosave.errorMessage, settingsAutosave.status, settingsAutosave.errorMessage]);

  // Warn before leaving the page with unsaved edits
  useEffect(() => {
    const unsaved = saveStatus === 'pending' || saveStatus === 'saving';
    if (!unsaved) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [saveStatus]);

  const editStop = (stopId: string, patch: UpdateStopPayload) => {
    setBuilder((prev) => ({
      ...prev,
      stops: prev.stops.map((s) => (s.id === stopId ? ({ ...s, ...patch } as BuilderStop) : s)),
    }));
    stopAutosave.schedule({ id: stopId, ...patch });
  };

  /**
   * Automatic translation of what is missing or outdated. Saves first and then takes the editor data
   * the server answers with; editing waits meanwhile so nothing typed is lost.
   */
  const translate = async (languages?: string[]) => {
    if (isTranslating) return;
    setIsTranslating(true);
    (document.activeElement as HTMLElement | null)?.blur();
    try {
      await flushAll();
      const { result, builder } = await translateTour(tourId!, languages);
      queryClient.setQueryData(queryKey, builder);
      await refetchLive();
      toast.success(result.translated ? `${result.translated} ${result.translated === 1 ? 'texto traducido' : 'textos traducidos'}` : 'No había nada que traducir');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'No se pudo traducir', { duration: 7000 });
    } finally {
      setIsTranslating(false);
    }
  };

  const editSettings = (patch: UpdateTourSettingsPayload) => {
    const added = patch.languages?.filter((code) => !data?.tour.languages.includes(code)) ?? [];
    setBuilder((prev) => ({ ...prev, tour: { ...prev.tour, ...patch } }));
    settingsAutosave.schedule(patch);
    // A language just turned on gets its texts right away
    if (added.length) void translate(added);
  };

  const selectStop = async (stopId: string | null) => {
    await stopAutosave.flush(); // pending edits belong to the previous stop
    setSelectedStopId(stopId);
  };

  // ---------- Stops ----------
  const addMutation = useMutation({
    mutationFn: (areaId: string) => addTourStop(tourId!, areaId),
    onSuccess: async (stop) => {
      await stopAutosave.flush();
      setBuilder((prev) => ({
        ...prev,
        tour: { ...prev.tour, has_unpublished_changes: true },
        stops: [...prev.stops, stop],
      }));
      setSelectedStopId(stop.id);
      setTab('content');
      refetchLive();
      toast.success(`"${stop.area_name}" agregada como área ${stop.order_index}`);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'No se pudo agregar el área'),
  });

  const handleMove = async (from: number, to: number) => {
    const reordered = moveItem(stops, from, to).map((s, i) => ({ ...s, order_index: i + 1 }));
    setBuilder((prev) => ({ ...prev, stops: reordered }));
    try {
      await stopAutosave.flush();
      await reorderTourStops(tourId!, reordered.map((s) => s.id));
      markUnpublished();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'No se pudo cambiar el orden');
      queryClient.invalidateQueries({ queryKey });
    }
  };

  const handleDelete = async (stop: BuilderStop) => {
    const name = stop.title_translations[sourceCode] || stop.area_name;
    const confirmed = await confirmar({
      title: 'Quitar área del tour',
      message: `Se quitará "${name}" del tour y se perderán su texto y secciones. El área no se borra.`,
      confirmLabel: 'Quitar',
    });
    if (!confirmed) return;
    try {
      await stopAutosave.flush();
      await deleteTourStop(stop.id);
      const remaining = stops.filter((s) => s.id !== stop.id).map((s, i) => ({ ...s, order_index: i + 1 }));
      setBuilder((prev) => ({ ...prev, tour: { ...prev.tour, has_unpublished_changes: true }, stops: remaining }));
      if (selectedStopId === stop.id) setSelectedStopId(remaining[0]?.id ?? null);
      refetchLive();
      toast.success('Área quitada del tour');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'No se pudo quitar el área');
    }
  };

  /** Show or hide one built-in section in every stop (and in the structure for new stops) */
  const applySectionToAll = async (key: TourSectionKey, visible: boolean) => {
    const label = SECTION_LABELS[key];
    const confirmed = await confirmar({
      title: `${visible ? 'Mostrar' : 'Ocultar'} sección`,
      message: `Se va a ${visible ? 'mostrar' : 'ocultar'} "${label}" en las ${stops.length} áreas del tour.\n\nDespués puedes cambiarlo en cada área.`,
      confirmLabel: visible ? 'Mostrar' : 'Ocultar',
      danger: false,
    });
    if (!confirmed) return;
    const withVisibility = (sections: TourSection[]) =>
      sections.some((s) => s.key === key) ? sections.map((s) => (s.key === key ? { ...s, visible } : s)) : [...sections, { key, visible }];
    try {
      await stopAutosave.flush();
      for (const stop of stops) {
        await updateTourStop(stop.id, { sections: withVisibility(stop.sections) });
      }
      const template = withVisibility(data!.tour.default_sections);
      await updateTourSettings(tourId!, { default_sections: template });
      setBuilder((prev) => ({
        ...prev,
        tour: { ...prev.tour, default_sections: template, has_unpublished_changes: true },
        stops: prev.stops.map((s) => ({ ...s, sections: withVisibility(s.sections) })),
      }));
      toast.success(`"${label}" ${visible ? 'visible' : 'oculta'} en todas las áreas`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'No se pudo aplicar a todas las áreas');
    }
  };

  const applyToAllStops = async () => {
    if (!selectedStop) return;
    const confirmed = await confirmar({
      title: 'Aplicar a todas las áreas',
      message: `Se aplicarán el orden y la visibilidad de las secciones de "${selectedStop.title_translations[sourceCode]}" a todas las áreas.\n\nLas secciones propias de cada área se conservan. También se guardará como estructura por defecto para áreas nuevas.`,
      confirmLabel: 'Aplicar',
      danger: false,
    });
    if (!confirmed) return;
    try {
      await stopAutosave.flush();
      const others = stops.filter((s) => s.id !== selectedStop.id);
      for (const stop of others) {
        await updateTourStop(stop.id, { sections: applyStructure(selectedStop.sections, stop.sections) });
      }
      const template = applyStructure(selectedStop.sections, []);
      await updateTourSettings(tourId!, { default_sections: template });
      setBuilder((prev) => ({
        ...prev,
        tour: { ...prev.tour, default_sections: template, has_unpublished_changes: true },
        stops: prev.stops.map((s) =>
          s.id === selectedStop.id ? s : { ...s, sections: applyStructure(selectedStop.sections, s.sections) }
        ),
      }));
      toast.success(`Estructura aplicada a ${others.length} área${others.length === 1 ? '' : 's'}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'No se pudo aplicar la estructura');
      queryClient.invalidateQueries({ queryKey });
    }
  };

  const { data: sectionCounts } = useQuery({
    queryKey: ['stop-section-counts', selectedStop?.id, selectedStop?.organizational_area_id],
    queryFn: () => getStopSectionCounts(selectedStop!.id),
    enabled: !!selectedStop && tab === 'sections',
  });

  // Live data of every stop (same as the visitor sees), for the quick look of live sections
  const { data: liveView } = useQuery({
    queryKey: ['tour-preview', tourId],
    queryFn: () => getTourPreview(tourId!),
    enabled: !!tourId && !!selectedStop && tab === 'sections',
    staleTime: 30_000,
  });

  // Live data the tour shows (safety, positions...) and its translations; it changes in other modules
  const liveKey = ['tour-live-texts', tourId];
  const { data: live, refetch: refetchLive } = useQuery({
    queryKey: liveKey,
    queryFn: () => getLiveTexts(tourId!),
    enabled: !!tourId,
    refetchOnWindowFocus: true,
  });
  const saveLive = async (language: string, source: string, text: string) => {
    const translation = await saveLiveTranslation(tourId!, language, source, text);
    queryClient.setQueryData<TourLiveTexts>(liveKey, (prev) => {
      if (!prev) return prev;
      const current = { ...(prev.translations[language] || {}) };
      if (translation) current[source] = translation;
      else delete current[source];
      return { ...prev, translations: { ...prev.translations, [language]: current } };
    });
  };

  // Narration plan of the saved draft (which audios exist / will be generated)
  const {
    data: narrationEstimate,
    isFetching: isLoadingNarration,
    refetch: refetchNarration,
  } = useQuery({
    queryKey: ['publish-estimate', tourId],
    queryFn: () => getPublishEstimate(tourId!),
    enabled: !!tourId && tab === 'narration',
    staleTime: 0,
  });

  // After an edit is saved, refresh the narration plan (scripts are computed by the server)
  useEffect(() => {
    if (tab === 'narration' && stopAutosave.status === 'saved') refetchNarration();
  }, [tab, stopAutosave.status, refetchNarration]);

  const usedAreaIds = useMemo(
    () => new Set(stops.map((s) => s.organizational_area_id).filter((id): id is string => !!id)),
    [stops]
  );

  // ---------- Render ----------
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-600">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Cargando editor…
      </div>
    );
  }

  if (error || !tour) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-red-600">No se pudo cargar el tour.</p>
        <Button variant="outline" onClick={() => navigate(toursListPath(undefined))}>
          Volver a Tours
        </Button>
      </div>
    );
  }

  const usage = data!.publications;
  const statusBadge =
    tour.status === 'draft'
      ? { text: 'Borrador', className: 'bg-gray-100 text-gray-700' }
      : tour.status === 'archived'
      ? { text: 'Despublicado', className: 'bg-gray-200 text-gray-700' }
      : tour.has_unpublished_changes
      ? { text: 'Cambios sin publicar', className: 'bg-amber-100 text-amber-800' }
      : { text: 'Publicado', className: 'bg-green-100 text-green-800' };
  const isPublished = tour.status === 'published';
  const languageOptions = data!.available_languages || [];
  const languageName = (code: string) => languageOptions.find((l) => l.code === code)?.name || code;
  // Coming from the alert on Inicio, it opens on a translated language: what there is to review
  const startLanguage = searchParams.get('tab') === 'live' ? tour.languages.find((l) => l !== sourceCode) ?? sourceCode : sourceCode;
  const language = pickedLanguage && tour.languages.includes(pickedLanguage) ? pickedLanguage : startLanguage;
  function flushAll() {
    return Promise.all([stopAutosave.flush(), settingsAutosave.flush()]);
  }
  const pending = pendingTranslations(
    [
      { texts: [tour.title_translations, tour.description_translations], meta: tour.translation_meta },
      ...stops.map((s) => ({ texts: [s.title_translations, s.content, s.sections], meta: s.translation_meta })),
    ],
    sourceCode,
    tour.languages
  );
  // Live data without translation counts too; it is translated from the organization's language
  const liveLanguage = live?.live_language ?? sourceCode;
  const liveTextsOf = (items: TourLiveTexts['tour'] = []) => items.map((item) => item.text);
  const allLive = live ? [...new Set([...liveTextsOf(live.tour), ...Object.values(live.stops).flatMap((items) => liveTextsOf(items))])] : [];
  const liveMissing = (lang: string, texts: string[]) => texts.filter((text) => !live?.translations[lang]?.[text]).length;
  for (const lang of tour.languages) {
    if (lang === liveLanguage) continue;
    const count = liveMissing(lang, allLive);
    if (count) pending[lang] = (pending[lang] || 0) + count;
  }
  const pendingTotal = Object.values(pending).reduce((a, b) => a + b, 0);
  const liveEditor = (items: TourLiveTexts['tour'], emptyText: string) => (
    <LiveTextsEditor
      items={items}
      language={language}
      languageName={languageName(language).toLowerCase()}
      liveLanguageName={languageName(liveLanguage).toLowerCase()}
      isOriginal={language === liveLanguage}
      translations={live?.translations[language] ?? {}}
      onSave={(source, text) => saveLive(language, source, text)}
      emptyText={emptyText}
    />
  );
  const stopLiveMissing =
    selectedStop && language !== liveLanguage ? liveMissing(language, liveTextsOf(live?.stops[selectedStop.id])) : 0;
  const translationUsage = data!.translation;

  return (
    <SourceLanguageContext.Provider value={{ code: sourceCode, name: languageName(sourceCode) }}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={async () => {
                await Promise.all([stopAutosave.flush(), settingsAutosave.flush()]);
                navigate(toursListPath(tour.plant_id));
              }}
              className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              aria-label="Volver a Tours"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-xl font-bold text-gray-900">{tour.title_translations[sourceCode] || tour.title}</h2>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge.className}`}>
                  {statusBadge.text}
                </span>
                <SaveIndicator status={saveStatus} />
              </div>
              <p className="text-xs text-gray-500">
                {tour.plant_name} · {stops.length} área{stops.length === 1 ? '' : 's'}
                {usage.latest_version && (
                  <>
                    {' · '}
                    <span className="font-medium text-gray-700">Versión publicada {usage.latest_version}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              title="Abre el tour como lo verán los visitantes, con el borrador actual"
              onClick={async () => {
                // Open the tab synchronously (popup blockers), then save pending edits before it loads
                const previewTab = window.open('about:blank', '_blank');
                await Promise.all([stopAutosave.flush(), settingsAutosave.flush()]);
                if (previewTab) previewTab.location.href = `/preview/tours/${tourId}`;
              }}
            >
              <Eye className="h-4 w-4" />
              Vista previa
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(`/tours/${tourId}/stats`)}>
              <BarChart3 className="h-4 w-4" />
              Estadísticas
            </Button>
            {isPublished && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setIsShareOpen(true)}>
                <Share2 className="h-4 w-4" />
                Compartir
              </Button>
            )}
            {canPublish && (
              <Button
                size="sm"
                className="gap-1.5"
                disabled={stops.length === 0 || (isPublished && !tour.has_unpublished_changes)}
                title={
                  stops.length === 0
                    ? 'Agrega al menos un área para publicar'
                    : isPublished && !tour.has_unpublished_changes
                    ? 'No hay cambios por publicar'
                    : undefined
                }
                onClick={() => setIsPublishOpen(true)}
              >
                <Rocket className="h-4 w-4" />
                {isPublished ? 'Publicar cambios' : 'Publicar'}
                <span
                  className="inline-flex items-center gap-1 rounded bg-white/20 px-1.5 text-[11px]"
                  title={`Publicaciones con narración en audio de tu organización este mes: ${usage.used} de ${usage.limit} (compartidas entre todos los tours). Publicar sin audio nuevo no cuenta. Se renueva el ${new Date(`${String(usage.resets_on).slice(0, 10)}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}.`}
                >
                  <Volume2 className="h-3 w-3" />
                  {usage.used}/{usage.limit} con audio este mes
                </span>
              </Button>
            )}
          </div>
        </div>

        {data!.narration_test_mode && (
          <div className="flex items-start gap-2 rounded-lg border border-purple-300 bg-purple-50 px-4 py-2.5 text-sm text-purple-900" role="status">
            <FlaskConical className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <p>
              <strong>Modo prueba de narración activo:</strong> al publicar solo se genera la primera frase de cada guion (~2–5 s).
              Apágalo en el servidor (<code className="rounded bg-purple-100 px-1">TTS_TEST_MODE=false</code>) para generar los audios completos.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          {/* Editing area (left, wide) */}
          <div
            className={`min-w-0 flex-1 rounded-lg border border-gray-200 bg-white ${isTranslating ? 'pointer-events-none opacity-60' : ''}`}
            aria-busy={isTranslating}
          >
            <TranslationMetaContext.Provider value={(selectedStop ? selectedStop.translation_meta : tour.translation_meta) ?? {}}>
            {/* Editor toolbar: what is being edited + language */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-3">
              {selectedStop ? (
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Área {selectedStop.order_index}
                  </p>
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-lg font-semibold text-gray-900">
                      {selectedStop.title_translations[sourceCode] || selectedStop.area_name}
                    </h3>
                    {selectedStop.organizational_area_id && (
                      <Link
                        to={`/areas/${selectedStop.organizational_area_id}`}
                        target="_blank"
                        className="inline-flex flex-shrink-0 items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-600 hover:bg-gray-200"
                        title="Abrir el área en otra pestaña para editar sus datos"
                      >
                        Ver área {selectedStop.area_code || selectedStop.area_name}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Tour</p>
                  <h3 className="text-lg font-semibold text-gray-900">Ajustes del tour</h3>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
              {pendingTotal > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  isLoading={isTranslating}
                  onClick={() => translate()}
                  title={`Traduce con ${translationUsage?.provider === 'google' ? 'Google' : 'el traductor automático'} lo que falta o cambió. Lo que escribiste a mano no se modifica.${
                    translationUsage ? ` Este mes la empresa lleva ${translationUsage.used.toLocaleString('es-MX')} de ${translationUsage.limit.toLocaleString('es-MX')} caracteres.` : ''
                  }`}
                >
                  {!isTranslating && <Languages className="h-4 w-4" />}
                  Traducir {pendingTotal} {pendingTotal === 1 ? 'texto' : 'textos'}
                </Button>
              )}
              <div className="flex flex-wrap rounded-md border border-gray-300 p-0.5 text-xs font-medium" role="group" aria-label="Idioma de edición">
                {tour.languages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`flex items-center gap-1 rounded px-2 py-1 ${language === lang ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
                    title={`Editar textos en ${languageName(lang)}`}
                  >
                    <LanguageFlag code={lang} className="h-3.5 w-3.5" />
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
              </div>
            </div>

            {selectedStop && !selectedStop.area_available && (
              <div className="mx-5 mt-4 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                Esta área fue eliminada o desactivada en el sistema. Se mostrará solo el texto escrito, sin datos en vivo.
              </div>
            )}

            {selectedStop && (
              <div className="flex gap-1 border-b border-gray-200 px-5">
                {(
                  [
                    ['content', 'Contenido'],
                    ['sections', 'Secciones'],
                    ['narration', 'Narración'],
                    ['live', 'Datos de la planta'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    onClick={async () => {
                      setTab(id);
                      // The narration plan is computed from the saved draft: save pending edits first
                      if (id === 'narration') {
                        await stopAutosave.flush();
                        refetchNarration();
                      }
                      // Hidden sections are not translated: their data leaves the list
                      if (id === 'live') {
                        await stopAutosave.flush();
                        refetchLive();
                      }
                    }}
                    className={`border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                      tab === id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    {label}
                    {id === 'live' && stopLiveMissing > 0 && (
                      <span
                        className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800"
                        title={`${stopLiveMissing} sin traducir en ${languageName(language).toLowerCase()}`}
                      >
                        {stopLiveMissing}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            <div className="p-5">
              {!selectedStop ? (
                <div className="space-y-8">
                  <TourSettingsEditor tour={tour} language={language} availableLanguages={data!.available_languages} onChange={editSettings} />
                  {!!live?.tour.length && (
                    <section className="space-y-3 border-t border-gray-200 pt-6">
                      <h4 className="text-base font-semibold text-gray-900">Datos de la empresa y del mapa</h4>
                      {liveEditor(live.tour, '')}
                    </section>
                  )}
                </div>
              ) : tab === 'live' ? (
                liveEditor(live?.stops[selectedStop.id] ?? [], 'Esta área no muestra datos que se traduzcan: personal, seguridad, procesos o productos.')
              ) : tab === 'narration' ? (
                <StopNarrationEditor
                  key={selectedStop.id}
                  stop={selectedStop}
                  language={language}
                  item={narrationEstimate?.items.find((i) => i.stop_id === selectedStop.id && i.language === language)}
                  isLoading={isLoadingNarration}
                  onChange={(patch) => editStop(selectedStop.id, patch)}
                />
              ) : tab === 'content' ? (
                <StopContentEditor
                  key={selectedStop.id}
                  stop={selectedStop}
                  language={language}
                  organizationId={tour.organization_id}
                  plantId={tour.plant_id}
                  onChange={(patch) => editStop(selectedStop.id, patch)}
                />
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="max-w-xl text-sm text-gray-600">
                      Elige qué ve el visitante en esta área y en qué orden. Las secciones <strong>en vivo</strong> se
                      actualizan solas con los datos del área.
                    </p>
                    {stops.length > 1 && (
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={applyToAllStops}>
                        <Copy className="h-4 w-4" />
                        Aplicar a todas las áreas
                      </Button>
                    )}
                  </div>
                  <SectionsEditor
                    sections={selectedStop.sections}
                    onChange={(sections) => editStop(selectedStop.id, { sections })}
                    language={language}
                    counts={sectionCounts ?? null}
                    liveData={liveView?.stops.find((s) => s.id === selectedStop.id)}
                    areaId={selectedStop.organizational_area_id}
                    onApplyVisibilityToAll={stops.length > 1 ? applySectionToAll : undefined}
                  />
                </div>
              )}
            </div>
            </TranslationMetaContext.Provider>
          </div>

          {/* Stops (right) */}
          <aside className="w-full lg:sticky lg:top-4 lg:w-80 lg:flex-shrink-0">
            <StopsPanel
              plantId={tour.plant_id}
              stops={stops}
              selectedStopId={selectedStop?.id ?? null}
              onSelect={selectStop}
              onAdd={() => setIsAddOpen(true)}
              onAddArea={(areaId) => addMutation.mutate(areaId)}
              onMove={handleMove}
              onDelete={handleDelete}
            />
          </aside>
        </div>

        {isPublishOpen && (
          <PublishTourModal
            isOpen
            onClose={() => setIsPublishOpen(false)}
            builder={data!}
            beforePublish={flushAll}
            pendingTranslations={pending}
            onTranslate={() => translate()}
            onPublished={(result) => {
              setBuilder((prev) => ({
                ...prev,
                tour: { ...prev.tour, status: 'published', has_unpublished_changes: false, public_code: result.public_code },
                publications: {
                  ...prev.publications,
                  latest_version: result.version,
                  used: prev.publications.used + (result.counted_toward_limit ? 1 : 0),
                  remaining: Math.max(prev.publications.remaining - (result.counted_toward_limit ? 1 : 0), 0),
                },
              }));
              queryClient.invalidateQueries({ queryKey: ['tours'] });
              queryClient.invalidateQueries({ queryKey: ['tour-share', tourId] });
              setIsPublishOpen(false);
              setIsShareOpen(true);
            }}
          />
        )}

        <ShareTourModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          tourId={tourId!}
          tourTitle={tour.title_translations[sourceCode] || tour.title}
          onUnpublished={() => setBuilder((prev) => ({ ...prev, tour: { ...prev.tour, status: 'archived' } }))}
        />

        <AddStopModal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          organizationId={tour.organization_id}
          plantId={tour.plant_id}
          usedAreaIds={usedAreaIds}
          onAdd={(areaId) => addMutation.mutateAsync(areaId)}
        />
      </div>
    </SourceLanguageContext.Provider>
  );
};

export default TourEditorPage;

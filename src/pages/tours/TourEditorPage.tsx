import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CloudOff,
  Copy,
  ExternalLink,
  Eye,
  Loader2,
  Rocket,
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
  TOUR_LANGUAGE_LABELS,
  type BuilderStop,
  type TourBuilderData,
  type TourLanguage,
  type UpdateStopPayload,
  type UpdateTourSettingsPayload,
} from '../../api/tourBuilder';
import { getTourPreview } from '../../api/tourView';
import StopsPanel from './editor/StopsPanel';
import StopContentEditor from './editor/StopContentEditor';
import SectionsEditor, { applyStructure } from './editor/SectionsEditor';
import TourSettingsEditor from './editor/TourSettingsEditor';
import AddStopModal from './editor/AddStopModal';

type EditorTab = 'content' | 'sections';

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
  const [language, setLanguage] = useState<TourLanguage>('es');
  const [tab, setTab] = useState<EditorTab>('content');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // While editing, the cache is the source of truth: no background refetch over typed text
  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => getTourBuilder(tourId!),
    enabled: !!tourId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

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
      toast.error('No se pudieron guardar los últimos cambios. Revisa tu conexión.');
    }
  }, [stopAutosave.status, settingsAutosave.status]);

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

  const editSettings = (patch: UpdateTourSettingsPayload) => {
    setBuilder((prev) => ({ ...prev, tour: { ...prev.tour, ...patch } }));
    settingsAutosave.schedule(patch);
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
      toast.success(`"${stop.area_name}" agregada como parada ${stop.order_index}`);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'No se pudo agregar la parada'),
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
    const name = stop.title_translations.es || stop.area_name;
    if (!window.confirm(`¿Quitar "${name}" del tour? Su texto y secciones de esta parada se perderán.`)) return;
    try {
      await stopAutosave.flush();
      await deleteTourStop(stop.id);
      const remaining = stops.filter((s) => s.id !== stop.id).map((s, i) => ({ ...s, order_index: i + 1 }));
      setBuilder((prev) => ({ ...prev, tour: { ...prev.tour, has_unpublished_changes: true }, stops: remaining }));
      if (selectedStopId === stop.id) setSelectedStopId(remaining[0]?.id ?? null);
      toast.success('Parada quitada');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'No se pudo quitar la parada');
    }
  };

  const applyToAllStops = async () => {
    if (!selectedStop) return;
    if (
      !window.confirm(
        `¿Aplicar el orden y la visibilidad de las secciones de "${selectedStop.title_translations.es}" a todas las paradas?\n\nLas secciones propias de cada parada se conservan. También se guardará como estructura por defecto para paradas nuevas.`
      )
    )
      return;
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
      toast.success(`Estructura aplicada a ${others.length} parada${others.length === 1 ? '' : 's'}`);
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
        <Button variant="outline" onClick={() => navigate('/tours')}>
          Volver a Tours
        </Button>
      </div>
    );
  }

  const usage = data!.publications;
  const statusBadge =
    tour.status === 'draft'
      ? { text: 'Borrador', className: 'bg-gray-100 text-gray-700' }
      : tour.has_unpublished_changes
      ? { text: 'Cambios sin publicar', className: 'bg-amber-100 text-amber-800' }
      : { text: 'Publicado', className: 'bg-green-100 text-green-800' };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={async () => {
              await Promise.all([stopAutosave.flush(), settingsAutosave.flush()]);
              navigate('/tours');
            }}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            aria-label="Volver a Tours"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-bold text-gray-900">{tour.title_translations.es || tour.title}</h2>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge.className}`}>
                {statusBadge.text}
              </span>
              <SaveIndicator status={saveStatus} />
            </div>
            <p className="text-xs text-gray-500">
              {tour.plant_name} · {stops.length} parada{stops.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
          <Button size="sm" className="gap-1.5" disabled title="Disponible en el siguiente paso">
            <Rocket className="h-4 w-4" />
            Publicar
            <span className="rounded bg-white/20 px-1.5 text-[11px]">
              {usage.used}/{usage.limit} este mes
            </span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        {/* Editing area (left, wide) */}
        <div className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white">
          {/* Editor toolbar: what is being edited + language */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-3">
            {selectedStop ? (
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Parada {selectedStop.order_index}
                </p>
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-lg font-semibold text-gray-900">
                    {selectedStop.title_translations.es || selectedStop.area_name}
                  </h3>
                  {selectedStop.organizational_area_id && (
                    <Link
                      to={`/areas/${selectedStop.organizational_area_id}`}
                      target="_blank"
                      className="inline-flex flex-shrink-0 items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-600 hover:bg-gray-200"
                      title="Abrir el área en otra pestaña para editar sus datos"
                    >
                      Área {selectedStop.area_code || selectedStop.area_name}
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

            <div className="flex rounded-md border border-gray-300 p-0.5 text-xs font-medium" role="group" aria-label="Idioma de edición">
              {tour.languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`rounded px-2.5 py-1 ${language === lang ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
                  title={`Editar textos en ${TOUR_LANGUAGE_LABELS[lang]}`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {selectedStop && !selectedStop.area_available && (
            <div className="mx-5 mt-4 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              El área de esta parada fue eliminada o desactivada. Se mostrará solo el texto escrito, sin datos en vivo.
            </div>
          )}

          {selectedStop && (
            <div className="flex gap-1 border-b border-gray-200 px-5">
              {(
                [
                  ['content', 'Contenido'],
                  ['sections', 'Secciones'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                    tab === id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {label}
                </button>
              ))}
              <span
                className="cursor-not-allowed border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-gray-300"
                title="Disponible cuando se active la generación de audio"
              >
                Narración
              </span>
            </div>
          )}

          <div className="p-5">
            {!selectedStop ? (
              <TourSettingsEditor tour={tour} language={language} onChange={editSettings} />
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
                    Elige qué ve el visitante en esta parada y en qué orden. Las secciones <strong>en vivo</strong> se
                    actualizan solas con los datos del área.
                  </p>
                  {stops.length > 1 && (
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={applyToAllStops}>
                      <Copy className="h-4 w-4" />
                      Aplicar a todas las paradas
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
                />
              </div>
            )}
          </div>
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

      <AddStopModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        organizationId={tour.organization_id}
        plantId={tour.plant_id}
        usedAreaIds={usedAreaIds}
        onAdd={(areaId) => addMutation.mutateAsync(areaId)}
      />
    </div>
  );
};

export default TourEditorPage;

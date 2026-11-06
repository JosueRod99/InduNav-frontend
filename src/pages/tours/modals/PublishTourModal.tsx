import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Info, Loader2, Lock, Rocket, Volume2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import { getPublishEstimate, publishTour, type PublishResult, type TourBuilderData } from '../../../api/tourBuilder';
import { getTourPreview, tr } from '../../../api/tourView';

interface PublishTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  builder: TourBuilderData;
  beforePublish: () => Promise<unknown>; // save pending edits first
  onPublished: (result: PublishResult) => void;
}

/** Summary + warnings before publishing. Publishing without audio does not use a monthly credit. */
const PublishTourModal = ({ isOpen, onClose, builder, beforePublish, onPublished }: PublishTourModalProps) => {
  const { tour, stops, publications } = builder;
  const [isPublishing, setIsPublishing] = useState(false);

  // The preview tells which areas would show nothing; the estimate, what happens with the narration
  const { data, isFetching } = useQuery({
    queryKey: ['tour-publish-check', tour.id],
    queryFn: async () => {
      await beforePublish();
      const [preview, estimate] = await Promise.all([getTourPreview(tour.id), getPublishEstimate(tour.id)]);
      return { preview, estimate };
    },
    enabled: isOpen,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
  // A result kept from the last time the dialog was open does not count: the draft may have changed
  const checks = isFetching ? undefined : data;
  const preview = checks?.preview;
  const estimate = checks?.estimate;
  const keepPreviousAudio = !!estimate && estimate.limit_reached && estimate.to_generate > 0;
  const minutes = estimate ? Math.max(1, Math.round(estimate.characters_to_generate / 900)) : 0;
  const resetsOn = estimate
    ? new Date(`${String(estimate.usage.resets_on).slice(0, 10)}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })
    : '';

  const emptyStops = (preview?.stops || []).filter((s) => s.sections.length === 0);
  const source = tour.source_language;
  const sourceName = builder.available_languages?.find((l) => l.code === source)?.name.toLowerCase() || source;
  const translations = tour.languages.filter((l) => l !== source);
  const untranslated = stops.filter((s) =>
    translations.some(
      (l) =>
        (s.title_translations[source] && !s.title_translations[l]) ||
        (s.content.narrative?.[source] && !s.content.narrative?.[l])
    )
  );
  const nextVersion = (publications.latest_version ?? 0) + 1;
  const isRepublish = tour.status !== 'draft';

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await beforePublish();
      const result = await publishTour(tour.id, { skipNewAudio: keepPreviousAudio });
      const audioNote = result.audio_generated > 0 ? ` · ${result.audio_generated} audios generados` : '';
      toast.success(`${isRepublish ? `Cambios publicados (versión ${result.version})` : 'Tour publicado'}${audioNote}`);
      onPublished(result);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'No se pudo publicar el tour');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isRepublish ? 'Publicar cambios' : 'Publicar tour'}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handlePublish} isLoading={isPublishing} disabled={isFetching} className="gap-1.5">
            <Rocket className="h-4 w-4" />
            {keepPreviousAudio ? 'Publicar sin narración nueva' : isRepublish ? 'Publicar cambios' : 'Publicar'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
          <p>
            Se publicará la <strong>versión {nextVersion}</strong> con <strong>{stops.length}</strong>{' '}
            {stops.length === 1 ? 'área' : 'áreas'}. Los visitantes verán los textos y secciones tal como están ahora;
            los datos de cada área (personal, equipos, productos…) se siguen actualizando solos.
          </p>
        </div>

        {estimate && (
          keepPreviousAudio ? (
            <div className="space-y-1 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              <p className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4" /> Límite de publicaciones con narración alcanzado
              </p>
              <p>
                Tu organización ya usó {estimate.usage.used} de {estimate.usage.limit} este mes (se renueva el {resetsOn}). Puedes
                publicar los cambios <strong>conservando la narración anterior</strong>: {estimate.to_generate}{' '}
                {estimate.to_generate === 1 ? 'audio' : 'audios'} con texto nuevo no se actualizarán. Para ampliar el límite, contacta a soporte.
              </p>
            </div>
          ) : estimate.to_generate > 0 ? (
            <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
              <Volume2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <p>
                Se generará la narración de <strong>{estimate.to_generate}</strong> {estimate.to_generate === 1 ? 'audio' : 'audios'}{' '}
                (~{minutes} min){estimate.reused > 0 && <>; {estimate.reused} sin cambios se reutilizan</>}. Esta publicación usará{' '}
                <strong>1 de las {estimate.usage.limit}</strong> publicaciones con narración de tu organización este mes (quedan{' '}
                {estimate.usage.remaining - 1}).
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-900">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <p>
                {isRepublish && 'Tus cambios de texto se publicarán. '}
                {estimate.reused > 0
                  ? `El audio no cambia (${estimate.reused === 1 ? 'se reutiliza 1 audio' : `se reutilizan ${estimate.reused} audios`})`
                  : 'No hay narración que generar'}
                , así que <strong>no consume</strong> de tus {estimate.usage.limit} publicaciones con narración del mes.
              </p>
            </div>
          )
        )}

        {!!estimate?.areas_keeping_script?.length && (
          <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>
              Cambiaste la narrativa de <strong>{estimate.areas_keeping_script.join(', ')}</strong>, pero se escuchará su guion
              personalizado con el audio actual. Para actualizarlo, edita el guion o vuelve al automático en la pestaña Narración.
            </span>
          </p>
        )}

        {estimate?.test_mode && estimate.to_generate === 0 && (
          <p className="rounded-lg border border-purple-300 bg-purple-50 p-3 text-sm text-purple-900">
            <strong>Modo prueba de narración activo:</strong> solo se compara la primera frase de cada guion. Un cambio después de
            esa frase no genera audio.
          </p>
        )}

        {estimate?.test_mode && estimate.to_generate > 0 && (
          <p className="rounded-lg border border-purple-300 bg-purple-50 p-3 text-sm text-purple-900">
            <strong>Modo prueba de narración activo:</strong> se generará solo la primera frase de cada guion (~2–5 s). Los
            visitantes escucharán esa versión corta hasta que publiques con el modo prueba apagado.
          </p>
        )}

        {isPublishing && estimate && estimate.to_generate > 0 && !keepPreviousAudio && (
          <p className="flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" /> Generando la narración… puede tardar unos segundos por audio.
          </p>
        )}

        {tour.visibility === 'private' && (
          <p className="flex items-start gap-2 text-sm text-gray-700">
            <Lock className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-500" />
            El tour es <strong>privado</strong>: solo podrán verlo usuarios con sesión en tu organización.
          </p>
        )}

        {isFetching ? (
          <p className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Revisando el contenido…
          </p>
        ) : emptyStops.length === 0 && untranslated.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4" /> Todo listo para publicar.
          </p>
        ) : (
          <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4" /> Revisa antes de publicar (puedes publicar de todos modos)
            </p>
            {emptyStops.length > 0 && (
              <p>
                Sin contenido visible: {emptyStops.map((s) => tr(s.title, source)).join(', ')}. Los visitantes solo verán el
                título.
              </p>
            )}
            {untranslated.length > 0 && (
              <p>
                Falta traducir en: {untranslated.map((s) => s.title_translations[source]).join(', ')}. Se mostrará en{' '}
                {sourceName}.
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PublishTourModal;

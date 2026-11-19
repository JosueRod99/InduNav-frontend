import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AlertTriangle, ArrowLeft, Copy, ExternalLink, Loader2, Plus, Search, Trash2, X } from 'lucide-react';
import {
  collectionText,
  collectionUrl,
  deleteCollection,
  getCandidateTours,
  getCollection,
  setCollectionTours,
  updateCollection,
  type Collection,
  type CollectionEditorTour,
  type CollectionTexts,
  type UnavailableReason,
} from '../../../api/collections';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import SortableList, { moveItem } from '../../../components/ui/SortableList';
import { confirmar } from '../../../components/ui/ConfirmDialog';

// Editor of a collection (platform): its texts in Spanish and English, its link and its tours in order.
// The texts are saved with the button; the tours, as soon as they are added, removed or moved.

const UNAVAILABLE: Record<UnavailableReason, string> = {
  not_published: 'Ya no está publicado',
  private: 'Es privado',
  not_demo: 'Su empresa ya no es demo',
};

const tourTitleOf = (tour: CollectionEditorTour) => tour.title_translations[tour.source_language] || Object.values(tour.title_translations)[0] || 'Tour';

interface Draft {
  slug: string;
  title_translations: CollectionTexts;
  description_translations: CollectionTexts;
  is_active: boolean;
}

const draftOf = (c: Collection): Draft => ({
  slug: c.slug,
  title_translations: { es: c.title_translations.es ?? '', en: c.title_translations.en ?? '' },
  description_translations: { es: c.description_translations.es ?? '', en: c.description_translations.en ?? '' },
  is_active: c.is_active,
});

const textareaClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

/** Search of published tours of demo companies to add */
const AddToursModal = ({ isOpen, onClose, current, onAdd }: { isOpen: boolean; onClose: () => void; current: string[]; onAdd: (ids: string[]) => void }) => {
  const [search, setSearch] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const { data: candidates, isLoading } = useQuery({
    queryKey: ['collection-candidates', search],
    queryFn: () => getCandidateTours(search.trim() || undefined),
    enabled: isOpen,
  });
  useEffect(() => {
    if (isOpen) setPicked([]);
  }, [isOpen]);
  const available = (candidates ?? []).filter((t) => !current.includes(t.tour_id));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agregar tours"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => onAdd(picked)} disabled={!picked.length}>
            Agregar {picked.length || ''}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por tour o empresa"
            aria-label="Buscar tours"
            className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <p className="text-xs text-gray-500">Solo aparecen tours publicados, no privados, de empresas marcadas como demo.</p>
        {isLoading ? (
          <p className="flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" /> Buscando…
          </p>
        ) : available.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
            No hay tours para agregar. Marca una empresa como demo en Organizaciones, Editar.
          </p>
        ) : (
          <ul className="max-h-96 divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-200">
            {available.map((tour) => (
              <li key={tour.tour_id}>
                <label className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={picked.includes(tour.tour_id)}
                    onChange={(e) => setPicked(e.target.checked ? [...picked, tour.tour_id] : picked.filter((id) => id !== tour.tour_id))}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-gray-900">{tourTitleOf(tour)}</span>
                    <span className="block truncate text-xs text-gray-500">
                      {tour.organization_name} · {tour.plant_name} · {tour.stops_count} {tour.stops_count === 1 ? 'área' : 'áreas'}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
};

const CollectionEditorPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const queryKey = ['collection', id];
  const { data: collection, isLoading, error } = useQuery({ queryKey, queryFn: () => getCollection(id!) });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    if (collection && !draft) setDraft(draftOf(collection));
  }, [collection, draft]);

  const store = (next: Collection) => {
    queryClient.setQueryData(queryKey, next);
    queryClient.invalidateQueries({ queryKey: ['collections'] });
  };

  const save = useMutation({
    mutationFn: () => updateCollection(id!, draft!),
    onSuccess: (next) => {
      store(next);
      setDraft(draftOf(next));
      toast.success('Colección guardada');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'No se pudo guardar'),
  });

  const saveTours = useMutation({
    mutationFn: (tourIds: string[]) => setCollectionTours(id!, tourIds),
    onSuccess: store,
    onError: (err: any) => toast.error(err.response?.data?.message || 'No se pudieron guardar los tours'),
  });

  const remove = async () => {
    if (!collection) return;
    const ok = await confirmar({
      title: 'Eliminar colección',
      message: `Se eliminará "${collectionText(collection.title_translations, 'es')}" y su enlace dejará de funcionar. Los tours no se tocan.`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteCollection(id!);
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      toast.success('Colección eliminada');
      navigate('/admin/collections');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'No se pudo eliminar');
    }
  };

  if (isLoading || (collection && !draft)) {
    return (
      <p className="flex items-center gap-2 text-gray-600">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
      </p>
    );
  }
  if (error || !collection || !draft) return <p className="text-red-600">No se encontró la colección.</p>;

  const tours = collection.tours;
  const tourIds = tours.map((t) => t.tour_id);
  const dirty = JSON.stringify(draft) !== JSON.stringify(draftOf(collection));
  const setText = (field: 'title_translations' | 'description_translations', language: 'es' | 'en', value: string) =>
    setDraft({ ...draft, [field]: { ...draft[field], [language]: value } });
  const shown = tours.filter((t) => !t.unavailable_reason).length;
  const url = collectionUrl(collection.slug);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <Link to="/admin/collections" className="mt-1 rounded-md p-1 text-gray-500 hover:bg-gray-100" aria-label="Volver a colecciones">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-bold text-gray-900">{collectionText(collection.title_translations, 'es')}</h2>
            <p className="mt-0.5 text-sm text-gray-600">
              {collection.is_active ? `${shown} ${shown === 1 ? 'tour visible' : 'tours visibles'} en la página pública` : 'Inactiva: el enlace no funciona'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={() => navigator.clipboard.writeText(url).then(() => toast.success('Enlace copiado'), () => toast.error('No se pudo copiar'))}
            disabled={!collection.is_active}
          >
            <Copy className="h-4 w-4" /> Copiar enlace
          </Button>
          <a
            href={`/c/${collection.slug}`}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${
              collection.is_active ? '' : 'pointer-events-none opacity-50'
            }`}
          >
            <ExternalLink className="h-4 w-4" /> Abrir
          </a>
          <Button variant="outline" className="gap-1.5 text-red-600 hover:bg-red-50" onClick={remove}>
            <Trash2 className="h-4 w-4" /> Eliminar
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Texts */}
        <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-900">Página de la colección</h3>
          {(['es', 'en'] as const).map((language) => (
            <div key={language} className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{language === 'es' ? 'Español' : 'Inglés'}</p>
              <Input
                label="Título"
                value={draft.title_translations[language] ?? ''}
                maxLength={200}
                onChange={(e) => setText('title_translations', language, e.target.value)}
                placeholder={language === 'en' ? collectionText(draft.title_translations, 'es') : ''}
              />
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor={`description-${language}`}>
                  Descripción
                </label>
                <textarea
                  id={`description-${language}`}
                  rows={3}
                  maxLength={1000}
                  value={draft.description_translations[language] ?? ''}
                  onChange={(e) => setText('description_translations', language, e.target.value)}
                  placeholder={language === 'es' ? 'Por ejemplo: Así se ve INAU en plantas como la suya.' : collectionText(draft.description_translations, 'es')}
                  className={textareaClass}
                />
              </div>
            </div>
          ))}
          <p className="text-xs text-gray-500">Si el inglés queda vacío, los visitantes en inglés ven el español.</p>
          <Input
            label="Enlace"
            value={draft.slug}
            maxLength={80}
            onChange={(e) => setDraft({ ...draft, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
            helperText={`${window.location.origin}/c/${draft.slug || '…'}. Si lo cambias, el enlace anterior deja de funcionar.`}
          />
          <label className="flex items-center gap-2 text-sm text-gray-800">
            <input
              type="checkbox"
              checked={draft.is_active}
              onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            Activa: cualquiera con el enlace puede verla
          </label>
          <div className="flex justify-end gap-2">
            {dirty && (
              <Button variant="outline" onClick={() => setDraft(draftOf(collection))}>
                Descartar
              </Button>
            )}
            <Button onClick={() => save.mutate()} disabled={!dirty} isLoading={save.isPending}>
              Guardar
            </Button>
          </div>
        </section>

        {/* Tours */}
        <section className="rounded-lg border border-gray-200 bg-white lg:col-span-3">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">Tours ({tours.length})</h3>
            <Button size="sm" className="gap-1" onClick={() => setIsAddOpen(true)} disabled={saveTours.isPending}>
              <Plus className="h-4 w-4" /> Agregar
            </Button>
          </div>
          {tours.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-500">Agrega los tours que quieras mostrar. Se guardan al momento.</p>
          ) : (
            <>
              <SortableList
                items={tours}
                getKey={(t) => t.tour_id}
                onMove={(from, to) => saveTours.mutate(moveItem(tourIds, from, to))}
                disabled={saveTours.isPending}
                className="p-2"
                handleLabel="Arrastra para cambiar el orden del tour"
                renderItem={(tour, index) => (
                  <div className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-gray-50">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
                      {index + 1}
                    </span>
                    {tour.cover_image_url ? (
                      <img src={tour.cover_image_url} alt="" className="h-10 w-14 flex-shrink-0 rounded object-cover" />
                    ) : (
                      <span className="h-10 w-14 flex-shrink-0 rounded bg-gray-100" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-gray-900">{tourTitleOf(tour)}</span>
                      <span className="block truncate text-xs text-gray-500">
                        {tour.organization_name} · {tour.stops_count} {tour.stops_count === 1 ? 'área' : 'áreas'} · {tour.languages.map((l) => l.toUpperCase()).join(' ')}
                      </span>
                      {tour.unavailable_reason && (
                        <span className="mt-0.5 flex items-center gap-1 text-xs text-amber-700">
                          <AlertTriangle className="h-3.5 w-3.5" /> {UNAVAILABLE[tour.unavailable_reason]}: no se muestra en la página
                        </span>
                      )}
                    </span>
                    <button
                      onClick={() => saveTours.mutate(tourIds.filter((tid) => tid !== tour.tour_id))}
                      disabled={saveTours.isPending}
                      className="rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Quitar ${tourTitleOf(tour)}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              />
              <p className="border-t border-gray-100 px-4 py-2 text-xs text-gray-500">
                Arrastra para ordenar: así aparecen en la página. Quitar un tour no lo borra.
              </p>
            </>
          )}
        </section>
      </div>

      <AddToursModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        current={tourIds}
        onAdd={(ids) => {
          setIsAddOpen(false);
          saveTours.mutate([...tourIds, ...ids]);
        }}
      />
    </div>
  );
};

export default CollectionEditorPage;

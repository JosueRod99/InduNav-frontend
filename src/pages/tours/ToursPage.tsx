import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Map, Globe, Lock, LayoutList, Eye, MapPin, Clock, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import TourModal from './TourModal';
import ShareTourModal from './modals/ShareTourModal';
import { getTours, deleteTour } from '../../api/tours';
import { getPlants } from '../../api/plants';
import type { Tour } from '../../types';

// Catalog of the organization's tours (cards). Each card opens the editor or the preview.

/** List rows include the v2 fields (PLAN_TOURS_REALES.md) on top of the legacy Tour type */
type TourCard = Tour & {
  stops_count?: number | string;
  status?: 'draft' | 'published' | 'archived';
  public_code?: string | null;
  visibility?: 'link' | 'private';
  has_unpublished_changes?: boolean;
  cover_image_url?: string | null;
  title_translations?: { es?: string; en?: string };
  description_translations?: { es?: string; en?: string };
};

type StatusFilter = 'all' | 'draft' | 'published';

const statusBadge = (tour: TourCard) => {
  if (tour.status === 'published') {
    return tour.has_unpublished_changes
      ? { text: 'Cambios sin publicar', className: 'bg-amber-100 text-amber-800' }
      : { text: 'Publicado', className: 'bg-green-100 text-green-800' };
  }
  if (tour.status === 'archived') return { text: 'Despublicado', className: 'bg-gray-200 text-gray-700' };
  return { text: 'Borrador', className: 'bg-gray-100 text-gray-700' };
};

const ToursPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [selectedPlantFilter, setSelectedPlantFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [shareTour, setShareTour] = useState<TourCard | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: plantsData } = useQuery({
    queryKey: ['plants'],
    queryFn: () => getPlants({ limit: 100 }),
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['tours', selectedPlantFilter],
    // Deleting a tour is a soft delete (is_active = false): hide those from the catalog
    queryFn: () => getTours({ limit: 100, plant_id: selectedPlantFilter || undefined, is_active: true }),
  });

  const tours = useMemo(() => {
    const list = (data?.tours || []) as TourCard[];
    if (statusFilter === 'all') return list;
    return list.filter((t) => (statusFilter === 'published' ? t.status === 'published' : t.status !== 'published'));
  }, [data, statusFilter]);

  const deleteMutation = useMutation({
    mutationFn: deleteTour,
    onSuccess: () => {
      toast.success('Tour eliminado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['tours'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar tour');
    },
  });

  const handleCreate = () => {
    setSelectedTour(null);
    setIsModalOpen(true);
  };

  const handleEdit = (tour: Tour) => {
    setSelectedTour(tour);
    setIsModalOpen(true);
  };

  const handleDelete = (tour: TourCard) => {
    if (window.confirm(`¿Eliminar el tour "${tour.title}"?`)) {
      deleteMutation.mutate(tour.id);
    }
  };

  const getPlantName = (plantId: string) => plantsData?.plants.find((p) => p.id === plantId)?.name || '—';

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tours</h2>
          <p className="mt-1 text-sm text-gray-600">Recorridos virtuales de tus plantas</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Tour
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="w-64">
          <label htmlFor="plant-filter" className="mb-1 block text-sm font-medium text-gray-700">
            Planta
          </label>
          <select
            id="plant-filter"
            value={selectedPlantFilter}
            onChange={(e) => setSelectedPlantFilter(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">Todas las plantas</option>
            {plantsData?.plants.map((plant) => (
              <option key={plant.id} value={plant.id}>
                {plant.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex rounded-md border border-gray-300 bg-white p-0.5 text-sm" role="group" aria-label="Filtrar por estado">
          {(
            [
              ['all', 'Todos'],
              ['draft', 'Borradores'],
              ['published', 'Publicados'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`rounded px-3 py-1.5 font-medium ${statusFilter === value ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="rounded-lg bg-white p-8 text-center shadow">
          <p className="text-gray-500">Cargando…</p>
        </div>
      ) : error ? (
        <div className="rounded-lg bg-white p-8 text-center shadow">
          <p className="text-red-500">Error al cargar tours</p>
        </div>
      ) : tours.length === 0 ? (
        <div className="rounded-lg bg-white p-10 text-center shadow">
          <Map className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {statusFilter === 'all' ? 'No hay tours' : 'No hay tours con este filtro'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">Crea un recorrido virtual con las áreas de tu planta.</p>
          <div className="mt-6">
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Tour
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {tours.map((tour) => {
            const badge = statusBadge(tour);
            const stopsCount = Number(tour.stops_count || 0);
            const title = tour.title_translations?.es || tour.title;
            const description = tour.description_translations?.es || tour.description;
            return (
              <article key={tour.id} className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                <button
                  onClick={() => navigate(`/tours/${tour.id}/edit`)}
                  className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-blue-600 to-slate-800 text-left"
                  aria-label={`Abrir el editor de ${title}`}
                >
                  {tour.cover_image_url ? (
                    <img src={tour.cover_image_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Map className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 text-white/40" />
                  )}
                  <span className={`absolute left-3 top-3 rounded-full px-2 py-0.5 text-xs font-medium shadow-sm ${badge.className}`}>
                    {badge.text}
                  </span>
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
                    {tour.visibility === 'private' ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                    {tour.visibility === 'private' ? 'Privado' : 'Con link'}
                  </span>
                </button>

                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div>
                    <h3 className="line-clamp-1 text-base font-semibold text-gray-900">{title}</h3>
                    {description && <p className="mt-0.5 line-clamp-2 text-sm text-gray-600">{description}</p>}
                  </div>
                  <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {stopsCount} {stopsCount === 1 ? 'área' : 'áreas'}
                    </span>
                    <span>{getPlantName(tour.plant_id)}</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(tour.updated_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 border-t border-gray-100 px-4 py-3">
                  <button
                    onClick={() => navigate(`/tours/${tour.id}/edit`)}
                    className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    <LayoutList className="h-4 w-4" />
                    Editor
                  </button>
                  {tour.status === 'published' && tour.public_code && (
                    <button
                      onClick={() => setShareTour(tour)}
                      className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2.5 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100"
                      title="Link, QR y hoja de QRs por área"
                    >
                      <Share2 className="h-4 w-4" />
                      Compartir
                    </button>
                  )}
                  <a
                    href={`/preview/tours/${tour.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                    title="Ver el tour como lo verán los visitantes"
                  >
                    <Eye className="h-4 w-4" />
                    Vista previa
                  </a>
                  <div className="ml-auto flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(tour)}
                      className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-blue-700"
                      title="Editar nombre y datos básicos"
                      aria-label="Editar datos básicos"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(tour)}
                      className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                      title="Eliminar tour"
                      aria-label="Eliminar tour"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {shareTour && (
        <ShareTourModal
          isOpen
          onClose={() => setShareTour(null)}
          tourId={shareTour.id}
          tourTitle={shareTour.title_translations?.es || shareTour.title}
        />
      )}

      <TourModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tour={selectedTour}
        onCreated={(created) => navigate(`/tours/${created.id}/edit`)}
      />
    </div>
  );
};

export default ToursPage;

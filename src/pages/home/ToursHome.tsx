import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { getTours } from '../../api/tours';
import { getPlants } from '../../api/plants';
import { getOrganizationPublications } from '../../api/organizations';
import Badge from '../../components/ui/Badge';
import { AttentionList, FigureCards, plural, PlantCards, type Figure } from '../../components/ui/SummaryParts';

// "Inicio" of whoever works with the tours (creator) or only looks at them (read-only).

interface HomeTour {
  public_code?: string | null;
  id: string;
  title: string;
  title_translations?: Record<string, string> | null;
  status: string;
  has_unpublished_changes?: boolean;
  plant_name?: string;
  stops_count?: number | string;
  visits_30d?: number;
  updated_at: string;
}

const titleOf = (tour: HomeTour) => tour.title_translations?.es || tour.title;
const LIST_LIMIT = 8;

const ToursHome = ({ organizationId, readOnly = false }: { organizationId?: string; readOnly?: boolean }) => {
  const { data: toursData, isLoading } = useQuery({
    queryKey: ['tours', 'home', organizationId ?? 'mine'],
    queryFn: () => getTours({ limit: 100, is_active: true, organization_id: organizationId }),
  });
  const { data: usage } = useQuery({
    queryKey: ['organization-publications', organizationId],
    queryFn: () => getOrganizationPublications(organizationId!),
    enabled: !!organizationId && !readOnly,
  });
  const { data: plantsData } = useQuery({
    queryKey: ['plants', 'home', organizationId ?? 'mine'],
    queryFn: () => getPlants({ limit: 100, organization_id: organizationId }),
    enabled: readOnly,
  });

  if (isLoading) {
    return (
      <p className="flex items-center gap-2 text-gray-600">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
      </p>
    );
  }

  const all = (toursData?.tours || []) as unknown as HomeTour[];
  const tours = (readOnly ? all.filter((t) => t.status === 'published') : all).slice().sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  const published = all.filter((t) => t.status === 'published');
  const visits = tours.reduce((total, t) => total + (t.visits_30d ?? 0), 0);
  const plants = (plantsData?.plants || []).filter((p) => p.is_active);

  const figures: Figure[] = readOnly
    ? [
        { label: 'Tours publicados', value: tours.length, to: '/tours' },
        { label: 'Plantas', value: plants.length, to: '/plants' },
      ]
    : [
        { label: 'Borradores', value: all.length - published.length, to: '/tours' },
        { label: 'Publicados', value: published.length, to: '/tours' },
        { label: 'Visitas en 30 días', value: visits },
        ...(usage ? [{ label: 'Publicaciones restantes', value: Math.max(0, usage.limit - usage.used), hint: `${usage.used} de ${usage.limit} este mes` }] : []),
      ];

  const attention = [
    ...tours.filter((t) => t.status === 'published' && t.has_unpublished_changes).map((t) => ({ text: `${titleOf(t)}: cambios sin publicar`, to: `/tours/${t.id}/edit` })),
    ...tours.filter((t) => t.status !== 'published' && Number(t.stops_count ?? 0) === 0).map((t) => ({ text: `${titleOf(t)}: sin paradas`, to: `/tours/${t.id}/edit` })),
  ];

  // Read-only opens what visitors see: the preview shows drafts too
  const tourLink = (tour: HomeTour) => (readOnly ? `/t/${tour.public_code}` : `/tours/${tour.id}/edit`);

  return (
    <div className="space-y-4">
      <FigureCards figures={figures} className={readOnly ? 'sm:grid-cols-2' : 'sm:grid-cols-4'} />
      {!readOnly && <AttentionList items={attention} />}

      <section className="rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-900">{readOnly ? 'Tours publicados' : 'Últimos tours modificados'}</h3>
          <Link to="/tours" className="text-xs font-medium text-blue-600 hover:underline">
            Ver todos
          </Link>
        </div>
        {tours.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-600">Aún no hay tours.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {tours.slice(0, LIST_LIMIT).map((tour) => (
              <li key={tour.id}>
                <Link to={tourLink(tour)} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 hover:bg-gray-50">
                  <span className="min-w-0 flex-1 basis-48">
                    <span className="block truncate text-sm font-medium text-gray-900">{titleOf(tour)}</span>
                    <span className="block text-xs text-gray-500">
                      {[tour.plant_name, plural(Number(tour.stops_count ?? 0), 'parada', 'paradas'), plural(tour.visits_30d ?? 0, 'visita', 'visitas')].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <Badge variant={tour.status === 'published' ? 'success' : 'default'}>{tour.status === 'published' ? 'Publicado' : 'Borrador'}</Badge>
                  <span className="text-xs text-gray-500">{new Date(tour.updated_at).toLocaleDateString('es-MX', { dateStyle: 'medium' })}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {readOnly && plants.length > 0 && (
        <PlantCards
          plants={plants.map((p) => ({
            id: p.id,
            name: p.name,
            location: p.location,
            is_active: p.is_active,
            cover_url: p.cover_url,
            areas: p.areas_count ?? 0,
            employees: p.employees_count ?? 0,
            tours: p.tours_count ?? 0,
          }))}
        />
      )}
    </div>
  );
};

export default ToursHome;

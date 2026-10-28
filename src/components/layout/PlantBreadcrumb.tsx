import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { getPlant } from '../../api/plants';
import { useBackTarget } from '../../hooks/useBackNavigation';

// "← Planta 2 › Equipos › Torno CNC" on detail pages (area, equipment, product). The crumbs lead
// to the plant tab the record belongs to; the arrow returns to the page that opened it (an area,
// the layout…) or, without one, to that plant tab.

interface PlantBreadcrumbProps {
  plantId: string | null | undefined;
  tab: 'areas' | 'equipos' | 'productos';
  current: string;
}

const TAB_LABELS = { areas: 'Áreas', equipos: 'Equipos', productos: 'Productos' };

const PlantBreadcrumb = ({ plantId, tab, current }: PlantBreadcrumbProps) => {
  const { data: plant } = useQuery({
    queryKey: ['plant', plantId],
    queryFn: () => getPlant(plantId!),
    enabled: !!plantId,
    staleTime: 5 * 60 * 1000,
  });
  const sectionPath = plantId ? `/plants/${plantId}/${tab}` : '/plants';
  const location = useLocation();
  const navigate = useNavigate();
  const back = useBackTarget(location.pathname, { path: sectionPath, label: `Volver a ${TAB_LABELS[tab]}` });

  return (
    <nav aria-label="Ruta" className="mb-2 flex min-w-0 flex-wrap items-center gap-1 text-sm text-gray-500">
      <Link
        to={back.path}
        onClick={(e) => {
          // Back in history when we came from that page: it reopens exactly as it was left
          if (back.fromOrigin && (window.history.state?.idx ?? 0) > 0) {
            e.preventDefault();
            navigate(-1);
          }
        }}
        className="mr-1 inline-flex items-center rounded-md border border-gray-300 bg-white p-1 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        aria-label={back.label}
        title={back.label}
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>
      {plantId && (
        <>
          <Link to={`/plants/${plantId}/resumen`} className="hover:text-blue-700 hover:underline">
            {plant?.name || 'Planta'}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
        </>
      )}
      <Link to={sectionPath} className="hover:text-blue-700 hover:underline">
        {TAB_LABELS[tab]}
      </Link>
      <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
      <span className="truncate text-gray-700">{current}</span>
    </nav>
  );
};

export default PlantBreadcrumb;

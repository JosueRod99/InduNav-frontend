import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { getPlants } from '../../api/plants';

// Old section pages (/equipment, /areas, /layouts…) now live inside each plant. With a single
// plant the visitor goes straight to that section; otherwise they pick the plant first.

const LegacyPlantRedirect = ({ tab, query = '' }: { tab: string; query?: string }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['plants', 'mine'],
    queryFn: () => getPlants({ limit: 100 }),
  });

  if (isLoading) {
    return (
      <p className="flex items-center gap-2 text-gray-600">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
      </p>
    );
  }
  const plants = data?.plants || [];
  if (plants.length === 1) return <Navigate to={`/plants/${plants[0].id}/${tab}${query}`} replace />;
  return <Navigate to={`/plants?seccion=${tab}`} replace />;
};

export default LegacyPlantRedirect;

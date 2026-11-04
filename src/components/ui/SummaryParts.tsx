import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ChevronRight, Factory, MapPin } from 'lucide-react';
import { avatarUrl } from '../../utils/avatarUrl';
import { useBackState } from '../../hooks/useBackNavigation';

// Pieces shared by the summaries (Inicio, organization): figures, what needs attention and plant cards.

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Visits against the previous period, in words */
export const visitsTrend = (now: number, previous: number) => {
  const difference = now - previous;
  if (difference === 0) return 'igual que los 30 días anteriores';
  return `${difference > 0 ? '+' : ''}${difference} vs. 30 días anteriores`;
};

export interface Figure {
  label: string;
  value: string | number;
  hint?: string;
  to?: string;
}

export const FigureCards = ({ figures, className = 'sm:grid-cols-3 xl:grid-cols-6' }: { figures: Figure[]; className?: string }) => (
  <div className={`grid grid-cols-2 gap-3 ${className}`}>
    {figures.map(({ label, value, hint, to }) => {
      const body = (
        <>
          <span className="block text-2xl font-bold text-gray-900">{value}</span>
          <span className="block text-xs text-gray-600">{label}</span>
          {hint && <span className="block text-xs text-gray-500">{hint}</span>}
        </>
      );
      return to ? (
        <Link key={label} to={to} className="rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:border-blue-300">
          {body}
        </Link>
      ) : (
        <div key={label} className="rounded-lg border border-gray-200 bg-white p-3">
          {body}
        </div>
      );
    })}
  </div>
);

export const AttentionList = ({ items, title = 'Requiere atención' }: { items: { text: string; to: string }[]; title?: string }) => {
  const backState = useBackState();
  return (
    <section className="rounded-lg border border-gray-200 bg-white">
      <h3 className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900">{title}</h3>
      {items.length === 0 ? (
        <p className="flex items-center gap-2 px-4 py-4 text-sm text-gray-600">
          <CheckCircle2 className="h-4 w-4 text-green-600" /> Todo en orden.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {items.map(({ text, to }) => (
            <li key={text}>
              <Link to={to} state={backState} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-50">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-600" />
                <span className="min-w-0 flex-1">{text}</span>
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export interface PlantCardData {
  id: string;
  name: string;
  location: string | null;
  is_active: boolean;
  cover_url?: string | null;
  areas: number;
  employees: number;
  tours: number;
}

export const PlantCards = ({ plants }: { plants: PlantCardData[] }) => {
  const backState = useBackState();
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-gray-900">Plantas</h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {plants.map((plant) => (
          <Link key={plant.id} to={`/plants/${plant.id}`} state={backState} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:border-blue-300">
            {plant.cover_url ? (
              <img src={avatarUrl(plant.cover_url, 56) || ''} alt="" className="h-14 w-14 flex-shrink-0 rounded-lg object-cover" />
            ) : (
              <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                <Factory className="h-6 w-6 text-gray-500" />
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-gray-900">{plant.name}</span>
                {!plant.is_active && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">Inactiva</span>}
              </span>
              {plant.location && (
                <span className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-500">
                  <MapPin className="h-3 w-3 flex-shrink-0" /> {plant.location}
                </span>
              )}
              <span className="mt-0.5 block text-xs text-gray-600">
                {plural(plant.areas, 'área', 'áreas')} · {plural(plant.employees, 'persona', 'personas')} · {plural(plant.tours, 'tour', 'tours')}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};

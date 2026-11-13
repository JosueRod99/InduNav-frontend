import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Building2, Loader2 } from 'lucide-react';
import { getPlatformHome, type PlatformHomeData } from '../../api/admin';
import Badge from '../../components/ui/Badge';
import { AttentionList, FigureCards, plural, visitsTrend, type Figure } from '../../components/ui/SummaryParts';

// "Inicio" of the platform team: how the platform is doing and which organization needs a hand.

const NEAR_LIMIT_RATIO = 0.8;

type Org = PlatformHomeData['organizations_list'][number];
type Change = PlatformHomeData['recent_changes'][number];

const nearLimit = (org: Org) => org.publications_limit > 0 && org.publications_used / org.publications_limit >= NEAR_LIMIT_RATIO;

/** Most urgent first; an organization without plants only shows that, since the rest follows from it */
const attentionOf = (organizations: Org[]) => {
  const active = organizations.filter((o) => o.is_active);
  return [
    ...active.filter(nearLimit).map((o) => ({ text: `${o.name}: cerca del límite, ${o.publications_used} de ${o.publications_limit} publicaciones`, to: `/organizations/${o.id}/configuracion` })),
    ...active.filter((o) => o.plants === 0).map((o) => ({ text: `${o.name}: sin plantas`, to: `/organizations/${o.id}/plantas` })),
    ...active.filter((o) => o.plants > 0 && o.tours_published === 0).map((o) => ({ text: `${o.name}: sin tours publicados`, to: `/organizations/${o.id}/resumen` })),
    ...active.filter((o) => o.tours_published > 0 && o.visits_30d === 0).map((o) => ({ text: `${o.name}: sin visitas en 30 días`, to: `/organizations/${o.id}/resumen` })),
  ];
};

const THINGS: Record<string, string> = {
  organizations: 'la organización',
  plants: 'la planta',
  tours: 'el tour',
  equipment: 'el equipo',
  products: 'el producto',
  'organizational-areas': 'el área',
  layouts: 'el layout',
  employees: 'el empleado',
  users: 'el usuario',
};
const VERBS: Record<string, string> = {
  create: 'creó',
  update: 'editó',
  delete: 'eliminó',
  permanent: 'eliminó definitivamente',
  publish: 'publicó',
  unpublish: 'despublicó',
};

const describeChange = (change: Change) => {
  const sub = change.action?.split(':')[1] || '';
  // Deleting an organization only deactivates it
  const verb = change.action === 'organizations:delete' ? 'desactivó' : VERBS[sub] || 'actualizó';
  const thing = THINGS[change.resource] || 'un registro';
  return `${change.user_name || 'Alguien'} ${verb} ${thing}${change.entity_name ? ` "${change.entity_name}"` : ''}`;
};

const thClass = 'px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500';

const PlatformHome = () => {
  const { data, isLoading, error } = useQuery({ queryKey: ['platform-home'], queryFn: getPlatformHome });

  if (isLoading) {
    return (
      <p className="flex items-center gap-2 text-gray-600">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
      </p>
    );
  }
  if (error || !data) return <p className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">No se pudo cargar el inicio.</p>;

  const figures: Figure[] = [
    { label: 'Organizaciones activas', value: data.organizations, to: '/organizations' },
    { label: 'Plantas', value: data.plants, to: '/plants' },
    { label: 'Tours publicados', value: data.tours_published, to: '/tours' },
    { label: 'Visitas en 30 días', value: data.visits_30d, hint: visitsTrend(data.visits_30d, data.visits_prev_30d) },
    { label: 'Publicaciones del mes', value: data.publications_used, hint: 'de todas las empresas', to: '/admin/usage?tab=narration' },
  ];

  const logo = (org: Org) =>
    org.logo_url ? (
      <img src={org.logo_url} alt="" className="h-9 w-9 flex-shrink-0 rounded-lg border border-gray-200 bg-white object-contain" />
    ) : (
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
        <Building2 className="h-4 w-4 text-gray-500" />
      </span>
    );

  return (
    <div className="space-y-4">
      <FigureCards figures={figures} className="sm:grid-cols-3 xl:grid-cols-5" />
      <AttentionList items={attentionOf(data.organizations_list)} />

      <section className="rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-900">Organizaciones por actividad</h3>
          <Link to="/organizations" className="text-xs font-medium text-blue-600 hover:underline">
            Ver todas
          </Link>
        </div>
        <table className="hidden min-w-full divide-y divide-gray-100 text-sm md:table">
          <thead className="bg-gray-50">
            <tr>
              <th className={thClass}>Organización</th>
              <th className={thClass}>Plantas</th>
              <th className={thClass}>Tours publicados</th>
              <th className={thClass}>Visitas en 30 días</th>
              <th className={thClass}>Publicaciones del mes</th>
              <th className={thClass}>Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.organizations_list.map((org) => (
              <tr key={org.id} className="hover:bg-gray-50">
                <td className="px-4 py-2">
                  <Link to={`/organizations/${org.id}`} className="flex items-center gap-3 font-medium text-gray-900 hover:text-blue-700">
                    {logo(org)}
                    {org.name}
                  </Link>
                </td>
                <td className="px-4 py-2 text-gray-700">{org.plants}</td>
                <td className="px-4 py-2 text-gray-700">{org.tours_published}</td>
                <td className="px-4 py-2 text-gray-700">{org.visits_30d}</td>
                <td className={`whitespace-nowrap px-4 py-2 ${nearLimit(org) ? 'font-medium text-amber-700' : 'text-gray-700'}`}>
                  {org.publications_used} de {org.publications_limit}
                </td>
                <td className="px-4 py-2">
                  <Badge variant={org.is_active ? 'success' : 'default'}>{org.is_active ? 'Activa' : 'Inactiva'}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <ul className="divide-y divide-gray-100 md:hidden">
          {data.organizations_list.map((org) => (
            <li key={org.id}>
              <Link to={`/organizations/${org.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                {logo(org)}
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-gray-900">{org.name}</span>
                  <span className="block text-xs text-gray-600">
                    {plural(org.plants, 'planta', 'plantas')} · {plural(org.tours_published, 'tour publicado', 'tours publicados')} · {plural(org.visits_30d, 'visita', 'visitas')}
                  </span>
                </span>
                {!org.is_active && <Badge variant="default">Inactiva</Badge>}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-900">Cambios recientes</h3>
          <Link to="/admin/audit" className="text-xs font-medium text-blue-600 hover:underline">
            Ver auditoría
          </Link>
        </div>
        {data.recent_changes.length === 0 ? (
          <p className="px-4 py-4 text-sm text-gray-600">Sin cambios recientes.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {data.recent_changes.map((change) => (
              <li key={change.id} className="flex flex-col gap-0.5 px-4 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <span className="min-w-0 text-gray-800">{describeChange(change)}</span>
                <span className="flex-shrink-0 text-xs text-gray-500">
                  {[change.organization_name, new Date(change.created_at).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })].filter(Boolean).join(' · ')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default PlatformHome;

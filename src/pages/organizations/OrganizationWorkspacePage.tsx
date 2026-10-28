import { Suspense, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, ChevronRight, Factory, Loader2, Pencil, Settings, Users } from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { getOrganization } from '../../api/organizations';
import { useAuthStore } from '../../store/authStore';
import OrganizationModal from './OrganizationModal';

// Organization page: its plants, users and settings behind tabs (/organizations/:orgId/:tab).
// Platform admins reach every organization from here; an organization owner sees their own
// ("Mi empresa"), without the users tab (user management is platform-admin only).

import PlantsPage from '../plants/PlantsPage';
import UsersPage from '../users/UsersPage';

const TABS = [
  { id: 'plantas', label: 'Plantas', Icon: Factory, adminOnly: false },
  { id: 'usuarios', label: 'Usuarios', Icon: Users, adminOnly: true },
  { id: 'configuracion', label: 'Configuración', Icon: Settings, adminOnly: false },
] as const;

const PLAN_LABELS: Record<string, string> = { free: 'Gratis', pro: 'Pro', enterprise: 'Enterprise' };

const OrganizationWorkspacePage = () => {
  const { orgId, tab } = useParams<{ orgId: string; tab?: string }>();
  const { user } = useAuthStore();
  const isPlatformAdmin = user?.role?.name === 'platform_admin';
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: organization, isLoading, error } = useQuery({
    queryKey: ['organization', orgId],
    queryFn: () => getOrganization(orgId!),
    enabled: !!orgId,
    retry: (count, err: any) => ![403, 404].includes(err?.response?.status) && count < 2,
  });

  const tabs = TABS.filter((t) => !t.adminOnly || isPlatformAdmin);
  const activeTab = tabs.find((t) => t.id === tab)?.id;
  if (!activeTab) return <Navigate to={`/organizations/${orgId}/plantas`} replace />;

  if (isLoading) {
    return (
      <p className="flex items-center gap-2 text-gray-600">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando empresa…
      </p>
    );
  }
  if (error || !organization) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-700">No se encontró la empresa o no tienes acceso a ella.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {isPlatformAdmin && (
            <nav aria-label="Ruta" className="flex items-center gap-1 text-sm text-gray-500">
              <Link to="/organizations" className="hover:text-blue-700 hover:underline">
                Organizaciones
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="truncate text-gray-700">{organization.name}</span>
            </nav>
          )}
          <h2 className="mt-0.5 flex items-center gap-2 text-2xl font-bold text-gray-900">
            {organization.logo_url ? (
              <img src={organization.logo_url} alt="" className="h-8 w-8 rounded object-contain" />
            ) : (
              <Building2 className="h-6 w-6 flex-shrink-0 text-gray-500" />
            )}
            <span className="truncate">{organization.name}</span>
            {!organization.is_active && <Badge variant="error">Inactiva</Badge>}
          </h2>
        </div>
      </div>

      <div className="overflow-x-auto border-b border-gray-200">
        <nav className="-mb-px flex gap-1" aria-label="Secciones de la empresa">
          {tabs.map(({ id, label, Icon }) => (
            <Link
              key={id}
              to={`/organizations/${organization.id}/${id}`}
              aria-current={activeTab === id ? 'page' : undefined}
              className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </div>

      <Suspense
        fallback={
          <p className="flex items-center gap-2 text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
          </p>
        }
      >
        {activeTab === 'plantas' && <PlantsPage organizationId={organization.id} />}
        {activeTab === 'usuarios' && <UsersPage organizationId={organization.id} />}
        {activeTab === 'configuracion' && (
          <section className="max-w-2xl rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-900">Datos de la empresa</h3>
              {isPlatformAdmin && (
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setIsEditOpen(true)}>
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
              )}
            </div>
            <dl className="divide-y divide-gray-100 text-sm">
              {[
                ['Nombre', organization.name],
                ['Identificador (links de tours)', organization.slug],
                ['Plan', PLAN_LABELS[organization.plan] || organization.plan],
                ['Estado', organization.is_active ? 'Activa' : 'Inactiva'],
                [
                  'Publicaciones de tours con narración al mes',
                  `${organization.tour_publications_per_month ?? 20} (se reinicia el día 1 de cada mes)`,
                ],
                ['Cliente desde', new Date(organization.created_at).toLocaleDateString('es-MX', { dateStyle: 'long' })],
              ].map(([label, value]) => (
                <div key={label} className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-3">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="text-gray-900 sm:col-span-2">{value}</dd>
                </div>
              ))}
            </dl>
            {!isPlatformAdmin && (
              <p className="border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
                Para cambiar estos datos o tu plan, contacta al equipo de InduNav.
              </p>
            )}
          </section>
        )}
      </Suspense>

      {isPlatformAdmin && (
        <OrganizationModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} organization={organization} />
      )}
    </div>
  );
};

export default OrganizationWorkspacePage;

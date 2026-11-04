import { Suspense, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, ChevronRight, Factory, FileText, IdCard, LayoutDashboard, Loader2, Pencil, Settings, Users } from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ScrollTabs from '../../components/ui/ScrollTabs';
import { getOrganization } from '../../api/organizations';
import { useAuthStore } from '../../store/authStore';
import OrganizationModal from './OrganizationModal';

// Organization page: its summary, plants, documents, users and settings behind tabs (/organizations/:orgId/:tab).
// Platform admins reach every organization from here; an organization owner sees their own
// ("Mi empresa"), without the users tab (user management is platform-admin only).

import PlantsPage from '../plants/PlantsPage';
import UsersPage from '../users/UsersPage';
import OrganizationProfileTab from './OrganizationProfileTab';
import OrganizationSummaryTab from './OrganizationSummaryTab';
import OrganizationLibraryTab from './OrganizationLibraryTab';

const MANAGERS = ['platform_admin', 'org_owner'];
const TABS = [
  { id: 'resumen', label: 'Resumen', Icon: LayoutDashboard, adminOnly: false, managersOnly: true },
  { id: 'plantas', label: 'Plantas', Icon: Factory, adminOnly: false, managersOnly: false },
  { id: 'perfil', label: 'Perfil', Icon: IdCard, adminOnly: false, managersOnly: false }, // company profile shown in the tours
  { id: 'documentos', label: 'Documentos y certificaciones', Icon: FileText, adminOnly: false, managersOnly: true },
  { id: 'usuarios', label: 'Usuarios', Icon: Users, adminOnly: true, managersOnly: false },
  { id: 'configuracion', label: 'Configuración', Icon: Settings, adminOnly: false, managersOnly: false }, // button in the header
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

  const isManager = MANAGERS.includes(user?.role?.name || '');
  const tabs = TABS.filter((t) => (!t.adminOnly || isPlatformAdmin) && (!t.managersOnly || isManager));
  const activeTab = tabs.find((t) => t.id === tab)?.id;
  if (!activeTab) return <Navigate to={`/organizations/${orgId}/${tabs[0].id}`} replace />;

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
          {/* Logo beside the name and plan */}
          <div className="mt-0.5 flex items-center gap-3">
            {organization.logo_url ? (
              <img src={organization.logo_url} alt="" className="h-14 w-14 flex-shrink-0 rounded-lg border border-gray-200 bg-white object-contain" />
            ) : (
              <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                <Building2 className="h-6 w-6 text-gray-500" />
              </span>
            )}
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-bold text-gray-900">{organization.name}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <Badge variant="default">{PLAN_LABELS[organization.plan] || organization.plan}</Badge>
                {!organization.is_active && <Badge variant="default">Inactiva</Badge>}
              </div>
            </div>
          </div>
        </div>
        {/* Settings: in the header, not one more tab */}
        <Link
          to={`/organizations/${organization.id}/configuracion`}
          aria-current={activeTab === 'configuracion' ? 'page' : undefined}
          className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === 'configuracion' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Settings className="h-4 w-4" /> Configuración
        </Link>
      </div>

      <ScrollTabs label="Secciones de la empresa">
          {tabs.filter((t) => t.id !== 'configuracion').map(({ id, label, Icon }) => (
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
      </ScrollTabs>

      <Suspense
        fallback={
          <p className="flex items-center gap-2 text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
          </p>
        }
      >
        {activeTab === 'resumen' && <OrganizationSummaryTab organizationId={organization.id} />}
        {activeTab === 'plantas' && <PlantsPage organizationId={organization.id} />}
        {activeTab === 'documentos' && <OrganizationLibraryTab organization={organization} />}
        {activeTab === 'perfil' && (
          <OrganizationProfileTab organizationId={organization.id} canEdit={isPlatformAdmin || user?.role?.name === 'org_owner'} />
        )}
        {activeTab === 'usuarios' && <UsersPage organizationId={organization.id} />}
        {activeTab === 'configuracion' && (
          <section className="rounded-lg border border-gray-200 bg-white">
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

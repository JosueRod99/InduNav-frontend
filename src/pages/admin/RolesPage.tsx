import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Copy, KeyRound, Loader2, Pencil, Plus, Search, Shield, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import ScrollTabs from '../../components/ui/ScrollTabs';
import SectionHeader from '../../components/ui/SectionHeader';
import {
  deleteRole,
  getManagedRoles,
  getPermissionCatalog,
  updatePermissionDescription,
  type CatalogPermission,
  type ManagedRole,
} from '../../api/roles';
import { ACTION_LABELS, byAction, CATEGORY_LABELS, SCOPE_LABELS } from '../../utils/permissions';
import { matchesSearch } from '../../utils/search';

// Roles and what each permission means. Permissions are fixed in code, since each one only works if
// the API checks it: here roles get permissions, and permissions only change their description.

const TABS = [
  { id: 'roles', label: 'Roles', Icon: Shield },
  { id: 'permisos', label: 'Permisos', Icon: KeyRound },
] as const;

const countLabel = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const errorMessage = (error: any, fallback: string) => error?.response?.data?.message || fallback;

const RolesTab = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: roles = [], isLoading, isError } = useQuery({ queryKey: ['managed-roles'], queryFn: getManagedRoles });

  const remove = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      toast.success('Rol eliminado');
      queryClient.invalidateQueries({ queryKey: ['managed-roles'] });
    },
    onError: (error) => toast.error(errorMessage(error, 'No se pudo eliminar el rol')),
  });

  const whyNotDeleted = (role: ManagedRole) =>
    role.is_system ? 'Los roles del sistema no se eliminan' : role.users_count > 0 ? `Tiene ${countLabel(role.users_count, 'usuario', 'usuarios')}: cámbialos de rol primero` : null;

  const actions = (role: ManagedRole) => {
    const blocked = whyNotDeleted(role);
    return (
      <span className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
        <Link
          to={`/admin/roles/nuevo?desde=${role.id}`}
          className="rounded p-1.5 text-gray-600 hover:bg-gray-100"
          title="Duplicar"
          aria-label={`Duplicar ${role.display_name}`}
        >
          <Copy className="h-4 w-4" />
        </Link>
        <button
          type="button"
          disabled={!!blocked || remove.isPending}
          onClick={() => window.confirm(`¿Eliminar el rol "${role.display_name}"?`) && remove.mutate(role.id)}
          className="rounded p-1.5 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
          title={blocked || 'Eliminar'}
          aria-label={`Eliminar ${role.display_name}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Roles"
        description="Lo que puede hacer cada tipo de usuario. Los cambios aplican a todos sus usuarios en menos de un minuto, sin que vuelvan a entrar."
        actions={
          <Link to="/admin/roles/nuevo">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Nuevo rol
            </Button>
          </Link>
        }
      />
      {isLoading ? (
        <p className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando roles…
        </p>
      ) : isError ? (
        <p className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">No se pudieron cargar los roles.</p>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white md:block">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Alcance</th>
                  <th className="px-4 py-3 text-right">Usuarios</th>
                  <th className="px-4 py-3 text-right">Permisos</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {roles.map((role) => (
                  <tr key={role.id} className="cursor-pointer hover:bg-gray-50" onClick={() => navigate(`/admin/roles/${role.id}`)}>
                    <td className="max-w-md px-4 py-3">
                      <Link to={`/admin/roles/${role.id}`} className="font-medium text-gray-900 hover:text-blue-700" onClick={(e) => e.stopPropagation()}>
                        {role.display_name}
                      </Link>
                      {role.description && <p className="mt-0.5 text-xs text-gray-500">{role.description}</p>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">{SCOPE_LABELS[role.scope]}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{role.users_count}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{role.permissions.length}</td>
                    <td className="px-4 py-3">{actions(role)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="space-y-2 md:hidden">
            {roles.map((role) => (
              <li key={role.id} className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/admin/roles/${role.id}`} className="min-w-0 font-medium text-gray-900">
                    {role.display_name}
                  </Link>
                  {actions(role)}
                </div>
                {role.description && <p className="mt-0.5 text-xs text-gray-500">{role.description}</p>}
                <p className="mt-2 text-xs text-gray-600">
                  {SCOPE_LABELS[role.scope]} · {countLabel(role.users_count, 'usuario', 'usuarios')} · {countLabel(role.permissions.length, 'permiso', 'permisos')}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

const PermissionRow = ({ permission }: { permission: CatalogPermission }) => {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<string | null>(null);
  const save = useMutation({
    mutationFn: (description: string) => updatePermissionDescription(permission.id, description),
    onSuccess: () => {
      toast.success('Descripción guardada');
      setDraft(null);
      queryClient.invalidateQueries({ queryKey: ['permission-catalog'] });
    },
    onError: (error) => toast.error(errorMessage(error, 'No se pudo guardar')),
  });

  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-sm font-medium text-gray-900">{ACTION_LABELS[permission.action] || permission.action}</span>
        <code className="text-xs text-gray-500">{permission.name}</code>
        {permission.platform_only && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">Solo plataforma</span>}
      </div>
      {draft === null ? (
        <p className="mt-1 flex items-start gap-1.5 text-sm text-gray-600">
          <span className="min-w-0">{permission.description}</span>
          <button
            type="button"
            onClick={() => setDraft(permission.description || '')}
            className="flex-shrink-0 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label={`Editar la descripción de ${permission.name}`}
            title="Editar descripción"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </p>
      ) : (
        <form
          className="mt-1 flex items-center gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate(draft);
          }}
        >
          <input
            autoFocus
            value={draft}
            maxLength={500}
            aria-label={`Descripción de ${permission.name}`}
            onChange={(e) => setDraft(e.target.value)}
            className="min-w-0 flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button type="submit" disabled={save.isPending} className="rounded p-1 text-green-700 hover:bg-green-50" aria-label="Guardar descripción">
            <Check className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => setDraft(null)} className="rounded p-1 text-gray-500 hover:bg-gray-100" aria-label="Cancelar">
            <X className="h-4 w-4" />
          </button>
        </form>
      )}
      <p className="mt-1 text-xs text-gray-500">{permission.roles.length ? permission.roles.join(' · ') : 'Ningún rol lo tiene'}</p>
    </li>
  );
};

const PermissionsTab = () => {
  const [search, setSearch] = useState('');
  const { data: permissions = [], isLoading, isError } = useQuery({ queryKey: ['permission-catalog'], queryFn: getPermissionCatalog });

  const categories = useMemo(() => {
    const visible = permissions.filter((p) =>
      matchesSearch(search, p.name, p.description, CATEGORY_LABELS[p.resource], ACTION_LABELS[p.action])
    );
    return Object.keys(CATEGORY_LABELS)
      .map((resource) => ({ resource, items: visible.filter((p) => p.resource === resource).sort(byAction) }))
      .filter((category) => category.items.length > 0);
  }, [permissions, search]);

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Permisos"
        description="Qué permite cada uno y qué roles lo tienen. Cada permiso lo revisa el sistema, por eso aquí solo se edita su descripción; para asignarlos, abre un rol."
      />
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar permiso…"
          aria-label="Buscar permiso"
          className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      {isLoading ? (
        <p className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando permisos…
        </p>
      ) : isError ? (
        <p className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">No se pudieron cargar los permisos.</p>
      ) : categories.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">Ningún permiso coincide con la búsqueda.</p>
      ) : (
        categories.map(({ resource, items }) => (
          <section key={resource} className="rounded-lg border border-gray-200 bg-white">
            <h3 className="border-b border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-900">{CATEGORY_LABELS[resource]}</h3>
            <ul className="divide-y divide-gray-100">
              {items.map((permission) => (
                <PermissionRow key={permission.id} permission={permission} />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
};

const RolesPage = () => {
  const [searchParams] = useSearchParams();
  const activeTab = TABS.find((t) => t.id === searchParams.get('tab'))?.id ?? TABS[0].id;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Roles y permisos</h2>
        <p className="mt-1 text-sm text-gray-600">Solo visible para administradores de la plataforma.</p>
      </div>
      <ScrollTabs label="Roles y permisos">
        {TABS.map(({ id, label, Icon }) => (
          <Link
            key={id}
            to={`?tab=${id}`}
            replace
            aria-current={activeTab === id ? 'page' : undefined}
            className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              activeTab === id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900'
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </Link>
        ))}
      </ScrollTabs>
      {activeTab === 'roles' ? <RolesTab /> : <PermissionsTab />}
    </div>
  );
};

export default RolesPage;

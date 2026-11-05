import { confirmar } from '../../components/ui/ConfirmDialog';
import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Power, Search, Trash2, Building2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import OrganizationModal from './OrganizationModal';
import { getOrganizations, deleteOrganization, permanentlyDeleteOrganization, updateOrganization } from '../../api/organizations';
import { matchesSearch } from '../../utils/search';
import type { Organization } from '../../types';

// Organizations of the platform: who they are and how much they use it. The summary cards filter
// the list. "Desactivar" keeps everything; deleting for good is only offered for inactive ones.

export const PLAN_LABELS: Record<string, string> = { free: 'Gratis', pro: 'Pro', enterprise: 'Enterprise' };
export const NEAR_LIMIT_RATIO = 0.8;

type Quick = '' | 'active' | 'inactive' | 'near';

const nearLimit = (org: Organization) => !!org.is_active && !!org.publications_limit && (org.publications_used ?? 0) / org.publications_limit >= NEAR_LIMIT_RATIO;

const selectClass = 'min-w-0 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const thClass = 'px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500';

const Logo = ({ org }: { org: Organization }) =>
  org.logo_url ? (
    <img src={org.logo_url} alt="" className="h-10 w-10 flex-shrink-0 rounded-lg border border-gray-200 bg-white object-contain" />
  ) : (
    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
      <Building2 className="h-5 w-5 text-gray-500" />
    </span>
  );

/** Deleting for good: the name has to be typed, because it takes everything with it */
const PermanentDeleteModal = ({ org, onClose }: { org: Organization | null; onClose: () => void }) => {
  const queryClient = useQueryClient();
  const [typed, setTyped] = useState('');
  const close = () => {
    setTyped('');
    onClose();
  };
  const remove = useMutation({
    mutationFn: () => permanentlyDeleteOrganization(org!.id),
    onSuccess: () => {
      toast.success('Organización eliminada definitivamente');
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      close();
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'No se pudo eliminar la organización'),
  });
  return (
    <Modal
      isOpen={!!org}
      onClose={close}
      title="Eliminar definitivamente"
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={close}>
            Cancelar
          </Button>
          <button
            onClick={() => remove.mutate()}
            disabled={typed.trim() !== org?.name || remove.isPending}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Eliminar definitivamente
          </button>
        </div>
      }
    >
      <div className="space-y-3 text-sm text-gray-700">
        <p>
          Se borrarán <strong>{org?.name}</strong> y todo lo que contiene: plantas, áreas, personal, equipos, productos, documentos, tours y usuarios. <strong>No se puede deshacer.</strong>
        </p>
        <label className="block font-medium text-gray-700">
          Escribe el nombre de la organización para confirmar
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={org?.name}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-normal focus:border-blue-500 focus:outline-none"
          />
        </label>
      </div>
    </Modal>
  );
};

const OrganizationsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [deleting, setDeleting] = useState<Organization | null>(null);
  const [search, setSearch] = useState('');
  const [plan, setPlan] = useState('');
  const [quick, setQuick] = useState<Quick>('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => getOrganizations({ limit: 100 }),
  });
  const organizations = useMemo(() => data?.organizations || [], [data]);

  const setActive = useMutation({
    mutationFn: async ({ org, active }: { org: Organization; active: boolean }) => {
      if (active) await updateOrganization(org.id, { is_active: true });
      else await deleteOrganization(org.id);
    },
    onSuccess: (_, { org, active }) => {
      toast.success(active ? 'Organización reactivada' : 'Organización desactivada');
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['organization', org.id] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'No se pudo cambiar el estado'),
  });

  const handleCreate = () => {
    setSelectedOrganization(null);
    setIsModalOpen(true);
  };
  const handleEdit = (organization: Organization) => {
    setSelectedOrganization(organization);
    setIsModalOpen(true);
  };
  const toggleActive = async (org: Organization) => {
    if (!org.is_active) setActive.mutate({ org, active: true });
    else if (await confirmar({ title: 'Desactivar empresa', message: `"${org.name}" quedará inactiva. No se borra nada y puedes reactivarla cuando quieras.`, confirmLabel: 'Desactivar' })) setActive.mutate({ org, active: false });
  };

  const counts = {
    total: organizations.length,
    active: organizations.filter((o) => o.is_active).length,
    inactive: organizations.filter((o) => !o.is_active).length,
    near: organizations.filter(nearLimit).length,
  };
  const visible = organizations.filter((o) => {
    if (quick === 'active' && !o.is_active) return false;
    if (quick === 'inactive' && o.is_active) return false;
    if (quick === 'near' && !nearLimit(o)) return false;
    if (plan && o.plan !== plan) return false;
    return matchesSearch(search, o.name, o.slug);
  });

  const usage = (org: Organization) => (
    <span className={nearLimit(org) ? 'font-medium text-amber-700' : 'text-gray-700'}>
      {org.publications_used ?? 0} de {org.publications_limit ?? 20}
    </span>
  );
  const planBadge = (org: Organization) => <Badge variant="default">{PLAN_LABELS[org.plan] || org.plan}</Badge>;
  const stateBadge = (org: Organization) => <Badge variant={org.is_active ? 'success' : 'default'}>{org.is_active ? 'Activa' : 'Inactiva'}</Badge>;
  const actions = (org: Organization) => (
    <div className="flex items-center justify-end gap-3">
      <button onClick={() => handleEdit(org)} className="text-gray-600 hover:text-gray-900" title="Editar" aria-label={`Editar ${org.name}`}>
        <Pencil className="h-4 w-4" />
      </button>
      <button
        onClick={() => toggleActive(org)}
        disabled={setActive.isPending}
        className={`${org.is_active ? 'text-gray-600 hover:text-gray-900' : 'text-green-700 hover:text-green-900'} disabled:opacity-50`}
        title={org.is_active ? 'Desactivar' : 'Reactivar'}
        aria-label={`${org.is_active ? 'Desactivar' : 'Reactivar'} ${org.name}`}
      >
        <Power className="h-4 w-4" />
      </button>
      {!org.is_active && (
        <button onClick={() => setDeleting(org)} className="text-red-600 hover:text-red-900" title="Eliminar definitivamente" aria-label={`Eliminar definitivamente ${org.name}`}>
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-gray-900">Organizaciones</h2>
          <p className="mt-1 text-sm text-gray-600">Las empresas de la plataforma y cuánto la usan.</p>
        </div>
        <Button onClick={handleCreate} className="gap-2 whitespace-nowrap">
          <Plus className="h-4 w-4" />
          Nueva Organización
        </Button>
      </div>

      {isLoading ? (
        <p className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">Cargando…</p>
      ) : error ? (
        <p className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-red-600">Error al cargar organizaciones</p>
      ) : organizations.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay organizaciones</h3>
          <p className="mt-1 text-sm text-gray-500">Comienza creando una nueva organización.</p>
        </div>
      ) : (
        <>
          {/* Summary: each card filters (a second click clears it) */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {(
              [
                ['', 'Organizaciones', counts.total],
                ['active', 'Activas', counts.active],
                ['inactive', 'Inactivas', counts.inactive],
                ['near', 'Cerca del límite de publicaciones', counts.near],
              ] as [Quick, string, number][]
            ).map(([key, label, value]) => (
              <button
                key={label}
                onClick={() => setQuick(quick === key ? '' : key)}
                aria-pressed={quick === key}
                className={`rounded-lg border bg-white p-3 text-left transition-colors ${quick === key ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200 hover:border-blue-300'}`}
              >
                <span className="block text-2xl font-bold text-gray-900">{value}</span>
                <span className="text-xs text-gray-600">{label}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="relative w-full flex-1 sm:w-auto sm:min-w-[12rem]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o identificador"
                aria-label="Buscar organizaciones"
                className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            {/* Side by side on phones */}
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
            <select value={plan} onChange={(e) => setPlan(e.target.value)} aria-label="Plan" className={selectClass}>
              <option value="">Plan: todos</option>
              {Object.entries(PLAN_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select value={quick === 'near' ? '' : quick} onChange={(e) => setQuick(e.target.value as Quick)} aria-label="Estado" className={selectClass}>
              <option value="">Estado: todos</option>
              <option value="active">Activas</option>
              <option value="inactive">Inactivas</option>
            </select>
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">Ninguna organización coincide con los filtros.</p>
          ) : (
            <>
              {/* Table on wide screens */}
              <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white md:block">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className={thClass}>Organización</th>
                      <th className={thClass}>Plan</th>
                      <th className={thClass}>Plantas</th>
                      <th className={thClass}>Usuarios</th>
                      <th className={thClass}>Tours publicados</th>
                      <th className={thClass}>Publicaciones del mes</th>
                      <th className={thClass}>Estado</th>
                      <th className={`${thClass} text-right`}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {visible.map((org) => (
                      <tr key={org.id} className="cursor-pointer hover:bg-gray-50" onClick={() => navigate(`/organizations/${org.id}`)}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Logo org={org} />
                            <div className="min-w-0">
                              <Link
                                to={`/organizations/${org.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="font-medium text-gray-900 hover:text-blue-700 hover:underline"
                              >
                                {org.name}
                              </Link>
                              <p className="text-xs text-gray-500">{org.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">{planBadge(org)}</td>
                        <td className="px-4 py-3 text-gray-700">{org.plants_count ?? 0}</td>
                        <td className="px-4 py-3 text-gray-700">{org.users_count ?? 0}</td>
                        <td className="px-4 py-3 text-gray-700">{org.tours_published ?? 0}</td>
                        <td className="whitespace-nowrap px-4 py-3">{usage(org)}</td>
                        <td className="whitespace-nowrap px-4 py-3">{stateBadge(org)}</td>
                        <td className="whitespace-nowrap px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          {actions(org)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards on phones */}
              <ul className="space-y-2 md:hidden">
                {visible.map((org) => (
                  <li key={org.id} className="rounded-lg border border-gray-200 bg-white p-3">
                    <div className="flex items-start gap-3">
                      <Logo org={org} />
                      <div className="min-w-0 flex-1">
                        <Link to={`/organizations/${org.id}`} className="block font-medium text-gray-900 hover:text-blue-700">
                          {org.name}
                        </Link>
                        <p className="text-xs text-gray-500">{org.slug}</p>
                      </div>
                      {actions(org)}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {planBadge(org)}
                      {stateBadge(org)}
                    </div>
                    <p className="mt-2 text-xs text-gray-600">
                      {plural(org.plants_count ?? 0, 'planta', 'plantas')} · {plural(org.users_count ?? 0, 'usuario', 'usuarios')} · {plural(org.tours_published ?? 0, 'tour publicado', 'tours publicados')}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-600">Publicaciones del mes: {usage(org)}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      <OrganizationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} organization={selectedOrganization} />
      <PermanentDeleteModal org={deleting} onClose={() => setDeleting(null)} />
    </div>
  );
};

export default OrganizationsPage;

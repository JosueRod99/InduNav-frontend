import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Lock, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import { createRole, getManagedRole, getPermissionCatalog, updateRole, type CatalogPermission, type RoleInput } from '../../api/roles';
import { ACTION_LABELS, byAction, CATEGORY_LABELS, withRequired } from '../../utils/permissions';
import { matchesSearch } from '../../utils/search';

// One role: its name, what data it reaches and its permissions by category.
// Also creates one, empty or as a copy of another (?desde=<role>).

const SCOPES = [
  { value: 'organization', label: 'Toda su empresa', hint: 'Ve todas las plantas de su empresa.' },
  { value: 'plant', label: 'Sus plantas', hint: 'Solo las plantas que se le asignen en su usuario. Sin plantas no ve nada.' },
] as const;

const usersLabel = (n: number) => (n === 1 ? '1 usuario' : `${n} usuarios`);

const RoleEditorPage = () => {
  const { roleId } = useParams<{ roleId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const copyFrom = searchParams.get('desde');
  const sourceId = roleId || copyFrom;

  const { data: source, isLoading: loadingSource, isError: sourceError } = useQuery({
    queryKey: ['managed-role', sourceId],
    queryFn: () => getManagedRole(sourceId!),
    enabled: !!sourceId,
    retry: false,
  });
  const { data: catalog = [], isLoading: loadingCatalog } = useQuery({ queryKey: ['permission-catalog'], queryFn: getPermissionCatalog });

  const role = roleId ? source : undefined;
  const isLocked = role?.name === 'platform_admin';
  const scopeLocked = !!role && (role.is_system || role.users_count > 0);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState<RoleInput['scope']>('plant');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!source) return;
    setName(roleId ? source.display_name : `Copia de ${source.display_name}`);
    setDescription(source.description || '');
    setScope(source.scope === 'platform' ? 'organization' : source.scope);
    setSelected(new Set(source.permissions));
    setIsDirty(false);
  }, [source, roleId]);

  const assignable = useMemo(() => catalog.filter((p) => isLocked || !p.platform_only), [catalog, isLocked]);
  const catalogNames = useMemo(() => new Set(assignable.map((p) => p.name)), [assignable]);
  // A copy of the platform role keeps only what a client role can hold
  const markedCount = [...selected].filter((permission) => catalogNames.has(permission)).length;
  const required = useMemo(() => {
    const others = (name: string) => [...selected].filter((other) => other !== name);
    return new Set([...selected].filter((name) => withRequired(others(name), catalogNames).has(name)));
  }, [selected, catalogNames]);

  const change = (update: () => void) => {
    update();
    setIsDirty(true);
  };
  const toggle = (permission: string) =>
    change(() =>
      setSelected((current) => {
        const next = new Set(current);
        if (next.has(permission)) next.delete(permission);
        else next.add(permission);
        return withRequired(next, catalogNames);
      })
    );
  const setCategory = (items: CatalogPermission[], on: boolean) =>
    change(() =>
      setSelected((current) => {
        const next = new Set(current);
        items.forEach((p) => (on ? next.add(p.name) : next.delete(p.name)));
        return withRequired(next, catalogNames);
      })
    );

  const categories = useMemo(() => {
    const visible = assignable.filter((p) => matchesSearch(search, p.name, p.description, CATEGORY_LABELS[p.resource], ACTION_LABELS[p.action]));
    return Object.keys(CATEGORY_LABELS)
      .map((resource) => ({ resource, items: visible.filter((p) => p.resource === resource).sort(byAction) }))
      .filter((category) => category.items.length > 0);
  }, [assignable, search]);

  const save = useMutation({
    mutationFn: () => {
      const input: RoleInput = {
        display_name: name.trim(),
        description: description.trim() || null,
        scope,
        permissions: [...selected].filter((permission) => catalogNames.has(permission)),
      };
      return role ? updateRole(role.id, input) : createRole(input);
    },
    onSuccess: () => {
      toast.success(role ? 'Rol actualizado' : 'Rol creado');
      queryClient.invalidateQueries({ queryKey: ['managed-roles'] });
      queryClient.invalidateQueries({ queryKey: ['managed-role'] });
      queryClient.invalidateQueries({ queryKey: ['permission-catalog'] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setIsDirty(false);
      navigate('/admin/roles');
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'No se pudo guardar el rol'),
  });

  if ((sourceId && loadingSource) || loadingCatalog) {
    return (
      <p className="flex items-center gap-2 text-gray-600">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando rol…
      </p>
    );
  }
  if (sourceId && sourceError) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-700">No se encontró el rol.</p>
        <Link to="/admin/roles" className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline">
          Volver a roles
        </Link>
      </div>
    );
  }

  const inputClass = 'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500';

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!isLocked) save.mutate();
      }}
    >
      <div>
        <Link to="/admin/roles" className="mb-1 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Roles y permisos
        </Link>
        <h2 className="text-2xl font-bold text-gray-900">{role ? role.display_name : copyFrom ? 'Duplicar rol' : 'Nuevo rol'}</h2>
      </div>

      {isLocked && (
        <p className="flex items-start gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
          <Lock className="mt-0.5 h-4 w-4 flex-shrink-0" />
          Este rol tiene todos los permisos y no se puede cambiar, para que siempre haya quien administre la plataforma.
        </p>
      )}

      <section className="grid gap-4 rounded-lg border border-gray-200 bg-white p-4 md:grid-cols-2">
        <div>
          <label htmlFor="role-name" className="mb-1 block text-sm font-medium text-gray-700">
            Nombre *
          </label>
          <input id="role-name" required minLength={2} maxLength={80} disabled={isLocked} value={name} onChange={(e) => change(() => setName(e.target.value))} className={inputClass} />
        </div>
        <div>
          <label htmlFor="role-description" className="mb-1 block text-sm font-medium text-gray-700">
            Descripción
          </label>
          <input id="role-description" maxLength={500} disabled={isLocked} value={description} onChange={(e) => change(() => setDescription(e.target.value))} className={inputClass} />
        </div>
        {!isLocked && (
          <fieldset className="md:col-span-2">
            <legend className="mb-1 text-sm font-medium text-gray-700">Alcance: qué datos alcanza</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {SCOPES.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-2 rounded-md border p-3 text-sm ${scope === option.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} ${scopeLocked ? 'opacity-70' : 'cursor-pointer'}`}
                >
                  <input type="radio" name="scope" className="mt-0.5" disabled={scopeLocked} checked={scope === option.value} onChange={() => change(() => setScope(option.value))} />
                  <span>
                    <span className="block font-medium text-gray-900">{option.label}</span>
                    <span className="text-xs text-gray-600">{option.hint}</span>
                  </span>
                </label>
              ))}
            </div>
            {scopeLocked && (
              <p className="mt-1 text-xs text-gray-500">
                {role?.is_system ? 'El alcance de los roles del sistema es fijo.' : `Tiene ${usersLabel(role!.users_count)}: cámbialos de rol para cambiar el alcance.`}
              </p>
            )}
          </fieldset>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Permisos</h3>
          <p className="text-sm text-gray-600">
            {markedCount} marcados. Para cambiar algo hay que poder verlo, así que "Ver" se marca solo.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar permiso…" aria-label="Buscar permiso" className={`${inputClass} pl-9`} />
        </div>
      </div>

      {categories.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">Ningún permiso coincide con la búsqueda.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {categories.map(({ resource, items }) => {
            const marked = items.filter((p) => selected.has(p.name)).length;
            return (
              <section key={resource} className="self-start rounded-lg border border-gray-200 bg-white">
                <div className="flex items-center justify-between gap-2 border-b border-gray-200 px-4 py-2.5">
                  <h4 className="text-sm font-semibold text-gray-900">
                    {CATEGORY_LABELS[resource]} <span className="font-normal text-gray-500">{marked}/{items.length}</span>
                  </h4>
                  {!isLocked && (
                    <button type="button" onClick={() => setCategory(items, marked < items.length)} className="text-xs font-medium text-blue-700 hover:underline">
                      {marked < items.length ? 'Marcar todos' : 'Quitar todos'}
                    </button>
                  )}
                </div>
                <ul className="divide-y divide-gray-100">
                  {items.map((permission) => {
                    const isRequired = required.has(permission.name);
                    return (
                      <li key={permission.id}>
                        <label className={`flex items-start gap-2.5 px-4 py-2.5 ${isLocked || isRequired ? '' : 'cursor-pointer hover:bg-gray-50'}`} title={isRequired ? 'Lo necesitan otros permisos marcados' : undefined}>
                          <input
                            type="checkbox"
                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-60"
                            checked={selected.has(permission.name)}
                            disabled={isLocked || isRequired}
                            onChange={() => toggle(permission.name)}
                          />
                          <span className="min-w-0">
                            <span className="text-sm font-medium text-gray-900">{ACTION_LABELS[permission.action] || permission.action}</span>
                            <span className="block text-xs text-gray-600">{permission.description}</span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {!isLocked && (
        <div className="sticky bottom-0 z-30 -mx-4 border-t border-gray-200 bg-white px-4 py-3 md:mx-0 md:rounded-t-lg md:border-x">
          <div className="flex flex-wrap items-center justify-end gap-3">
            {role && role.users_count > 0 && <p className="mr-auto text-xs text-gray-600">Aplica en menos de un minuto a {usersLabel(role.users_count)}, sin que vuelvan a entrar.</p>}
            <Link to="/admin/roles">
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" isLoading={save.isPending} disabled={!!role && !isDirty}>
              {role ? 'Guardar cambios' : 'Crear rol'}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
};

export default RoleEditorPage;

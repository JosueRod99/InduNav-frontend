import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Languages, Loader2, Pencil, Plus, Power, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import { confirmar } from '../../components/ui/ConfirmDialog';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import ScrollTabs from '../../components/ui/ScrollTabs';
import SectionHeader from '../../components/ui/SectionHeader';
import {
  createLanguage,
  deleteLanguage,
  getLanguages,
  getOrganizationLanguages,
  setOrganizationLanguages,
  updateLanguage,
  type CatalogLanguage,
  type OrganizationLanguages,
} from '../../api/languages';

// Languages of the tours: the catalog of the platform and which ones each company has. Each tour then
// chooses among those of its company.

const TABS = [
  { id: 'catalogo', label: 'Catálogo', Icon: Languages },
  { id: 'empresas', label: 'Por empresa', Icon: Building2 },
] as const;

const countLabel = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const errorMessage = (error: any, fallback: string) => error?.response?.data?.message || fallback;

const LanguageModal = ({ language, onClose }: { language: CatalogLanguage | null; onClose: () => void }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    code: language?.code ?? '',
    name: language?.name ?? '',
    native_name: language?.native_name ?? '',
  });
  const save = useMutation({
    mutationFn: () =>
      language
        ? updateLanguage(language.code, { name: form.name, native_name: form.native_name })
        : createLanguage(form),
    onSuccess: () => {
      toast.success(language ? 'Idioma guardado' : 'Idioma agregado');
      queryClient.invalidateQueries({ queryKey: ['languages'] });
      onClose();
    },
    onError: (error) => toast.error(errorMessage(error, 'No se pudo guardar el idioma')),
  });

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={language ? `Editar ${language.name}` : 'Agregar idioma'}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="language-form" isLoading={save.isPending}>
            Guardar
          </Button>
        </>
      }
    >
      <form
        id="language-form"
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <Input
          label="Código"
          required
          disabled={!!language}
          value={form.code}
          maxLength={10}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
          helperText={language ? 'El código no se puede cambiar.' : 'Formato: ja, pt-BR o zh-Hant.'}
        />
        <Input
          label="Nombre en español"
          required
          value={form.name}
          maxLength={80}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Japonés"
        />
        <Input
          label="Nombre en su idioma"
          required
          value={form.native_name}
          maxLength={80}
          onChange={(e) => setForm({ ...form, native_name: e.target.value })}
          placeholder="日本語"
          helperText="Es el que verá el visitante del tour."
        />
      </form>
    </Modal>
  );
};

const CatalogTab = () => {
  const queryClient = useQueryClient();
  const { data: languages = [], isLoading, isError } = useQuery({ queryKey: ['languages'], queryFn: getLanguages });
  const [editing, setEditing] = useState<CatalogLanguage | 'new' | null>(null);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['languages'] });
    queryClient.invalidateQueries({ queryKey: ['organization-languages'] });
  };
  const toggle = useMutation({
    mutationFn: (language: CatalogLanguage) => updateLanguage(language.code, { is_active: !language.is_active }),
    onSuccess: refresh,
    onError: (error) => toast.error(errorMessage(error, 'No se pudo cambiar el idioma')),
  });
  const remove = useMutation({
    mutationFn: deleteLanguage,
    onSuccess: () => {
      toast.success('Idioma eliminado');
      refresh();
    },
    onError: (error) => toast.error(errorMessage(error, 'No se pudo eliminar el idioma')),
  });

  const whyLocked = (language: CatalogLanguage) =>
    language.is_built_in
      ? 'Español e inglés siempre están disponibles'
      : language.organizations_count > 0
      ? `Primero quítalo de ${countLabel(language.organizations_count, 'empresa', 'empresas')}`
      : null;

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Catálogo"
        description="Idiomas que se pueden habilitar a las empresas. Un idioma inactivo deja de ofrecerse."
        actions={
          <Button className="gap-2" onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" /> Agregar idioma
          </Button>
        }
      />
      {isLoading ? (
        <p className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando idiomas…
        </p>
      ) : isError ? (
        <p className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">No se pudieron cargar los idiomas.</p>
      ) : (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200 bg-white">
          {languages.map((language) => {
            const locked = whyLocked(language);
            const blockedOff = language.is_active && !!locked;
            return (
              <li key={language.code} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-900">
                    {language.name}
                    <span className="font-normal text-gray-600">{language.native_name}</span>
                    <code className="text-xs font-normal text-gray-500">{language.code}</code>
                    {!language.is_active && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-normal text-gray-700">Inactivo</span>}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {countLabel(language.organizations_count, 'empresa', 'empresas')} · {countLabel(language.tours_count, 'tour', 'tours')}
                  </p>
                </div>
                <span className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditing(language)}
                    className="rounded p-1.5 text-gray-600 hover:bg-gray-100"
                    title="Editar"
                    aria-label={`Editar ${language.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={blockedOff || toggle.isPending}
                    onClick={() => toggle.mutate(language)}
                    className="rounded p-1.5 text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
                    title={blockedOff ? locked! : language.is_active ? 'Desactivar' : 'Activar'}
                    aria-label={`${language.is_active ? 'Desactivar' : 'Activar'} ${language.name}`}
                  >
                    <Power className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={!!locked || remove.isPending}
                    onClick={async () => {
                      const accepted = await confirmar({
                        title: 'Eliminar idioma',
                        message: `Se eliminará ${language.name} del catálogo.`,
                      });
                      if (accepted) remove.mutate(language.code);
                    }}
                    className="rounded p-1.5 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
                    title={locked || 'Eliminar'}
                    aria-label={`Eliminar ${language.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {editing && <LanguageModal language={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
};

const OrganizationsTab = () => {
  const queryClient = useQueryClient();
  const { data: languages = [], isLoading: loadingLanguages } = useQuery({ queryKey: ['languages'], queryFn: getLanguages });
  const { data: organizations = [], isLoading, isError } = useQuery({ queryKey: ['organization-languages'], queryFn: getOrganizationLanguages });
  const offered = languages.filter((language) => language.is_active);

  const save = useMutation({
    mutationFn: ({ id, codes }: { id: string; codes: string[] }) => setOrganizationLanguages(id, codes),
    onError: (error) => toast.error(errorMessage(error, 'No se pudo guardar'), { duration: 7000 }),
    // Returned so the change stays on screen until the fresh list arrives
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['organization-languages'] }),
        queryClient.invalidateQueries({ queryKey: ['languages'] }),
      ]),
  });
  // What is being saved shows right away; if the server refuses it, the list brings the box back
  const selectedIn = (organization: OrganizationLanguages) =>
    save.isPending && save.variables?.id === organization.id ? save.variables.codes : organization.languages;

  const toggle = (organization: OrganizationLanguages, code: string) =>
    save.mutate({
      id: organization.id,
      codes: organization.languages.includes(code)
        ? organization.languages.filter((c) => c !== code)
        : [...organization.languages, code],
    });

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Por empresa"
        description="Los idiomas que cada empresa puede elegir para sus tours. Un idioma que usa algún tour no se puede quitar."
      />
      {isLoading || loadingLanguages ? (
        <p className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando empresas…
        </p>
      ) : isError ? (
        <p className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">No se pudieron cargar las empresas.</p>
      ) : (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200 bg-white">
          {organizations.map((organization) => (
            <li key={organization.id} className="px-4 py-3">
              <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-900">
                {organization.name}
                {!organization.is_active && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-normal text-gray-700">Inactiva</span>}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
                {offered.map((language) => {
                  const isBase = language.code === organization.default_language;
                  return (
                    <label key={language.code} className="flex items-center gap-1.5 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={selectedIn(organization).includes(language.code)}
                        disabled={isBase || save.isPending}
                        onChange={() => toggle(organization, language.code)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      {language.name}
                      {isBase && <span className="text-xs text-gray-400">(base)</span>}
                    </label>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const LanguagesPage = () => {
  const [searchParams] = useSearchParams();
  const activeTab = TABS.find((t) => t.id === searchParams.get('tab'))?.id ?? TABS[0].id;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Idiomas</h2>
        <p className="mt-1 text-sm text-gray-600">Solo visible para administradores de la plataforma.</p>
      </div>
      <ScrollTabs label="Idiomas">
        {TABS.map(({ id, label, Icon }) => (
          <Link
            key={id}
            to={`?tab=${id}`}
            replace
            aria-current={activeTab === id ? 'page' : undefined}
            className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium ${
              activeTab === id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900'
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </Link>
        ))}
      </ScrollTabs>
      {activeTab === 'catalogo' ? <CatalogTab /> : <OrganizationsTab />}
    </div>
  );
};

export default LanguagesPage;

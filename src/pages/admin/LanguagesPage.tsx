import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Building2, Languages, Loader2, Pencil, Plus, Power, Trash2, Type, Volume2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import { confirmar } from '../../components/ui/ConfirmDialog';
import Input from '../../components/ui/Input';
import LanguageFlag from '../../components/ui/LanguageFlag';
import Modal from '../../components/ui/Modal';
import ScrollTabs from '../../components/ui/ScrollTabs';
import SectionHeader from '../../components/ui/SectionHeader';
import {
  createLanguage,
  deleteLanguage,
  getLanguages,
  getOrganizationLanguages,
  getVoice,
  setOrganizationLanguages,
  translateViewerTexts,
  updateLanguage,
  type CatalogLanguage,
  type NarrationVoice,
  type OrganizationLanguages,
} from '../../api/languages';
import { missingPlaceholders, VIEWER_TEXT_KEYS, viewerTextInEnglish, viewerTextInSpanish, type ViewerTextKey } from '../tourViewer/viewerTexts';

// Languages of the tours: the catalog of the platform and which ones each company has. Each tour then
// chooses among those of its company.

const TABS = [
  { id: 'catalogo', label: 'Catálogo', Icon: Languages },
  { id: 'empresas', label: 'Por empresa', Icon: Building2 },
] as const;

const countLabel = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const errorMessage = (error: any, fallback: string) => error?.response?.data?.message || fallback;

const narrationLabel = (language: CatalogLanguage) =>
  !language.can_narrate
    ? 'sin narración disponible'
    : language.voice_source === 'catalog'
    ? 'voz propia'
    : language.voice_source === 'environment'
    ? 'voz del servidor'
    : 'sin voz';

/** Narration voice of a language: an ElevenLabs id, checked with its name and sample before saving */
const VoiceField = ({ language, value, onChange }: { language: CatalogLanguage; value: string; onChange: (value: string) => void }) => {
  const [voice, setVoice] = useState<NarrationVoice | null>(null);
  const check = useMutation({
    mutationFn: () => getVoice(value.trim()),
    onSuccess: setVoice,
    onError: (error) => {
      setVoice(null);
      toast.error(errorMessage(error, 'No se pudo consultar la voz'));
    },
  });

  if (!language.can_narrate) {
    return (
      <p className="flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
        <Volume2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
        El servicio de narración no tiene voces en este idioma: los visitantes escuchan la narración en el idioma original del tour.
      </p>
    );
  }

  const base = language.code.split('-')[0];
  const verified = voice && voice.languages.includes(base);
  const changed = value.trim() !== (language.voice_id ?? '');
  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <Input
            label="Voz de narración"
            value={value}
            maxLength={40}
            onChange={(e) => {
              onChange(e.target.value);
              setVoice(null);
            }}
            placeholder="Identificador de ElevenLabs"
          />
        </div>
        <Button type="button" variant="outline" disabled={!value.trim()} isLoading={check.isPending} onClick={() => check.mutate()}>
          Comprobar
        </Button>
      </div>
      {voice && (
        <div className="space-y-2 rounded-lg border border-gray-200 p-3 text-sm">
          <p className="font-medium text-gray-900">{voice.name}</p>
          {voice.preview_url && <audio controls src={voice.preview_url} className="w-full" aria-label={`Muestra de ${voice.name}`} />}
          <p className={`flex items-start gap-1.5 text-xs ${verified ? 'text-gray-600' : 'text-amber-800'}`}>
            {!verified && <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />}
            {verified
              ? `Verificada en ${language.name.toLowerCase()}. La muestra puede estar en otro idioma.`
              : `No está verificada en ${language.name.toLowerCase()}: puede leerse con acento. La muestra está en su idioma original.`}
          </p>
        </div>
      )}
      <p className="text-xs text-gray-500">
        {language.is_built_in
          ? 'Vacío: usa la voz configurada en el servidor.'
          : 'Vacío: sin audio en este idioma; los visitantes escuchan la narración en el idioma original del tour.'}
        {changed && ' Al cambiarla, cada tour en este idioma genera su audio de nuevo en su siguiente publicación.'}
      </p>
    </div>
  );
};

const LanguageModal = ({ language, onClose }: { language: CatalogLanguage | null; onClose: () => void }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    code: language?.code ?? '',
    name: language?.name ?? '',
    native_name: language?.native_name ?? '',
    voice_id: language?.voice_id ?? '',
  });
  const save = useMutation({
    mutationFn: () =>
      language
        ? updateLanguage(language.code, {
            name: form.name,
            native_name: form.native_name,
            ...(form.voice_id.trim() !== (language.voice_id ?? '') && { voice_id: form.voice_id.trim() || null }),
          })
        : createLanguage({ code: form.code, name: form.name, native_name: form.native_name }),
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
        {language && <VoiceField language={language} value={form.voice_id} onChange={(voice_id) => setForm({ ...form, voice_id })} />}
      </form>
    </Modal>
  );
};

const translatedTexts = (language: CatalogLanguage) => VIEWER_TEXT_KEYS.filter((key) => language.ui_texts?.[key]).length;

/** Buttons and labels of the tour viewer in a language. What stays empty is shown in English */
const ViewerTextsModal = ({ language, onClose }: { language: CatalogLanguage; onClose: () => void }) => {
  const queryClient = useQueryClient();
  const [texts, setTexts] = useState<Record<string, string>>(language.ui_texts ?? {});
  const [onlyMissing, setOnlyMissing] = useState(false);
  // Fixed when the modal opens or the filter changes, so a row does not vanish while it is being typed in
  const [shownKeys, setShownKeys] = useState(VIEWER_TEXT_KEYS);

  const problemOf = (key: ViewerTextKey) => {
    const missing = texts[key]?.trim() ? missingPlaceholders(key, texts[key]) : [];
    return missing.length ? `Debe incluir ${missing.join(' y ')}: ahí va el dato.` : null;
  };
  const save = useMutation({
    mutationFn: () =>
      updateLanguage(language.code, { ui_texts: Object.fromEntries(VIEWER_TEXT_KEYS.map((key) => [key, texts[key]?.trim() ?? ''])) }),
    onSuccess: () => {
      toast.success('Textos guardados');
      queryClient.invalidateQueries({ queryKey: ['languages'] });
      onClose();
    },
    onError: (error) => toast.error(errorMessage(error, 'No se pudieron guardar los textos')),
  });
  const hasProblems = VIEWER_TEXT_KEYS.some(problemOf);
  const missingKeys = VIEWER_TEXT_KEYS.filter((key) => !texts[key]?.trim());
  const translate = useMutation({
    mutationFn: () => translateViewerTexts(language.code, Object.fromEntries(missingKeys.map((key) => [key, viewerTextInEnglish(key)]))),
    onSuccess: (translated) => {
      setTexts((current) => ({ ...translated, ...Object.fromEntries(Object.entries(current).filter(([, text]) => text?.trim())) }));
      const count = Object.keys(translated).length;
      toast.success(`${count} ${count === 1 ? 'texto traducido' : 'textos traducidos'}. Revísalos y guarda.`);
    },
    onError: (error) => toast.error(errorMessage(error, 'No se pudo traducir')),
  });

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Textos del visor en ${language.name}`}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => save.mutate()} disabled={hasProblems} isLoading={save.isPending}>
            Guardar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Botones y etiquetas que ve el visitante. Lo que quede vacío se muestra en inglés. Los textos en singular pueden quedar vacíos si el idioma no
          distingue singular y plural. Los cambios llegan de inmediato a los tours publicados.
        </p>
        {missingKeys.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
            <span>Faltan {missingKeys.length}. Se traducen desde el inglés y no se guardan hasta que pulses Guardar.</span>
            <Button size="sm" variant="outline" className="gap-1.5" isLoading={translate.isPending} onClick={() => translate.mutate()}>
              {!translate.isPending && <Languages className="h-4 w-4" />}
              Traducir automáticamente
            </Button>
          </div>
        )}
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={onlyMissing}
            onChange={(e) => {
              setOnlyMissing(e.target.checked);
              setShownKeys(e.target.checked ? VIEWER_TEXT_KEYS.filter((key) => !texts[key]?.trim()) : VIEWER_TEXT_KEYS);
            }}
          />
          Solo los que faltan
        </label>
        {shownKeys.length === 0 && <p className="text-sm text-gray-500">No falta ningún texto.</p>}
        <ul className="space-y-3">
          {shownKeys.map((key) => (
            <li key={key}>
              <Input
                label={viewerTextInSpanish(key)}
                value={texts[key] ?? ''}
                maxLength={300}
                placeholder={viewerTextInEnglish(key)} // what the visitor sees while it is empty
                onChange={(e) => setTexts({ ...texts, [key]: e.target.value })}
                error={problemOf(key) ?? undefined}
                helperText={`En inglés: ${viewerTextInEnglish(key)}`}
              />
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
};

const CatalogTab = () => {
  const queryClient = useQueryClient();
  const { data: languages = [], isLoading, isError } = useQuery({ queryKey: ['languages'], queryFn: getLanguages });
  const [editing, setEditing] = useState<CatalogLanguage | 'new' | null>(null);
  const [editingTexts, setEditingTexts] = useState<CatalogLanguage | null>(null);

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
                    <LanguageFlag code={language.code} />
                    {language.name}
                    <span className="font-normal text-gray-600">{language.native_name}</span>
                    <code className="text-xs font-normal text-gray-500">{language.code}</code>
                    {!language.is_active && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-normal text-gray-700">Inactivo</span>}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {countLabel(language.organizations_count, 'empresa', 'empresas')} · {countLabel(language.tours_count, 'tour', 'tours')} ·
                    Narración: {narrationLabel(language)}
                    {!language.is_built_in && ` · Textos del visor: ${translatedTexts(language)} de ${VIEWER_TEXT_KEYS.length}`}
                  </p>
                </div>
                <span className="flex items-center gap-1">
                  {!language.is_built_in && (
                    <button
                      type="button"
                      onClick={() => setEditingTexts(language)}
                      className="rounded p-1.5 text-gray-600 hover:bg-gray-100"
                      title="Textos del visor"
                      aria-label={`Textos del visor en ${language.name}`}
                    >
                      <Type className="h-4 w-4" />
                    </button>
                  )}
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
      {editingTexts && <ViewerTextsModal language={editingTexts} onClose={() => setEditingTexts(null)} />}
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
                      <LanguageFlag code={language.code} />
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

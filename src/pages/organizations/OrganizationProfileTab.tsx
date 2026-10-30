import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowDown, ArrowUp, Building2, ImagePlus, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import PhotoGallery from '../../components/media/PhotoGallery';
import { uploadImage, ImageType } from '../../api/upload';
import {
  getOrganizationProfile,
  updateOrganizationProfile,
  type OrganizationProfile,
  type OrganizationProfileData,
  type TourDisplay,
  type TourDisplayBlock,
} from '../../api/organizationProfile';
import type { TourLanguage, Translations } from '../../api/tourBuilder';
import PhoneInput from '../../components/ui/PhoneInput';
import AddressInput from '../../components/ui/AddressInput';

// "Perfil" tab of the organization page: what the company is (tagline, about, mission, vision,
// values, contact, photos). Every block has a switch that shows or hides it in all the tours.
// Texts are written in Spanish and, optionally, in English for tours in English.

const EMPTY: OrganizationProfileData = {
  tagline: {},
  about: {},
  mission: {},
  vision: {},
  values: [],
  industry: '',
  website: '',
  phone: '',
  email: '',
  address: '',
  address_details: null,
};

interface FormState {
  profile: OrganizationProfileData;
  tour_display: TourDisplay;
  logo_url: string | null;
}

const toForm = (data: OrganizationProfile): FormState => ({
  profile: { ...EMPTY, ...data.profile, values: data.profile.values || [] },
  tour_display: data.tour_display,
  logo_url: data.logo_url,
});

const inputClass =
  'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:bg-gray-50';

/** "Visible / Oculto en tours" switch of a block */
const TourSwitch = ({ checked, onChange, disabled }: { checked: boolean; onChange: (value: boolean) => void; disabled?: boolean }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    title={checked ? 'Se muestra en todos los tours' : 'Oculto en todos los tours'}
    className="inline-flex flex-shrink-0 items-center gap-2 rounded-full text-xs font-medium text-gray-600 disabled:opacity-60"
  >
    <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}>
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </span>
    <span className="hidden sm:inline">{checked ? 'Visible en tours' : 'Oculto en tours'}</span>
  </button>
);

const Section = ({
  title,
  hint,
  block,
  form,
  setDisplay,
  canEdit,
  children,
}: {
  title: string;
  hint?: string;
  block?: TourDisplayBlock;
  form: FormState;
  setDisplay: (block: TourDisplayBlock, value: boolean) => void;
  canEdit: boolean;
  children: React.ReactNode;
}) => (
  <section className={`rounded-lg border bg-white ${block && !form.tour_display[block] ? 'border-dashed border-gray-300' : 'border-gray-200'}`}>
    <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-3">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {hint && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}
      </div>
      {block && <TourSwitch checked={form.tour_display[block]} onChange={(v) => setDisplay(block, v)} disabled={!canEdit} />}
    </div>
    <div className="space-y-4 p-4">{children}</div>
  </section>
);

const OrganizationProfileTab = ({ organizationId, canEdit }: { organizationId: string; canEdit: boolean }) => {
  const queryClient = useQueryClient();
  const [language, setLanguage] = useState<TourLanguage>('es');
  const [form, setForm] = useState<FormState | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInput = useRef<HTMLInputElement>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['organization-profile', organizationId],
    queryFn: () => getOrganizationProfile(organizationId),
  });
  useEffect(() => {
    if (data) setForm(toForm(data));
  }, [data]);

  const initial = useMemo(() => (data ? JSON.stringify(toForm(data)) : ''), [data]);
  const isDirty = !!form && JSON.stringify(form) !== initial;

  const save = useMutation({
    mutationFn: () => updateOrganizationProfile(organizationId, form!),
    onSuccess: (saved) => {
      queryClient.setQueryData(['organization-profile', organizationId], saved);
      queryClient.invalidateQueries({ queryKey: ['organization', organizationId] }); // logo in the header
      toast.success('Perfil de la empresa guardado');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'No se pudo guardar el perfil'),
  });

  if (isLoading || (!form && !isError)) {
    return (
      <p className="flex items-center gap-2 text-gray-600">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando perfil…
      </p>
    );
  }
  if (isError || !form) return <p className="text-sm text-red-600">No se pudo cargar el perfil de la empresa.</p>;

  const profile = form.profile;
  const setProfile = (patch: Partial<OrganizationProfileData>) => setForm((f) => f && { ...f, profile: { ...f.profile, ...patch } });
  const setDisplay = (block: TourDisplayBlock, value: boolean) =>
    setForm((f) => f && { ...f, tour_display: { ...f.tour_display, [block]: value } });

  // Translated text of the current language
  const tText = (field: 'tagline' | 'about' | 'mission' | 'vision') => profile[field][language] || '';
  const setT = (field: 'tagline' | 'about' | 'mission' | 'vision', value: string) => setProfile({ [field]: { ...profile[field], [language]: value } });
  const placeholderFor = (value: Translations, fallback: string) => (language === 'en' ? value.es || fallback : fallback);

  const setValue = (index: number, key: 'title' | 'description', value: string) =>
    setProfile({ values: profile.values.map((v, i) => (i === index ? { ...v, [key]: { ...v[key], [language]: value } } : v)) });
  const moveValue = (index: number, delta: number) => {
    const values = [...profile.values];
    const [moved] = values.splice(index, 1);
    values.splice(index + delta, 0, moved);
    setProfile({ values });
  };

  const uploadLogo = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return toast.error('El logo pesa más de 10 MB');
    setUploadingLogo(true);
    try {
      const result = await uploadImage(file, { imageType: ImageType.LOGO, organizationId });
      setForm((f) => f && { ...f, logo_url: result.url });
    } catch {
      toast.error('No se pudo subir el logo');
    } finally {
      setUploadingLogo(false);
      if (logoInput.current) logoInput.current.value = '';
    }
  };

  const sectionProps = { form, setDisplay, canEdit };
  const englishMissing = language === 'en';

  return (
    <form
      className="max-w-4xl space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (canEdit && isDirty) save.mutate();
      }}
    >
      {/* Content language */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          Lo que captures aquí aparece en <strong>todos los tours</strong> de la empresa. Usa el interruptor de cada bloque para mostrarlo u
          ocultarlo.
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          Idioma del texto
          <div className="flex rounded-lg border border-gray-300 bg-white p-0.5 text-sm font-medium" role="group" aria-label="Idioma del texto">
            {(['es', 'en'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLanguage(l)}
                aria-pressed={language === l}
                className={`rounded-md px-3 py-1 ${language === l ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
              >
                {l === 'es' ? 'Español' : 'English'}
              </button>
            ))}
          </div>
        </div>
      </div>
      {englishMissing && (
        <p className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-800">
          Versión en inglés para los tours en inglés. Lo que dejes vacío se mostrará en español.
        </p>
      )}

      <fieldset disabled={!canEdit} className="space-y-4">
        <Section title="Identidad" hint="Logo, eslogan y a qué se dedica la empresa." block="about" {...sectionProps}>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
              {form.logo_url ? (
                <img src={form.logo_url} alt="Logo" className="h-full w-full object-contain p-1" />
              ) : (
                <Building2 className="h-8 w-8 text-gray-400" />
              )}
            </div>
            {canEdit && (
              <div className="flex flex-wrap gap-2">
                <input ref={logoInput} type="file" accept="image/*" className="hidden" onChange={(e) => uploadLogo(e.target.files?.[0])} />
                <Button type="button" variant="outline" size="sm" className="gap-1.5" disabled={uploadingLogo} onClick={() => logoInput.current?.click()}>
                  {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                  {form.logo_url ? 'Cambiar logo' : 'Subir logo'}
                </Button>
                {form.logo_url && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setForm((f) => f && { ...f, logo_url: null })}>
                    Quitar
                  </Button>
                )}
              </div>
            )}
            <p className="w-full text-xs text-gray-500 sm:w-auto">El logo y el eslogan siempre aparecen en la portada de los tours.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-gray-700">
              Eslogan
              <input
                value={tText('tagline')}
                onChange={(e) => setT('tagline', e.target.value)}
                maxLength={200}
                placeholder={placeholderFor(profile.tagline, 'Ej. Soluciones en empaque industrial')}
                className={`mt-1 ${inputClass}`}
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Giro o industria
              <input
                value={profile.industry}
                onChange={(e) => setProfile({ industry: e.target.value })}
                maxLength={150}
                placeholder="Ej. Empaque y embalaje industrial"
                className={`mt-1 ${inputClass}`}
              />
            </label>
          </div>
          <label className="block text-sm font-medium text-gray-700">
            Quiénes somos
            <textarea
              value={tText('about')}
              onChange={(e) => setT('about', e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder={placeholderFor(profile.about, 'Breve presentación de la empresa para los visitantes.')}
              className={`mt-1 ${inputClass}`}
            />
          </label>
        </Section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Section title="Misión" block="mission" {...sectionProps}>
            <textarea
              aria-label="Misión"
              value={tText('mission')}
              onChange={(e) => setT('mission', e.target.value)}
              rows={5}
              maxLength={1500}
              placeholder={placeholderFor(profile.mission, 'Qué hace la empresa, para quién y cómo.')}
              className={inputClass}
            />
          </Section>
          <Section title="Visión" block="vision" {...sectionProps}>
            <textarea
              aria-label="Visión"
              value={tText('vision')}
              onChange={(e) => setT('vision', e.target.value)}
              rows={5}
              maxLength={1500}
              placeholder={placeholderFor(profile.vision, 'Hacia dónde va la empresa.')}
              className={inputClass}
            />
          </Section>
        </div>

        <Section title="Valores" hint={`${profile.values.length} de 12`} block="values" {...sectionProps}>
          {profile.values.length === 0 && <p className="text-sm text-gray-500">Sin valores capturados.</p>}
          <ol className="space-y-3">
            {profile.values.map((value, index) => (
              <li key={index} className="flex gap-2 rounded-lg border border-gray-200 p-3">
                <span className="mt-2 w-5 flex-shrink-0 text-center text-xs font-semibold text-gray-400">{index + 1}</span>
                <div className="min-w-0 flex-1 space-y-2">
                  <input
                    aria-label={`Nombre del valor ${index + 1}`}
                    value={value.title[language] || ''}
                    onChange={(e) => setValue(index, 'title', e.target.value)}
                    maxLength={100}
                    placeholder={placeholderFor(value.title, 'Ej. Calidad y resistencia')}
                    className={`${inputClass} font-medium`}
                  />
                  <textarea
                    aria-label={`Descripción del valor ${index + 1}`}
                    value={value.description[language] || ''}
                    onChange={(e) => setValue(index, 'description', e.target.value)}
                    rows={2}
                    maxLength={500}
                    placeholder={placeholderFor(value.description, 'Qué significa este valor (opcional)')}
                    className={inputClass}
                  />
                </div>
                {canEdit && (
                  <div className="flex flex-col gap-1">
                    <button type="button" onClick={() => moveValue(index, -1)} disabled={index === 0} className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30" aria-label="Subir valor">
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveValue(index, 1)}
                      disabled={index === profile.values.length - 1}
                      className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                      aria-label="Bajar valor"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfile({ values: profile.values.filter((_, i) => i !== index) })}
                      className="rounded p-1 text-gray-500 hover:bg-red-50 hover:text-red-600"
                      aria-label="Quitar valor"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ol>
          {canEdit && profile.values.length < 12 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setProfile({ values: [...profile.values, { title: {}, description: {} }] })}
            >
              <Plus className="h-4 w-4" /> Agregar valor
            </Button>
          )}
        </Section>

        <Section title="Contacto" hint="Para visitantes que quieran comunicarse con la empresa." block="contact" {...sectionProps}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="block text-sm font-medium text-gray-700">
              Sitio web
              <input value={profile.website} onChange={(e) => setProfile({ website: e.target.value })} type="url" placeholder="https://" className={`mt-1 ${inputClass}`} />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Teléfono
              <PhoneInput value={profile.phone} onChange={(phone) => setProfile({ phone })} ariaLabel="Teléfono" disabled={!canEdit} className="mt-1" />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Correo
              <input value={profile.email} onChange={(e) => setProfile({ email: e.target.value })} type="email" maxLength={255} className={`mt-1 ${inputClass}`} />
            </label>
          </div>
          <div>
            <label htmlFor="org-address" className="block text-sm font-medium text-gray-700">
              Domicilio
            </label>
            <AddressInput
              id="org-address"
              value={profile.address}
              details={profile.address_details}
              onChange={(address, address_details) => setProfile({ address, address_details })}
              disabled={!canEdit}
              className="mt-1"
            />
          </div>
        </Section>

        <Section
          title="Plantas en los tours"
          hint="Muestra la descripción y las fotos de la planta (se capturan en la pestaña Configuración de cada planta)."
          block="plant"
          {...sectionProps}
        >
          <p className="text-sm text-gray-600">
            {form.tour_display.plant ? 'Cada tour muestra la información de su planta.' : 'Los tours no muestran la información de la planta.'}
          </p>
        </Section>

        <Section
          title="Documentos generales en los tours"
          hint="Los documentos de toda la empresa o de toda la planta (se administran en la pestaña Documentos de cada planta)."
          block="documents"
          {...sectionProps}
        >
          <p className="text-sm text-gray-600">
            {form.tour_display.documents
              ? 'Aparecen una sola vez al inicio del tour (no en cada parada). Los privados y los que no tienen archivo no se muestran.'
              : 'Los tours no muestran los documentos generales.'}
          </p>
        </Section>
      </fieldset>

      {/* Photos save on their own (outside the form's save button) */}
      <Section title="Fotos de la empresa" hint="Se guardan al subirlas. La portada se usa en los tours que no tienen portada propia." block="gallery" {...sectionProps}>
        <PhotoGallery organizationId={organizationId} canEdit={canEdit} emptyText="Aún no hay fotos de la empresa." />
      </Section>

      {canEdit && (
        <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-2 border-t border-gray-200 bg-gray-50/95 py-3 backdrop-blur">
          {isDirty && <span className="mr-auto text-sm text-amber-700">Tienes cambios sin guardar</span>}
          <Button type="button" variant="outline" disabled={!isDirty || save.isPending} onClick={() => data && setForm(toForm(data))}>
            Descartar
          </Button>
          <Button type="submit" className="gap-1.5" disabled={!isDirty || save.isPending}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar perfil
          </Button>
        </div>
      )}
    </form>
  );
};

export default OrganizationProfileTab;

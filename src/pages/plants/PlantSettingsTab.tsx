import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Loader2, Save } from 'lucide-react';
import Button from '../../components/ui/Button';
import { updatePlant, type UpdatePlantRequest } from '../../api/plants';
import type { Plant } from '../../types';
import { PLANT_TIMEZONES, timezoneLabel } from './timezones';
import { MANAGERS } from './plantTabs';
import { useAuthStore } from '../../store/authStore';
import PhotoGallery from '../../components/media/PhotoGallery';
import PhoneInput from '../../components/ui/PhoneInput';
import AddressInput from '../../components/ui/AddressInput';
import { plantAddressDefaults, type AddressDetails } from '../../utils/googlePlaces';

// "Configuración" tab of the plant workspace: the plant's own details, edited in place.
// Platform admins and organization owners edit; everyone else sees them read-only.

type Form = Required<Pick<UpdatePlantRequest, 'name' | 'location' | 'timezone'>> & {
  address: string;
  description: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
};

const toForm = (plant: Plant): Form => ({
  name: plant.name,
  description: plant.description || '',
  location: plant.location || '',
  address: plant.address || '',
  timezone: plant.timezone || 'America/Mexico_City',
  contact_name: plant.contact_name || '',
  contact_phone: plant.contact_phone || '',
  contact_email: plant.contact_email || '',
});

const inputClass =
  'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:bg-gray-50 disabled:text-gray-700';

const Field = ({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) => (
  <div>
    <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
      {label}
    </label>
    {children}
    {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
  </div>
);

const PlantSettingsTab = ({ plant }: { plant: Plant }) => {
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.user?.role?.name) || '';
  const canEdit = MANAGERS.includes(role);
  const [form, setForm] = useState<Form>(() => toForm(plant));
  const [addressDetails, setAddressDetails] = useState<AddressDetails | null>(plant.address_details || null);
  const [autoNote, setAutoNote] = useState<string | null>(null); // what picking the address filled in

  // Saved elsewhere (or after our own save): start from the stored values
  useEffect(() => {
    setForm(toForm(plant));
    setAddressDetails(plant.address_details || null);
    setAutoNote(null);
  }, [plant]);

  const initial = toForm(plant);
  const isDirty =
    (Object.keys(initial) as (keyof Form)[]).some((key) => form[key].trim() !== initial[key].trim()) ||
    JSON.stringify(addressDetails) !== JSON.stringify(plant.address_details || null);

  // A picked address fills "Ubicación" (City, State) and the time zone
  const changeAddress = async (address: string, details: AddressDetails | null) => {
    setForm((current) => ({ ...current, address }));
    setAddressDetails(details);
    if (!details) return;
    const { location, timezone } = await plantAddressDefaults(details);
    setForm((current) => ({ ...current, location: location || current.location, timezone: timezone || current.timezone }));
    setAutoNote(
      [location && `Ubicación: ${location}`, timezone && `zona horaria: ${timezoneLabel(timezone)}`].filter(Boolean).join(' · ') || null
    );
  };
  const nameError = form.name.trim().length < 2 ? 'El nombre debe tener al menos 2 caracteres' : null;

  const save = useMutation({
    mutationFn: () =>
      updatePlant(plant.id, {
        name: form.name.trim(),
        description: form.description.trim() || null,
        location: form.location.trim(),
        address: form.address.trim() || null,
        address_details: form.address.trim() ? addressDetails : null,
        timezone: form.timezone,
        contact_name: form.contact_name.trim() || null,
        // Only when changed: an old phone that is not valid must not block saving the rest
        ...(form.contact_phone.trim() !== initial.contact_phone.trim() && { contact_phone: form.contact_phone.trim() || null }),
        contact_email: form.contact_email.trim() || null,
      }),
    onSuccess: () => {
      toast.success('Datos de la planta guardados');
      queryClient.invalidateQueries({ queryKey: ['plant', plant.id] });
      queryClient.invalidateQueries({ queryKey: ['plants'] });
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'No se pudieron guardar los cambios'),
  });

  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((current) => ({ ...current, [key]: e.target.value }));

  return (
    <form
      className="max-w-3xl space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (canEdit && isDirty && !nameError) save.mutate();
      }}
    >
      <section className="rounded-lg border border-gray-200 bg-white">
        <h3 className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900">Datos de la planta</h3>
        <fieldset disabled={!canEdit} className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field id="plant-name" label="Nombre">
              <input id="plant-name" value={form.name} onChange={set('name')} maxLength={255} className={inputClass} />
              {canEdit && nameError && <p className="mt-1 text-xs text-red-600">{nameError}</p>}
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field id="plant-description" label="Descripción" hint="Qué se hace en esta planta. Se muestra en su resumen.">
              <textarea
                id="plant-description"
                value={form.description}
                onChange={set('description')}
                rows={3}
                maxLength={2000}
                placeholder="Ej. Planta de ensamble de componentes automotrices, 2 turnos."
                className={inputClass}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field
              id="plant-address"
              label="Dirección"
              hint="Elige la dirección de la lista para llenar la ubicación y la zona horaria. También puedes escribirla a mano."
            >
              <AddressInput id="plant-address" value={form.address} details={addressDetails} onChange={changeAddress} disabled={!canEdit} />
              {autoNote && <p className="mt-1 text-xs text-blue-700">Se ajustó con la dirección → {autoNote}</p>}
            </Field>
          </div>
          <Field id="plant-location" label="Ubicación" hint="Se muestra bajo el nombre de la planta.">
            <input id="plant-location" value={form.location} onChange={set('location')} maxLength={500} placeholder="Ciudad, Estado" className={inputClass} />
          </Field>
          <Field id="plant-timezone" label="Zona horaria">
            <select id="plant-timezone" value={form.timezone} onChange={set('timezone')} className={inputClass}>
              {!PLANT_TIMEZONES.some((tz) => tz.value === form.timezone) && <option value={form.timezone}>{form.timezone}</option>}
              {PLANT_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </Field>
        </fieldset>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white">
        <h3 className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900">Contacto de la planta</h3>
        <fieldset disabled={!canEdit} className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
          <Field id="plant-contact-name" label="Nombre">
            <input id="plant-contact-name" value={form.contact_name} onChange={set('contact_name')} maxLength={255} placeholder="Gerente de planta" className={inputClass} />
          </Field>
          <Field id="plant-contact-phone" label="Teléfono">
            <PhoneInput
              id="plant-contact-phone"
              value={form.contact_phone}
              onChange={(contact_phone) => setForm((current) => ({ ...current, contact_phone }))}
              disabled={!canEdit}
            />
          </Field>
          <Field id="plant-contact-email" label="Correo">
            <input id="plant-contact-email" type="email" value={form.contact_email} onChange={set('contact_email')} maxLength={255} className={inputClass} />
          </Field>
        </fieldset>
      </section>

      <dl className="grid grid-cols-1 gap-x-6 gap-y-1 px-1 text-xs text-gray-500 sm:grid-cols-3">
        <div>
          <dt className="inline">Identificador: </dt>
          <dd className="inline font-mono">{plant.slug}</dd>
        </div>
        <div>
          <dt className="inline">Estado: </dt>
          <dd className="inline">{plant.is_active ? 'Activa' : 'Inactiva'}</dd>
        </div>
        <div>
          <dt className="inline">Creada: </dt>
          <dd className="inline">{new Date(plant.created_at).toLocaleDateString('es-MX', { dateStyle: 'long' })}</dd>
        </div>
      </dl>

      {/* Company-wide texts live on the organization's profile, not here */}
      {canEdit && (
        <p className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-900">
          La misión, visión, valores, logo y fotos de la empresa se capturan en el{' '}
          <Link to={`/organizations/${plant.organization_id}/perfil`} className="font-semibold underline hover:no-underline">
            Perfil de la empresa
          </Link>
          {' '}y se muestran en todos sus tours.
        </p>
      )}

      {/* Photos save on their own when uploaded (not with the form's button) */}
      <section className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-900">Fotos de la planta</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            Se muestran en los tours de esta planta; la portada abre los tours que no tienen portada propia.
          </p>
        </div>
        <div className="p-4">
          <PhotoGallery organizationId={plant.organization_id} plantId={plant.id} canEdit={canEdit} emptyText="Aún no hay fotos de la planta." />
        </div>
      </section>

      {canEdit ? (
        <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 border-t border-gray-200 bg-gray-50/95 py-3 backdrop-blur">
          {isDirty && <span className="mr-auto text-sm text-amber-700">Tienes cambios sin guardar</span>}
          <Button type="button" variant="outline" disabled={!isDirty || save.isPending} onClick={() => setForm(initial)}>
            Descartar
          </Button>
          <Button type="submit" className="gap-1.5" disabled={!isDirty || !!nameError || save.isPending}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar cambios
          </Button>
        </div>
      ) : (
        <p className="text-xs text-gray-500">Solo el dueño de la empresa puede cambiar estos datos.</p>
      )}
    </form>
  );
};

export default PlantSettingsTab;

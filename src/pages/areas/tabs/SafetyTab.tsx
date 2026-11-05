import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  Ban,
  Ear,
  ExternalLink,
  FileText,
  Footprints,
  Glasses,
  Hand,
  HardHat,
  Lock,
  Phone,
  Plus,
  Shield,
  Shirt,
  Siren,
  Trash2,
  Wind,
} from 'lucide-react';
import {
  createSafetyInfo,
  getSafetyInfoByArea,
  updateSafetyInfoByAreaId,
  type AreaSafetyInfo,
  type Hazard,
  type PPEItem,
} from '../../../api/areaSafetyInfo';
import { getResponsiblesByArea } from '../../../api/areaResponsibles';
import { appliesToArea, getCategoryLabel, getPlantDocuments } from '../../../api/areaDocuments';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import SectionHeader from '../../../components/ui/SectionHeader';
import { personName } from '../../../utils/personName';
import { formatPhone, phoneHref } from '../../../utils/phone';
import { useCan } from '../../../hooks/usePermissions';

// "Seguridad" of an area: what to know before going in. The form captures what is stored here; the
// protocols come from the area's Documents and the emergency contacts from its Responsables, so they
// are only shown, not captured twice. Protective equipment, hazards, access, instructions and meeting
// point also show in the tours.

const SAFETY_CATEGORIES = ['SAFETY_PROCEDURE', 'MSDS', 'RISK_ANALYSIS'];
const ICON_FOR: Record<string, typeof Shield> = { hardhat: HardHat, glasses: Glasses, boots: Footprints, ears: Ear, gloves: Hand, vest: Shirt, mask: Wind, shield: Shield };
const PPE_CATALOG = [
  { icon: 'hardhat', name: 'Casco' },
  { icon: 'glasses', name: 'Lentes de seguridad' },
  { icon: 'boots', name: 'Botas de seguridad' },
  { icon: 'ears', name: 'Protección auditiva' },
  { icon: 'gloves', name: 'Guantes' },
  { icon: 'vest', name: 'Chaleco reflejante' },
  { icon: 'mask', name: 'Mascarilla o respirador' },
  { icon: 'shield', name: 'Careta' },
];
const HAZARD_LABELS: Record<string, string> = { chemical: 'Químico', physical: 'Físico', biological: 'Biológico', ergonomic: 'Ergonómico' };
// A darker tag means more risk, no traffic-light colors (same as the tours)
const SEVERITY: Record<string, { label: string; className: string }> = {
  low: { label: 'Bajo', className: 'bg-gray-100 text-gray-600' },
  medium: { label: 'Medio', className: 'bg-gray-100 text-gray-700' },
  high: { label: 'Alto', className: 'bg-gray-300 text-gray-900' },
  critical: { label: 'Crítico', className: 'bg-gray-800 text-white' },
};

const today = () => new Date().toISOString().slice(0, 10);
const day = (value?: Date | string | null) => (value ? String(value instanceof Date ? value.toISOString() : value).slice(0, 10) : '');
const niceDate = (value?: Date | string | null) =>
  value ? new Date(`${day(value)}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

const Card = ({ title, Icon, internal, children }: { title: string; Icon: typeof Shield; internal?: boolean; children: React.ReactNode }) => (
  <section className="rounded-lg border border-gray-200 bg-white">
    <h3 className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-900">
      <Icon className="h-4 w-4 text-gray-500" />
      {title}
      {internal && (
        <span className="ml-auto inline-flex items-center gap-1 text-xs font-normal text-gray-500" title="No se muestra en los tours">
          <Lock className="h-3 w-3" /> Interno
        </span>
      )}
    </h3>
    <div className="p-4">{children}</div>
  </section>
);

const inputClass = 'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

interface Form {
  required_ppe: PPEItem[];
  hazards: Hazard[];
  restricted_access: boolean;
  access_requirements: string;
  special_instructions: string;
  emergency_assembly_point: string;
  evacuation_procedure: string;
  fire_extinguisher_locations: string;
  first_aid_kit_location: string;
  safety_shower_location: string;
  eye_wash_station_location: string;
  last_inspection_date: string;
  next_inspection_date: string;
  incident_count_ytd: string;
}

const SafetyModal = ({ area, info, onClose }: { area: any; info: AreaSafetyInfo | null; onClose: () => void }) => {
  const queryClient = useQueryClient();
  const [customPpe, setCustomPpe] = useState('');
  const [form, setForm] = useState<Form>(() => ({
    required_ppe: info?.required_ppe || [],
    hazards: info?.hazards || [],
    restricted_access: !!info?.restricted_access,
    access_requirements: info?.access_requirements || '',
    special_instructions: info?.special_instructions || '',
    emergency_assembly_point: info?.emergency_assembly_point || '',
    evacuation_procedure: info?.evacuation_procedure || '',
    fire_extinguisher_locations: info?.fire_extinguisher_locations || '',
    first_aid_kit_location: info?.first_aid_kit_location || '',
    safety_shower_location: info?.safety_shower_location || '',
    eye_wash_station_location: info?.eye_wash_station_location || '',
    last_inspection_date: day(info?.last_inspection_date),
    next_inspection_date: day(info?.next_inspection_date),
    incident_count_ytd: String(info?.incident_count_ytd ?? 0),
  }));
  const text = (key: keyof Form) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const togglePpe = (item: { icon: string; name: string }) =>
    setForm((f) => ({
      ...f,
      required_ppe: f.required_ppe.some((p) => p.name === item.name) ? f.required_ppe.filter((p) => p.name !== item.name) : [...f.required_ppe, { ...item, required: true }],
    }));
  const addCustomPpe = () => {
    const name = customPpe.trim();
    if (name && !form.required_ppe.some((p) => p.name === name)) togglePpe({ icon: 'shield', name });
    setCustomPpe('');
  };
  const custom = form.required_ppe.filter((p) => !PPE_CATALOG.some((c) => c.name === p.name));
  const setHazard = (index: number, patch: Partial<Hazard>) => setForm((f) => ({ ...f, hazards: f.hazards.map((h, i) => (i === index ? { ...h, ...patch } : h)) }));

  const save = useMutation({
    mutationFn: () => {
      const orNull = (value: string) => value.trim() || null;
      const payload = {
        required_ppe: form.required_ppe,
        hazards: form.hazards.filter((h) => h.name.trim()).map((h) => ({ ...h, name: h.name.trim() })),
        restricted_access: form.restricted_access,
        access_requirements: form.restricted_access ? orNull(form.access_requirements) : null,
        special_instructions: orNull(form.special_instructions),
        emergency_assembly_point: orNull(form.emergency_assembly_point),
        evacuation_procedure: orNull(form.evacuation_procedure),
        fire_extinguisher_locations: orNull(form.fire_extinguisher_locations),
        first_aid_kit_location: orNull(form.first_aid_kit_location),
        safety_shower_location: orNull(form.safety_shower_location),
        eye_wash_station_location: orNull(form.eye_wash_station_location),
        last_inspection_date: (form.last_inspection_date || null) as unknown as Date | null,
        next_inspection_date: (form.next_inspection_date || null) as unknown as Date | null,
        incident_count_ytd: Number(form.incident_count_ytd) || 0,
      };
      return info ? updateSafetyInfoByAreaId(area.id, payload) : createSafetyInfo(area.id, payload);
    },
    onSuccess: () => {
      toast.success('Seguridad guardada');
      queryClient.invalidateQueries({ queryKey: ['area-safety', area.id] });
      onClose();
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'No se pudo guardar'),
  });

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Seguridad · ${area.name}`}
      size="xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            Guardar
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <section>
          <h3 className="mb-2 text-sm font-semibold text-gray-900">Equipo de protección requerido</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PPE_CATALOG.map((item) => {
              const Icon = ICON_FOR[item.icon];
              const active = form.required_ppe.some((p) => p.name === item.name);
              return (
                <button
                  key={item.name}
                  type="button"
                  aria-pressed={active}
                  onClick={() => togglePpe(item)}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center text-xs font-medium transition-colors ${
                    active ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-gray-200 text-gray-700 hover:border-blue-300'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                  {item.name}
                </button>
              );
            })}
          </div>
          {custom.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {custom.map((p) => (
                <button key={p.name} type="button" onClick={() => togglePpe({ icon: p.icon, name: p.name })} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-800 hover:bg-blue-100" title="Quitar">
                  {p.name} ×
                </button>
              ))}
            </div>
          )}
          <div className="mt-2 flex gap-2">
            <input
              value={customPpe}
              onChange={(e) => setCustomPpe(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomPpe();
                }
              }}
              placeholder="Otro equipo (ej. Arnés)"
              aria-label="Otro equipo de protección"
              maxLength={80}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <Button type="button" variant="outline" onClick={addCustomPpe} disabled={!customPpe.trim()}>
              Agregar
            </Button>
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Riesgos del área</h3>
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setForm((f) => ({ ...f, hazards: [...f.hazards, { type: 'physical', name: '', severity: 'medium' }] }))}>
              <Plus className="h-4 w-4" /> Agregar riesgo
            </Button>
          </div>
          {form.hazards.length === 0 ? (
            <p className="rounded-md border border-dashed border-gray-200 px-3 py-3 text-center text-xs text-gray-500">Sin riesgos capturados.</p>
          ) : (
            <ul className="space-y-2">
              {form.hazards.map((hazard, index) => (
                <li key={index} className="flex flex-wrap items-center gap-2">
                  <input
                    value={hazard.name}
                    onChange={(e) => setHazard(index, { name: e.target.value })}
                    placeholder="Ej. Ruido de troqueladora"
                    aria-label={`Riesgo ${index + 1}`}
                    maxLength={150}
                    className="min-w-[12rem] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <select value={hazard.type} onChange={(e) => setHazard(index, { type: e.target.value })} aria-label="Tipo de riesgo" className="text-sm">
                    {Object.entries(HAZARD_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <select value={hazard.severity} onChange={(e) => setHazard(index, { severity: e.target.value })} aria-label="Gravedad" className="text-sm">
                    {Object.entries(SEVERITY).map(([value, { label }]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setForm((f) => ({ ...f, hazards: f.hazards.filter((_, i) => i !== index) }))} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600" aria-label={`Quitar riesgo ${index + 1}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Acceso e instrucciones</h3>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.restricted_access} onChange={(e) => setForm((f) => ({ ...f, restricted_access: e.target.checked }))} className="rounded text-blue-600" />
            Área de acceso restringido
          </label>
          {form.restricted_access && (
            <label className="block text-sm font-medium text-gray-700">
              Requisitos de acceso
              <input {...text('access_requirements')} placeholder="Ej. Solo personal autorizado con inducción" className={inputClass} />
            </label>
          )}
          <label className="block text-sm font-medium text-gray-700">
            Instrucciones especiales
            <textarea {...text('special_instructions')} rows={2} placeholder="Ej. No usar joyería ni ropa suelta" className={inputClass} />
          </label>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Emergencias</h3>
          <label className="block text-sm font-medium text-gray-700">
            Punto de reunión
            <input {...text('emergency_assembly_point')} placeholder="Ej. Estacionamiento norte" className={inputClass} />
          </label>
          <p className="flex items-center gap-1 text-xs text-gray-500">
            <Lock className="h-3 w-3" /> Lo siguiente es interno: no sale en los tours.
          </p>
          <label className="block text-sm font-medium text-gray-700">
            Procedimiento de evacuación
            <textarea {...text('evacuation_procedure')} rows={2} className={inputClass} />
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium text-gray-700">
              Extintores
              <input {...text('fire_extinguisher_locations')} placeholder="Dónde están" className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Botiquín
              <input {...text('first_aid_kit_location')} placeholder="Dónde está" className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Regadera de emergencia
              <input {...text('safety_shower_location')} placeholder="Dónde está" className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Lavaojos
              <input {...text('eye_wash_station_location')} placeholder="Dónde está" className={inputClass} />
            </label>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Incidentes e inspecciones</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium text-gray-700">
              Incidentes este año
              <input type="number" min={0} {...text('incident_count_ytd')} className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Última inspección
              <input type="date" max={today()} {...text('last_inspection_date')} className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Próxima inspección
              <input type="date" {...text('next_inspection_date')} className={inputClass} />
            </label>
          </div>
        </section>
      </div>
    </Modal>
  );
};

const SafetyTab = ({ areaId, area }: { areaId: string; area: any }) => {
  const can = useCan();
  const canEdit = can('safety.update');
  const [editing, setEditing] = useState(false);

  const { data: info, isLoading } = useQuery({ queryKey: ['area-safety', areaId], queryFn: () => getSafetyInfoByArea(areaId) });
  const { data: responsibles = [] } = useQuery({ queryKey: ['area-responsibles', areaId], queryFn: () => getResponsiblesByArea(areaId) });
  const { data: allDocuments = [] } = useQuery({
    queryKey: ['plant-documents', area.plant_id, 'safety'],
    queryFn: () => getPlantDocuments(area.plant_id),
    enabled: !!area.plant_id,
    retry: false,
  });
  const protocols = useMemo(() => allDocuments.filter((d) => appliesToArea(d, areaId) && SAFETY_CATEGORIES.includes(d.category) && d.status !== 'archived'), [allDocuments, areaId]);
  const contacts = responsibles.filter((r) => r.role === 'emergency');

  if (isLoading) return <div className="flex items-center justify-center py-12 text-gray-600">Cargando información de seguridad...</div>;

  const nextInspection = day(info?.next_inspection_date);
  const overdue = !!nextInspection && nextInspection < today();
  const location = (label: string, value?: string | null) =>
    value ? (
      <div>
        <dt className="text-xs text-gray-500">{label}</dt>
        <dd className="text-sm text-gray-900">{value}</dd>
      </div>
    ) : null;

  const contactsAndProtocols = (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card title="Contactos de emergencia" Icon={Phone}>
        {contacts.length === 0 ? (
          <p className="text-sm text-gray-500">
            Sin asignar.{' '}
            <Link to={`/areas/${areaId}?tab=general`} className="font-medium text-blue-700 hover:underline">
              Agrégalos en Resumen
            </Link>
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {contacts.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-gray-900">{personName(c)}</span>
                {c.phone && (
                  <a href={phoneHref(c.phone)} className="text-blue-700 hover:underline">
                    {formatPhone(c.phone)}
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card title="Protocolos" Icon={FileText}>
        {protocols.length === 0 ? (
          <p className="text-sm text-gray-500">
            Sin protocolos.{' '}
            <Link to={`/areas/${areaId}?tab=documents`} className="font-medium text-blue-700 hover:underline">
              Súbelos en Documentos
            </Link>{' '}
            con categoría de seguridad.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {protocols.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between gap-2">
                <span className="min-w-0">
                  <span className="block truncate font-medium text-gray-900">{doc.title}</span>
                  <span className="text-xs text-gray-500">{getCategoryLabel(doc.category)}</span>
                </span>
                {doc.file_url ? (
                  <a href={doc.file_url} target="_blank" rel="noreferrer" className="flex-shrink-0 text-green-700 hover:text-green-900" title="Abrir el archivo" aria-label={`Abrir ${doc.title}`}>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : (
                  <span className="flex-shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">Sin archivo</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Seguridad"
        description="Lo que hay que saber antes de entrar a esta área. Lo que no dice «Interno» también aparece en los tours."
        actions={
          canEdit && (
            <Button onClick={() => setEditing(true)} variant={info ? 'outline' : 'primary'} className="gap-2">
              <Shield className="h-4 w-4" />
              {info ? 'Editar' : 'Capturar seguridad'}
            </Button>
          )
        }
      />

      {!info ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white py-10 text-center">
          <Shield className="mx-auto mb-3 h-10 w-10 text-gray-400" />
          <p className="font-medium text-gray-900">Aún no se ha capturado la seguridad de esta área</p>
          <p className="mt-1 text-sm text-gray-600">Equipo de protección, riesgos, acceso y qué hacer en una emergencia.</p>
        </div>
      ) : (
        <>
          {/* Figures */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <span className="flex items-center gap-1 text-xs text-gray-600">
                <Lock className="h-3 w-3" /> Incidentes este año
              </span>
              <span className="block text-2xl font-bold text-gray-900">{info.incident_count_ytd ?? 0}</span>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <span className="flex items-center gap-1 text-xs text-gray-600">
                <Lock className="h-3 w-3" /> Última inspección
              </span>
              <span className="mt-1 block text-sm font-semibold text-gray-900">{niceDate(info.last_inspection_date) || 'Sin registro'}</span>
            </div>
            <div className={`rounded-lg border p-3 ${overdue ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
              <span className="flex items-center gap-1 text-xs text-gray-600">
                <Lock className="h-3 w-3" /> Próxima inspección
              </span>
              <span className={`mt-1 block text-sm font-semibold ${overdue ? 'text-red-700' : 'text-gray-900'}`}>
                {niceDate(info.next_inspection_date) || 'No programada'}
                {overdue && ' · vencida'}
              </span>
            </div>
          </div>

          {info.restricted_access && (
            <div className="flex items-start gap-3 rounded-lg border border-gray-300 bg-white p-4">
              <Ban className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-500" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Área de acceso restringido</p>
                {info.access_requirements && <p className="text-sm text-gray-700">{info.access_requirements}</p>}
              </div>
            </div>
          )}

          {info.special_instructions && (
            <p className="whitespace-pre-line rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-800">{info.special_instructions}</p>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card title="Equipo de protección requerido" Icon={HardHat}>
              {info.required_ppe?.length ? (
                <ul className="flex flex-wrap gap-2">
                  {info.required_ppe.map((p) => {
                    const Icon = ICON_FOR[p.icon] || Shield;
                    return (
                      <li key={p.name} className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm font-medium text-gray-800">
                        <Icon className="h-4 w-4 text-gray-500" />
                        {p.name}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">Sin capturar.</p>
              )}
            </Card>
            <Card title="Riesgos del área" Icon={AlertTriangle}>
              {info.hazards?.length ? (
                <ul className="space-y-1.5">
                  {info.hazards.map((h, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 text-sm">
                      <span className="min-w-0 text-gray-900">
                        {h.name} <span className="text-xs text-gray-500">· {HAZARD_LABELS[h.type] || h.type}</span>
                      </span>
                      <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY[h.severity]?.className || 'bg-gray-100 text-gray-700'}`}>{SEVERITY[h.severity]?.label || h.severity}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">Sin capturar.</p>
              )}
            </Card>
            <Card title="Punto de reunión" Icon={Siren}>
              <p className="text-sm text-gray-900">{info.emergency_assembly_point || <span className="text-gray-500">Sin capturar.</span>}</p>
            </Card>
            <Card title="Evacuación y ubicaciones" Icon={Siren} internal>
              {info.evacuation_procedure || info.fire_extinguisher_locations || info.first_aid_kit_location || info.safety_shower_location || info.eye_wash_station_location ? (
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {location('Procedimiento de evacuación', info.evacuation_procedure)}
                  {location('Extintores', info.fire_extinguisher_locations)}
                  {location('Botiquín', info.first_aid_kit_location)}
                  {location('Regadera de emergencia', info.safety_shower_location)}
                  {location('Lavaojos', info.eye_wash_station_location)}
                </dl>
              ) : (
                <p className="text-sm text-gray-500">Sin capturar.</p>
              )}
            </Card>
          </div>
        </>
      )}

      {contactsAndProtocols}

      {editing && <SafetyModal area={area} info={info || null} onClose={() => setEditing(false)} />}
    </div>
  );
};

export default SafetyTab;

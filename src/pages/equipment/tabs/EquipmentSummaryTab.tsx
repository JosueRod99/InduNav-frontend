import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, FileText, Image as ImageIcon, MapPin, Package } from 'lucide-react';
import { EQUIPMENT_STATUS_LABELS, getEquipmentAreaAssignments, getEquipmentImages, type Equipment } from '../../../api/equipment';
import { BLOCKING_EQUIPMENT_STATUSES, getEquipmentProducts } from '../../../api/productStepEquipment';
import { getPlantDocuments } from '../../../api/areaDocuments';
import SectionHeader from '../../../components/ui/SectionHeader';
import EquipmentSpecificationsEditor from '../components/EquipmentSpecificationsEditor';

// Summary of a piece of equipment, like the product's: key figures that open their tab, what needs
// attention (stopped and which products it affects, warranty…), its data and technical specifications.

const WARRANTY_ALERT_DAYS = 30;
const niceDate = (value: Date | string) => new Date(String(value).length <= 10 ? `${value}T12:00:00` : value).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });

const EquipmentSummaryTab = ({ equipment, onEdit }: { equipment: Equipment; onEdit?: () => void }) => {
  const { pathname } = useLocation();
  const tab = (name: string) => `${pathname}?tab=${name}`;
  const { data: links = [] } = useQuery({ queryKey: ['equipment-products', equipment.id], queryFn: () => getEquipmentProducts(equipment.id) });
  const { data: images = [] } = useQuery({ queryKey: ['equipment-images', equipment.id], queryFn: () => getEquipmentImages(equipment.id) });
  const { data: assignments = [] } = useQuery({ queryKey: ['equipment-assignments', equipment.id], queryFn: () => getEquipmentAreaAssignments(equipment.id, true) });
  const { data: library = [] } = useQuery({
    queryKey: ['plant-documents', equipment.plant_id],
    queryFn: () => getPlantDocuments(equipment.plant_id, { includeArchived: true }),
  });

  const documents = library.filter((d) => d.status !== 'archived' && d.shared_equipment?.some((e) => e.id === equipment.id));
  const current = assignments.find((a) => !a.end_date);
  const placed = equipment.placed_on || [];
  const productCount = new Set(links.map((l) => l.product_id)).size;
  const hasSpecs = Object.keys(equipment.specifications || {}).length > 0;

  // Stopped: which products need it
  const stopped = BLOCKING_EQUIPMENT_STATUSES.includes(equipment.status);
  const affected = [...new Map(links.filter((l) => l.usage_type === 'required').map((l) => [l.product_id, l.product_name])).values()];
  const warrantyDays = equipment.warranty_expiry_date ? Math.ceil((new Date(equipment.warranty_expiry_date).getTime() - Date.now()) / 864e5) : null;

  const alerts: { key: string; text: string; detail: string; to?: string; danger?: boolean }[] = [
    ...(stopped
      ? [
          {
            key: 'stopped',
            text: affected.length ? `${EQUIPMENT_STATUS_LABELS[equipment.status]}: afecta a ${affected.slice(0, 2).join(' y ')}${affected.length > 2 ? ` y ${affected.length - 2} más` : ''}` : EQUIPMENT_STATUS_LABELS[equipment.status],
            detail: affected.length ? 'Ver Productos' : 'Detenido',
            to: affected.length ? tab('products') : undefined,
            danger: true,
          },
        ]
      : []),
    ...(warrantyDays !== null && warrantyDays <= WARRANTY_ALERT_DAYS
      ? [{ key: 'warranty', text: warrantyDays < 0 ? 'Garantía vencida' : `Garantía por vencer en ${warrantyDays} días`, detail: niceDate(equipment.warranty_expiry_date!), danger: warrantyDays < 0 }]
      : []),
    ...(!current ? [{ key: 'area', text: 'Sin área asignada', detail: 'Asignar a un área', to: tab('location') }] : []),
    ...(current && placed.length === 0 ? [{ key: 'plan', text: 'Sin colocar en el plano', detail: 'Ver el plano del área', to: `/areas/${current.organizational_area_id}?tab=layout` }] : []),
    ...(!equipment.primary_image_url ? [{ key: 'image', text: 'Sin imagen', detail: 'Subir imágenes', to: tab('gallery') }] : []),
    ...(!hasSpecs ? [{ key: 'specs', text: 'Sin especificaciones técnicas', detail: 'Se capturan abajo' }] : []),
    ...(documents.length === 0 ? [{ key: 'docs', text: 'Sin documentos', detail: 'Agregar documentos', to: tab('documents') }] : []),
  ];

  const fields: [string, string | null | undefined, boolean?][] = [
    ['Fabricante', equipment.manufacturer],
    ['Modelo', equipment.model],
    ['Número de serie', equipment.serial_number, true],
    ['Adquisición', equipment.acquisition_date ? niceDate(equipment.acquisition_date) : null],
    ['Garantía hasta', equipment.warranty_expiry_date ? niceDate(equipment.warranty_expiry_date) : null],
  ];
  const captured = fields.filter(([, value]) => value);
  const missing = fields.filter(([, value]) => !value).map(([label]) => label.toLowerCase());

  return (
    <div className="space-y-4">
      <SectionHeader title="Resumen" description="Cómo está el equipo, dónde está y sus especificaciones." />

      {/* Key numbers: each one opens its tab */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link to={tab('location')} className="group col-span-2 rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:border-blue-300 hover:bg-blue-50/40 sm:col-span-1 sm:p-4">
          <span className="flex items-center gap-1.5 text-sm text-gray-600 group-hover:text-blue-700">
            <MapPin className="h-4 w-4" />
            Ubicación
          </span>
          <span className={`mt-1 block truncate text-sm font-semibold ${current ? 'text-gray-900' : 'text-amber-700'}`}>{current?.area_name || 'Sin área'}</span>
          <span className="block text-xs text-gray-500">{placed.length ? 'Colocado en el plano' : 'Sin colocar en el plano'}</span>
        </Link>
        {[
          { key: 'products', Icon: Package, label: 'Productos', value: productCount },
          { key: 'documents', Icon: FileText, label: 'Documentos', value: documents.length },
          { key: 'gallery', Icon: ImageIcon, label: 'Imágenes', value: images.length },
        ].map(({ key, Icon, label, value }) => (
          <Link key={key} to={tab(key)} className="group rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:border-blue-300 hover:bg-blue-50/40 sm:p-4">
            <span className="flex items-center gap-1.5 text-sm text-gray-600 group-hover:text-blue-700">
              <Icon className="h-4 w-4" />
              {label}
            </span>
            <span className="mt-1 block text-2xl font-bold text-gray-900">{value}</span>
          </Link>
        ))}
      </div>

      {/* What needs attention */}
      <section className="rounded-lg border border-gray-200 bg-white">
        <h3 className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-900">
          <AlertTriangle className="h-4 w-4 text-gray-500" />
          Requiere atención
          {alerts.length > 0 && <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">{alerts.length}</span>}
        </h3>
        {alerts.length === 0 ? (
          <p className="flex items-center gap-2 px-4 py-4 text-sm text-gray-600">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
            Todo en orden: operando, en su área y con su información completa.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {alerts.map(({ key, text, detail, to, danger }) => {
              const content = (
                <>
                  <AlertTriangle className={`h-4 w-4 flex-shrink-0 ${danger ? 'text-red-600' : 'text-amber-600'}`} />
                  <span className="min-w-0 flex-1 font-medium text-gray-900">{text}</span>
                  <span className={`flex-shrink-0 text-xs ${to ? 'font-medium text-blue-700' : 'text-gray-500'}`}>{detail}</span>
                </>
              );
              return (
                <li key={key}>
                  {to ? (
                    <Link to={to} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50">
                      {content}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-2.5 text-sm">{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {equipment.description && (
        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-1 text-sm font-semibold text-gray-900">Descripción</h3>
          <p className="whitespace-pre-line text-sm text-gray-700">{equipment.description}</p>
        </section>
      )}

      {/* Data of the equipment: only what has been captured; the rest is offered as one line */}
      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Datos del equipo</h3>
        {captured.length > 0 && (
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {captured.map(([label, value, mono]) => (
              <div key={label}>
                <dt className="text-xs text-gray-500">{label}</dt>
                <dd className={`text-sm text-gray-900 ${mono ? 'font-mono' : ''}`}>{value}</dd>
              </div>
            ))}
          </dl>
        )}
        {missing.length > 0 && (
          <p className={`text-sm text-gray-500 ${captured.length ? 'mt-3 border-t border-gray-100 pt-3' : ''}`}>
            Sin capturar: {missing.join(', ')}.{' '}
            {onEdit && (
              <button onClick={onEdit} className="font-medium text-blue-700 hover:underline">
                Completar datos
              </button>
            )}
          </p>
        )}
      </section>

      <EquipmentSpecificationsEditor equipmentId={equipment.id} specifications={equipment.specifications || {}} />

      <p className="text-xs text-gray-500">
        Creado el {niceDate(equipment.created_at)} · Actualizado el {niceDate(equipment.updated_at)}
      </p>
    </div>
  );
};

export default EquipmentSummaryTab;

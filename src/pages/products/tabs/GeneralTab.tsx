import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, ChevronRight, FileText, GitBranch, Image as ImageIcon, Layers, Lock, Tag, Wrench } from 'lucide-react';
import { getProcessSteps, getProductImages, type Product } from '../../../api/products';
import { getPlantDocuments } from '../../../api/areaDocuments';
import { BLOCKING_EQUIPMENT_STATUSES, getProductEquipment } from '../../../api/productStepEquipment';
import { EQUIPMENT_STATUS_LABELS } from '../../../api/equipment';
import Badge from '../../../components/ui/Badge';
import SectionHeader from '../../../components/ui/SectionHeader';
import { useBackState } from '../../../hooks/useBackNavigation';
import SpecificationsEditor from '../components/SpecificationsEditor';

// Summary of a product, like the plant's and the area's: key figures that open their tab, its route
// through the areas, what needs attention, its description and technical specifications.

const niceDate = (value: Date | string) => new Date(value).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });

const GeneralTab = ({ product }: { product: Product }) => {
  const { pathname } = useLocation();
  const backState = useBackState();
  const { data: steps = [] } = useQuery({ queryKey: ['process-steps', product.id], queryFn: () => getProcessSteps(product.id) });
  const { data: links = [] } = useQuery({ queryKey: ['product-equipment', product.id], queryFn: () => getProductEquipment(product.id) });
  const { data: library = [] } = useQuery({
    queryKey: ['plant-documents', product.plant_id],
    queryFn: () => getPlantDocuments(product.plant_id, { includeArchived: true }),
  });
  const documents = library.filter((d) => d.status !== 'archived' && d.shared_products?.some((p) => p.id === product.id));
  const { data: images = [] } = useQuery({ queryKey: ['product-images', product.id], queryFn: () => getProductImages(product.id) });

  const tab = (name: string) => `${pathname}?tab=${name}`;
  const areaCount = new Set(steps.map((s) => s.organizational_area_id)).size;
  const equipmentCount = new Set(links.map((l) => l.equipment_id)).size;
  const hasSpecs = Object.keys(product.specifications || {}).length > 0;
  const blocked = links.filter((l) => l.usage_type === 'required' && BLOCKING_EQUIPMENT_STATUSES.includes(l.equipment_status));

  const stats = [
    { key: 'process', Icon: GitBranch, label: 'Pasos', value: steps.length },
    { key: 'process', Icon: Layers, label: 'Áreas', value: areaCount },
    { key: 'equipment', Icon: Wrench, label: 'Equipos', value: equipmentCount, alert: blocked.length > 0 },
    { key: 'documents', Icon: FileText, label: 'Documentos', value: documents.length },
    { key: 'gallery', Icon: ImageIcon, label: 'Imágenes', value: images.length },
  ];

  const alerts: { key: string; text: string; detail: string; to?: string; danger?: boolean }[] = [
    ...blocked.map((l) => ({ key: l.id, text: `${l.equipment_code} · ${l.equipment_name}: ${EQUIPMENT_STATUS_LABELS[l.equipment_status]}`, detail: `Requerido en el paso ${l.step_number}`, to: tab('equipment'), danger: true })),
    ...(steps.length === 0 ? [{ key: 'steps', text: 'Sin pasos de proceso', detail: 'Agregar pasos', to: tab('process') }] : []),
    ...(!product.primary_image_url ? [{ key: 'image', text: 'Sin imagen', detail: 'Subir imágenes', to: tab('gallery') }] : []),
    ...(!hasSpecs ? [{ key: 'specs', text: 'Sin especificaciones técnicas', detail: 'Se capturan abajo' }] : []),
    ...(documents.length === 0 ? [{ key: 'docs', text: 'Sin documentos', detail: 'Agregar documentos', to: tab('documents') }] : []),
  ];

  return (
    <div className="space-y-4">
      <SectionHeader title="Resumen" description="Cómo está el producto, por dónde pasa y sus especificaciones." />

      {/* Key numbers: each one opens its tab */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {stats.map(({ key, Icon, label, value, alert }) => (
          <Link key={label} to={tab(key)} className="group rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:border-blue-300 hover:bg-blue-50/40 sm:p-4">
            <span className="flex items-center gap-1.5 text-sm text-gray-600 group-hover:text-blue-700">
              <Icon className="h-4 w-4" />
              {label}
            </span>
            <span className={`mt-1 block text-2xl font-bold ${alert ? 'text-red-700' : 'text-gray-900'}`}>{value}</span>
          </Link>
        ))}
      </div>

      {/* Route through the areas */}
      {steps.length > 0 && (
        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold text-gray-900">Recorrido</h3>
          <div className="flex flex-wrap items-center gap-1" aria-label="Recorrido del producto">
            {steps.map((step, index) => (
              <span key={step.id} className="inline-flex items-center gap-1">
                {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-gray-400" />}
                <Link
                  to={`/areas/${step.organizational_area_id}`}
                  state={backState}
                  title={step.step_name}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: step.area_color || '#94A3B8' }} />
                  {step.area_name || 'Sin área'}
                </Link>
              </span>
            ))}
          </div>
        </section>
      )}

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
            Todo en orden: tiene pasos, imagen, especificaciones y documentos.
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
        {product.is_private && (
          <p className="flex items-center gap-2 border-t border-gray-100 px-4 py-2.5 text-sm text-gray-600">
            <Lock className="h-4 w-4 flex-shrink-0 text-gray-400" />
            Es privado: no sale en los tours.
          </p>
        )}
      </section>

      {(product.description || !!product.tags?.length) && (
        <section className="rounded-lg border border-gray-200 bg-white p-4">
          {product.description && (
            <>
              <h3 className="mb-1 text-sm font-semibold text-gray-900">Descripción</h3>
              <p className="whitespace-pre-line text-sm text-gray-700">{product.description}</p>
            </>
          )}
          {!!product.tags?.length && (
            <div className={`flex flex-wrap items-center gap-1.5 ${product.description ? 'mt-3' : ''}`}>
              <Tag className="h-4 w-4 text-gray-400" />
              {product.tags.map((tag, index) => (
                <Badge key={index} variant="default">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </section>
      )}

      <SpecificationsEditor productId={product.id} specifications={product.specifications || {}} />

      <p className="text-xs text-gray-500">
        Creado el {niceDate(product.created_at)} · Actualizado el {niceDate(product.updated_at)}
      </p>
    </div>
  );
};

export default GeneralTab;

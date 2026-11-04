import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Package } from 'lucide-react';
import Badge from '../../../components/ui/Badge';
import SectionHeader from '../../../components/ui/SectionHeader';
import { EQUIPMENT_STATUS_LABELS, type Equipment } from '../../../api/equipment';
import { getEquipmentProducts, BLOCKING_EQUIPMENT_STATUSES, USAGE_TYPE_LABELS, type ProductStepEquipment } from '../../../api/productStepEquipment';
import { useNavigateWithBack } from '../../../hooks/useBackNavigation';

interface EquipmentProductsTabProps {
  equipmentId: string;
  equipment: Equipment;
}

const EquipmentProductsTab = ({ equipmentId, equipment }: EquipmentProductsTabProps) => {
  const navigate = useNavigateWithBack(); // detail pages opened from here return here

  const { data: links = [], isLoading } = useQuery({
    queryKey: ['equipment-products', equipmentId],
    queryFn: () => getEquipmentProducts(equipmentId),
  });

  // One row per product, listing the steps that use this equipment
  const byProduct = Object.values(
    links.reduce<Record<string, { first: ProductStepEquipment; steps: ProductStepEquipment[] }>>((acc, link) => {
      (acc[link.product_id] ||= { first: link, steps: [] }).steps.push(link);
      return acc;
    }, {})
  );

  const isBlocking = BLOCKING_EQUIPMENT_STATUSES.includes(equipment.status);
  const affectedProducts = new Set(links.filter((l) => l.usage_type === 'required').map((l) => l.product_id)).size;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stepName = (s: ProductStepEquipment) => (
    <span className="inline-flex flex-wrap items-center gap-1.5 text-xs text-gray-700">
      <span className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 font-semibold text-gray-700">{s.step_number}</span>
      {s.step_name}
    </span>
  );
  const notThere = (s: ProductStepEquipment) =>
    !s.in_step_area && (
      <span className="inline-flex items-center gap-1 text-xs text-amber-700" title="El equipo no está en el área de este paso">
        <AlertTriangle className="h-3 w-3" />
        No está aquí
      </span>
    );

  return (
    <div className="space-y-4">
      <SectionHeader title="Productos" description='Productos que usan este equipo. Se vincula en la pestaña "Proceso" de cada producto.' />

      {isBlocking && affectedProducts > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <p>
            Este equipo está <strong>{EQUIPMENT_STATUS_LABELS[equipment.status]}</strong> y es requerido en{' '}
            <strong>
              {affectedProducts} producto{affectedProducts !== 1 && 's'}
            </strong>
            .
          </p>
        </div>
      )}

      {byProduct.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <Package className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">No se usa en ningún producto</h3>
          <p className="text-gray-600">Se vincula desde la pestaña "Proceso" de cada producto.</p>
        </div>
      ) : (
        <>
          {/* Table (tablets and up) */}
          <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white md:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Producto', 'SKU', 'Paso', 'Área', 'Uso'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {byProduct.map(({ first, steps }) => (
                  <tr key={first.product_id} onClick={() => navigate(`/products/${first.product_id}`)} className="cursor-pointer align-top hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{first.product_name}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-gray-900">{first.product_sku}</td>
                    <td className="space-y-1.5 px-4 py-3">
                      {steps.map((s) => (
                        <div key={s.id}>{stepName(s)}</div>
                      ))}
                    </td>
                    <td className="space-y-1.5 px-4 py-3 text-sm text-gray-700">
                      {steps.map((s) => (
                        <div key={s.id} className="flex flex-wrap items-center gap-2">
                          {s.step_area_name}
                          {notThere(s)}
                        </div>
                      ))}
                    </td>
                    <td className="space-y-1.5 px-4 py-3">
                      {steps.map((s) => (
                        <div key={s.id}>
                          <Badge variant={s.usage_type === 'required' ? 'primary' : 'default'} size="sm">
                            {USAGE_TYPE_LABELS[s.usage_type]}
                          </Badge>
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards (phones) */}
          <ul className="space-y-2 md:hidden">
            {byProduct.map(({ first, steps }) => (
              <li key={first.product_id} onClick={() => navigate(`/products/${first.product_id}`)} className="cursor-pointer rounded-lg border border-gray-200 bg-white p-3">
                <p className="text-sm font-medium text-gray-900">{first.product_name}</p>
                <p className="font-mono text-xs text-gray-500">{first.product_sku}</p>
                <div className="mt-2 space-y-1.5">
                  {steps.map((s) => (
                    <div key={s.id} className="flex flex-wrap items-center gap-1.5">
                      {stepName(s)}
                      <span className="text-xs text-gray-500">· {s.step_area_name}</span>
                      <Badge variant={s.usage_type === 'required' ? 'primary' : 'default'} size="sm">
                        {USAGE_TYPE_LABELS[s.usage_type]}
                      </Badge>
                      {notThere(s)}
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default EquipmentProductsTab;

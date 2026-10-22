import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronRight, Package } from 'lucide-react';
import Badge from '../../../components/ui/Badge';
import { EQUIPMENT_STATUS_LABELS, type Equipment } from '../../../api/equipment';
import {
  getEquipmentProducts,
  BLOCKING_EQUIPMENT_STATUSES,
  USAGE_TYPE_LABELS,
  type ProductStepEquipment,
} from '../../../api/productStepEquipment';

interface EquipmentProductsTabProps {
  equipmentId: string;
  equipment: Equipment;
}

const EquipmentProductsTab = ({ equipmentId, equipment }: EquipmentProductsTabProps) => {
  const navigate = useNavigate();

  const { data: links = [], isLoading } = useQuery({
    queryKey: ['equipment-products', equipmentId],
    queryFn: () => getEquipmentProducts(equipmentId),
  });

  // One card per product, listing the steps that use this equipment
  const byProduct = Object.values(
    links.reduce<Record<string, { first: ProductStepEquipment; steps: ProductStepEquipment[] }>>(
      (acc, link) => {
        (acc[link.product_id] ||= { first: link, steps: [] }).steps.push(link);
        return acc;
      },
      {}
    )
  );

  const isBlocking = BLOCKING_EQUIPMENT_STATUSES.includes(equipment.status);
  const affectedProducts = new Set(
    links.filter((l) => l.usage_type === 'required').map((l) => l.product_id)
  ).size;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se usa en ningún producto</h3>
          <p className="text-gray-600">
            Se vincula desde el "Proceso de Fabricación" de cada producto.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
          {byProduct.map(({ first, steps }) => (
            <button
              key={first.product_id}
              onClick={() => navigate(`/products/${first.product_id}`)}
              className="w-full flex items-start gap-4 p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <Package className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">{first.product_name}</p>
                  <Badge variant="info" className="font-mono">
                    {first.product_sku}
                  </Badge>
                </div>
                <div className="mt-2 space-y-1">
                  {steps.map((s) => (
                    <div key={s.id} className="flex flex-wrap items-center gap-2 text-xs text-gray-700">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold">
                        {s.step_number}
                      </span>
                      <span>{s.step_name}</span>
                      <span className="text-gray-400">· {s.step_area_name}</span>
                      <Badge variant={s.usage_type === 'required' ? 'primary' : 'default'} size="sm">
                        {USAGE_TYPE_LABELS[s.usage_type]}
                      </Badge>
                      {!s.in_step_area && (
                        <span className="inline-flex items-center gap-1 text-amber-700">
                          <AlertTriangle className="h-3 w-3" />
                          No está en el área del paso
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default EquipmentProductsTab;

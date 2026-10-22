import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, MapPin, Wrench } from 'lucide-react';
import Badge from '../../../components/ui/Badge';
import { useAuthStore } from '../../../store/authStore';
import {
  EQUIPMENT_STATUS_COLORS,
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_TYPE_LABELS,
} from '../../../api/equipment';
import {
  getProductEquipment,
  BLOCKING_EQUIPMENT_STATUSES,
  USAGE_TYPE_LABELS,
  type ProductStepEquipment,
} from '../../../api/productStepEquipment';

interface ProductEquipmentTabProps {
  productId: string;
}

// Only these roles can open /equipment
const EQUIPMENT_MODULE_ROLES = ['platform_admin', 'org_owner'];

const ProductEquipmentTab = ({ productId }: ProductEquipmentTabProps) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const canOpenEquipment = !!user?.role && EQUIPMENT_MODULE_ROLES.includes(user.role.name);

  const { data: links = [], isLoading } = useQuery({
    queryKey: ['product-equipment', productId],
    queryFn: () => getProductEquipment(productId),
  });

  // Required equipment that is not operational blocks its step
  const alerts = links.filter(
    (l) => l.usage_type === 'required' && BLOCKING_EQUIPMENT_STATUSES.includes(l.equipment_status)
  );

  // One row per equipment, listing every step where it is used
  const byEquipment = Object.values(
    links.reduce<Record<string, { first: ProductStepEquipment; steps: ProductStepEquipment[] }>>(
      (acc, link) => {
        (acc[link.equipment_id] ||= { first: link, steps: [] }).steps.push(link);
        return acc;
      },
      {}
    )
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Cargando equipos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Herramientas y Maquinaria</h3>
        <p className="text-sm text-gray-600 mt-1">
          Equipos usados en el proceso de fabricación. Se asignan desde la pestaña "Proceso de Fabricación".
        </p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
            <AlertTriangle className="h-5 w-5" />
            {alerts.length === 1
              ? 'Un equipo requerido no está disponible'
              : `${alerts.length} equipos requeridos no están disponibles`}
          </div>
          <ul className="space-y-1 text-sm text-amber-900">
            {alerts.map((a) => (
              <li key={a.id}>
                El paso {a.step_number} ({a.step_name}) depende de{' '}
                <strong>
                  {a.equipment_code} · {a.equipment_name}
                </strong>
                , que está <strong>{EQUIPMENT_STATUS_LABELS[a.equipment_status]}</strong>.
              </li>
            ))}
          </ul>
        </div>
      )}

      {byEquipment.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sin equipos asignados</h3>
          <p className="text-gray-600">
            Agrega equipos a cada paso desde la pestaña "Proceso de Fabricación" con el botón "+ Equipo".
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
          {byEquipment.map(({ first, steps }) => {
            const Row = canOpenEquipment ? 'button' : 'div';
            return (
              <Row
                key={first.equipment_id}
                {...(canOpenEquipment && { onClick: () => navigate(`/equipment/${first.equipment_id}`) })}
                className={`w-full flex items-start gap-4 p-4 text-left ${
                  canOpenEquipment ? 'hover:bg-gray-50 transition-colors' : ''
                }`}
              >
                {first.equipment_image_url ? (
                  <img
                    src={first.equipment_image_url}
                    alt={first.equipment_name}
                    className="h-12 w-12 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Wrench className="h-6 w-6 text-gray-400" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{first.equipment_name}</p>
                    <Badge variant="info" className="font-mono">
                      {first.equipment_code}
                    </Badge>
                    <span className="flex items-center gap-1 text-xs text-gray-600">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: EQUIPMENT_STATUS_COLORS[first.equipment_status] }}
                      />
                      {EQUIPMENT_STATUS_LABELS[first.equipment_status]}
                    </span>
                  </div>
                  <p className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    {EQUIPMENT_TYPE_LABELS[first.equipment_type]} ·
                    <MapPin className="h-3 w-3" />
                    {first.current_area_name || 'Sin área asignada'}
                  </p>

                  <div className="mt-2 space-y-1">
                    {steps.map((s) => (
                      <div key={s.id} className="flex flex-wrap items-center gap-2 text-xs text-gray-700">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold">
                          {s.step_number}
                        </span>
                        <span>{s.step_name}</span>
                        <Badge variant={s.usage_type === 'required' ? 'primary' : 'default'} size="sm">
                          {USAGE_TYPE_LABELS[s.usage_type]}
                        </Badge>
                        {!s.in_step_area && (
                          <span className="inline-flex items-center gap-1 text-amber-700">
                            <AlertTriangle className="h-3 w-3" />
                            No está en {s.step_area_name}
                          </span>
                        )}
                        {s.notes && <span className="text-gray-500 italic">{s.notes}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </Row>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductEquipmentTab;

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Search, Wrench } from 'lucide-react';
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
import { useNavigateWithBack } from '../../../hooks/useBackNavigation';
import SectionHeader from '../../../components/ui/SectionHeader';
import { matchesSearch } from '../../../utils/search';

interface ProductEquipmentTabProps {
  productId: string;
}

// Only these roles can open /equipment
const EQUIPMENT_MODULE_ROLES = ['platform_admin', 'org_owner'];
// The search only appears when the list is long enough to need it
const FILTERS_FROM = 7;

const ProductEquipmentTab = ({ productId }: ProductEquipmentTabProps) => {
  const navigate = useNavigateWithBack(); // detail pages opened from here return here
  const { user } = useAuthStore();
  const canOpenEquipment = !!user?.role && EQUIPMENT_MODULE_ROLES.includes(user.role.name);
  const [search, setSearch] = useState('');

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

  const visible = byEquipment.filter(({ first }) => matchesSearch(search, first.equipment_name, first.equipment_code, first.current_area_name));

  const Photo = ({ link }: { link: ProductStepEquipment }) =>
    link.equipment_image_url ? (
      <img src={link.equipment_image_url} alt="" className="h-10 w-10 flex-shrink-0 rounded object-cover" />
    ) : (
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded bg-gray-200">
        <Wrench className="h-5 w-5 text-gray-400" />
      </span>
    );
  const Status = ({ link }: { link: ProductStepEquipment }) => (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-gray-700">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: EQUIPMENT_STATUS_COLORS[link.equipment_status] }} />
      {EQUIPMENT_STATUS_LABELS[link.equipment_status]}
    </span>
  );
  const Steps = ({ steps }: { steps: ProductStepEquipment[] }) => (
    <div className="space-y-1">
      {steps.map((s) => (
        <div key={s.id} className="flex flex-wrap items-center gap-1.5 text-xs text-gray-700">
          <span className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 font-semibold text-gray-700">{s.step_number}</span>
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
        </div>
      ))}
    </div>
  );
  const open = (id: string) => canOpenEquipment && navigate(`/equipment/${id}`);

  return (
    <div className="space-y-4">
      <SectionHeader title="Equipos" description='Equipos usados en el proceso de fabricación. Se asignan por paso en la pestaña "Proceso".' />

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
            <AlertTriangle className="h-5 w-5" />
            {alerts.length === 1 ? 'Un equipo requerido no está disponible' : `${alerts.length} equipos requeridos no están disponibles`}
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

      {byEquipment.length >= FILTERS_FROM && (
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, código o área"
            aria-label="Buscar equipos del producto"
            className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>
      )}

      {byEquipment.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <Wrench className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">Sin equipos asignados</h3>
          <p className="text-gray-600">Agrégalos a cada paso en la pestaña "Proceso" con el botón "+ Equipo".</p>
        </div>
      ) : visible.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">Ningún equipo coincide con la búsqueda.</p>
      ) : (
        <>
          {/* Table (tablets and up) */}
          <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white md:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Equipo', 'Código', 'Tipo', 'Paso', 'Área', 'Estado'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {visible.map(({ first, steps }) => (
                  <tr key={first.equipment_id} onClick={() => open(first.equipment_id)} className={`hover:bg-gray-50 ${canOpenEquipment ? 'cursor-pointer' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Photo link={first} />
                        <span className="text-sm font-medium text-gray-900">{first.equipment_name}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-gray-900">{first.equipment_code}</td>
                    <td className="px-4 py-3">
                      <Badge variant="default">{EQUIPMENT_TYPE_LABELS[first.equipment_type]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Steps steps={steps} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{first.current_area_name || <span className="text-xs text-amber-700">Sin área</span>}</td>
                    <td className="px-4 py-3">
                      <Status link={first} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards (phones) */}
          <ul className="space-y-2 md:hidden">
            {visible.map(({ first, steps }) => (
              <li key={first.equipment_id} onClick={() => open(first.equipment_id)} className={`rounded-lg border border-gray-200 bg-white p-3 ${canOpenEquipment ? 'cursor-pointer' : ''}`}>
                <div className="flex items-start gap-3">
                  <Photo link={first} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">{first.equipment_name}</p>
                    <p className="font-mono text-xs text-gray-500">
                      {first.equipment_code} · {EQUIPMENT_TYPE_LABELS[first.equipment_type]}
                    </p>
                    <p className="text-xs text-gray-500">{first.current_area_name || 'Sin área'}</p>
                  </div>
                  <Status link={first} />
                </div>
                <div className="mt-2">
                  <Steps steps={steps} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default ProductEquipmentTab;

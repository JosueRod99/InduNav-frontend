import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Wrench, Calendar, ChevronRight } from 'lucide-react';
import Badge from '../../../components/ui/Badge';
import { useAuthStore } from '../../../store/authStore';
import {
  getAreaEquipment,
  EQUIPMENT_TYPE_LABELS,
  EQUIPMENT_STATUS_LABELS,
  ASSIGNMENT_TYPE_LABELS,
  type EquipmentType,
} from '../../../api/equipment';

interface EquipmentTabProps {
  areaId: string;
  area: any;
}

// Solo estos roles tienen acceso al módulo /equipment
const EQUIPMENT_MODULE_ROLES = ['platform_admin', 'org_owner'];

const EquipmentTab = ({ areaId, area }: EquipmentTabProps) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const canOpenEquipment = !!user?.role && EQUIPMENT_MODULE_ROLES.includes(user.role.name);
  const [typeFilter, setTypeFilter] = useState<EquipmentType | 'all'>('all');

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['area-equipment', areaId],
    queryFn: () => getAreaEquipment(areaId),
  });

  const counts = assignments.reduce<Partial<Record<EquipmentType, number>>>((acc, a) => {
    if (a.equipment_type) acc[a.equipment_type] = (acc[a.equipment_type] || 0) + 1;
    return acc;
  }, {});
  const visible =
    typeFilter === 'all' ? assignments : assignments.filter((a) => a.equipment_type === typeFilter);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Cargando equipos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Herramientas y Maquinaria</h3>
          <p className="text-sm text-gray-600 mt-1">
            Equipos ubicados actualmente en "{area?.name}"
          </p>
        </div>

        {assignments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                typeFilter === 'all'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
              }`}
            >
              Todos ({assignments.length})
            </button>
            {(Object.keys(counts) as EquipmentType[]).map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  typeFilter === type
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                }`}
              >
                {EQUIPMENT_TYPE_LABELS[type]} ({counts[type]})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Equipment List */}
      {assignments.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay equipos en esta área</h3>
          <p className="text-gray-600">
            Asigna herramientas o maquinaria desde la pestaña "Asignaciones" de cada equipo
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visible.map((a) => {
            const Card = canOpenEquipment ? 'button' : 'div';
            return (
              <Card
                key={a.id}
                {...(canOpenEquipment && { onClick: () => navigate(`/equipment/${a.equipment_id}`) })}
                className={`flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg text-left ${
                  canOpenEquipment ? 'hover:shadow-md hover:border-blue-300 transition-all' : ''
                }`}
              >
                {a.equipment_image_url ? (
                  <img
                    src={a.equipment_image_url}
                    alt={a.equipment_name}
                    className="h-16 w-16 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200 flex-shrink-0">
                    <Wrench className="h-7 w-7 text-gray-400" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-gray-900 truncate">{a.equipment_name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {[a.equipment_manufacturer, a.equipment_model].filter(Boolean).join(' · ') ||
                      (a.equipment_type && EQUIPMENT_TYPE_LABELS[a.equipment_type])}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <Badge variant="info" className="font-mono">
                      {a.equipment_code}
                    </Badge>
                    {a.equipment_status && (
                      <Badge
                        variant={
                          a.equipment_status === 'active'
                            ? 'success'
                            : a.equipment_status === 'maintenance'
                            ? 'warning'
                            : 'error'
                        }
                      >
                        {EQUIPMENT_STATUS_LABELS[a.equipment_status]}
                      </Badge>
                    )}
                    {a.assignment_type === 'temporary' && (
                      <Badge variant="warning">{ASSIGNMENT_TYPE_LABELS.temporary}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                    <Calendar className="h-3 w-3" />
                    <span>
                      En el área desde{' '}
                      {new Date(a.start_date).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        timeZone: 'UTC',
                      })}
                    </span>
                  </div>
                </div>

                {canOpenEquipment && <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EquipmentTab;

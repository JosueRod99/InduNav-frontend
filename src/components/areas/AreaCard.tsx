import { Building2, Users, Maximize2, DollarSign, User } from 'lucide-react';
import type { OrganizationalArea } from '../../api/areas';
import Badge from '../ui/Badge';

interface AreaCardProps {
  area: OrganizationalArea;
  onClick?: () => void;
  className?: string;
  showDetails?: boolean;
}

const AreaCard = ({
  area,
  onClick,
  className = '',
  showDetails = true,
}: AreaCardProps) => {
  const areaTypeLabels: Record<string, string> = {
    production: 'Producción',
    warehouse: 'Almacén',
    office: 'Oficina',
    quality: 'Control de Calidad',
    maintenance: 'Mantenimiento',
    general: 'General',
  };

  const areaTypeColors: Record<string, string> = {
    production: 'bg-blue-100 text-blue-800',
    warehouse: 'bg-yellow-100 text-yellow-800',
    office: 'bg-gray-100 text-gray-800',
    quality: 'bg-green-100 text-green-800',
    maintenance: 'bg-orange-100 text-orange-800',
    general: 'bg-purple-100 text-purple-800',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-gray-200 rounded-lg p-4 transition-all
        ${onClick ? 'cursor-pointer hover:border-blue-400 hover:shadow-md' : ''}
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Color Indicator */}
          {area.color && (
            <div
              className="w-4 h-4 rounded-full mt-1 flex-shrink-0"
              style={{ backgroundColor: area.color }}
            />
          )}

          {/* Title */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{area.name}</h3>
            {area.code && (
              <p className="text-sm text-gray-500">Código: {area.code}</p>
            )}
          </div>
        </div>

        {/* Type Badge */}
        <Badge
          variant="default"
          className={areaTypeColors[area.area_type] || 'bg-gray-100 text-gray-800'}
        >
          {areaTypeLabels[area.area_type] || area.area_type}
        </Badge>
      </div>

      {/* Description */}
      {area.description && showDetails && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{area.description}</p>
      )}

      {/* Details Grid */}
      {showDetails && (
        <div className="grid grid-cols-2 gap-3 text-sm">
          {/* Employee Count */}
          {area.employee_count !== undefined && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">
                {area.employee_count} {area.employee_count === 1 ? 'empleado' : 'empleados'}
              </span>
            </div>
          )}

          {/* Sub-areas */}
          {area.sub_area_count !== undefined && (
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">
                {area.sub_area_count} {area.sub_area_count === 1 ? 'sub-área' : 'sub-áreas'}
              </span>
            </div>
          )}

          {/* Capacity */}
          {area.capacity && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Capacidad: {area.capacity}</span>
            </div>
          )}

          {/* Square Meters */}
          {area.square_meters && (
            <div className="flex items-center gap-2">
              <Maximize2 className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">{area.square_meters} m²</span>
            </div>
          )}

          {/* Cost Center */}
          {area.cost_center && (
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">{area.cost_center}</span>
            </div>
          )}

          {/* Supervisor */}
          {area.supervisor && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 truncate">
                {area.supervisor.first_name} {area.supervisor.last_name}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Parent Area */}
      {area.parent_area && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Área padre:{' '}
            <span className="font-medium text-gray-700">{area.parent_area.name}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default AreaCard;

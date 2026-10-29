import { useState } from 'react';
import { Users, Building2, Calendar, Shield, Edit } from 'lucide-react';
import type { OrganizationalArea } from '../../../api/areas';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import EditGeneralInfoModal from '../modals/EditGeneralInfoModal';
import EmployeeDetailModal from '../../../components/employees/EmployeeDetailModal';
import AreaResponsiblesSection from '../../../components/responsibles/AreaResponsiblesSection';
import { areaTypeLabel } from '../../../constants/areaTypes';

interface GeneralTabProps {
  area: OrganizationalArea;
}

const GeneralTab = ({ area }: GeneralTabProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  // Parse shift schedule if available
  const shiftSchedule = area.shift_schedule as any;

  // Filter out days_without_accident from metadata display
  const displayMetadata = area.metadata ? (() => {
    const { days_without_accident, ...rest } = area.metadata;
    return rest;
  })() : {};

  return (
    <div className="space-y-8">
      {/* Basic Information */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Información Básica
          </h3>
          <Button
            onClick={() => setIsEditModalOpen(true)}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            Editar
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <InfoCard
            label="Código"
            value={area.code || 'Sin código'}
            icon={<Building2 className="h-5 w-5 text-gray-400" />}
          />
          <InfoCard
            label="Tipo de Área"
            value={
              <Badge variant={area.area_type === 'production' ? 'success' : 'default'}>
                {areaTypeLabel(area.area_type)}
              </Badge>
            }
          />
          <InfoCard
            label="Capacidad"
            value={area.capacity ? `${area.capacity} personas` : 'No especificada'}
            icon={<Users className="h-5 w-5 text-gray-400" />}
          />
          <InfoCard
            label="Metros Cuadrados"
            value={area.square_meters ? `${area.square_meters} m²` : 'No especificado'}
          />
          <InfoCard
            label="Centro de Costo"
            value={area.cost_center || 'No especificado'}
          />
          <InfoCard
            label="Días sin Accidente"
            value={
              <span className={`font-bold ${area.days_without_accident && area.days_without_accident > 90 ? 'text-green-600' : 'text-gray-900'}`}>
                {area.days_without_accident || 0} días
              </span>
            }
            icon={<Shield className="h-5 w-5 text-green-600" />}
          />
        </div>
      </div>

      {/* Who is in charge (several people per role, assigned here or from the employee) */}
      <AreaResponsiblesSection area={area} onOpenEmployee={setSelectedEmployeeId} />

      {/* Shift Schedule */}
      {shiftSchedule && shiftSchedule.shifts && shiftSchedule.shifts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Horarios de Turnos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shiftSchedule.shifts.map((shift: any, index: number) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <h4 className="font-semibold text-gray-900 mb-2">{shift.name}</h4>
                <p className="text-sm text-gray-600 mb-2">
                  {shift.start_time} - {shift.end_time}
                </p>
                {shift.days && shift.days.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {shift.days.map((day: string, dayIndex: number) => (
                      <Badge key={dayIndex} variant="secondary" size="sm">
                        {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      {displayMetadata && Object.keys(displayMetadata).length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Adicional</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-xs text-gray-700 overflow-auto">
              {JSON.stringify(displayMetadata, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <EditGeneralInfoModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        area={area}
      />

      {/* Employee Detail Modal */}
      <EmployeeDetailModal
        isOpen={!!selectedEmployeeId}
        onClose={() => setSelectedEmployeeId(null)}
        employeeId={selectedEmployeeId}
      />
    </div>
  );
};

// Helper Components
interface InfoCardProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}

const InfoCard = ({ label, value, icon }: InfoCardProps) => (
  <div className="flex items-start gap-3">
    {icon && <div className="mt-1">{icon}</div>}
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-base text-gray-900">{value}</p>
    </div>
  </div>
);

export default GeneralTab;

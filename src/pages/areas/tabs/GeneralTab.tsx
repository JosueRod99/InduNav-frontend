import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Award, BadgeAlert, Calendar, CheckCircle2, ChevronRight, Edit, FileText, Layers, MapPinOff, Package, UserX, Users, Wrench } from 'lucide-react';
import { areaPending, getPlantAreasOverview, type OrganizationalArea } from '../../../api/areas';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import EditGeneralInfoModal from '../modals/EditGeneralInfoModal';
import EmployeeDetailModal from '../../../components/employees/EmployeeDetailModal';
import AreaResponsiblesSection from '../../../components/responsibles/AreaResponsiblesSection';
import SectionHeader from '../../../components/ui/SectionHeader';
import { useCan } from '../../../hooks/usePermissions';

// Summary of an area, like the plant's: key figures that open their tab, what needs attention, who is
// in charge, its subareas and its data.

interface GeneralTabProps {
  area: OrganizationalArea;
}

const GeneralTab = ({ area }: GeneralTabProps) => {
  const can = useCan();
  const canEdit = can('areas.update');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  // Real figures of every area of the plant (only managers can read them: without them, no figures)
  const { data: overview } = useQuery({
    queryKey: ['plant-areas-overview', area.plant_id],
    queryFn: () => getPlantAreasOverview(area.plant_id),
    enabled: !!area.plant_id,
    retry: false,
  });
  const figures = overview?.find((a) => a.id === area.id);
  const children = (overview || []).filter((a) => a.parent_area_id === area.id).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const tab = (name: string) => `/areas/${area.id}?tab=${name}`;
  const pending = figures && areaPending(figures);
  const alerts = pending
    ? [
        pending.noSupervisor && { key: 'supervisor', Icon: UserX, tone: 'text-amber-600', text: 'Sin supervisor', detail: 'Asígnalo abajo en Responsables' },
        pending.notDrawn && { key: 'drawn', Icon: MapPinOff, tone: 'text-amber-600', text: 'Sin dibujar en ningún plano', to: `/plants/${area.plant_id}/layout?area=${area.id}&draw=1`, detail: 'Dibujar en el plano' },
        pending.stoppedEquipment > 0 && {
          key: 'equipment',
          Icon: Wrench,
          tone: 'text-red-600',
          text: `${pending.stoppedEquipment} equipo${pending.stoppedEquipment === 1 ? '' : 's'} detenido${pending.stoppedEquipment === 1 ? '' : 's'}`,
          to: tab('equipment'),
          detail: 'Ver Equipos',
        },
        pending.certifications > 0 && {
          key: 'certifications',
          Icon: BadgeAlert,
          tone: 'text-red-600',
          text: `${pending.certifications} certificaci${pending.certifications === 1 ? 'ón' : 'ones'} vencida${pending.certifications === 1 ? '' : 's'} o por vencer`,
          to: tab('certifications'),
          detail: 'Ver Certificaciones',
        },
      ].filter(Boolean) as { key: string; Icon: typeof Users; tone: string; text: string; detail: string; to?: string }[]
    : [];
  const stats = figures
    ? [
        { key: 'personal', Icon: Users, label: 'Personal', value: figures.employees + figures.headcount, detail: figures.headcount ? `+${figures.headcount} en plantilla` : '' },
        { key: 'equipment', Icon: Wrench, label: 'Equipos', value: figures.equipment, detail: figures.equipment_stopped ? `${figures.equipment_stopped} detenido${figures.equipment_stopped === 1 ? '' : 's'}` : '', alert: figures.equipment_stopped > 0 },
        { key: 'products', Icon: Package, label: 'Productos', value: figures.products, detail: '' },
        { key: 'documents', Icon: FileText, label: 'Documentos', value: figures.documents, detail: '' },
        {
          key: 'certifications',
          Icon: Award,
          label: 'Certificaciones',
          value: figures.certification_alerts + figures.people_certification_alerts,
          detail: figures.certification_alerts + figures.people_certification_alerts ? 'vencidas o por vencer' : 'sin alertas',
          alert: figures.certification_alerts + figures.people_certification_alerts > 0,
        },
      ]
    : [];

  // Parse shift schedule if available
  const shiftSchedule = area.shift_schedule as any;

  // Filter out days_without_accident from metadata display
  const displayMetadata = area.metadata ? (() => {
    const { days_without_accident, ...rest } = area.metadata;
    return rest;
  })() : {};

  const missing = [
    !area.capacity && 'capacidad',
    !area.square_meters && 'metros cuadrados',
    !area.cost_center && 'centro de costo',
  ].filter(Boolean) as string[];
  const captured = 3 - missing.length;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <SectionHeader
          title="Resumen"
          description="Cómo está el área, quién está a cargo y sus datos."
          actions={
            canEdit && (
              <Button onClick={() => setIsEditModalOpen(true)} variant="outline" size="sm" className="gap-2">
                <Edit className="h-4 w-4" />
                Editar
              </Button>
            )
          }
        />

        {/* Key numbers: each one opens its tab */}
        {stats.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {stats.map(({ key, Icon, label, value, detail, alert }) => (
              <Link key={key} to={tab(key)} className="group rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:border-blue-300 hover:bg-blue-50/40 sm:p-4">
                <span className="flex items-center gap-1.5 text-sm text-gray-600 group-hover:text-blue-700">
                  <Icon className="h-4 w-4" />
                  {label}
                </span>
                <span className={`mt-1 block text-2xl font-bold ${alert ? 'text-red-700' : 'text-gray-900'}`}>{value}</span>
                <span className={`flex h-4 items-center whitespace-nowrap text-xs ${alert ? 'text-red-700' : 'text-gray-500'}`}>{detail}</span>
              </Link>
            ))}
          </div>
        )}

        {/* What needs attention */}
        {figures && (
          <section className="rounded-lg border border-gray-200 bg-white">
            <h3 className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-900">
              <AlertTriangle className="h-4 w-4 text-gray-500" />
              Requiere atención
              {alerts.length > 0 && <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">{alerts.length}</span>}
            </h3>
            {alerts.length === 0 ? (
              <p className="flex items-center gap-2 px-4 py-4 text-sm text-gray-600">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
                Todo en orden: con supervisor, dibujada en el plano, sin equipos detenidos ni certificaciones por vencer.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {alerts.map(({ key, Icon, tone, text, detail, to }) => {
                  const content = (
                    <>
                      <Icon className={`h-4 w-4 flex-shrink-0 ${tone}`} />
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
        )}
      </div>

      {/* Who is in charge (several people per role, assigned here or from the employee) */}
      <AreaResponsiblesSection area={area} onOpenEmployee={can('employees.read') ? setSelectedEmployeeId : undefined} />

      {/* Subareas */}
      {children.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Layers className="h-5 w-5 text-blue-600" />
            Subáreas ({children.length})
          </h3>
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
            {children.map((child) => (
              <li key={child.id}>
                <Link to={`/areas/${child.id}`} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50">
                  <span className="h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: child.color || '#94A3B8' }} />
                  <span className="min-w-0 flex-1 truncate font-medium text-gray-900">{child.name}</span>
                  <span className="hidden flex-shrink-0 text-xs text-gray-500 sm:inline">
                    {child.employees + child.headcount} persona{child.employees + child.headcount === 1 ? '' : 's'} · {child.equipment} equipo{child.equipment === 1 ? '' : 's'}
                  </span>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Data of the area: only what has been captured; the rest is offered as one line */}
      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Datos del área</h3>
        {captured > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {!!area.capacity && <InfoCard label="Capacidad" value={`${area.capacity} personas`} />}
            {!!area.square_meters && <InfoCard label="Metros cuadrados" value={`${area.square_meters} m²`} />}
            {area.cost_center && <InfoCard label="Centro de costo" value={area.cost_center} />}
          </div>
        )}
        {missing.length > 0 && (
          <p className={`text-sm text-gray-500 ${captured > 0 ? 'mt-3 border-t border-gray-100 pt-3' : ''}`}>
            Sin capturar: {missing.join(', ')}.{' '}
            {canEdit && (
              <button onClick={() => setIsEditModalOpen(true)} className="font-medium text-blue-700 hover:underline">
                Completar datos
              </button>
            )}
          </p>
        )}
      </section>

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

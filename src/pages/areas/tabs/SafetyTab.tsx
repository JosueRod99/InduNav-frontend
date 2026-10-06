import { useQuery } from '@tanstack/react-query';
import { Shield, AlertTriangle, FileText, MapPin, Calendar, Ban } from 'lucide-react';
import { getSafetyInfoByArea } from '../../../api/areaSafetyInfo';
import type { PPEItem, Hazard, EmergencyContact } from '../../../api/areaSafetyInfo';
import Badge from '../../../components/ui/Badge';

interface SafetyTabProps {
  areaId: string;
}

const SafetyTab = ({ areaId }: SafetyTabProps) => {
  const { data: safetyInfo, isLoading } = useQuery({
    queryKey: ['area-safety', areaId],
    queryFn: () => getSafetyInfoByArea(areaId),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Cargando información de seguridad...</div>
      </div>
    );
  }

  if (!safetyInfo) {
    return (
      <div className="text-center py-12">
        <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Sin Información de Seguridad
        </h3>
        <p className="text-gray-600">
          Aún no se ha registrado información de seguridad para esta área.
        </p>
      </div>
    );
  }

  const severityColors = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    critical: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <div className="space-y-8">
      {/* Safety Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          label="Días sin Accidente"
          value={safetyInfo.incident_count_ytd === 0 ? '∞' : '0'}
          variant={safetyInfo.incident_count_ytd === 0 ? 'success' : 'warning'}
        />
        <MetricCard
          label="Incidentes Este Año"
          value={safetyInfo.incident_count_ytd}
          variant={safetyInfo.incident_count_ytd === 0 ? 'success' : 'danger'}
        />
        <MetricCard
          label="Última Inspección"
          value={
            safetyInfo.last_inspection_date
              ? new Date(safetyInfo.last_inspection_date).toLocaleDateString()
              : 'Sin registro'
          }
        />
        <MetricCard
          label="Próxima Inspección"
          value={
            safetyInfo.next_inspection_date
              ? new Date(safetyInfo.next_inspection_date).toLocaleDateString()
              : 'No programada'
          }
          variant={
            safetyInfo.next_inspection_date &&
            new Date(safetyInfo.next_inspection_date) < new Date()
              ? 'danger'
              : 'default'
          }
        />
      </div>

      {/* Restricted Access */}
      {safetyInfo.restricted_access && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Ban className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-base font-semibold text-red-900 mb-1">
                Área de Acceso Restringido
              </h4>
              {safetyInfo.access_requirements && (
                <p className="text-sm text-red-800">{safetyInfo.access_requirements}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Required PPE */}
      {safetyInfo.required_ppe && safetyInfo.required_ppe.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Equipo de Protección Personal (EPP) Requerido
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {safetyInfo.required_ppe.map((ppe: PPEItem, index: number) => (
              <PPECard key={index} ppe={ppe} />
            ))}
          </div>
        </div>
      )}

      {/* Hazards */}
      {safetyInfo.hazards && safetyInfo.hazards.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Riesgos y Peligros
          </h3>
          <div className="space-y-3">
            {safetyInfo.hazards.map((hazard: Hazard, index: number) => (
              <div
                key={index}
                className={`border rounded-lg p-4 ${severityColors[hazard.severity as keyof typeof severityColors] || severityColors.medium}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold">{hazard.name}</h4>
                    <p className="text-sm opacity-75 capitalize">{hazard.type}</p>
                  </div>
                  <Badge
                    variant={
                      hazard.severity === 'critical' || hazard.severity === 'high'
                        ? 'danger'
                        : hazard.severity === 'medium'
                        ? 'warning'
                        : 'success'
                    }
                  >
                    {hazard.severity}
                  </Badge>
                </div>
                {hazard.notes && <p className="text-sm mt-2">{hazard.notes}</p>}
                <div className="flex flex-wrap gap-2 mt-3">
                  {hazard.cas_number && (
                    <span className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded">
                      CAS: {hazard.cas_number}
                    </span>
                  )}
                  {hazard.level_db && (
                    <span className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded">
                      {hazard.level_db} dB
                    </span>
                  )}
                  {hazard.msds_url && (
                    <a
                      href={hazard.msds_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded hover:bg-opacity-75 underline"
                    >
                      Ver MSDS
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emergency Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Evacuation Procedure */}
        {safetyInfo.evacuation_procedure && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Procedimiento de Evacuación
            </h4>
            <p className="text-sm text-gray-700 whitespace-pre-line">
              {safetyInfo.evacuation_procedure}
            </p>
          </div>
        )}

        {/* Assembly Point */}
        {safetyInfo.emergency_assembly_point && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600" />
              Punto de Reunión
            </h4>
            <p className="text-sm text-gray-700">{safetyInfo.emergency_assembly_point}</p>
          </div>
        )}
      </div>

      {/* Safety Equipment Locations */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Ubicación de Equipo de Seguridad
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {safetyInfo.fire_extinguisher_locations && (
            <LocationCard
              label="Extintores"
              location={safetyInfo.fire_extinguisher_locations}
              icon="🧯"
            />
          )}
          {safetyInfo.first_aid_kit_location && (
            <LocationCard
              label="Botiquín de Primeros Auxilios"
              location={safetyInfo.first_aid_kit_location}
              icon="🏥"
            />
          )}
          {safetyInfo.safety_shower_location && (
            <LocationCard
              label="Regadera de Seguridad"
              location={safetyInfo.safety_shower_location}
              icon="🚿"
            />
          )}
          {safetyInfo.eye_wash_station_location && (
            <LocationCard
              label="Estación Lavaojos"
              location={safetyInfo.eye_wash_station_location}
              icon="👁️"
            />
          )}
        </div>
      </div>

      {/* Emergency Contacts */}
      {safetyInfo.emergency_contacts && safetyInfo.emergency_contacts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Contactos de Emergencia
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {safetyInfo.emergency_contacts.map((contact: EmergencyContact, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-500 mb-1">{contact.role}</p>
                <p className="font-semibold text-gray-900 mb-2">{contact.name}</p>
                <a
                  href={`tel:${contact.phone}`}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {contact.phone}
                  {contact.ext && ` ext. ${contact.ext}`}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Special Instructions */}
      {safetyInfo.special_instructions && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-900 mb-2">Instrucciones Especiales</h4>
          <p className="text-sm text-yellow-800 whitespace-pre-line">
            {safetyInfo.special_instructions}
          </p>
        </div>
      )}
    </div>
  );
};

// Helper Components
interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const MetricCard = ({ label, value, variant = 'default' }: MetricCardProps) => {
  const colors = {
    default: 'bg-gray-50 border-gray-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    danger: 'bg-red-50 border-red-200',
  };

  return (
    <div className={`border rounded-lg p-4 ${colors[variant]}`}>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
};

interface PPECardProps {
  ppe: PPEItem;
}

const PPECard = ({ ppe }: PPECardProps) => (
  <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
    <div className="flex items-start justify-between mb-2">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{getIconForPPE(ppe.icon)}</span>
        <h4 className="font-semibold text-gray-900">{ppe.name}</h4>
      </div>
      {ppe.required && (
        <Badge variant="danger" size="sm">
          Obligatorio
        </Badge>
      )}
    </div>
    {ppe.notes && <p className="text-sm text-gray-600 mt-2">{ppe.notes}</p>}
  </div>
);

interface LocationCardProps {
  label: string;
  location: string;
  icon: string;
}

const LocationCard = ({ label, location, icon }: LocationCardProps) => (
  <div className="flex items-start gap-3 border border-gray-200 rounded-lg p-4">
    <span className="text-2xl">{icon}</span>
    <div>
      <p className="font-medium text-gray-900 mb-1">{label}</p>
      <p className="text-sm text-gray-600">{location}</p>
    </div>
  </div>
);

// Helper function to get icon emoji
const getIconForPPE = (iconName: string): string => {
  const icons: Record<string, string> = {
    hardhat: '⛑️',
    glasses: '🥽',
    gloves: '🧤',
    boots: '🥾',
    vest: '🦺',
    earplugs: '🎧',
    mask: '😷',
    helmet: '⛑️',
  };
  return icons[iconName] || '🛡️';
};

export default SafetyTab;

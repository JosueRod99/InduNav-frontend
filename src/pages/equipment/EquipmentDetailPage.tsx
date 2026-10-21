import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Wrench, Edit } from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EquipmentModal from './EquipmentModal';
import EquipmentGalleryTab from './tabs/EquipmentGalleryTab';
import EquipmentDocumentsTab from './tabs/EquipmentDocumentsTab';
import EquipmentAssignmentsTab from './tabs/EquipmentAssignmentsTab';
import EquipmentSpecificationsEditor from './components/EquipmentSpecificationsEditor';
import {
  getEquipmentById,
  type Equipment,
  EQUIPMENT_TYPE_LABELS,
  EQUIPMENT_STATUS_LABELS,
} from '../../api/equipment';

const EquipmentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'general' | 'gallery' | 'documents' | 'assignments'>('general');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: equipment, isLoading } = useQuery({
    queryKey: ['equipment', id],
    queryFn: () => getEquipmentById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-600">Equipo no encontrado</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Button
              onClick={() => navigate('/equipment')}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <Badge variant="info" className="font-mono">
              {equipment.code}
            </Badge>
            <Badge
              variant={
                equipment.status === 'active'
                  ? 'success'
                  : equipment.status === 'maintenance'
                  ? 'warning'
                  : equipment.status === 'out_of_service'
                  ? 'error'
                  : 'default'
              }
            >
              {EQUIPMENT_STATUS_LABELS[equipment.status]}
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            {equipment.primary_image_url ? (
              <img
                src={equipment.primary_image_url}
                alt={equipment.name}
                className="h-20 w-20 rounded-lg object-cover border border-gray-200"
              />
            ) : (
              <div className="h-20 w-20 rounded-lg bg-gray-200 flex items-center justify-center border border-gray-300">
                <Wrench className="h-10 w-10 text-gray-400" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{equipment.name}</h2>
              <p className="text-sm text-gray-600 mt-1">
                {EQUIPMENT_TYPE_LABELS[equipment.equipment_type]}
                {equipment.manufacturer && ` • ${equipment.manufacturer}`}
              </p>
            </div>
          </div>
        </div>

        <Button onClick={() => setIsEditModalOpen(true)} className="gap-2">
          <Edit className="h-4 w-4" />
          Editar
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'general'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'gallery'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Galería
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'documents'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Documentos
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'assignments'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Asignaciones
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'general' && (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Información Básica</h3>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Código</dt>
                  <dd className="mt-1 text-sm font-mono text-gray-900">{equipment.code}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Nombre</dt>
                  <dd className="mt-1 text-sm text-gray-900">{equipment.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Tipo</dt>
                  <dd className="mt-1">
                    <Badge variant="info">
                      {EQUIPMENT_TYPE_LABELS[equipment.equipment_type]}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Estado</dt>
                  <dd className="mt-1">
                    <Badge
                      variant={
                        equipment.status === 'active'
                          ? 'success'
                          : equipment.status === 'maintenance'
                          ? 'warning'
                          : equipment.status === 'out_of_service'
                          ? 'error'
                          : 'default'
                      }
                    >
                      {EQUIPMENT_STATUS_LABELS[equipment.status]}
                    </Badge>
                  </dd>
                </div>
                {equipment.manufacturer && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Fabricante</dt>
                    <dd className="mt-1 text-sm text-gray-900">{equipment.manufacturer}</dd>
                  </div>
                )}
                {equipment.model && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Modelo</dt>
                    <dd className="mt-1 text-sm text-gray-900">{equipment.model}</dd>
                  </div>
                )}
                {equipment.serial_number && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Número de Serie</dt>
                    <dd className="mt-1 text-sm font-mono text-gray-900">{equipment.serial_number}</dd>
                  </div>
                )}
                {equipment.acquisition_date && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Fecha de Adquisición</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(equipment.acquisition_date).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </dd>
                  </div>
                )}
                {equipment.warranty_expiry_date && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Vencimiento de Garantía</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(equipment.warranty_expiry_date).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </dd>
                  </div>
                )}
                {equipment.description && (
                  <div className="md:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Descripción</dt>
                    <dd className="mt-1 text-sm text-gray-900">{equipment.description}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Technical Specifications */}
            <EquipmentSpecificationsEditor
              equipmentId={equipment.id}
              specifications={equipment.specifications || {}}
            />

            {/* Audit Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Información de Auditoría</h3>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Fecha de Creación</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(equipment.created_at).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Última Actualización</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(equipment.updated_at).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {activeTab === 'gallery' && (
          <EquipmentGalleryTab equipmentId={id!} equipment={equipment} />
        )}

        {activeTab === 'documents' && (
          <EquipmentDocumentsTab equipmentId={id!} equipment={equipment} />
        )}

        {activeTab === 'assignments' && (
          <EquipmentAssignmentsTab equipmentId={id!} equipment={equipment} />
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <EquipmentModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          equipment={equipment}
          organizationId={equipment.organization_id}
          plantId={equipment.plant_id}
        />
      )}
    </div>
  );
};

export default EquipmentDetailPage;

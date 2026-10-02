import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Link2, Plus } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import AreaSelector from '../../components/areas/AreaSelector';
import {
  getAreaTree,
  createArea,
  type CreateAreaRequest,
  type AreaTreeNode,
} from '../../api/areas';
import {
  createRepresentation,
  leafletToGeoJSON,
  type CreatePhysicalRepresentationRequest,
} from '../../api/areaRepresentations';
import { getEmployees } from '../../api/employees';

interface LinkAreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  plantId: string;
  layoutId: string | null;
  floorLevel: number;
  coordinates: number[][]; // Leaflet format [lat, lng]
}

type TabType = 'link' | 'create';

const AREA_TYPES = [
  { value: 'general', label: 'General' },
  { value: 'production', label: 'Producción' },
  { value: 'warehouse', label: 'Almacén' },
  { value: 'office', label: 'Oficina' },
  { value: 'quality', label: 'Control de Calidad' },
  { value: 'maintenance', label: 'Mantenimiento' },
];

const PREDEFINED_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
];

const LinkAreaModal = ({
  isOpen,
  onClose,
  organizationId,
  plantId,
  layoutId,
  floorLevel,
  coordinates,
}: LinkAreaModalProps) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('link');
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);

  // Form data for creating new area
  const [newAreaData, setNewAreaData] = useState<CreateAreaRequest>({
    organization_id: organizationId,
    plant_id: plantId,
    parent_area_id: null,
    name: '',
    code: '',
    description: '',
    area_type: 'general',
    color: PREDEFINED_COLORS[0],
    capacity: undefined,
    square_meters: undefined,
    cost_center: '',
    supervisor_id: '',
  });

  // Fetch area tree for linking
  const { data: areasTree, isLoading: isLoadingAreas } = useQuery({
    queryKey: ['areas-tree', organizationId, plantId],
    queryFn: () =>
      getAreaTree({
        organization_id: organizationId,
        plant_id: plantId || undefined,
      }),
    enabled: isOpen && !!organizationId,
  });

  // Fetch employees for supervisor selection
  const { data: employeesData } = useQuery({
    queryKey: ['employees', organizationId, plantId],
    queryFn: () =>
      getEmployees({
        organization_id: organizationId,
        plant_id: plantId || undefined,
        limit: 200,
      }),
    enabled: isOpen && activeTab === 'create' && !!organizationId,
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setActiveTab('link');
      setSelectedAreaId(null);
      setNewAreaData({
        organization_id: organizationId,
        plant_id: plantId,
        parent_area_id: null,
        name: '',
        code: '',
        description: '',
        area_type: 'general',
        color: PREDEFINED_COLORS[0],
        capacity: undefined,
        square_meters: undefined,
        cost_center: '',
        supervisor_id: '',
      });
    }
  }, [isOpen, organizationId, plantId]);

  // Mutation for linking existing area
  const linkAreaMutation = useMutation({
    mutationFn: (payload: Omit<CreatePhysicalRepresentationRequest, 'organizational_area_id'>) =>
      createRepresentation(selectedAreaId!, payload),
    onSuccess: () => {
      toast.success('Área vinculada exitosamente al layout');
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      queryClient.invalidateQueries({ queryKey: ['layout-areas'] });
      queryClient.invalidateQueries({ queryKey: ['area-representations'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al vincular área');
    },
  });

  // Mutation for creating new area + representation
  const createAreaMutation = useMutation({
    mutationFn: async (data: {
      areaData: CreateAreaRequest;
      representationData: Omit<CreatePhysicalRepresentationRequest, 'organizational_area_id'>;
    }) => {
      // First create the organizational area
      const newArea = await createArea(data.areaData);

      // Then create the physical representation
      await createRepresentation(newArea.id, data.representationData);

      return newArea;
    },
    onSuccess: () => {
      toast.success('Área creada y vinculada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      queryClient.invalidateQueries({ queryKey: ['areas-tree'] });
      queryClient.invalidateQueries({ queryKey: ['layout-areas'] });
      queryClient.invalidateQueries({ queryKey: ['area-representations'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear área');
    },
  });

  const handleLinkArea = () => {
    if (!selectedAreaId) {
      toast.error('Selecciona un área para vincular');
      return;
    }

    const geometry = leafletToGeoJSON(coordinates);

    linkAreaMutation.mutate({
      layout_id: layoutId,
      geometry,
      floor_level: floorLevel,
    });
  };

  const handleCreateArea = () => {
    if (!newAreaData.name.trim()) {
      toast.error('El nombre del área es requerido');
      return;
    }

    const geometry = leafletToGeoJSON(coordinates);

    // Prepare area payload
    const areaPayload = {
      ...newAreaData,
      capacity: newAreaData.capacity ? Number(newAreaData.capacity) : undefined,
      square_meters: newAreaData.square_meters ? Number(newAreaData.square_meters) : undefined,
      code: newAreaData.code || undefined,
      description: newAreaData.description || undefined,
      cost_center: newAreaData.cost_center || undefined,
      supervisor_id: newAreaData.supervisor_id || undefined,
    };

    createAreaMutation.mutate({
      areaData: areaPayload,
      representationData: {
        layout_id: layoutId,
        geometry,
        floor_level: floorLevel,
      },
    });
  };

  const handleAreaChange = (field: keyof CreateAreaRequest, value: any) => {
    setNewAreaData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Vincular Geometría a Área"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          {activeTab === 'link' ? (
            <Button
              onClick={handleLinkArea}
              disabled={!selectedAreaId || linkAreaMutation.isPending}
              className="gap-2"
            >
              <Link2 className="h-4 w-4" />
              Vincular Área
            </Button>
          ) : (
            <Button
              onClick={handleCreateArea}
              disabled={createAreaMutation.isPending}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Crear y Vincular
            </Button>
          )}
        </>
      }
    >
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('link')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'link'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Vincular a Área Existente
            </div>
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'create'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Crear Nueva Área
            </div>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'link' ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Selecciona un área organizacional existente para vincular esta geometría.
          </p>

          {isLoadingAreas ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : areasTree && areasTree.length > 0 ? (
            <AreaSelector
              label="Área Organizacional"
              areas={areasTree}
              selectedAreaId={selectedAreaId}
              onSelect={(area) => setSelectedAreaId(area?.id || null)}
              placeholder="Seleccionar área..."
              required
            />
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>No hay áreas organizacionales disponibles.</strong>
              </p>
              <p className="text-xs text-yellow-700 mt-2">
                Ve a la página de Áreas y crea al menos un área organizacional para esta planta, o usa la pestaña "Crear Nueva Área".
              </p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>Nota:</strong> Una misma área organizacional puede tener múltiples representaciones físicas en diferentes layouts o pisos.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Crea una nueva área organizacional y vincúlala automáticamente a esta geometría.
          </p>

          {/* Name */}
          <Input
            label="Nombre del Área"
            value={newAreaData.name}
            onChange={(e) => handleAreaChange('name', e.target.value)}
            required
            placeholder="Ej: Producción, Almacén, Oficinas"
          />

          {/* Code */}
          <Input
            label="Código"
            value={newAreaData.code}
            onChange={(e) => handleAreaChange('code', e.target.value)}
            placeholder="Ej: PROD-01, ALM-02"
          />

          {/* Parent Area */}
          {areasTree && areasTree.length > 0 && (
            <AreaSelector
              label="Área Padre (opcional)"
              areas={areasTree}
              selectedAreaId={newAreaData.parent_area_id}
              onSelect={(selectedArea) =>
                handleAreaChange('parent_area_id', selectedArea?.id || null)
              }
              placeholder="Ninguna (será un área raíz)"
              allowClear={true}
            />
          )}

          {/* Area Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Área <span className="text-red-500">*</span>
            </label>
            <select
              value={newAreaData.area_type}
              onChange={(e) => handleAreaChange('area_type', e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            >
              {AREA_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color Identificador
            </label>
            <div className="flex gap-2">
              {PREDEFINED_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleAreaChange('color', color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    newAreaData.color === color
                      ? 'border-gray-900 scale-110'
                      : 'border-gray-300 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
              <input
                type="color"
                value={newAreaData.color}
                onChange={(e) => handleAreaChange('color', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={newAreaData.description}
              onChange={(e) => handleAreaChange('description', e.target.value)}
              rows={2}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Descripción del área"
            />
          </div>

          {/* Capacity & Square Meters */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Capacidad (personas)"
              type="number"
              value={newAreaData.capacity || ''}
              onChange={(e) =>
                handleAreaChange('capacity', e.target.value ? Number(e.target.value) : undefined)
              }
              placeholder="0"
              min="0"
            />
            <Input
              label="Metros Cuadrados"
              type="number"
              step="0.01"
              value={newAreaData.square_meters || ''}
              onChange={(e) =>
                handleAreaChange('square_meters', e.target.value ? Number(e.target.value) : undefined)
              }
              placeholder="0.00"
              min="0"
            />
          </div>
        </div>
      )}
    </Modal>
  );
};

export default LinkAreaModal;

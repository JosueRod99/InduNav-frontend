import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Wrench, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EquipmentModal from './EquipmentModal';
import {
  getEquipment,
  deleteEquipment,
  type Equipment,
  type EquipmentType,
  type EquipmentStatus,
  EQUIPMENT_TYPE_LABELS,
  EQUIPMENT_STATUS_LABELS,
} from '../../api/equipment';
import { getOrganizations } from '../../api/organizations';
import { getPlants } from '../../api/plants';

const EquipmentPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [selectedPlant, setSelectedPlant] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<EquipmentType | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<EquipmentStatus | ''>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);

  // Fetch organizations
  const { data: organizationsData } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => getOrganizations({ limit: 100 }),
  });

  // Fetch plants for selected organization
  const { data: plantsData } = useQuery({
    queryKey: ['plants', selectedOrg],
    queryFn: () => getPlants({ organization_id: selectedOrg || undefined, limit: 100 }),
    enabled: !!selectedOrg,
  });

  // Fetch equipment
  const { data: equipment = [], isLoading } = useQuery({
    queryKey: ['equipment', selectedOrg, selectedPlant, searchQuery, selectedType, selectedStatus],
    queryFn: () =>
      getEquipment({
        organization_id: selectedOrg || undefined,
        plant_id: selectedPlant || undefined,
        search: searchQuery || undefined,
        equipment_type: selectedType || undefined,
        status: selectedStatus || undefined,
      }),
    enabled: !!selectedOrg,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteEquipment,
    onSuccess: () => {
      toast.success('Equipo eliminado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar equipo');
    },
  });

  const handleEdit = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setIsModalOpen(true);
  };

  const handleDelete = (equipment: Equipment) => {
    if (window.confirm(`¿Estás seguro de eliminar "${equipment.name}"?`)) {
      deleteMutation.mutate(equipment.id);
    }
  };

  const handleCreateNew = () => {
    setEditingEquipment(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEquipment(null);
  };

  const handleViewDetails = (equipmentId: string) => {
    navigate(`/equipment/${equipmentId}`);
  };

  const organizations = organizationsData?.organizations || [];
  const plants = plantsData?.plants || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Herramientas y Maquinaria</h2>
          <p className="mt-1 text-sm text-gray-600">
            Gestión de equipos, herramientas y maquinaria de la planta
          </p>
        </div>

        {selectedOrg && (
          <Button onClick={handleCreateNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Equipo
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Organization Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organización
            </label>
            <select
              value={selectedOrg}
              onChange={(e) => {
                setSelectedOrg(e.target.value);
                setSelectedPlant('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Seleccionar organización</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          {/* Plant Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Planta
            </label>
            <select
              value={selectedPlant}
              onChange={(e) => setSelectedPlant(e.target.value)}
              disabled={!selectedOrg}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">Todas las plantas</option>
              {plants.map((plant) => (
                <option key={plant.id} value={plant.id}>
                  {plant.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as EquipmentType | '')}
              disabled={!selectedOrg}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">Todos los tipos</option>
              {Object.entries(EQUIPMENT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as EquipmentStatus | '')}
              disabled={!selectedOrg}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">Todos los estados</option>
              {Object.entries(EQUIPMENT_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Nombre, código, modelo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={!selectedOrg}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {!selectedOrg ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Selecciona una organización
          </h3>
          <p className="text-gray-600">
            Selecciona una organización para ver su inventario de equipos
          </p>
        </div>
      ) : isLoading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <div className="text-gray-600">Cargando equipos...</div>
        </div>
      ) : equipment.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay equipos registrados
          </h3>
          <p className="text-gray-600 mb-4">
            Comienza agregando tu primer equipo
          </p>
          <Button onClick={handleCreateNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Agregar Primer Equipo
          </Button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Modelo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {equipment.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleViewDetails(item.id)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {item.primary_image_url ? (
                        <img
                          src={item.primary_image_url}
                          alt={item.name}
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center">
                          <Wrench className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        {item.manufacturer && (
                          <div className="text-xs text-gray-500">{item.manufacturer}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-mono text-gray-900">{item.code}</div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="default">
                      {EQUIPMENT_TYPE_LABELS[item.equipment_type]}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {item.model || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant={
                        item.status === 'active'
                          ? 'success'
                          : item.status === 'maintenance'
                          ? 'warning'
                          : item.status === 'out_of_service'
                          ? 'error'
                          : 'default'
                      }
                    >
                      {EQUIPMENT_STATUS_LABELS[item.status]}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <EquipmentModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          equipment={editingEquipment}
          organizationId={selectedOrg}
          plantId={selectedPlant}
        />
      )}
    </div>
  );
};

export default EquipmentPage;

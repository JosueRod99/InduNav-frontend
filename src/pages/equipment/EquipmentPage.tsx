import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Wrench, Search } from 'lucide-react';
import toast from 'react-hot-toast';
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
import type { PlantScopedProps } from '../plants/plantScope';
import { useNavigateWithBack } from '../../hooks/useBackNavigation';
import SectionHeader from '../../components/ui/SectionHeader';

// Equipment of the plant: summary by status (each one filters), one row of filters, and a table
// with the area each item is in (cards on phones). The list is filtered in the browser.

const STATUS_BADGE: Record<EquipmentStatus, 'success' | 'warning' | 'error' | 'default'> = {
  active: 'success',
  maintenance: 'warning',
  out_of_service: 'error',
  retired: 'default',
};

const NO_AREA = '__none__';

const AreaChips = ({ item }: { item: Equipment }) =>
  item.areas?.length ? (
    <span className="flex flex-wrap gap-1">
      {item.areas.map((a) => (
        <span key={a.id} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: a.color || '#94A3B8' }} />
          {a.name}
        </span>
      ))}
    </span>
  ) : (
    <span className="text-xs text-amber-700">Sin área</span>
  );

const EquipmentPage = ({ plantId, organizationId }: PlantScopedProps = {}) => {
  const embedded = !!plantId; // inside the plant workspace: fixed plant, no org/plant selectors

  const navigate = useNavigateWithBack(); // detail pages opened from here return here
  const queryClient = useQueryClient();

  const [selectedOrg, setSelectedOrg] = useState<string>(organizationId ?? '');
  const [selectedPlant, setSelectedPlant] = useState<string>(plantId ?? '');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<EquipmentType | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<EquipmentStatus | ''>('');
  const [selectedArea, setSelectedArea] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);

  const { data: organizationsData } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => getOrganizations({ limit: 100 }),
    enabled: !embedded,
  });

  const { data: plantsData } = useQuery({
    queryKey: ['plants', selectedOrg],
    queryFn: () => getPlants({ organization_id: selectedOrg || undefined, limit: 100 }),
    enabled: !!selectedOrg && !embedded,
  });

  // Every item of the plant (or organization): the summary counts all of them, filters run here
  const { data: equipment = [], isLoading } = useQuery({
    queryKey: ['equipment', selectedOrg, selectedPlant],
    queryFn: () => getEquipment({ organization_id: selectedOrg || undefined, plant_id: selectedPlant || undefined }),
    enabled: !!selectedOrg,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEquipment,
    onSuccess: () => {
      toast.success('Equipo eliminado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Error al eliminar equipo'),
  });

  const counts = useMemo(() => {
    const by = (status: EquipmentStatus) => equipment.filter((e) => e.status === status).length;
    return { total: equipment.length, active: by('active'), maintenance: by('maintenance'), out_of_service: by('out_of_service') };
  }, [equipment]);

  // Areas that have equipment (for the filter)
  const areas = useMemo(() => {
    const map = new Map<string, string>();
    equipment.forEach((e) => e.areas?.forEach((a) => map.set(a.id, a.name)));
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], 'es'));
  }, [equipment]);

  const visible = equipment.filter((e) => {
    if (selectedType && e.equipment_type !== selectedType) return false;
    if (selectedStatus && e.status !== selectedStatus) return false;
    if (selectedArea === NO_AREA && e.areas?.length) return false;
    if (selectedArea && selectedArea !== NO_AREA && !e.areas?.some((a) => a.id === selectedArea)) return false;
    if (searchQuery) {
      const text = `${e.name} ${e.code} ${e.manufacturer || ''} ${e.model || ''} ${e.description || ''}`.toLowerCase();
      if (!text.includes(searchQuery.toLowerCase())) return false;
    }
    return true;
  });

  const handleEdit = (item: Equipment) => {
    setEditingEquipment(item);
    setIsModalOpen(true);
  };

  const handleDelete = (item: Equipment) => {
    if (window.confirm(`¿Estás seguro de eliminar "${item.name}"?`)) deleteMutation.mutate(item.id);
  };

  const handleCreateNew = () => {
    setEditingEquipment(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEquipment(null);
  };

  const openDetails = (id: string) => navigate(`/equipment/${id}`);
  const filtersActive = !!(searchQuery || selectedType || selectedStatus || selectedArea);
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedType('');
    setSelectedStatus('');
    setSelectedArea('');
  };

  const organizations = organizationsData?.organizations || [];
  const plants = plantsData?.plants || [];
  const summary: { status: EquipmentStatus | ''; label: string; value: number; tone: string }[] = [
    { status: '', label: 'Equipos', value: counts.total, tone: 'text-gray-900' },
    { status: 'active', label: 'Activos', value: counts.active, tone: 'text-green-700' },
    { status: 'maintenance', label: 'En mantenimiento', value: counts.maintenance, tone: 'text-amber-700' },
    { status: 'out_of_service', label: 'Fuera de servicio', value: counts.out_of_service, tone: 'text-red-700' },
  ];

  return (
    <div className="space-y-4">
      <SectionHeader
        title={embedded ? 'Equipos' : 'Herramientas y Maquinaria'}
        description="Herramientas y maquinaria de la planta, con su estado y el área donde están."
        actions={
          selectedOrg && (
            <Button onClick={handleCreateNew} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Equipo
            </Button>
          )
        }
      />

      {/* Organization and plant (only outside the plant workspace) */}
      {!embedded && (
        <div className="flex flex-wrap gap-2">
          <select
            aria-label="Organización"
            value={selectedOrg}
            onChange={(e) => {
              setSelectedOrg(e.target.value);
              setSelectedPlant('');
            }}
            className="w-full sm:w-64"
          >
            <option value="">Seleccionar organización</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
          <select aria-label="Planta" value={selectedPlant} onChange={(e) => setSelectedPlant(e.target.value)} disabled={!selectedOrg} className="w-full sm:w-64">
            <option value="">Todas las plantas</option>
            {plants.map((plant) => (
              <option key={plant.id} value={plant.id}>
                {plant.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedOrg && (
        <>
          {/* Summary: each card filters by its status */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {summary.map(({ status, label, value, tone }) => (
              <button
                key={label}
                onClick={() => setSelectedStatus(status)}
                aria-pressed={selectedStatus === status}
                className={`rounded-lg border bg-white p-3 text-left transition-colors ${
                  selectedStatus === status ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <span className={`block text-2xl font-bold ${tone}`}>{value}</span>
                <span className="text-xs text-gray-600">{label}</span>
              </button>
            ))}
          </div>

          {/* Filters in one row */}
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative min-w-[14rem] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Buscar por nombre, código, fabricante o modelo"
                aria-label="Buscar equipos"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <select aria-label="Tipo" value={selectedType} onChange={(e) => setSelectedType(e.target.value as EquipmentType | '')} className="text-sm">
              <option value="">Tipo: todos</option>
              {Object.entries(EQUIPMENT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select aria-label="Área" value={selectedArea} onChange={(e) => setSelectedArea(e.target.value)} className="text-sm">
              <option value="">Área: todas</option>
              {areas.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
              <option value={NO_AREA}>Sin área</option>
            </select>
            <select aria-label="Estado" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value as EquipmentStatus | '')} className="text-sm">
              <option value="">Estado: todos</option>
              {Object.entries(EQUIPMENT_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {/* Content */}
      {!selectedOrg ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <Wrench className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">Selecciona una organización</h3>
          <p className="text-gray-600">Selecciona una organización para ver su inventario de equipos</p>
        </div>
      ) : isLoading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center text-gray-600">Cargando equipos...</div>
      ) : equipment.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <Wrench className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">No hay equipos registrados</h3>
          <p className="mb-4 text-gray-600">Comienza agregando tu primer equipo</p>
          <Button onClick={handleCreateNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Agregar Primer Equipo
          </Button>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-sm text-gray-600">
          Ningún equipo coincide con los filtros.{' '}
          {filtersActive && (
            <button onClick={clearFilters} className="font-medium text-blue-700 hover:underline">
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Table (tablets and up) */}
          <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white md:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Equipo', 'Código', 'Tipo', 'Área', 'Estado'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      {h}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {visible.map((item) => (
                  <tr key={item.id} className="cursor-pointer transition-colors hover:bg-gray-50" onClick={() => openDetails(item.id)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {item.primary_image_url ? (
                          <img src={item.primary_image_url} alt="" className="h-10 w-10 flex-shrink-0 rounded object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded bg-gray-200">
                            <Wrench className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          {(item.manufacturer || item.model) && (
                            <div className="text-xs text-gray-500">{[item.manufacturer, item.model].filter(Boolean).join(' · ')}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-gray-900">{item.code}</td>
                    <td className="px-4 py-3">
                      <Badge variant="default">{EQUIPMENT_TYPE_LABELS[item.equipment_type]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <AreaChips item={item} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_BADGE[item.status]}>{EQUIPMENT_STATUS_LABELS[item.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => handleEdit(item)} className="rounded p-1.5 text-blue-600 hover:bg-blue-50" title="Editar" aria-label={`Editar ${item.name}`}>
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(item)} className="rounded p-1.5 text-red-600 hover:bg-red-50" title="Eliminar" aria-label={`Eliminar ${item.name}`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards (phones) */}
          <ul className="space-y-2 md:hidden">
            {visible.map((item) => (
              <li key={item.id} className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="flex items-start gap-3">
                  <button onClick={() => openDetails(item.id)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
                    {item.primary_image_url ? (
                      <img src={item.primary_image_url} alt="" className="h-12 w-12 flex-shrink-0 rounded object-cover" />
                    ) : (
                      <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded bg-gray-200">
                        <Wrench className="h-5 w-5 text-gray-400" />
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block font-medium text-gray-900">{item.name}</span>
                      <span className="block font-mono text-xs text-gray-500">
                        {item.code} · {EQUIPMENT_TYPE_LABELS[item.equipment_type]}
                      </span>
                    </span>
                  </button>
                  <Badge variant={STATUS_BADGE[item.status]}>{EQUIPMENT_STATUS_LABELS[item.status]}</Badge>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <AreaChips item={item} />
                  <span className="flex flex-shrink-0 gap-1">
                    <button onClick={() => handleEdit(item)} className="rounded p-1.5 text-blue-600 hover:bg-blue-50" aria-label={`Editar ${item.name}`}>
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(item)} className="rounded p-1.5 text-red-600 hover:bg-red-50" aria-label={`Eliminar ${item.name}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {isModalOpen && (
        <EquipmentModal isOpen={isModalOpen} onClose={handleCloseModal} equipment={editingEquipment} organizationId={selectedOrg} plantId={selectedPlant} />
      )}
    </div>
  );
};

export default EquipmentPage;

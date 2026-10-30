import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import AreaModal from './AreaModal';
import PlantAreaTree from './PlantAreaTree';
import AreaOverviewPanel from './AreaOverviewPanel';
import { getArea, deleteArea, getPlantAreasOverview, moveArea, type AreaOverview, type OrganizationalArea } from '../../api/areas';
import { getOrganizations } from '../../api/organizations';
import { getPlants } from '../../api/plants';
import type { PlantScopedProps } from '../plants/plantScope';
import { useBackState } from '../../hooks/useBackNavigation';
import SectionHeader from '../../components/ui/SectionHeader';

// "Áreas" tab of the plant: tree with real figures and pending flags, and the selected area's panel
// (beside the tree on wide screens, a bottom sheet on phones).

const AreasPage = ({ plantId, organizationId }: PlantScopedProps = {}) => {
  const embedded = !!plantId; // inside the plant workspace: fixed plant, no org/plant selectors

  const backState = useBackState(); // area pages opened from here return here
  const [selectedOrg, setSelectedOrg] = useState<string>(organizationId ?? '');
  const [selectedPlant, setSelectedPlant] = useState<string>(plantId ?? '');
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<OrganizationalArea | null>(null);
  const [parentForNewArea, setParentForNewArea] = useState<string | null>(null);
  const queryClient = useQueryClient();

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

  const { data: areas = [], isLoading } = useQuery({
    queryKey: ['plant-areas-overview', selectedPlant],
    queryFn: () => getPlantAreasOverview(selectedPlant),
    enabled: !!selectedPlant,
  });

  const selectedArea = areas.find((a) => a.id === selectedAreaId) || null;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['plant-areas-overview'] });
    queryClient.invalidateQueries({ queryKey: ['areas-tree'] });
    queryClient.invalidateQueries({ queryKey: ['areas'] });
    queryClient.invalidateQueries({ queryKey: ['plant-summary'] });
  };

  const deleteMutation = useMutation({
    mutationFn: deleteArea,
    onSuccess: () => {
      toast.success('Área eliminada');
      refresh();
      setSelectedAreaId(null);
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Error al eliminar el área'),
  });

  // Move inside another area (or to the root), with "Deshacer" in the notice
  const moveMutation = useMutation({
    mutationFn: ({ area, parentId }: { area: AreaOverview; parentId: string | null; undo?: boolean }) => moveArea(area.id, { parent_area_id: parentId }),
    onSuccess: (_, { area, parentId, undo }) => {
      refresh();
      if (undo) return void toast.success(`Se regresó ${area.name} a su lugar`);
      const previous = area.parent_area_id;
      const target = parentId ? areas.find((a) => a.id === parentId)?.name : null;
      toast.success(
        (t) => (
          <span className="flex items-center gap-3">
            <span>{target ? `${area.name} ahora está dentro de ${target}` : `${area.name} ahora es un área raíz`}</span>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                moveMutation.mutate({ area: { ...area, parent_area_id: parentId }, parentId: previous, undo: true });
              }}
              className="font-semibold text-blue-700 hover:underline"
            >
              Deshacer
            </button>
          </span>
        ),
        { duration: 6000 }
      );
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'No se pudo mover el área'),
  });
  const move = (area: AreaOverview, parentId: string | null) => {
    if (area.parent_area_id !== parentId) moveMutation.mutate({ area, parentId });
  };

  const handleEdit = async () => {
    if (!selectedArea) return;
    try {
      const full = await queryClient.fetchQuery({ queryKey: ['area', selectedArea.id], queryFn: () => getArea(selectedArea.id, true) });
      setEditingArea(full);
      setParentForNewArea(null);
      setIsModalOpen(true);
    } catch {
      toast.error('No se pudo abrir el área');
    }
  };

  const handleDelete = () => {
    if (!selectedArea) return;
    const warning = selectedArea.children ? ` Tiene ${selectedArea.children} subárea${selectedArea.children === 1 ? '' : 's'}.` : '';
    if (window.confirm(`¿Eliminar el área "${selectedArea.name}"?${warning}`)) deleteMutation.mutate(selectedArea.id);
  };

  const openCreate = (parentId: string | null) => {
    setEditingArea(null);
    setParentForNewArea(parentId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingArea(null);
    setParentForNewArea(null);
    refresh();
  };

  const select = (area: AreaOverview) => setSelectedAreaId(area.id);

  return (
    <div className="space-y-6">
      <SectionHeader
        title={embedded ? 'Áreas' : 'Áreas Organizacionales'}
        description={
          embedded
            ? `${areas.length} área${areas.length === 1 ? '' : 's'} de la planta con sus subáreas y lo que necesita atención.`
            : 'Gestiona la estructura de áreas de tu organización'
        }
        actions={
          selectedOrg &&
          selectedPlant && (
            <Button onClick={() => openCreate(null)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Área Raíz
            </Button>
          )
        }
      />

      {/* Organization and plant (only outside the plant workspace) */}
      {!embedded && (
        <div className="grid grid-cols-1 gap-4 rounded-lg bg-white p-4 shadow md:grid-cols-2">
          <select
            aria-label="Organización"
            value={selectedOrg}
            onChange={(e) => {
              setSelectedOrg(e.target.value);
              setSelectedPlant('');
              setSelectedAreaId(null);
            }}
          >
            <option value="">Seleccionar organización</option>
            {organizationsData?.organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
          {selectedOrg && (
            <select
              aria-label="Planta"
              value={selectedPlant}
              onChange={(e) => {
                setSelectedPlant(e.target.value);
                setSelectedAreaId(null);
              }}
            >
              <option value="">Seleccionar planta</option>
              {plantsData?.plants.map((plant) => (
                <option key={plant.id} value={plant.id}>
                  {plant.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {selectedPlant && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Tree */}
          <div className="rounded-lg bg-white shadow lg:col-span-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
              </div>
            ) : areas.length === 0 ? (
              <div className="py-12 text-center">
                <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay áreas</h3>
                <p className="mt-1 text-sm text-gray-500">Crea la primera área para comenzar</p>
                <Button onClick={() => openCreate(null)} className="mt-6 gap-2">
                  <Plus className="h-4 w-4" /> Nueva Área
                </Button>
              </div>
            ) : (
              <PlantAreaTree areas={areas} selectedId={selectedAreaId} onSelect={select} onMove={move} />
            )}
          </div>

          {/* Selected area: beside the tree (sticky) on wide screens, a bottom sheet on phones */}
          {selectedArea ? (
            <>
              <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setSelectedAreaId(null)} aria-hidden />
              <aside
                aria-label={`Detalle de ${selectedArea.name}`}
                className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl lg:sticky lg:top-4 lg:z-auto lg:max-h-[calc(100vh-2rem)] lg:self-start lg:rounded-lg lg:shadow"
              >
                <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-300 lg:hidden" aria-hidden />
                <AreaOverviewPanel
                  area={selectedArea}
                  areas={areas}
                  plantId={selectedPlant}
                  backState={backState}
                  onSelect={select}
                  onEdit={handleEdit}
                  onAddChild={() => openCreate(selectedArea.id)}
                  onDelete={handleDelete}
                  onClose={() => setSelectedAreaId(null)}
                  onMove={(parentId) => move(selectedArea, parentId)}
                />
              </aside>
            </>
          ) : (
            <div className="hidden rounded-lg bg-white p-8 text-center text-gray-500 shadow lg:block lg:self-start">
              <Building2 className="mx-auto mb-2 h-12 w-12 text-gray-300" />
              <p className="text-sm">Selecciona un área para ver sus datos y acciones</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <AreaModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          area={editingArea}
          organizationId={selectedOrg || editingArea?.organization_id || ''}
          plantId={selectedPlant || ''}
          parentAreaId={parentForNewArea}
        />
      )}
    </div>
  );
};

export default AreasPage;

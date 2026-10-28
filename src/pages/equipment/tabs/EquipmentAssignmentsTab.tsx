import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Plus, Calendar, ArrowRight, History, Trash2, StopCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Select from '../../../components/ui/Select';
import AreaSelector from '../../../components/areas/AreaSelector';
import { getAreaTree } from '../../../api/areas';
import {
  getEquipmentAreaAssignments,
  createAreaAssignment,
  endAreaAssignment,
  deleteAreaAssignment,
  ASSIGNMENT_TYPE_LABELS,
  type AssignmentType,
  type Equipment,
  type EquipmentAreaAssignment,
} from '../../../api/equipment';
import { useNavigateWithBack } from '../../../hooks/useBackNavigation';

interface EquipmentAssignmentsTabProps {
  equipmentId: string;
  equipment: Equipment;
}

const formatDate = (date: Date | string) =>
  new Date(date).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC', // Las fechas vienen como DATE (sin hora)
  });

const today = () => new Date().toISOString().split('T')[0];

const EquipmentAssignmentsTab = ({ equipmentId, equipment }: EquipmentAssignmentsTabProps) => {
  const queryClient = useQueryClient();
  const navigate = useNavigateWithBack(); // detail pages opened from here return here
  const [showForm, setShowForm] = useState(false);
  const [areaId, setAreaId] = useState<string | null>(null);
  const [assignmentType, setAssignmentType] = useState<AssignmentType>('permanent');
  const [startDate, setStartDate] = useState(today());
  const [notes, setNotes] = useState('');

  const { data: areasTree } = useQuery({
    queryKey: ['areas-tree', equipment.organization_id, equipment.plant_id],
    queryFn: () =>
      getAreaTree({
        organization_id: equipment.organization_id,
        plant_id: equipment.plant_id || undefined,
      }),
    enabled: !!equipment.organization_id,
  });

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['equipment-assignments', equipmentId],
    queryFn: () => getEquipmentAreaAssignments(equipmentId, true),
  });

  const current = assignments.find((a) => !a.end_date);
  const history = assignments.filter((a) => a !== current);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['equipment-assignments', equipmentId] });
    queryClient.invalidateQueries({ queryKey: ['area-equipment'] });
    // Moving/removing equipment deletes its footprint from the previous area layout
    queryClient.invalidateQueries({ queryKey: ['layout-footprints'] });
  };

  const resetForm = () => {
    setShowForm(false);
    setAreaId(null);
    setAssignmentType('permanent');
    setStartDate(today());
    setNotes('');
  };

  const createMutation = useMutation({
    mutationFn: () =>
      createAreaAssignment(equipmentId, {
        organizational_area_id: areaId!,
        assignment_type: assignmentType,
        start_date: startDate as unknown as Date,
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success(current ? 'Equipo reubicado exitosamente' : 'Equipo asignado exitosamente');
      invalidate();
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al asignar equipo');
    },
  });

  const endMutation = useMutation({
    mutationFn: (assignmentId: string) => endAreaAssignment(assignmentId, today() as unknown as Date),
    onSuccess: () => {
      toast.success('Asignación finalizada');
      invalidate();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al finalizar asignación');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAreaAssignment,
    onSuccess: () => {
      toast.success('Registro eliminado');
      invalidate();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar registro');
    },
  });

  const handleSubmit = () => {
    if (!areaId) {
      toast.error('Selecciona un área');
      return;
    }
    if (current?.organizational_area_id === areaId) {
      toast.error('El equipo ya está en esa área');
      return;
    }
    createMutation.mutate();
  };

  const handleEnd = (assignment: EquipmentAreaAssignment) => {
    if (window.confirm(`¿Retirar el equipo de "${assignment.area_name}"? Quedará sin área asignada.`)) {
      endMutation.mutate(assignment.id);
    }
  };

  const handleDelete = (assignment: EquipmentAreaAssignment) => {
    if (window.confirm('¿Eliminar este registro del historial? Esta acción no se puede deshacer.')) {
      deleteMutation.mutate(assignment.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Location */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Ubicación Actual</h3>
          {!showForm && (
            <Button onClick={() => setShowForm(true)} size="sm" className="gap-2">
              {current ? <ArrowRight className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {current ? 'Reubicar' : 'Asignar a Área'}
            </Button>
          )}
        </div>

        {current ? (
          <div className="flex items-start justify-between gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3 min-w-0">
              <MapPin className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <button
                  onClick={() => navigate(`/areas/${current.organizational_area_id}`)}
                  className="text-base font-semibold text-blue-900 hover:underline text-left"
                >
                  {current.area_name}
                </button>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {current.area_code && (
                    <span className="text-xs font-mono text-blue-700">{current.area_code}</span>
                  )}
                  <Badge variant={current.assignment_type === 'temporary' ? 'warning' : 'info'}>
                    {ASSIGNMENT_TYPE_LABELS[current.assignment_type]}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-xs text-blue-800 mt-2">
                  <Calendar className="h-3 w-3" />
                  <span>Desde {formatDate(current.start_date)}</span>
                </div>
                {current.notes && <p className="text-sm text-blue-900 mt-2">{current.notes}</p>}
              </div>
            </div>
            <button
              onClick={() => handleEnd(current)}
              disabled={endMutation.isPending}
              className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-red-600 flex-shrink-0"
              title="Retirar del área"
            >
              <StopCircle className="h-4 w-4" />
              Retirar
            </button>
          </div>
        ) : (
          !showForm && (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <MapPin className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Este equipo no está asignado a ninguna área</p>
            </div>
          )
        )}

        {/* Assign / Move Form */}
        {showForm && (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-4">
            {current && (
              <p className="text-sm text-gray-600">
                Al reubicar, la asignación en <strong>{current.area_name}</strong> se cerrará y quedará en
                el historial.
              </p>
            )}

            {areasTree && (
              <AreaSelector
                label="Área destino"
                areas={areasTree}
                selectedAreaId={areaId}
                onSelect={(area) => setAreaId(area?.id || null)}
                placeholder="Seleccionar área..."
                required
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Tipo"
                value={assignmentType}
                onChange={(e) => setAssignmentType(e.target.value as AssignmentType)}
                options={Object.entries(ASSIGNMENT_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Desde</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Notas</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Ej: Préstamo para mantenimiento de línea 2, regresa el 15 de noviembre"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={resetForm}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={!areaId || createMutation.isPending}>
                {createMutation.isPending ? 'Guardando...' : current ? 'Reubicar' : 'Asignar'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* History */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">Historial de Ubicaciones</h3>
        </div>

        {history.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Sin movimientos anteriores</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {history.map((assignment) => (
              <div key={assignment.id} className="flex items-start justify-between gap-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">{assignment.area_name}</p>
                    <Badge variant="default">{ASSIGNMENT_TYPE_LABELS[assignment.assignment_type]}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(assignment.start_date)} →{' '}
                    {assignment.end_date ? formatDate(assignment.end_date) : 'Actual'}
                  </p>
                  {assignment.notes && <p className="text-xs text-gray-600 mt-1">{assignment.notes}</p>}
                </div>
                <button
                  onClick={() => handleDelete(assignment)}
                  disabled={deleteMutation.isPending}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
                  title="Eliminar registro"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EquipmentAssignmentsTab;

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../../components/ui/Button';
import {
  createProcessStep,
  updateProcessStep,
  type ProductProcessStep,
  type CreateProcessStepRequest,
  type UpdateProcessStepRequest,
} from '../../../api/products';
import { getAreas } from '../../../api/areas';

interface ProcessStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  processStep?: ProductProcessStep | null;
  existingStepNumbers: number[];
}

const ProcessStepModal = ({
  isOpen,
  onClose,
  productId,
  processStep,
  existingStepNumbers,
}: ProcessStepModalProps) => {
  const queryClient = useQueryClient();

  // Form state
  const [stepNumber, setStepNumber] = useState(1);
  const [stepName, setStepName] = useState('');
  const [organizationalAreaId, setOrganizationalAreaId] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedDurationHours, setEstimatedDurationHours] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  // Fetch areas for dropdown
  const { data: areasData } = useQuery({
    queryKey: ['areas'],
    queryFn: () => getAreas({ limit: 1000 }),
    enabled: isOpen,
  });

  // Load process step data if editing
  useEffect(() => {
    if (processStep) {
      setStepNumber(processStep.step_number);
      setStepName(processStep.step_name);
      setOrganizationalAreaId(processStep.organizational_area_id);
      setDescription(processStep.description || '');
      setEstimatedDurationHours(processStep.estimated_duration_hours || '');
      setNotes(processStep.notes || '');
    } else {
      // Reset form for new step
      // Set step number to next available
      const maxStep = existingStepNumbers.length > 0 ? Math.max(...existingStepNumbers) : 0;
      setStepNumber(maxStep + 1);
      setStepName('');
      setOrganizationalAreaId('');
      setDescription('');
      setEstimatedDurationHours('');
      setNotes('');
    }
  }, [processStep, existingStepNumbers]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateProcessStepRequest) => createProcessStep(productId, data),
    onSuccess: () => {
      toast.success('Paso creado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['process-steps', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear paso');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProcessStepRequest }) =>
      updateProcessStep(id, data),
    onSuccess: () => {
      toast.success('Paso actualizado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['process-steps', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar paso');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!stepName || !organizationalAreaId) {
      toast.error('Nombre del paso y Área son requeridos');
      return;
    }

    // Validate step number uniqueness (except for current step when editing)
    const isDuplicateNumber = existingStepNumbers.some(
      (num) => num === stepNumber && (!processStep || num !== processStep.step_number)
    );

    if (isDuplicateNumber) {
      toast.error(`El número de paso ${stepNumber} ya existe`);
      return;
    }

    if (processStep) {
      // Update existing step
      const updateData: UpdateProcessStepRequest = {
        step_number: stepNumber,
        step_name: stepName,
        organizational_area_id: organizationalAreaId,
        description: description || undefined,
        estimated_duration_hours:
          estimatedDurationHours !== '' ? Number(estimatedDurationHours) : undefined,
        notes: notes || undefined,
      };

      updateMutation.mutate({ id: processStep.id, data: updateData });
    } else {
      // Create new step
      const createData: CreateProcessStepRequest = {
        organizational_area_id: organizationalAreaId,
        step_number: stepNumber,
        step_name: stepName,
        description: description || undefined,
        estimated_duration_hours:
          estimatedDurationHours !== '' ? Number(estimatedDurationHours) : undefined,
        notes: notes || undefined,
      };

      createMutation.mutate(createData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const areas = areasData?.areas || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 !mt-0">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-gray-900">
            {processStep ? 'Editar Paso de Proceso' : 'Nuevo Paso de Proceso'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Step Number and Name */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Paso <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={stepNumber}
                onChange={(e) => setStepNumber(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Paso <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={stepName}
                onChange={(e) => setStepName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Corte de Material, Ensamblaje, Control de Calidad"
                required
              />
            </div>
          </div>

          {/* Organizational Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Área Organizacional <span className="text-red-500">*</span>
            </label>
            <select
              value={organizationalAreaId}
              onChange={(e) => setOrganizationalAreaId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Seleccionar área</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.full_path_name || area.name}
                  {area.code && ` (${area.code})`}
                </option>
              ))}
            </select>
          </div>

          {/* Estimated Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duración Estimada (horas)
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={estimatedDurationHours}
              onChange={(e) =>
                setEstimatedDurationHours(e.target.value === '' ? '' : parseFloat(e.target.value))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: 2.5"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe brevemente qué se hace en este paso..."
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas Especiales
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Instrucciones especiales, precauciones, etc..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : processStep ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProcessStepModal;

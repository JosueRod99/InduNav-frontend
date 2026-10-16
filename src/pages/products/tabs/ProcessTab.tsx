import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, MapPin, Clock, ChevronDown, ChevronRight, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../../components/ui/Button';
import {
  getProcessSteps,
  deleteProcessStep,
  moveProcessStep,
  type ProductProcessStep,
} from '../../../api/products';
import ProcessStepModal from '../modals/ProcessStepModal';

interface ProcessTabProps {
  productId: string;
}

const ProcessTab = ({ productId }: ProcessTabProps) => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<ProductProcessStep | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  // Fetch process steps
  const { data: processSteps = [], isLoading } = useQuery({
    queryKey: ['process-steps', productId],
    queryFn: () => getProcessSteps(productId),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteProcessStep,
    onSuccess: () => {
      toast.success('Paso eliminado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['process-steps', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar paso');
    },
  });

  // Move mutation
  const moveMutation = useMutation({
    mutationFn: ({ stepId, direction }: { stepId: string; direction: 'up' | 'down' }) =>
      moveProcessStep(stepId, direction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['process-steps', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al mover paso');
    },
  });

  const handleEdit = (step: ProductProcessStep) => {
    setEditingStep(step);
    setIsModalOpen(true);
  };

  const handleDelete = (step: ProductProcessStep) => {
    if (window.confirm(`¿Estás seguro de eliminar el paso "${step.step_name}"?`)) {
      deleteMutation.mutate(step.id);
    }
  };

  const handleCreateNew = () => {
    setEditingStep(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStep(null);
  };

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  const handleMoveUp = (stepId: string) => {
    moveMutation.mutate({ stepId, direction: 'up' });
  };

  const handleMoveDown = (stepId: string) => {
    moveMutation.mutate({ stepId, direction: 'down' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Cargando pasos del proceso...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Flujo de Producción</h3>
          <p className="text-sm text-gray-600 mt-1">
            Secuencia de áreas por las que pasa el producto durante su fabricación
          </p>
        </div>
        <Button onClick={handleCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Agregar Paso
        </Button>
      </div>

      {/* Process Steps */}
      {processSteps.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay pasos de proceso
          </h3>
          <p className="text-gray-600 mb-4">
            Define el flujo de producción agregando pasos secuenciales
          </p>
          <Button onClick={handleCreateNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Agregar Primer Paso
          </Button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
          {processSteps.map((step) => {
            const isExpanded = expandedSteps.has(step.id);
            const hasDetails = step.description || step.notes;

            return (
              <div key={step.id}>
                <div className="p-3">
                  {/* Compact Header - Always Visible */}
                  <div className="flex items-center gap-3">
                    {/* Step Number */}
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
                      {step.step_number}
                    </div>

                    {/* Expand/Collapse Button */}
                    {hasDetails && (
                      <button
                        onClick={() => toggleStep(step.id)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title={isExpanded ? 'Colapsar' : 'Expandir'}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                    )}

                    {/* Step Name & Area */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h4 className="text-sm font-medium text-gray-900">
                          {step.step_name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span>
                            {step.area_name || 'Sin área'}
                            {step.area_code && (
                              <span className="text-gray-400 ml-1">({step.area_code})</span>
                            )}
                          </span>
                          {step.area_color && (
                            <div
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: step.area_color }}
                            />
                          )}
                        </div>
                        {/* Duration - Always visible */}
                        {step.estimated_duration_hours && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span>{step.estimated_duration_hours} hrs</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {/* Move Up */}
                      <button
                        onClick={() => handleMoveUp(step.id)}
                        disabled={step.step_number === 1 || moveMutation.isPending}
                        className="p-1.5 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Mover arriba"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      {/* Move Down */}
                      <button
                        onClick={() => handleMoveDown(step.id)}
                        disabled={step.step_number === processSteps.length || moveMutation.isPending}
                        className="p-1.5 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Mover abajo"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                      {/* Edit */}
                      <button
                        onClick={() => handleEdit(step)}
                        className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                        title="Editar"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(step)}
                        disabled={deleteMutation.isPending}
                        className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        title="Eliminar"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && hasDetails && (
                    <div className="mt-2 ml-11 space-y-1.5">
                      {/* Description */}
                      {step.description && (
                        <p className="text-xs text-gray-600">{step.description}</p>
                      )}

                      {/* Notes - Subtle secondary text */}
                      {step.notes && (
                        <p className="text-xs text-gray-500 italic">
                          {step.notes}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Process Step Modal */}
      {isModalOpen && (
        <ProcessStepModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          productId={productId}
          processStep={editingStep}
          existingStepNumbers={processSteps.map((s) => s.step_number)}
        />
      )}
    </div>
  );
};

export default ProcessTab;

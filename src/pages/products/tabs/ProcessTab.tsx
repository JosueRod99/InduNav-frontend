import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, MapPin, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../../components/ui/Button';
import {
  getProcessSteps,
  deleteProcessStep,
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Cargando pasos del proceso...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          {processSteps.map((step, index) => (
            <div key={step.id} className="p-6">
              <div className="flex items-start justify-between">
                {/* Step Info */}
                <div className="flex items-start gap-4 flex-1">
                  {/* Step Number */}
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                      {step.step_number}
                    </div>
                  </div>

                  {/* Step Details */}
                  <div className="flex-1">
                    <h4 className="text-base font-medium text-gray-900 mb-1">
                      {step.step_name}
                    </h4>

                    {/* Area */}
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {step.area_name || 'Área no especificada'}
                        {step.area_code && (
                          <span className="text-gray-400 ml-1">({step.area_code})</span>
                        )}
                      </span>
                      {step.area_color && (
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: step.area_color }}
                        />
                      )}
                    </div>

                    {/* Duration */}
                    {step.estimated_duration_hours && (
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {step.estimated_duration_hours} horas estimadas
                        </span>
                      </div>
                    )}

                    {/* Description */}
                    {step.description && (
                      <p className="text-sm text-gray-600 mt-2">{step.description}</p>
                    )}

                    {/* Notes */}
                    {step.notes && (
                      <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <span className="font-medium">Notas:</span> {step.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(step)}
                    className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(step)}
                    disabled={deleteMutation.isPending}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Connection Arrow (except for last step) */}
              {index < processSteps.length - 1 && (
                <div className="flex items-center justify-center py-4">
                  <div className="h-8 w-0.5 bg-gray-300"></div>
                </div>
              )}
            </div>
          ))}
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

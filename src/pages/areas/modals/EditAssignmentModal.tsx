import { useState } from 'react';
import { Calendar, X } from 'lucide-react';
import type { AssignmentType } from '../../../api/areaAssignments';
import Button from '../../../components/ui/Button';
import { personName } from '../../../utils/personName';

// Edit Assignment Modal Component
interface EditAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: any;
  onSave: (assignmentType: AssignmentType, roleInArea: string) => void;
  isLoading: boolean;
}

const EditAssignmentModal = ({ isOpen, onClose, assignment, onSave, isLoading }: EditAssignmentModalProps) => {
  const [assignmentType, setAssignmentType] = useState<AssignmentType>(assignment.assignment_type);
  const [roleInArea, setRoleInArea] = useState(assignment.role_in_area || '');

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSave(assignmentType, roleInArea);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 !mt-0">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Editar Asignación</h2>
            <p className="text-sm text-gray-600 mt-1">
              {personName(assignment)}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Assignment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Asignación <span className="text-red-500">*</span>
            </label>
            <select
              value={assignmentType}
              onChange={(e) => setAssignmentType(e.target.value as AssignmentType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="primary">Principal</option>
              <option value="secondary">Secundario</option>
              <option value="temporary">Temporal</option>
            </select>
          </div>

          {/* Role in Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rol en el Área (Opcional)
            </label>
            <input
              type="text"
              value={roleInArea}
              onChange={(e) => setRoleInArea(e.target.value)}
              placeholder="Ej: Supervisor, Operador Líder, Inspector..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Assignment Info */}
          <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                Desde: {new Date(assignment.start_date).toLocaleDateString()}
              </span>
            </div>
            {assignment.end_date && (
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4" />
                <span>
                  Hasta: {new Date(assignment.end_date).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 rounded-b-lg">
          <Button onClick={onClose} variant="outline" disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="gap-2">
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Guardando...
              </>
            ) : (
              'Guardar Cambios'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditAssignmentModal;

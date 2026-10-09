import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../../components/ui/Button';
import { updateProduct } from '../../../api/products';

interface SpecificationsEditorProps {
  productId: string;
  specifications: Record<string, any>;
}

const SpecificationsEditor = ({ productId, specifications }: SpecificationsEditorProps) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [specs, setSpecs] = useState<Record<string, any>>(specifications || {});
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (newSpecs: Record<string, any>) =>
      updateProduct(productId, { specifications: newSpecs }),
    onSuccess: () => {
      toast.success('Especificaciones actualizadas');
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar especificaciones');
    },
  });

  const handleAddSpec = () => {
    if (!newKey.trim() || !newValue.trim()) {
      toast.error('La clave y el valor son requeridos');
      return;
    }

    if (specs[newKey]) {
      toast.error('Esta clave ya existe');
      return;
    }

    setSpecs({ ...specs, [newKey.trim()]: newValue.trim() });
    setNewKey('');
    setNewValue('');
  };

  const handleEditSpec = (key: string) => {
    setEditingKey(key);
    setEditingValue(specs[key]);
  };

  const handleSaveEdit = () => {
    if (!editingKey || !editingValue.trim()) return;

    const newSpecs = { ...specs };
    newSpecs[editingKey] = editingValue.trim();
    setSpecs(newSpecs);
    setEditingKey(null);
    setEditingValue('');
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditingValue('');
  };

  const handleDeleteSpec = (key: string) => {
    if (window.confirm(`¿Eliminar la especificación "${key}"?`)) {
      const newSpecs = { ...specs };
      delete newSpecs[key];
      setSpecs(newSpecs);
    }
  };

  const handleSaveAll = () => {
    updateMutation.mutate(specs);
  };

  const handleCancel = () => {
    setSpecs(specifications || {});
    setNewKey('');
    setNewValue('');
    setEditingKey(null);
    setIsEditing(false);
  };

  const hasSpecs = Object.keys(specs).length > 0;

  if (!isEditing) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Especificaciones Técnicas</h3>
          <Button
            onClick={() => setIsEditing(true)}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            Editar
          </Button>
        </div>

        {hasSpecs ? (
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {Object.entries(specs).map(([key, value]) => (
              <div key={key}>
                <dt className="text-sm font-medium text-gray-500">{key}</dt>
                <dd className="mt-1 text-sm text-gray-900">{String(value)}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-gray-500 text-sm">No hay especificaciones técnicas definidas</p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Editar Especificaciones Técnicas</h3>
        <div className="flex gap-2">
          <Button
            onClick={handleCancel}
            variant="outline"
            size="sm"
            disabled={updateMutation.isPending}
          >
            <X className="h-4 w-4 mr-1" />
            Cancelar
          </Button>
          <Button
            onClick={handleSaveAll}
            size="sm"
            disabled={updateMutation.isPending}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>

      {/* Existing Specifications */}
      {hasSpecs && (
        <div className="mb-6 space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Especificaciones Actuales</h4>
          {Object.entries(specs).map(([key, value]) => (
            <div key={key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {editingKey === key ? (
                <>
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="text"
                        value={key}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Valor"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={handleSaveEdit}
                      className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg"
                      title="Guardar"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-200 rounded-lg"
                      title="Cancelar"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-sm font-medium text-gray-700">{key}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-900">{String(value)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditSpec(key)}
                      className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSpec(key)}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add New Specification */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Agregar Nueva Especificación</h4>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
            <input
              type="text"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: Peso, Material, Dimensiones"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddSpec();
              }}
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">Valor</label>
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: 250g, Aluminio, 15x10x5cm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddSpec();
              }}
            />
          </div>
          <Button onClick={handleAddSpec} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Agregar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SpecificationsEditor;

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import { createUser, updateUser, getRoles } from '../../api/users';
import { getOrganizations } from '../../api/organizations';
import type { User } from '../../types';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  defaultOrganizationId?: string; // creating from an organization's page
}

const UserModal = ({ isOpen, onClose, user, defaultOrganizationId }: UserModalProps) => {
  const queryClient = useQueryClient();
  const isEditing = !!user;

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role_id: '',
    organization_id: '',
    is_active: true,
  });

  // Fetch roles - SOLO cuando el modal está abierto
  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
    enabled: isOpen, // Solo cargar cuando el modal está abierto
  });

  // Fetch organizations - SOLO cuando el modal está abierto
  const { data: orgsData } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => getOrganizations({ limit: 100 }),
    enabled: isOpen, // Solo cargar cuando el modal está abierto
  });

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        password: '', // Never pre-fill password
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        role_id: user.role_id,
        organization_id: user.organization_id || '',
        is_active: user.is_active,
      });
    } else {
      setFormData({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role_id: '',
        organization_id: defaultOrganizationId || '',
        is_active: true,
      });
    }
  }, [user, defaultOrganizationId]);

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      toast.success('Usuario creado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear usuario');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateUser(id, data),
    onSuccess: () => {
      toast.success('Usuario actualizado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar usuario');
    },
  });

  // Same rules as the backend (validators/userValidators.ts)
  const isPlatformAdminRole = rolesData?.find((r) => r.id === formData.role_id)?.name === 'platform_admin';
  const passwordRules = [
    { ok: formData.password.length >= 8, text: '8 caracteres' },
    { ok: /[A-Z]/.test(formData.password), text: 'una mayúscula' },
    { ok: /[a-z]/.test(formData.password), text: 'una minúscula' },
    { ok: /[0-9]/.test(formData.password), text: 'un número' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.first_name || !formData.last_name || !formData.role_id) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    if (!isEditing && !formData.password) {
      toast.error('La contraseña es requerida al crear un usuario');
      return;
    }

    if (formData.password && passwordRules.some((r) => !r.ok)) {
      toast.error(`La contraseña debe tener al menos ${passwordRules.map((r) => r.text).join(', ')}`);
      return;
    }

    if (!isPlatformAdminRole && !formData.organization_id) {
      toast.error('Selecciona la empresa del usuario (obligatoria para este rol)');
      return;
    }

    const payload = {
      ...formData,
      email: formData.email.trim().toLowerCase(),
      organization_id: isPlatformAdminRole ? null : formData.organization_id || null,
    };

    // Don't send password if it's empty (for updates)
    if (isEditing && !formData.password) {
      delete (payload as any).password;
    }

    if (isEditing && user) {
      updateMutation.mutate({ id: user.id, data: payload });
    } else {
      createMutation.mutate(payload as any);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apellido *
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña {isEditing ? '(dejar vacío para no cambiar)' : '*'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required={!isEditing}
                minLength={8}
                placeholder={isEditing ? 'Dejar vacío para mantener actual' : 'Mínimo 8 caracteres'}
                aria-describedby="password-rules"
              />
              {(!isEditing || formData.password) && (
                <p id="password-rules" className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                  {passwordRules.map((rule) => (
                    <span key={rule.text} className={rule.ok ? 'text-green-700' : 'text-gray-500'}>
                      {rule.ok ? '✓' : '○'} {rule.text}
                    </span>
                  ))}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rol *
              </label>
              <select
                value={formData.role_id}
                onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Selecciona un rol</option>
                {rolesData?.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.display_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organización {!isPlatformAdminRole && '*'}
              </label>
              <select
                value={isPlatformAdminRole ? '' : formData.organization_id}
                onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
                disabled={isPlatformAdminRole}
                required={!isPlatformAdminRole}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="">{isPlatformAdminRole ? 'No aplica (administra todas las empresas)' : 'Selecciona una organización'}</option>
                {orgsData?.organizations?.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Usuario activo
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                isLoading={createMutation.isPending || updateMutation.isPending}
              >
                {isEditing ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserModal;

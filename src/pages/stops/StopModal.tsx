import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { createStop, updateStop, type CreateStopRequest } from '../../api/stops';
import { getTours } from '../../api/tours';
import type { Stop } from '../../types';

interface StopModalProps {
  isOpen: boolean;
  onClose: () => void;
  stop?: Stop | null;
}

const StopModal = ({ isOpen, onClose, stop }: StopModalProps) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'es' | 'en'>('es');
  const [formData, setFormData] = useState<CreateStopRequest>({
    tour_id: '',
    title_translations: { es: '', en: '' },
    description_translations: { es: '', en: '' },
    image_url: '',
    video_url: '',
    audio_urls: { es: '', en: '' },
  });

  const isEditing = !!stop;

  // Fetch tours for selector
  const { data: toursData } = useQuery({
    queryKey: ['tours'],
    queryFn: () => getTours({ limit: 100 }),
  });

  useEffect(() => {
    if (stop) {
      setFormData({
        tour_id: stop.tour_id,
        title_translations: stop.title_translations || { es: '', en: '' },
        description_translations: stop.description_translations || { es: '', en: '' },
        image_url: stop.image_url || '',
        video_url: stop.video_url || '',
        audio_urls: stop.audio_urls || { es: '', en: '' },
      });
    } else {
      setFormData({
        tour_id: '',
        title_translations: { es: '', en: '' },
        description_translations: { es: '', en: '' },
        image_url: '',
        video_url: '',
        audio_urls: { es: '', en: '' },
      });
    }
  }, [stop]);

  const createMutation = useMutation({
    mutationFn: createStop,
    onSuccess: () => {
      toast.success('Stop creado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['stops'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear stop');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; payload: CreateStopRequest }) =>
      updateStop(data.id, data.payload),
    onSuccess: () => {
      toast.success('Stop actualizado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['stops'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar stop');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.tour_id) {
      toast.error('Selecciona un tour');
      return;
    }

    // Validate at least Spanish title and description
    if (!formData.title_translations.es || !formData.description_translations.es) {
      toast.error('El título y descripción en español son obligatorios');
      return;
    }

    if (isEditing && stop) {
      updateMutation.mutate({ id: stop.id, payload: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTranslationChange = (
    field: 'title_translations' | 'description_translations' | 'audio_urls',
    lang: 'es' | 'en',
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        [lang]: value,
      },
    }));
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Stop' : 'Nuevo Stop'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="tour_id" className="block text-sm font-medium text-gray-700 mb-1">
            Tour <span className="text-red-500">*</span>
          </label>
          <select
            id="tour_id"
            name="tour_id"
            value={formData.tour_id}
            onChange={handleChange}
            disabled={isEditing}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
          >
            <option value="">Seleccionar tour</option>
            {toursData?.tours.map((tour) => (
              <option key={tour.id} value={tour.id}>
                {tour.title}
              </option>
            ))}
          </select>
          {isEditing && (
            <p className="mt-1 text-xs text-gray-500">
              No se puede cambiar el tour de un stop existente
            </p>
          )}
        </div>

        {/* Language Tabs */}
        <div>
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex gap-6">
              <button
                type="button"
                onClick={() => setActiveTab('es')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'es'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Español <span className="text-red-500">*</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('en')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'en'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                English
              </button>
            </nav>
          </div>

          <div className="mt-4 space-y-4">
            {/* Spanish Tab */}
            {activeTab === 'es' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título (Español) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.title_translations.es}
                    onChange={(e) =>
                      handleTranslationChange('title_translations', 'es', e.target.value)
                    }
                    placeholder="Título del stop en español"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción (Español) <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description_translations.es}
                    onChange={(e) =>
                      handleTranslationChange('description_translations', 'es', e.target.value)
                    }
                    placeholder="Descripción en español"
                    rows={3}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL de Audio (Español)
                  </label>
                  <Input
                    type="url"
                    value={formData.audio_urls?.es || ''}
                    onChange={(e) =>
                      handleTranslationChange('audio_urls', 'es', e.target.value)
                    }
                    placeholder="https://..."
                  />
                </div>
              </>
            )}

            {/* English Tab */}
            {activeTab === 'en' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title (English)
                  </label>
                  <Input
                    value={formData.title_translations.en}
                    onChange={(e) =>
                      handleTranslationChange('title_translations', 'en', e.target.value)
                    }
                    placeholder="Stop title in English"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (English)
                  </label>
                  <textarea
                    value={formData.description_translations.en}
                    onChange={(e) =>
                      handleTranslationChange('description_translations', 'en', e.target.value)
                    }
                    placeholder="Description in English"
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Audio URL (English)
                  </label>
                  <Input
                    type="url"
                    value={formData.audio_urls?.en || ''}
                    onChange={(e) =>
                      handleTranslationChange('audio_urls', 'en', e.target.value)
                    }
                    placeholder="https://..."
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Media URLs */}
        <div className="border-t border-gray-200 pt-4 space-y-4">
          <h4 className="text-sm font-medium text-gray-900">Multimedia</h4>

          <div>
            <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-1">
              URL de Imagen
            </label>
            <Input
              id="image_url"
              name="image_url"
              type="url"
              value={formData.image_url}
              onChange={handleChange}
              placeholder="https://..."
            />
          </div>

          <div>
            <label htmlFor="video_url" className="block text-sm font-medium text-gray-700 mb-1">
              URL de Video
            </label>
            <Input
              id="video_url"
              name="video_url"
              type="url"
              value={formData.video_url}
              onChange={handleChange}
              placeholder="https://..."
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default StopModal;

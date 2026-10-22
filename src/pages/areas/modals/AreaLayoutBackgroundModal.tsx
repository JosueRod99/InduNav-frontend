import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Crop, ImageIcon, Grid3x3 } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import ImageUpload from '../../../components/shared/ImageUpload';
import { ImageType } from '../../../api/upload';
import { createLayout, updateLayout, type PlantLayout } from '../../../api/layouts';
import type { AreaPhysicalRepresentation } from '../../../api/areaRepresentations';
import { computePlantCrop, defaultOutline, type AreaLayoutData } from '../../../utils/areaLayout';

type Source = AreaLayoutData['source'];

interface AreaLayoutBackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  area: { id: string; name: string; plant_id: string; organization_id: string };
  layout: PlantLayout | null; // null = create the area layout
  plantRepresentation: AreaPhysicalRepresentation | null; // area outline on the plant layout
}

const AreaLayoutBackgroundModal = ({
  isOpen,
  onClose,
  area,
  layout,
  plantRepresentation,
}: AreaLayoutBackgroundModalProps) => {
  const queryClient = useQueryClient();
  const canCrop = !!plantRepresentation?.layout?.layout_image_url;
  const currentSource = (layout?.layout_data as AreaLayoutData | undefined)?.source;

  const [source, setSource] = useState<Source>('blank');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSource(currentSource || (canCrop ? 'plant_crop' : 'image'));
      setImageUrl(layout?.layout_image_url || '');
    }
  }, [isOpen, currentSource, canCrop, layout?.layout_image_url]);

  const buildLayoutData = (): AreaLayoutData => {
    if (source === 'plant_crop' && plantRepresentation?.layout) {
      const { crop, outline } = computePlantCrop(plantRepresentation.geometry);
      return {
        source,
        plant_layout_id: plantRepresentation.layout.id,
        plant_image_url: plantRepresentation.layout.layout_image_url,
        crop,
        outline,
      };
    }
    // With its own image or a blank canvas, keep the previous outline if there was one
    const previousOutline = (layout?.layout_data as AreaLayoutData | undefined)?.outline;
    return { source, outline: previousOutline || defaultOutline() };
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        layout_image_url: source === 'image' ? imageUrl : null,
        layout_data: buildLayoutData(),
      };
      return layout
        ? updateLayout(layout.id, payload)
        : createLayout({
            ...payload,
            plant_id: area.plant_id,
            organizational_area_id: area.id,
            layout_name: `Layout ${area.name}`,
            floor_level: plantRepresentation?.floor_level ?? 0,
          });
    },
    onSuccess: () => {
      toast.success(layout ? 'Fondo actualizado' : 'Layout del área creado');
      queryClient.invalidateQueries({ queryKey: ['area-layout', area.id] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al guardar el layout');
    },
  });

  const handleSave = () => {
    if (source === 'image' && !imageUrl) {
      toast.error('Sube una imagen del plano del área');
      return;
    }
    saveMutation.mutate();
  };

  const options: Array<{ value: Source; title: string; description: string; Icon: typeof Crop; disabled?: boolean }> = [
    {
      value: 'plant_crop',
      title: 'Recorte del plano de planta',
      description: canCrop
        ? 'Usa la parte del plano de la planta donde está dibujada esta área, ampliada.'
        : 'No disponible: esta área no está dibujada en un plano de planta con imagen.',
      Icon: Crop,
      disabled: !canCrop,
    },
    {
      value: 'image',
      title: 'Plano propio del área',
      description: 'Sube una imagen con más detalle del interior del área.',
      Icon: ImageIcon,
    },
    {
      value: 'blank',
      title: 'Lienzo en blanco',
      description: 'Solo una cuadrícula con el contorno del área.',
      Icon: Grid3x3,
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={layout ? 'Cambiar fondo del layout' : `Crear layout de ${area.name}`}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} isLoading={saveMutation.isPending}>
            {layout ? 'Guardar' : 'Crear Layout'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3">
          {options.map(({ value, title, description, Icon, disabled }) => (
            <button
              key={value}
              type="button"
              disabled={disabled}
              onClick={() => setSource(value)}
              className={`flex items-start gap-3 rounded-lg border-2 p-3 text-left transition-colors ${
                source === value
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <Icon className={`h-5 w-5 mt-0.5 ${source === value ? 'text-blue-600' : 'text-gray-500'}`} />
              <div>
                <p className="text-sm font-medium text-gray-900">{title}</p>
                <p className="text-xs text-gray-600 mt-0.5">{description}</p>
              </div>
            </button>
          ))}
        </div>

        {source === 'image' && (
          <ImageUpload
            onImageUploaded={setImageUrl}
            organizationId={area.organization_id}
            plantId={area.plant_id}
            imageType={ImageType.LAYOUT}
            currentImageUrl={imageUrl}
            label="Plano del área *"
            helperText="Arrastra el plano aquí o haz clic para seleccionar"
            maxSizeMB={10}
          />
        )}

        {layout && source !== currentSource && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              Las subáreas y equipos ya dibujados conservan su posición en el lienzo. Si el nuevo fondo
              tiene otra escala, quizá tengas que ajustar sus puntos.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AreaLayoutBackgroundModal;

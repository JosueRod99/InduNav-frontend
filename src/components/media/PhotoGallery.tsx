import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, ImagePlus, Images, Loader2, Star, Trash2 } from 'lucide-react';
import { uploadImage, ImageType } from '../../api/upload';
import { addPhotos, deletePhoto, getPhotos, reorderPhotos, updatePhoto, type OrganizationPhoto } from '../../api/organizationProfile';

// Photo gallery of the company (no plantId) or of a plant. The cover photo opens the tours;
// the rest appear in their "about" sections.

const MAX_BYTES = 10 * 1024 * 1024; // same limit as the upload endpoint

interface PhotoGalleryProps {
  organizationId: string;
  plantId?: string | null;
  canEdit: boolean;
  emptyText: string;
}

const PhotoGallery = ({ organizationId, plantId = null, canEdit, emptyText }: PhotoGalleryProps) => {
  const queryClient = useQueryClient();
  const queryKey = ['organization-photos', organizationId, plantId ?? 'company'];
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);

  const { data: photos = [], isLoading } = useQuery({ queryKey, queryFn: () => getPhotos(organizationId, plantId) });
  const setPhotos = (list: OrganizationPhoto[]) => queryClient.setQueryData(queryKey, list);
  const onError = (error: any) => toast.error(error.response?.data?.message || 'No se pudo guardar el cambio');

  const update = useMutation({
    mutationFn: ({ id, ...payload }: { id: string; caption?: string | null; is_cover?: true }) => updatePhoto(organizationId, id, payload),
    onSuccess: setPhotos,
    onError,
  });
  const reorder = useMutation({ mutationFn: (ids: string[]) => reorderPhotos(organizationId, plantId, ids), onSuccess: setPhotos, onError });
  const remove = useMutation({
    mutationFn: (id: string) => deletePhoto(organizationId, id),
    onSuccess: (list) => {
      setPhotos(list);
      toast.success('Foto eliminada');
    },
    onError,
  });

  const upload = async (files: FileList | null) => {
    const images = Array.from(files || []).filter((f) => f.type.startsWith('image/'));
    const tooBig = images.filter((f) => f.size > MAX_BYTES);
    if (tooBig.length) toast.error(`${tooBig.length === 1 ? 'Una foto pesa' : `${tooBig.length} fotos pesan`} más de 10 MB y no se subirá${tooBig.length === 1 ? '' : 'n'}`);
    const valid = images.filter((f) => f.size <= MAX_BYTES);
    if (!valid.length) return;

    setUploading({ done: 0, total: valid.length });
    const uploaded: { image_url: string }[] = [];
    for (const file of valid) {
      try {
        const result = await uploadImage(file, { imageType: ImageType.OTHER, organizationId, plantId: plantId || undefined });
        uploaded.push({ image_url: result.url });
      } catch {
        toast.error(`No se pudo subir ${file.name}`);
      }
      setUploading((current) => current && { ...current, done: current.done + 1 });
    }
    try {
      if (uploaded.length) {
        setPhotos(await addPhotos(organizationId, plantId, uploaded));
        toast.success(uploaded.length === 1 ? 'Foto agregada' : `${uploaded.length} fotos agregadas`);
      }
    } catch (error) {
      onError(error);
    } finally {
      setUploading(null);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const move = (index: number, delta: number) => {
    const ids = photos.map((p) => p.id);
    const [moved] = ids.splice(index, 1);
    ids.splice(index + delta, 0, moved);
    setPhotos(ids.map((id) => photos.find((p) => p.id === id)!)); // instant; the server confirms
    reorder.mutate(ids);
  };

  if (isLoading) {
    return (
      <p className="flex items-center gap-2 text-sm text-gray-600">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando fotos…
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {canEdit && (
        <div className="flex flex-wrap items-center gap-3">
          <input ref={fileInput} type="file" accept="image/*" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={!!uploading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            {uploading ? `Subiendo ${uploading.done + 1 > uploading.total ? uploading.total : uploading.done + 1} de ${uploading.total}…` : 'Subir fotos'}
          </button>
          <span className="text-xs text-gray-500">JPG o PNG, hasta 10 MB cada una. La foto con ★ es la portada.</span>
        </div>
      )}

      {photos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
          <Images className="mx-auto mb-2 h-8 w-8 text-gray-400" />
          {emptyText}
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo, index) => (
            <li key={photo.id} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <div className="relative aspect-[4/3] bg-gray-100">
                <a href={photo.image_url} target="_blank" rel="noreferrer" title="Ver en tamaño completo">
                  <img src={photo.image_url} alt={photo.caption || ''} loading="lazy" className="h-full w-full object-cover" />
                </a>
                {photo.is_cover && (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-semibold text-amber-950 shadow">
                    <Star className="h-3 w-3 fill-current" /> Portada
                  </span>
                )}
              </div>
              {canEdit ? (
                <div className="space-y-2 p-2">
                  <input
                    defaultValue={photo.caption || ''}
                    placeholder="Pie de foto (opcional)"
                    maxLength={300}
                    aria-label="Pie de foto"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault(); // inside forms: save the caption, do not submit the form
                        e.currentTarget.blur();
                      }
                    }}
                    onBlur={(e) => {
                      const caption = e.target.value.trim();
                      if (caption !== (photo.caption || '')) update.mutate({ id: photo.id, caption: caption || null });
                    }}
                    className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                  />
                  <div className="flex items-center gap-1">
                    {!photo.is_cover && (
                      <button
                        type="button"
                        onClick={() => update.mutate({ id: photo.id, is_cover: true })}
                        className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs text-gray-600 hover:bg-amber-50 hover:text-amber-800"
                        title="Usar como portada"
                      >
                        <Star className="h-3.5 w-3.5" /> Portada
                      </button>
                    )}
                    <span className="ml-auto flex items-center">
                      <button
                        type="button"
                        onClick={() => move(index, -1)}
                        disabled={index === 0}
                        className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                        aria-label="Mover antes"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(index, 1)}
                        disabled={index === photos.length - 1}
                        className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                        aria-label="Mover después"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => window.confirm('¿Eliminar esta foto?') && remove.mutate(photo.id)}
                        className="rounded p-1 text-gray-500 hover:bg-red-50 hover:text-red-600"
                        aria-label="Eliminar foto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </span>
                  </div>
                </div>
              ) : (
                photo.caption && <p className="p-2 text-xs text-gray-600">{photo.caption}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PhotoGallery;

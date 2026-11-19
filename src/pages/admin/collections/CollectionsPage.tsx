import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ExternalLink, LayoutGrid, Loader2, Plus } from 'lucide-react';
import { collectionText, createCollection, getCollections } from '../../../api/collections';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';

// Collections of tours of demo companies (platform): a public page to show in a sale, with tours of
// several companies of the same industry.

const CollectionsPage = () => {
  const navigate = useNavigate();
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [title, setTitle] = useState('');
  const { data: collections, isLoading, error } = useQuery({ queryKey: ['collections'], queryFn: getCollections });

  const create = useMutation({
    mutationFn: () => createCollection({ title_translations: { es: title.trim() } }),
    onSuccess: (collection) => navigate(`/admin/collections/${collection.id}`),
    onError: (err: any) => toast.error(err.response?.data?.message || 'No se pudo crear la colección'),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Colecciones</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-600">
            Una página pública con tours de varias empresas demo, para mostrarla en una venta: por ejemplo, tres maquiladoras para un
            prospecto del mismo giro. Solo visible para administradores de la plataforma.
          </p>
        </div>
        <Button onClick={() => setIsNewOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Nueva colección
        </Button>
      </div>

      {isLoading ? (
        <p className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
        </p>
      ) : error || !collections ? (
        <p className="text-red-600">No se pudieron cargar las colecciones.</p>
      ) : collections.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-600">
          <LayoutGrid className="mx-auto mb-2 h-8 w-8 text-gray-400" />
          Aún no hay colecciones. Primero marca como <strong>empresa demo</strong> a las organizaciones cuyos tours quieras mostrar (en
          Organizaciones, Editar).
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200 bg-white">
          {collections.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-gray-50">
              <Link to={`/admin/collections/${c.id}`} className="min-w-0 flex-1 basis-60">
                <span className="block truncate text-sm font-medium text-gray-900">{collectionText(c.title_translations, 'es')}</span>
                <span className="block text-xs text-gray-500">
                  /c/{c.slug} · {c.tours_count} {c.tours_count === 1 ? 'tour' : 'tours'} · {c.visits_30d}{' '}
                  {c.visits_30d === 1 ? 'visita' : 'visitas'} en 30 días
                </span>
              </Link>
              <Badge variant={c.is_active ? 'success' : 'default'}>{c.is_active ? 'Activa' : 'Inactiva'}</Badge>
              {c.is_active && (
                <a
                  href={`/c/${c.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                >
                  Abrir <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </li>
          ))}
        </ul>
      )}

      <Modal
        isOpen={isNewOpen}
        onClose={() => setIsNewOpen(false)}
        title="Nueva colección"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsNewOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => create.mutate()} disabled={!title.trim()} isLoading={create.isPending}>
              Crear
            </Button>
          </>
        }
      >
        <Input
          label="Título"
          value={title}
          maxLength={200}
          placeholder="Por ejemplo: Maquiladoras de Chihuahua"
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && title.trim() && create.mutate()}
          helperText="Lo verá el prospecto. Después podrás agregar la descripción, el inglés y los tours."
          autoFocus
        />
      </Modal>
    </div>
  );
};

export default CollectionsPage;

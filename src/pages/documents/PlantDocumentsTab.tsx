import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Eye, GitBranch, Globe2, Plus, Search, Trash2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  appliesToArea,
  deleteDocument,
  getCategoryLabel,
  getFileIcon,
  getPlantDocuments,
  getStatusColor,
  getStatusLabel,
  invalidateDocumentLists,
  scopeLabel,
  type AreaDocument,
  type DocumentScope,
} from '../../api/areaDocuments';
import { getAreas } from '../../api/areas';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import UploadDocumentModal from '../areas/modals/UploadDocumentModal';
import EditDocumentModal from '../areas/modals/EditDocumentModal';
import NewDocumentVersionModal from '../areas/modals/NewDocumentVersionModal';
import SectionHeader from '../../components/ui/SectionHeader';

// Plant document library: everything that applies to its areas, to the whole plant or to the
// whole company, with who each document applies to.

interface Props {
  plant: { id: string; name: string; organization_id: string };
}

const SCOPE_BADGE: Record<DocumentScope, string> = {
  organization: 'bg-blue-50 text-blue-800',
  plant: 'bg-blue-50 text-blue-800',
  areas: 'bg-violet-50 text-violet-800',
  area: 'bg-gray-100 text-gray-700',
};

const PlantDocumentsTab = ({ plant }: Props) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState<'' | DocumentScope>('');
  const [areaFilter, setAreaFilter] = useState(''); // documents that apply to this area
  const [onlyPending, setOnlyPending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AreaDocument | null>(null);
  const [versioning, setVersioning] = useState<AreaDocument | null>(null);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['plant-documents', plant.id],
    queryFn: () => getPlantDocuments(plant.id),
  });
  const { data: areas = [] } = useQuery({
    queryKey: ['plant-areas-flat', plant.id],
    queryFn: async () => (await getAreas({ plant_id: plant.id, limit: 500 })).areas,
  });
  const sortedAreas = useMemo(() => [...areas].sort((a, b) => a.name.localeCompare(b.name, 'es')), [areas]);

  const archive = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      toast.success('Documento archivado');
      invalidateDocumentLists(queryClient);
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'No se pudo archivar'),
  });

  const counts = useMemo(
    () => ({
      total: documents.length,
      general: documents.filter((d) => d.scope === 'plant' || d.scope === 'organization').length,
      shared: documents.filter((d) => d.scope === 'areas').length,
      pending: documents.filter((d) => d.document_type === 'pending').length,
    }),
    [documents]
  );

  const visible = documents.filter((d) => {
    if (scopeFilter && d.scope !== scopeFilter) return false;
    if (areaFilter && !appliesToArea(d, areaFilter)) return false;
    if (onlyPending && d.document_type !== 'pending') return false;
    if (search) {
      const text = `${d.document_code || ''} ${d.title} ${d.description || ''}`.toLowerCase();
      if (!text.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const selectClass = 'rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Documentos"
        description="Todos los documentos de la planta y de la empresa, y a quién aplica cada uno."
        actions={
          <Button onClick={() => setCreating(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Nuevo documento
          </Button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Documentos', counts.total],
          ['Toda la planta o empresa', counts.general],
          ['De varias áreas', counts.shared],
          ['Sin archivo', counts.pending],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-600">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-[12rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código o título"
            aria-label="Buscar documentos"
            className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>
        <select value={scopeFilter} onChange={(e) => setScopeFilter(e.target.value as typeof scopeFilter)} aria-label="Alcance" className={selectClass}>
          <option value="">Alcance: todos</option>
          <option value="organization">Toda la empresa</option>
          <option value="plant">Toda la planta</option>
          <option value="areas">Varias áreas</option>
          <option value="area">Un área</option>
        </select>
        <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} aria-label="Aplica al área" className={selectClass}>
          <option value="">Aplica a: cualquier área</option>
          {sortedAreas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700">
          <input type="checkbox" checked={onlyPending} onChange={(e) => setOnlyPending(e.target.checked)} className="rounded text-blue-600" />
          Solo sin archivo
        </label>
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {isLoading ? (
          <p className="p-8 text-center text-sm text-gray-600">Cargando documentos…</p>
        ) : visible.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-600">{documents.length ? 'Ningún documento coincide con los filtros.' : 'Aún no hay documentos.'}</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {visible.map((doc) => (
              <li key={doc.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className="mt-0.5 text-xl">{doc.document_type === 'pending' ? '🗂️' : getFileIcon(doc.file_type)}</span>
                  <div className="min-w-0">
                    {doc.document_code && <div className="font-mono text-xs font-semibold text-blue-700">{doc.document_code}</div>}
                    <button onClick={() => setEditing(doc)} className="text-left text-sm font-medium text-gray-900 hover:text-blue-700 hover:underline">
                      {doc.title}
                    </button>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${SCOPE_BADGE[doc.scope]}`}
                        title={doc.scope === 'areas' ? (doc.shared_areas || []).map((a) => a.name).join(', ') : undefined}
                      >
                        {(doc.scope === 'plant' || doc.scope === 'organization') && <Globe2 className="h-3 w-3" />}
                        Aplica a: {scopeLabel(doc)}
                      </span>
                      <span className="text-gray-600">{getCategoryLabel(doc.category)}</span>
                      <span className="text-gray-400">·</span>
                      <span className="text-gray-600">v{doc.version}</span>
                      <Badge variant={getStatusColor(doc.status)} size="sm">
                        {getStatusLabel(doc.status)}
                      </Badge>
                      {doc.is_private && (
                        <Badge variant="warning" size="sm">
                          Privado
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-3 pl-9 sm:pl-0">
                  {doc.document_type === 'pending' ? (
                    <button
                      onClick={() => setVersioning(doc)}
                      className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-200"
                    >
                      <Upload className="h-3.5 w-3.5" /> Subir archivo
                    </button>
                  ) : (
                    <>
                      <a href={doc.file_url || '#'} target="_blank" rel="noreferrer" className="text-green-700 hover:text-green-900" aria-label={`Ver archivo de ${doc.title}`}>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <button onClick={() => setVersioning(doc)} className="text-purple-600 hover:text-purple-900" aria-label={`Nueva versión de ${doc.title}`}>
                        <GitBranch className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  <button onClick={() => setEditing(doc)} className="text-gray-600 hover:text-gray-900" aria-label={`Detalles de ${doc.title}`}>
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => window.confirm(`¿Archivar "${doc.title}"?`) && archive.mutate(doc.id)}
                    disabled={archive.isPending}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    aria-label={`Archivar ${doc.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <UploadDocumentModal isOpen={creating} onClose={() => setCreating(false)} organizationId={plant.organization_id} plantId={plant.id} />
      <EditDocumentModal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        document={editing}
        organizationId={plant.organization_id}
        plantId={plant.id}
      />
      <NewDocumentVersionModal
        isOpen={!!versioning}
        onClose={() => setVersioning(null)}
        document={versioning}
        organizationId={plant.organization_id}
        plantId={plant.id}
      />
    </div>
  );
};

export default PlantDocumentsTab;

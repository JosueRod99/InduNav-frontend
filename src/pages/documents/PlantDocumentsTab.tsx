import { confirmar } from '../../components/ui/ConfirmDialog';
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArchiveRestore,
  ExternalLink,
  Eye,
  GitBranch,
  Globe2,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  appliesToArea,
  updateDocument,
  deleteDocument,
  getCategoryLabel,
  getFileIcon,
  getOrganizationDocuments,
  getPlantDocuments,
  getStatusColor,
  getStatusLabel,
  invalidateDocumentLists,
  scopeLabel,
  type AreaDocument,
  type DocumentScope,
} from "../../api/areaDocuments";
import { getAreas } from "../../api/areas";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import UploadDocumentModal from "../areas/modals/UploadDocumentModal";
import EditDocumentModal from "../areas/modals/EditDocumentModal";
import NewDocumentVersionModal from "../areas/modals/NewDocumentVersionModal";
import SectionHeader from "../../components/ui/SectionHeader";
import { matchesSearch } from "../../utils/search";
import { useCan } from '../../hooks/usePermissions';
import { useAuthStore } from '../../store/authStore';

// Plant document library: everything that applies to its areas, to the whole plant or to the
// whole company, with who each document applies to.

interface Props {
  plant?: { id: string; name?: string; organization_id: string };
  organization?: { id: string; name: string }; // on the organization's page: only what applies to all of it
  area?: { id: string; name: string }; // inside an area's page: only what applies to that area
  product?: { id: string; name: string; sku: string }; // inside a product's page: only its documents
  equipment?: { id: string; name: string; code: string }; // inside a piece of equipment's page: same
}

const SCOPE_BADGE: Record<DocumentScope, string> = {
  organization: "bg-blue-50 text-blue-800",
  plant: "bg-blue-50 text-blue-800",
  areas: "bg-violet-50 text-violet-800",
  area: "bg-gray-100 text-gray-700",
  products: "bg-amber-50 text-amber-800",
  equipment: "bg-slate-100 text-slate-700",
};

const PlantDocumentsTab = ({ plant, organization, area, product, equipment }: Props) => {
  const can = useCan();
  const canCreate = can('documents.create');
  const canDelete = can('documents.delete');
  // Plant scope: what is of the whole company is read, not changed
  const isPlantScope = useAuthStore((state) => state.user?.role?.scope) === 'plant';
  const canChange = (doc: { scope: string }) => can('documents.update') && !(isPlantScope && doc.scope === 'organization');
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState<"" | DocumentScope>("");
  const [areaFilter, setAreaFilter] = useState(""); // documents that apply to this area
  const [productFilter, setProductFilter] = useState(""); // documents of this product
  const [equipmentFilter, setEquipmentFilter] = useState(""); // documents of this piece of equipment
  const linked = !!(product || equipment || !plant); // inside a product, equipment or organization page: no scope filters
  const organizationId = plant?.organization_id ?? organization!.id;
  const [onlyPending, setOnlyPending] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [generalOnly, setGeneralOnly] = useState(false); // summary card: whole plant or company
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AreaDocument | null>(null);
  const [versioning, setVersioning] = useState<AreaDocument | null>(null);

  const { data: allDocuments = [], isLoading } = useQuery({
    queryKey: plant
      ? ["plant-documents", plant.id]
      : ["organization-documents", organizationId],
    queryFn: () =>
      plant
        ? getPlantDocuments(plant.id, { includeArchived: true })
        : getOrganizationDocuments(organizationId, { includeArchived: true }),
  });
  const inScope = useMemo(
    () =>
      area
        ? allDocuments.filter((d) => appliesToArea(d, area.id))
        : product
          ? allDocuments.filter((d) => d.shared_products?.some((p) => p.id === product.id))
          : equipment
            ? allDocuments.filter((d) => d.shared_equipment?.some((e) => e.id === equipment.id))
            : allDocuments,
    [allDocuments, area, product, equipment],
  );
  // Active and archived are two separate views; the summary always counts the active ones
  const documents = useMemo(
    () => inScope.filter((d) => d.status !== "archived"),
    [inScope],
  );
  const archived = useMemo(
    () => inScope.filter((d) => d.status === "archived"),
    [inScope],
  );
  const listed = showArchived ? archived : documents;
  const { data: areas = [] } = useQuery({
    queryKey: ["plant-areas-flat", plant?.id],
    queryFn: async () =>
      (await getAreas({ plant_id: plant!.id, limit: 500 })).areas,
    enabled: !!plant,
  });
  const sortedAreas = useMemo(
    () => [...areas].sort((a, b) => a.name.localeCompare(b.name, "es")),
    [areas],
  );

  const restore = useMutation({
    mutationFn: (id: string) => updateDocument(id, { status: "active" }),
    onSuccess: () => {
      toast.success("Documento restaurado");
      invalidateDocumentLists(queryClient);
    },
    onError: (error: any) =>
      toast.error(error.response?.data?.message || "No se pudo restaurar"),
  });

  const archive = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      toast.success("Documento archivado");
      invalidateDocumentLists(queryClient);
    },
    onError: (error: any) =>
      toast.error(error.response?.data?.message || "No se pudo archivar"),
  });

  const counts = useMemo(
    () => ({
      total: documents.length,
      general: documents.filter(
        (d) => d.scope === "plant" || d.scope === "organization",
      ).length,
      shared: documents.filter((d) => d.scope === "areas").length,
      pending: documents.filter((d) => d.document_type === "pending").length,
    }),
    [documents],
  );

  // Products that have documents (for the filter)
  const productsWithDocs = useMemo(() => {
    const map = new Map<string, string>();
    inScope.forEach((d) =>
      d.shared_products?.forEach((p) => map.set(p.id, p.name)),
    );
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], "es"));
  }, [inScope]);

  const equipmentWithDocs = useMemo(() => {
    const map = new Map<string, string>();
    inScope.forEach((d) =>
      d.shared_equipment?.forEach((e) => map.set(e.id, e.name)),
    );
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], "es"));
  }, [inScope]);

  const visible = listed.filter((d) => {
    if (
      equipmentFilter &&
      !d.shared_equipment?.some((e) => e.id === equipmentFilter)
    )
      return false;
    if (
      productFilter &&
      !d.shared_products?.some((p) => p.id === productFilter)
    )
      return false;
    if (scopeFilter && d.scope !== scopeFilter) return false;
    if (generalOnly && d.scope !== "plant" && d.scope !== "organization")
      return false;
    if (areaFilter && !appliesToArea(d, areaFilter)) return false;
    if (onlyPending && d.document_type !== "pending") return false;
    if (!matchesSearch(search, d.document_code, d.title, d.description))
      return false;
    return true;
  });

  const selectClass =
    "rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="space-y-4">
      <SectionHeader
        title={plant ? "Documentos" : "Documentos de la empresa"}
        description={
          !plant
            ? "Aplican a toda la empresa y aparecen también en los documentos de cada planta."
            : equipment
            ? "Manuales y otros documentos de este equipo. También aparecen en Documentos de la planta."
            : product
              ? "Fichas técnicas, planos y otros documentos de este producto. También aparecen en Documentos de la planta."
              : area
                ? `Los de "${area.name}" y los generales que le aplican.`
                : "Todos los documentos de la planta y de la empresa, y a quién aplica cada uno."
        }
        actions={
          canCreate && (
            <Button onClick={() => setCreating(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Nuevo documento
            </Button>
          )
        }
      />

      {/* Summary: each card filters (a second click clears it) */}
      <div
        className={`grid grid-cols-2 gap-3 ${linked ? "" : "sm:grid-cols-4"}`}
      >
        {[
          {
            label: "Documentos",
            value: counts.total,
            active: !generalOnly && scopeFilter !== "areas" && !onlyPending,
            onClick: () => {
              setGeneralOnly(false);
              setScopeFilter("");
              setOnlyPending(false);
            },
          },
          ...(linked
            ? []
            : [
                {
                  label: "Toda la planta o empresa",
                  value: counts.general,
                  active: generalOnly,
                  onClick: () => {
                    setScopeFilter("");
                    setGeneralOnly(!generalOnly);
                  },
                },
                {
                  label: "De varias áreas",
                  value: counts.shared,
                  active: scopeFilter === "areas",
                  onClick: () => {
                    setGeneralOnly(false);
                    setScopeFilter(scopeFilter === "areas" ? "" : "areas");
                  },
                },
              ]),
          {
            label: "Sin archivo",
            value: counts.pending,
            active: onlyPending,
            onClick: () => setOnlyPending(!onlyPending),
          },
        ].map(({ label, value, active, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            aria-pressed={active}
            className={`rounded-lg border bg-white p-3 text-left transition-colors ${active ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-200 hover:border-blue-300"}`}
          >
            <span className="block text-2xl font-bold text-gray-900">
              {value}
            </span>
            <span className="text-xs text-gray-600">{label}</span>
          </button>
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
        {/* Side by side on phones */}
        {!linked && (
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
            <select
              value={scopeFilter}
              onChange={(e) => {
                setGeneralOnly(false);
                setScopeFilter(e.target.value as typeof scopeFilter);
              }}
              aria-label="Alcance"
              className={`${selectClass} min-w-0`}
            >
              <option value="">Alcance: todos</option>
              <option value="organization">Toda la empresa</option>
              <option value="plant">Toda la planta</option>
              <option value="areas">Varias áreas</option>
              <option value="area">Un área</option>
              <option value="products">Productos</option>
              <option value="equipment">Equipos</option>
            </select>
            {!area && (
              <select
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                aria-label="Aplica al área"
                className={`${selectClass} min-w-0`}
              >
                <option value="">Aplica a: todas</option>
                {sortedAreas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            )}
            {!area && equipmentWithDocs.length > 0 && (
              <select
                value={equipmentFilter}
                onChange={(e) => setEquipmentFilter(e.target.value)}
                aria-label="Equipo"
                className={`${selectClass} min-w-0`}
              >
                <option value="">Equipo: todos</option>
                {equipmentWithDocs.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            )}
            {!area && productsWithDocs.length > 0 && (
              <select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                aria-label="Producto"
                className={`${selectClass} min-w-0`}
              >
                <option value="">Producto: todos</option>
                {productsWithDocs.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={onlyPending}
            onChange={(e) => setOnlyPending(e.target.checked)}
            className="rounded text-blue-600"
          />
          Solo sin archivo
        </label>
        <label
          className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${showArchived ? "border-amber-300 bg-amber-50 text-amber-900" : "border-gray-300 text-gray-700"}`}
        >
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded text-amber-600"
          />
          Ver archivados ({archived.length})
        </label>
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {isLoading ? (
          <p className="p-8 text-center text-sm text-gray-600">
            Cargando documentos…
          </p>
        ) : visible.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-600">
            {listed.length
              ? "Ningún documento coincide con los filtros."
              : showArchived
                ? "No hay documentos archivados."
                : "Aún no hay documentos."}
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {visible.map((doc) => (
              <li
                key={doc.id}
                className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className="mt-0.5 text-xl">
                    {doc.document_type === "pending"
                      ? "🗂️"
                      : getFileIcon(doc.file_type)}
                  </span>
                  <div className="min-w-0">
                    {doc.document_code && (
                      <div className="font-mono text-xs font-semibold text-blue-700">
                        {doc.document_code}
                      </div>
                    )}
                    {canChange(doc) ? (
                      <button
                        onClick={() => setEditing(doc)}
                        className="text-left text-sm font-medium text-gray-900 hover:text-blue-700 hover:underline"
                      >
                        {doc.title}
                      </button>
                    ) : (
                      <span className="text-sm font-medium text-gray-900">{doc.title}</span>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${SCOPE_BADGE[doc.scope]}`}
                        title={
                          doc.scope === "areas"
                            ? (doc.shared_areas || [])
                                .map((a) => a.name)
                                .join(", ")
                            : doc.scope === "products"
                              ? (doc.shared_products || [])
                                  .map((p) => p.name)
                                  .join(", ")
                              : doc.scope === "equipment"
                                ? (doc.shared_equipment || [])
                                    .map((e) => e.name)
                                    .join(", ")
                                : undefined
                        }
                      >
                        {(doc.scope === "plant" ||
                          doc.scope === "organization") && (
                          <Globe2 className="h-3 w-3" />
                        )}
                        Aplica a: {scopeLabel(doc)}
                      </span>
                      <span className="text-gray-600">
                        {getCategoryLabel(doc.category)}
                      </span>
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
                  {doc.document_type === "pending" &&
                  doc.status === "archived" ? null : doc.document_type ===
                    "pending" ? (
                    canChange(doc) && (
                      <button
                        onClick={() => setVersioning(doc)}
                        className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-200"
                      >
                        <Upload className="h-3.5 w-3.5" /> Subir archivo
                      </button>
                    )
                  ) : (
                    <>
                      <a
                        href={doc.file_url || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="text-green-700 hover:text-green-900"
                        title="Abrir el archivo"
                        aria-label={`Ver archivo de ${doc.title}`}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      {doc.status !== "archived" && canChange(doc) && (
                        <button
                          onClick={() => setVersioning(doc)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Subir una nueva versión"
                          aria-label={`Nueva versión de ${doc.title}`}
                        >
                          <GitBranch className="h-4 w-4" />
                        </button>
                      )}
                    </>
                  )}
                  {canChange(doc) && (
                    <button
                      onClick={() => setEditing(doc)}
                      className="text-gray-600 hover:text-gray-900"
                      title="Ver y editar detalles"
                      aria-label={`Detalles de ${doc.title}`}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  )}
                  {doc.status === "archived" ? (
 canChange(doc) && (                    <button
                      onClick={() => restore.mutate(doc.id)}
                      disabled={restore.isPending}
                      className="text-green-700 hover:text-green-900 disabled:opacity-50"
                      title="Restaurar"
                      aria-label={`Restaurar ${doc.title}`}
                    >
                      <ArchiveRestore className="h-4 w-4" />
                    </button>)
) : (
 canDelete && !(isPlantScope && doc.scope === "organization") && (                    <button
                      onClick={async () =>
                        (await confirmar({ title: 'Archivar documento', message: `Se archivará "${doc.title}". Puedes restaurarlo después.`, confirmLabel: 'Archivar' })) &&
                        archive.mutate(doc.id)
                      }
                      disabled={archive.isPending}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      title="Archivar"
                      aria-label={`Archivar ${doc.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>)
)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <UploadDocumentModal
        isOpen={creating}
        onClose={() => setCreating(false)}
        areaId={area?.id}
        product={product}
        equipment={equipment}
        organizationId={organizationId}
        plantId={plant?.id}
      />
      <EditDocumentModal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        document={editing}
        organizationId={organizationId}
        plantId={plant?.id}
      />
      <NewDocumentVersionModal
        isOpen={!!versioning}
        onClose={() => setVersioning(null)}
        document={versioning}
        organizationId={organizationId}
        plantId={plant?.id}
      />
    </div>
  );
};

export default PlantDocumentsTab;

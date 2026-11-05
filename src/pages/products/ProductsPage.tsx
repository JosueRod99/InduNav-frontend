import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Lock, Plus, Pencil, Trash2, Package, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import ProductModal from './ProductModal';
import {
  getProducts,
  deleteProduct,
  type Product,
  type ProductCategory,
  type ProductStatus,
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_STATUS_LABELS,
} from '../../api/products';
import { getOrganizations } from '../../api/organizations';
import { getPlants } from '../../api/plants';
import type { PlantScopedProps } from '../plants/plantScope';
import { useNavigateWithBack } from '../../hooks/useBackNavigation';
import SectionHeader from '../../components/ui/SectionHeader';
import { matchesSearch } from '../../utils/search';
import { useCan } from '../../hooks/usePermissions';

// Products of the plant: summary (each card filters), one row of filters, and a table with the
// route of each product through the areas (cards on phones). The list is filtered in the browser.

const STATUS_BADGE: Record<ProductStatus, 'success' | 'warning' | 'error'> = {
  active: 'success',
  in_development: 'warning',
  discontinued: 'error',
};

type Quick = '' | 'active' | 'no_steps' | 'private';
const NO_AREA = '__none__';

const Route = ({ product, highlight }: { product: Product; highlight?: string }) =>
  product.route?.length ? (
    <span className="flex flex-wrap items-center gap-0.5">
      {product.route.map((a, i) => (
        <span key={`${a.id}${i}`} className="inline-flex items-center gap-0.5">
          {i > 0 && <ChevronRight className="h-3 w-3 text-gray-400" />}
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${a.id === highlight ? 'bg-blue-100 font-semibold text-blue-800' : 'bg-gray-100 text-gray-700'}`}>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: a.color || '#94A3B8' }} />
            {a.name}
          </span>
        </span>
      ))}
    </span>
  ) : (
    <span className="text-xs text-amber-700">Sin pasos</span>
  );

const ProductsPage = ({ plantId, organizationId, area }: PlantScopedProps = {}) => {
  const embedded = !!plantId; // inside the plant workspace: fixed plant, no org/plant selectors

  const navigate = useNavigateWithBack(); // detail pages opened from here return here
  const queryClient = useQueryClient();
  const can = useCan();
  const canCreate = can('products.create');
  const canUpdate = can('products.update');
  const canDelete = can('products.delete');

  const [selectedOrg, setSelectedOrg] = useState<string>(organizationId ?? '');
  const [selectedPlant, setSelectedPlant] = useState<string>(plantId ?? '');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<ProductStatus | ''>('');
  const [selectedArea, setSelectedArea] = useState('');
  const [quick, setQuick] = useState<Quick>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const { data: organizationsData } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => getOrganizations({ limit: 100 }),
    enabled: !embedded,
  });

  const { data: plantsData } = useQuery({
    queryKey: ['plants', selectedOrg],
    queryFn: () => getPlants({ organization_id: selectedOrg || undefined, limit: 100 }),
    enabled: !!selectedOrg && !embedded,
  });

  // Every product of the plant (or organization): the summary counts all of them, filters run here
  const { data: allProducts = [], isLoading } = useQuery({
    queryKey: ['products', selectedOrg, selectedPlant],
    queryFn: () =>
      getProducts({ organization_id: selectedOrg || undefined, plant_id: selectedPlant || undefined, include_process_steps: true }),
    enabled: !!selectedOrg,
  });

  const products = useMemo(() => (area ? allProducts.filter((p) => p.route?.some((a) => a.id === area.id)) : allProducts), [allProducts, area]);

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      toast.success('Producto eliminado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Error al eliminar producto'),
  });

  const hasSteps = (p: Product) => (p.route?.length || p.process_steps_count || 0) > 0;

  // Areas some product passes through (for the filter)
  const areas = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => p.route?.forEach((a) => map.set(a.id, a.name)));
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], 'es'));
  }, [products]);

  const visible = products.filter((p) => {
    if (quick === 'active' && p.status !== 'active') return false;
    if (quick === 'no_steps' && hasSteps(p)) return false;
    if (quick === 'private' && !p.is_private) return false;
    if (selectedCategory && p.category !== selectedCategory) return false;
    if (selectedStatus && p.status !== selectedStatus) return false;
    if (selectedArea === NO_AREA && hasSteps(p)) return false;
    if (selectedArea && selectedArea !== NO_AREA && !p.route?.some((a) => a.id === selectedArea)) return false;
    if (!matchesSearch(searchQuery, p.name, p.sku, p.description)) return false;
    return true;
  });

  const summary: { key: Quick; label: string; value: number; tone: string }[] = [
    { key: '', label: 'Productos', value: products.length, tone: 'text-gray-900' },
    { key: 'active', label: 'Activos', value: products.filter((p) => p.status === 'active').length, tone: 'text-green-700' },
    // Inside an area every product has steps
    ...(area ? [] : [{ key: 'no_steps' as Quick, label: 'Sin pasos de proceso', value: products.filter((p) => !hasSteps(p)).length, tone: 'text-amber-700' }]),
    { key: 'private', label: 'Privados (no salen en tours)', value: products.filter((p) => p.is_private).length, tone: 'text-gray-700' },
  ];

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = (product: Product) => {
    if (window.confirm(`¿Estás seguro de eliminar el producto "${product.name}"?`)) deleteMutation.mutate(product.id);
  };

  const handleCreateNew = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const openDetails = (id: string) => navigate(`/products/${id}`);
  const filtersActive = !!(searchQuery || selectedCategory || selectedStatus || selectedArea || quick);
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedStatus('');
    setSelectedArea('');
    setQuick('');
  };

  const organizations = organizationsData?.organizations || [];
  const plants = plantsData?.plants || [];

  const Name = ({ product }: { product: Product }) => (
    <span className="min-w-0">
      <span className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
        {product.name}
        {product.is_private && (
          <span title="Privado: no sale en los tours" aria-label="Privado">
            <Lock className="h-3.5 w-3.5 text-gray-500" />
          </span>
        )}
      </span>
      <span className="block text-xs text-gray-500">
        Rev. {product.revision}
        {product.description && <span className="hidden lg:inline"> · {product.description}</span>}
      </span>
    </span>
  );

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Productos"
        description={area ? `Productos que pasan por "${area.name}" en su proceso de fabricación.` : 'Catálogo de productos que se fabrican en la planta y sus pasos de proceso.'}
        actions={
          selectedOrg &&
          canCreate && (
            <Button onClick={handleCreateNew} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Producto
            </Button>
          )
        }
      />

      {/* Organization and plant (only outside the plant workspace) */}
      {!embedded && (
        <div className="flex flex-wrap gap-2">
          <select
            aria-label="Organización"
            value={selectedOrg}
            onChange={(e) => {
              setSelectedOrg(e.target.value);
              setSelectedPlant('');
            }}
            className="w-full sm:w-64"
          >
            <option value="">Seleccionar organización</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
          <select aria-label="Planta" value={selectedPlant} onChange={(e) => setSelectedPlant(e.target.value)} disabled={!selectedOrg} className="w-full sm:w-64">
            <option value="">Todas las plantas</option>
            {plants.map((plant) => (
              <option key={plant.id} value={plant.id}>
                {plant.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedOrg && (
        <>
          {/* Summary: each card filters */}
          <div className={`grid grid-cols-2 gap-3 ${area ? 'sm:grid-cols-3' : 'sm:grid-cols-4'}`}>
            {summary.map(({ key, label, value, tone }) => (
              <button
                key={label}
                onClick={() => setQuick(key)}
                aria-pressed={quick === key}
                className={`rounded-lg border bg-white p-3 text-left transition-colors ${
                  quick === key ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <span className={`block text-2xl font-bold ${tone}`}>{value}</span>
                <span className="text-xs text-gray-600">{label}</span>
              </button>
            ))}
          </div>

          {/* Filters in one row */}
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative min-w-[14rem] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Buscar por nombre, SKU o descripción"
                aria-label="Buscar productos"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <select aria-label="Categoría" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value as ProductCategory | '')} className="text-sm">
              <option value="">Categoría: todas</option>
              {Object.entries(PRODUCT_CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
{!area && (
                        <select aria-label="Área" value={selectedArea} onChange={(e) => setSelectedArea(e.target.value)} className="text-sm">
              <option value="">Área: todas</option>
              {areas.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
              <option value={NO_AREA}>Sin pasos</option>
            </select>
            )}
            <select aria-label="Estado" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value as ProductStatus | '')} className="text-sm">
              <option value="">Estado: todos</option>
              {Object.entries(PRODUCT_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {/* Content */}
      {!selectedOrg ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <Package className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">Selecciona una organización</h3>
          <p className="text-gray-600">Selecciona una organización para ver su catálogo de productos</p>
        </div>
      ) : isLoading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center text-gray-600">Cargando productos...</div>
      ) : products.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <Package className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">{area ? 'No hay productos en esta área' : 'No hay productos registrados'}</h3>
          {area ? (
            <>
              <p className="mb-4 text-gray-600">Esta área no participa en ningún proceso de fabricación actualmente.</p>
              {canCreate && (
                <Button onClick={handleCreateNew} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nuevo Producto
                </Button>
              )}
            </>
          ) : (
            <>
              <p className="mb-4 text-gray-600">Comienza agregando tu primer producto</p>
              <Button onClick={handleCreateNew} className="gap-2">
                <Plus className="h-4 w-4" />
                Agregar Primer Producto
              </Button>
            </>
          )}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-sm text-gray-600">
          Ningún producto coincide con los filtros.{' '}
          {filtersActive && (
            <button onClick={clearFilters} className="font-medium text-blue-700 hover:underline">
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Table (tablets and up) */}
          <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white md:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Producto', 'SKU', 'Categoría', 'Recorrido', 'Estado'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      {h}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {visible.map((product) => (
                  <tr key={product.id} className={`transition-colors hover:bg-gray-50 cursor-pointer`} onClick={() => openDetails(product.id)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.primary_image_url ? (
                          <img src={product.primary_image_url} alt="" className="h-10 w-10 flex-shrink-0 rounded object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded bg-gray-200">
                            <Package className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <Name product={product} />
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-gray-900">{product.sku}</td>
                    <td className="px-4 py-3">
                      <Badge variant="info">{PRODUCT_CATEGORY_LABELS[product.category]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Route product={product} highlight={area?.id} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_BADGE[product.status]}>{PRODUCT_STATUS_LABELS[product.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        {canUpdate && (
                          <button onClick={() => handleEdit(product)} className="rounded p-1.5 text-blue-600 hover:bg-blue-50" title="Editar" aria-label={`Editar ${product.name}`}>
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => handleDelete(product)} className="rounded p-1.5 text-red-600 hover:bg-red-50" title="Eliminar" aria-label={`Eliminar ${product.name}`}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards (phones) */}
          <ul className="space-y-2 md:hidden">
            {visible.map((product) => (
              <li key={product.id} className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="flex items-start gap-3">
                  <button onClick={() => openDetails(product.id)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
                    {product.primary_image_url ? (
                      <img src={product.primary_image_url} alt="" className="h-12 w-12 flex-shrink-0 rounded object-cover" />
                    ) : (
                      <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded bg-gray-200">
                        <Package className="h-5 w-5 text-gray-400" />
                      </span>
                    )}
                    <span className="min-w-0">
                      <Name product={product} />
                      <span className="block font-mono text-xs text-gray-500">
                        {product.sku} · {PRODUCT_CATEGORY_LABELS[product.category]}
                      </span>
                    </span>
                  </button>
                  <Badge variant={STATUS_BADGE[product.status]}>{PRODUCT_STATUS_LABELS[product.status]}</Badge>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <Route product={product} highlight={area?.id} />
                  <span className="flex flex-shrink-0 gap-1">
                    {canUpdate && (
                      <button onClick={() => handleEdit(product)} className="rounded p-1.5 text-blue-600 hover:bg-blue-50" aria-label={`Editar ${product.name}`}>
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => handleDelete(product)} className="rounded p-1.5 text-red-600 hover:bg-red-50" aria-label={`Eliminar ${product.name}`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {isModalOpen && (
        <ProductModal isOpen={isModalOpen} onClose={handleCloseModal} product={editingProduct} organizationId={selectedOrg} plantId={selectedPlant || ''} onCreated={(created) => openDetails(created.id)} />
      )}
    </div>
  );
};

export default ProductsPage;

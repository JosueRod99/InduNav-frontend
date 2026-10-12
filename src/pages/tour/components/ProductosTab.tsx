import type { AreaProduct } from '../../../demo/enhancedTourData';
import { Package } from 'lucide-react';

interface ProductosTabProps {
  products: AreaProduct[];
  language: 'es' | 'en';
}

const ProductosTab = ({ products, language }: ProductosTabProps) => {
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-200">
        <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-slate-900 mb-1">
          {language === 'es' ? 'Sin Productos Asignados' : 'No Products Assigned'}
        </h3>
        <p className="text-xs text-slate-600">
          {language === 'es'
            ? 'Esta área no tiene productos asignados'
            : 'This area has no assigned products'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
        <h3 className="text-sm font-semibold text-blue-700 mb-1">
          {language === 'es' ? 'Productos del Área' : 'Area Products'}
        </h3>
        <p className="text-xs text-slate-600">
          {language === 'es'
            ? `${products.length} producto${products.length > 1 ? 's' : ''} se fabrica${products.length > 1 ? 'n' : ''} en esta área`
            : `${products.length} product${products.length > 1 ? 's' : ''} manufactured in this area`}
        </p>
      </div>

      {/* Products Grid */}
      <div className="grid md:grid-cols-2 gap-3">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-lg shadow-sm overflow-hidden border border-slate-200 hover:border-blue-300 transition-colors"
          >
            {/* Product Image */}
            <div className="relative h-32 overflow-hidden bg-slate-100">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2">
                <span className="inline-block px-2 py-0.5 bg-white text-xs font-mono font-semibold text-slate-900 rounded shadow">
                  {product.sku}
                </span>
              </div>
            </div>

            {/* Product Info */}
            <div className="p-3">
              <h4 className="text-sm font-bold text-slate-900 mb-1">
                {product.name}
              </h4>
              <p className="text-xs text-slate-600 mb-2">
                {product.description[language]}
              </p>

              {/* Specifications */}
              <div className="space-y-1">
                <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  {language === 'es' ? 'Especificaciones' : 'Specifications'}
                </h5>
                <div className="bg-slate-50 rounded p-2 space-y-1">
                  {Object.entries(product.specifications).map(([key, value], index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">{key}:</span>
                      <span className="font-semibold text-slate-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4 text-white">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div>
            <div className="text-2xl font-bold mb-0.5">{products.length}</div>
            <div className="text-xs text-blue-100">
              {language === 'es' ? 'Productos' : 'Products'}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold mb-0.5">100%</div>
            <div className="text-xs text-blue-100">
              {language === 'es' ? 'Certificados' : 'Certified'}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold mb-0.5">
              {products.reduce((sum, p) => sum + Object.keys(p.specifications).length, 0)}
            </div>
            <div className="text-xs text-blue-100">
              {language === 'es' ? 'Especificaciones' : 'Specifications'}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold mb-0.5">A+</div>
            <div className="text-xs text-blue-100">
              {language === 'es' ? 'Calificación' : 'Rating'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductosTab;

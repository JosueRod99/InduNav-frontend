import { ChevronRight, Home } from 'lucide-react';
import type { OrganizationalArea } from '../../api/areas';

interface AreaBreadcrumbProps {
  path: OrganizationalArea[];
  onAreaClick?: (area: OrganizationalArea) => void;
  className?: string;
  showHome?: boolean;
}

const AreaBreadcrumb = ({
  path,
  onAreaClick,
  className = '',
  showHome = true,
}: AreaBreadcrumbProps) => {
  if (!path || path.length === 0) {
    return null;
  }

  return (
    <nav className={`flex items-center gap-2 text-sm ${className}`} aria-label="Breadcrumb">
      {showHome && (
        <>
          <button
            onClick={() => onAreaClick?.(path[0])}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Home"
          >
            <Home className="w-4 h-4" />
          </button>
          {path.length > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
        </>
      )}

      {path.map((area, index) => {
        const isLast = index === path.length - 1;

        return (
          <div key={area.id} className="flex items-center gap-2">
            <button
              onClick={() => !isLast && onAreaClick?.(area)}
              className={`truncate max-w-xs transition-colors
                ${isLast
                  ? 'text-gray-900 font-semibold cursor-default'
                  : 'text-gray-600 hover:text-gray-900 cursor-pointer'
                }
              `}
              disabled={isLast}
            >
              {area.name}
            </button>

            {!isLast && <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
          </div>
        );
      })}
    </nav>
  );
};

export default AreaBreadcrumb;

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Building2, X } from 'lucide-react';
import type { AreaTreeNode } from '../../api/areas';

interface AreaSelectorProps {
  areas: AreaTreeNode[];
  selectedAreaId?: string | null;
  onSelect: (area: AreaTreeNode | null) => void;
  placeholder?: string;
  className?: string;
  allowClear?: boolean;
  disabled?: boolean;
  label?: string;
  required?: boolean;
  error?: string;
}

const AreaSelector = ({
  areas,
  selectedAreaId,
  onSelect,
  placeholder = 'Seleccionar área...',
  className = '',
  allowClear = true,
  disabled = false,
  label,
  required = false,
  error,
}: AreaSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find selected area
  const findArea = (areas: AreaTreeNode[], id: string): AreaTreeNode | null => {
    for (const area of areas) {
      if (area.id === id) return area;
      if (area.children) {
        const found = findArea(area.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const selectedArea = selectedAreaId ? findArea(areas, selectedAreaId) : null;

  // Flatten areas for search
  const flattenAreas = (areas: AreaTreeNode[], level = 0): Array<AreaTreeNode & { level: number }> => {
    const result: Array<AreaTreeNode & { level: number }> = [];
    for (const area of areas) {
      result.push({ ...area, level });
      if (area.children) {
        result.push(...flattenAreas(area.children, level + 1));
      }
    }
    return result;
  };

  const flatAreas = flattenAreas(areas);

  // Filter areas by search term
  const filteredAreas = searchTerm
    ? flatAreas.filter((area) =>
        area.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (area.code && area.code.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : flatAreas;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (area: AreaTreeNode) => {
    onSelect(area);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Selector Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 border rounded-md bg-white transition-colors
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-400 cursor-pointer'}
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
        `}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
          {selectedArea ? (
            <div className="flex items-center gap-2 truncate">
              {selectedArea.color && (
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: selectedArea.color }}
                />
              )}
              <span className="truncate">{selectedArea.full_path_name || selectedArea.name}</span>
              {selectedArea.code && (
                <span className="text-xs text-gray-500 flex-shrink-0">({selectedArea.code})</span>
              )}
            </div>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {allowClear && selectedArea && !disabled && (
            <button
              onClick={handleClear}
              className="p-0.5 hover:bg-gray-200 rounded transition-colors"
              type="button"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
          />
        </div>
      </button>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar área..."
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {/* Area List */}
          <div className="overflow-y-auto max-h-64">
            {filteredAreas.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-gray-500">
                No se encontraron áreas
              </div>
            ) : (
              filteredAreas.map((area) => {
                const isSelected = area.id === selectedAreaId;

                return (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => handleSelect(area)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors
                      ${isSelected ? 'bg-blue-50 text-blue-700' : ''}
                    `}
                    style={{ paddingLeft: `${area.level * 1.5 + 0.75}rem` }}
                  >
                    {area.color && (
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: area.color }}
                      />
                    )}
                    <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="flex-1 truncate">{area.name}</span>
                    {area.code && (
                      <span className="text-xs text-gray-500 flex-shrink-0">({area.code})</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AreaSelector;

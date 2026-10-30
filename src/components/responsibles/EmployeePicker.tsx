import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Search } from 'lucide-react';
import { getEmployees, type Employee } from '../../api/employees';
import { personName } from '../../utils/personName';
import EmployeeAvatar from '../employees/EmployeeAvatar';

// Search box to pick an employee of the organization. People of `plantId` are listed first.

interface EmployeePickerProps {
  organizationId: string;
  plantId?: string | null;
  excludeIds?: string[];
  onPick: (employee: Employee) => void;
  autoFocus?: boolean;
}

const EmployeePicker = ({ organizationId, plantId, excludeIds = [], onPick, autoFocus }: EmployeePickerProps) => {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isFetching } = useQuery({
    queryKey: ['employee-picker', organizationId, debounced],
    queryFn: () => getEmployees({ organization_id: organizationId, search: debounced || undefined, is_active: true, limit: 30 }),
    enabled: !!organizationId,
    staleTime: 30_000,
  });
  const employees = (data?.employees || [])
    .filter((e) => !excludeIds.includes(e.id))
    .sort((a, b) => Number(b.plant_id === plantId) - Number(a.plant_id === plantId));

  return (
    <div className="space-y-2">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus={autoFocus}
          placeholder="Buscar por nombre, número o correo"
          aria-label="Buscar empleado"
          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-9 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
        {isFetching && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />}
      </label>
      <ul className="max-h-64 divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-200" role="listbox" aria-label="Empleados">
        {employees.map((e) => (
          <li key={e.id}>
            <button
              type="button"
              role="option"
              aria-selected={false}
              onClick={() => onPick(e)}
              className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-blue-50"
            >
              <EmployeeAvatar person={e} size={32} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-gray-900">{personName(e)}</span>
                <span className="block truncate text-xs text-gray-500">
                  {[e.position, e.primary_area?.name].filter(Boolean).join(' · ') || 'Sin puesto'}
                </span>
              </span>
              {plantId && e.plant_id !== plantId && <span className="flex-shrink-0 text-[11px] text-gray-400">Otra planta</span>}
            </button>
          </li>
        ))}
        {!isFetching && employees.length === 0 && <li className="px-3 py-4 text-center text-sm text-gray-500">Sin resultados</li>}
      </ul>
    </div>
  );
};

export default EmployeePicker;

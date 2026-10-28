import { useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Back arrows that return to the page you came from. Opening a page with `useNavigateWithBack`
// records where you were (in the router state); the opened page reads it with `useBackTarget`
// and falls back to its usual parent when there is none (link opened directly, page reloaded).

export interface BackTarget {
  path: string;
  label: string; // e.g. "Volver al área"
}

const PLANT_TAB_LABELS: Record<string, string> = {
  resumen: 'Volver al resumen de la planta',
  layout: 'Volver al Layout',
  areas: 'Volver a Áreas',
  equipos: 'Volver a Equipos',
  productos: 'Volver a Productos',
  personal: 'Volver a Personal',
  tours: 'Volver a Tours',
};

const labelFor = (pathname: string) => {
  const [first, , third] = pathname.split('/').filter(Boolean);
  if (first === 'areas') return 'Volver al área';
  if (first === 'equipment') return 'Volver al equipo';
  if (first === 'products') return 'Volver al producto';
  if (first === 'organizations') return 'Volver a la empresa';
  if (first === 'plants' && third) return PLANT_TAB_LABELS[third] || 'Volver a la planta';
  return 'Volver';
};

/** navigate(path) that lets the opened page return here */
export const useNavigateWithBack = () => {
  const navigate = useNavigate();
  const location = useLocation();
  return useCallback(
    (path: string) => {
      const backTo: BackTarget = { path: location.pathname + location.search, label: labelFor(location.pathname) };
      navigate(path, { state: { backTo } });
    },
    [navigate, location.pathname, location.search]
  );
};

/** State for a <Link> that lets the opened page return here */
export const useBackState = () => {
  const location = useLocation();
  return { backTo: { path: location.pathname + location.search, label: labelFor(location.pathname) } as BackTarget };
};

/**
 * Where this page's back arrow goes. `scopeKey` identifies the page (e.g. its record id): the
 * origin is kept while the page changes its own tabs/query, and forgotten when another record opens.
 */
export const useBackTarget = (scopeKey: string, fallback: BackTarget): BackTarget & { fromOrigin: boolean } => {
  const location = useLocation();
  const remembered = useRef<{ key: string; target: BackTarget } | null>(null);
  const fromState = (location.state as { backTo?: BackTarget } | null)?.backTo;
  if (fromState?.path) remembered.current = { key: scopeKey, target: fromState };
  else if (remembered.current?.key !== scopeKey) remembered.current = null;
  return remembered.current ? { ...remembered.current.target, fromOrigin: true } : { ...fallback, fromOrigin: false };
};

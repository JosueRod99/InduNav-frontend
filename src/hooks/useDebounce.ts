import { useEffect, useState } from 'react';

/**
 * Hook para hacer debounce de un valor
 * @param value - Valor a hacer debounce
 * @param delay - Delay en milisegundos (default: 500ms)
 * @returns Valor con debounce aplicado
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set timeout to update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function - cancels timeout if value changes before delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

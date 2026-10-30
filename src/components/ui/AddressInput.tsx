import { useEffect, useId, useRef, useState } from 'react';
import { CheckCircle2, Loader2, MapPin } from 'lucide-react';
import {
  coordinatesUrl,
  fetchAddress,
  fetchAddressSuggestions,
  newSessionToken,
  placesEnabled,
  type AddressDetails,
  type AddressSuggestion,
} from '../../utils/googlePlaces';

// Street address with Google Places suggestions (Mexico and the United States). Typing by hand is
// always allowed: then only the text is kept (details = null). Without the Google key, or if Google
// fails, it is a plain text input.

interface AddressInputProps {
  id?: string;
  value: string;
  details?: AddressDetails | null;
  onChange: (address: string, details: AddressDetails | null) => void;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

const MIN_CHARS = 3;
const DEBOUNCE_MS = 300;

const AddressInput = ({ id, value, details, onChange, placeholder, disabled, ariaLabel, className = '' }: AddressInputProps) => {
  const listId = useId();
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [picking, setPicking] = useState(false);
  const [query, setQuery] = useState<string | null>(null); // what the user is typing (null: nothing new)
  const token = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const lastRequest = useRef(0);

  // Suggestions for what is being typed (debounced; one billing session until an address is picked)
  useEffect(() => {
    if (!placesEnabled || query === null || query.trim().length < MIN_CHARS) {
      setSuggestions([]);
      return;
    }
    const request = ++lastRequest.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        token.current = token.current || (await newSessionToken());
        const found = await fetchAddressSuggestions(query.trim(), token.current);
        if (request === lastRequest.current) {
          setSuggestions(found);
          setActive(-1);
          setOpen(true);
        }
      } catch {
        if (request === lastRequest.current) setSuggestions([]); // Google unavailable: plain text
      } finally {
        if (request === lastRequest.current) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const pick = async (suggestion: AddressSuggestion) => {
    setOpen(false);
    setPicking(true);
    try {
      const { formatted, details: picked } = await fetchAddress(suggestion);
      onChange(formatted, picked);
    } catch {
      onChange(`${suggestion.main}${suggestion.secondary ? `, ${suggestion.secondary}` : ''}`, null);
    } finally {
      token.current = null; // the session ends with the chosen place
      setQuery(null);
      setSuggestions([]);
      setPicking(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || !suggestions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      void pick(suggestions[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const showList = open && suggestions.length > 0;

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          id={id}
          type="text"
          value={value}
          disabled={disabled || picking}
          aria-label={ariaLabel}
          placeholder={placeholder || (placesEnabled ? 'Escribe y elige la dirección de la lista' : 'Calle, número, colonia, ciudad')}
          autoComplete="off"
          role={placesEnabled ? 'combobox' : undefined}
          aria-expanded={placesEnabled ? showList : undefined}
          aria-controls={placesEnabled ? listId : undefined}
          aria-autocomplete={placesEnabled ? 'list' : undefined}
          aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
          onChange={(e) => {
            onChange(e.target.value, null); // typed by hand: no verified place
            setQuery(e.target.value);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onFocus={() => suggestions.length && setOpen(true)}
          maxLength={500}
          className="block w-full rounded-md border border-gray-300 py-2 pl-9 pr-9 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:bg-gray-50"
        />
        {(loading || picking) && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />}
      </div>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg"
        >
          {suggestions.map((s, i) => (
            <li
              key={s.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault(); // keep focus until picked
                void pick(s);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-start gap-2 px-3 py-2 text-sm ${i === active ? 'bg-blue-50' : ''}`}
            >
              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
              <span className="min-w-0">
                <span className="block truncate font-medium text-gray-900">{s.main}</span>
                {s.secondary && <span className="block truncate text-xs text-gray-500">{s.secondary}</span>}
              </span>
            </li>
          ))}
          {/* Required by Google when its results are not shown on a Google map */}
          <li role="presentation" className="border-t border-gray-100 px-3 pt-1.5 text-right text-[11px] text-gray-400">
            powered by Google
          </li>
        </ul>
      )}

      {details && value && (
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-green-700">
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Dirección verificada
          </span>
          <a href={coordinatesUrl(details)} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">
            Ver en Google Maps
          </a>
        </p>
      )}
    </div>
  );
};

export default AddressInput;

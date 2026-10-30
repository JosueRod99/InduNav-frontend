/// <reference types="google.maps" />
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';

// Address suggestions with Google Places (API New). Without VITE_GOOGLE_MAPS_API_KEY, or when Google
// fails to load, address fields work as plain text. Billing: one session per address (token),
// suggestions for Mexico and the United States only, and only "Essentials" place fields.

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
const REGIONS = ['mx', 'us'];

export const placesEnabled = !!API_KEY;

/** Address picked from the suggestions (stored as address_details, see backend utils/address.ts) */
export interface AddressDetails {
  place_id: string;
  lat: number;
  lng: number;
  street: string | null;
  city: string | null;
  state: string | null;
  state_code: string | null;
  country: string; // ISO 3166-1 alpha-2
  postal_code: string | null;
}

export interface AddressSuggestion {
  id: string;
  main: string;
  secondary: string;
  prediction: google.maps.places.PlacePrediction;
}

let placesLibrary: Promise<google.maps.PlacesLibrary> | null = null;
const loadPlaces = () => {
  if (!placesLibrary) {
    setOptions({ key: API_KEY, v: 'weekly', language: 'es', region: 'MX' });
    placesLibrary = importLibrary('places').catch((error) => {
      placesLibrary = null; // try again next time
      throw error;
    });
  }
  return placesLibrary;
};

export const newSessionToken = async () => new (await loadPlaces()).AutocompleteSessionToken();

export const fetchAddressSuggestions = async (input: string, sessionToken: google.maps.places.AutocompleteSessionToken): Promise<AddressSuggestion[]> => {
  const { AutocompleteSuggestion } = await loadPlaces();
  const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
    input,
    sessionToken,
    includedRegionCodes: REGIONS,
    language: 'es',
  });
  return suggestions
    .map((s) => s.placePrediction)
    .filter((p): p is google.maps.places.PlacePrediction => !!p)
    .map((p) => ({ id: p.placeId, main: p.mainText?.text || p.text.text, secondary: p.secondaryText?.text || '', prediction: p }));
};

/** Full address of the chosen suggestion (ends the billing session) */
export const fetchAddress = async (suggestion: AddressSuggestion): Promise<{ formatted: string; details: AddressDetails }> => {
  const place = suggestion.prediction.toPlace();
  await place.fetchFields({ fields: ['formattedAddress', 'addressComponents', 'location'] });
  const part = (type: string, short = false) => {
    const component = place.addressComponents?.find((c) => c.types.includes(type));
    return (short ? component?.shortText : component?.longText) || null;
  };
  const street = [part('route'), part('street_number')].filter(Boolean).join(' ') || null;
  return {
    formatted: place.formattedAddress || suggestion.prediction.text.text,
    details: {
      place_id: place.id,
      lat: place.location?.lat() ?? 0,
      lng: place.location?.lng() ?? 0,
      street,
      city: part('locality') || part('administrative_area_level_2') || part('sublocality'),
      state: part('administrative_area_level_1'),
      state_code: part('administrative_area_level_1', true),
      country: (part('country', true) || '').toUpperCase(),
      postal_code: part('postal_code'),
    },
  };
};

/** "Ciudad Juárez, Chih." — short label of a place (plants.location) */
export const cityStateLabel = (details: AddressDetails) => [details.city, details.state_code || details.state].filter(Boolean).join(', ');

/** Google Maps showing the point at the address coordinates (free: a link, not the API) */
export const coordinatesUrl = (details: Pick<AddressDetails, 'lat' | 'lng'>) => `https://www.google.com/maps/search/?api=1&query=${details.lat},${details.lng}`;

/** Google Maps directions to the address (free: a link, not the API) */
export const directionsUrl = (address: string, details?: AddressDetails | null) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}${
    details?.place_id ? `&destination_place_id=${encodeURIComponent(details.place_id)}` : ''
  }`;

/** What a picked plant address suggests for its other fields: "City, State" and the time zone */
export const plantAddressDefaults = async (details: AddressDetails) => {
  const { timezoneAt } = await import('./timezoneAt');
  return { location: cityStateLabel(details), timezone: await timezoneAt(details.lat, details.lng) };
};

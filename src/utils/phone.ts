import { parsePhoneNumberFromString } from 'libphonenumber-js';

// Phone numbers are stored in international E.164 format (+526564128901). Mexican numbers are shown
// in national format (656 412 8901); other countries keep their code (+1 915 555 0100).
// Values that cannot be parsed (older free text) are shown as they are.

const DEFAULT_COUNTRY = 'MX';

export const formatPhone = (value: string | null | undefined) => {
  if (!value) return '';
  const phone = parsePhoneNumberFromString(value, DEFAULT_COUNTRY);
  if (!phone) return value;
  return phone.country === DEFAULT_COUNTRY ? phone.formatNational() : phone.formatInternational();
};

/** "tel:" link that works from any country */
export const phoneHref = (value: string | null | undefined) => {
  if (!value) return undefined;
  const phone = parsePhoneNumberFromString(value, DEFAULT_COUNTRY);
  return `tel:${phone ? phone.number : value.replace(/[^\d+]/g, '')}`;
};

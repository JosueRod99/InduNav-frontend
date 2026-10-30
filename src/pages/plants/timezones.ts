// Time zones offered for a plant (Mexico and the United States, plus a few others). Picking the plant
// address fills it automatically (utils/timezoneAt.ts); a zone missing here still shows by its name.
// Offsets are the standard (winter) time.
export const PLANT_TIMEZONES = [
  { value: 'America/Mexico_City', label: 'Ciudad de México (GMT-6)' },
  { value: 'America/Monterrey', label: 'Monterrey (GMT-6)' },
  { value: 'America/Merida', label: 'Mérida (GMT-6)' },
  { value: 'America/Bahia_Banderas', label: 'Bahía de Banderas (GMT-6)' },
  { value: 'America/Chihuahua', label: 'Chihuahua (GMT-6)' },
  { value: 'America/Matamoros', label: 'Matamoros (GMT-6)' },
  { value: 'America/Ojinaga', label: 'Ojinaga (GMT-6)' },
  { value: 'America/Cancun', label: 'Cancún (GMT-5)' },
  { value: 'America/Ciudad_Juarez', label: 'Ciudad Juárez (GMT-7)' },
  { value: 'America/Mazatlan', label: 'Mazatlán (GMT-7)' },
  { value: 'America/Hermosillo', label: 'Hermosillo (GMT-7)' },
  { value: 'America/Tijuana', label: 'Tijuana (GMT-8)' },
  { value: 'America/New_York', label: 'New York (GMT-5)' },
  { value: 'America/Detroit', label: 'Detroit (GMT-5)' },
  { value: 'America/Chicago', label: 'Chicago (GMT-6)' },
  { value: 'America/Denver', label: 'Denver (GMT-7)' },
  { value: 'America/Boise', label: 'Boise (GMT-7)' },
  { value: 'America/Phoenix', label: 'Phoenix (GMT-7)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (GMT-8)' },
  { value: 'America/Anchorage', label: 'Anchorage (GMT-9)' },
  { value: 'Pacific/Honolulu', label: 'Honolulu (GMT-10)' },
  { value: 'Europe/Madrid', label: 'Madrid (GMT+1)' },
  { value: 'Europe/London', label: 'London (GMT+0)' },
];

export const timezoneLabel = (value: string) => PLANT_TIMEZONES.find((tz) => tz.value === value)?.label || value;

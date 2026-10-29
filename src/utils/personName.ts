// "Ing. Roberto Mendoza": a person's name with their title (employees have an optional name_prefix)
export const personName = (person: { name_prefix?: string | null; first_name?: string | null; last_name?: string | null } | null | undefined) =>
  person ? [person.name_prefix, person.first_name, person.last_name].filter(Boolean).join(' ') : '';

// Titles offered when typing one (any other text is also accepted)
export const NAME_PREFIXES = ['Ing.', 'Lic.', 'C.P.', 'Tec.', 'Dr.', 'Dra.', 'Mtro.', 'Mtra.', 'Arq.'];

import type { LiveNotes, TourView, TourViewStop } from '../../api/tourView';

// Live data of the tour (safety, positions, processes...) in the visitor's language. It stays in the
// organization's language; the server sends the translations of the texts this tour shows
// (backend services/liveTranslationService.ts, same list of fields). A text without translation
// is shown as it is: when a datum changes it is shown in the original until it is translated.

// Numbers, codes and empty values are shown as they are
const isText = (value: unknown): value is string => typeof value === 'string' && /\p{L}/u.test(value);

/** The view with its live data in a language, and per stop what to tell the visitor about it */
export const localizeView = (view: TourView, language: string): TourView => {
  const liveLanguage = view.tour.live_language ?? view.tour.source_language;
  const translations = view.tour.live_translations?.[language];
  if (language === liveLanguage || !translations) return view;

  const find = (text: string | null | undefined) => (isText(text) ? translations[text.trim()] : undefined);
  const plain = <T extends string | null | undefined>(text: T): T => (find(text)?.text as T) ?? text;

  const localizeStop = (stop: TourViewStop): TourViewStop => {
    const shown = new Set(stop.sections.map((section) => section.key));
    const notes: LiveNotes = { machine: false, safety_machine: false, original: false };
    // Only the texts of the sections visitors see count for the notes
    const tr = (visible: boolean, safety = false) => <T extends string | null | undefined>(text: T): T => {
      if (!isText(text)) return text;
      const found = find(text);
      if (visible) {
        if (!found) notes.original = true;
        else if (found.auto) {
          notes.machine = true;
          if (safety) notes.safety_machine = true;
        }
      }
      return (found?.text as T) ?? text;
    };
    const always = tr(true);
    const personnel = tr(shown.has('personnel'));
    const safety = tr(shown.has('safety'), true);
    const processes = tr(shown.has('processes'));
    const products = tr(shown.has('products'));
    const equipment = tr(shown.has('equipment'));
    const location = tr(shown.has('location'));
    const { live } = stop;

    const localized: TourViewStop = {
      ...stop,
      area: stop.area && { ...stop.area, name: always(stop.area.name), description: always(stop.area.description) },
      responsible: stop.responsible && { ...stop.responsible, position: always(stop.responsible.position) },
      live: {
        ...live,
        personnel: live.personnel.map((person) => ({ ...person, position: personnel(person.position) })),
        headcount: live.headcount?.map((row) => ({ ...row, position: personnel(row.position), shift: personnel(row.shift) })),
        safety: live.safety && {
          ...live.safety,
          required_ppe: live.safety.required_ppe.map(safety),
          hazards: live.safety.hazards.map((hazard) => ({ ...hazard, name: safety(hazard.name) })),
          emergency_assembly_point: safety(live.safety.emergency_assembly_point),
          access_requirements: safety(live.safety.access_requirements),
          special_instructions: safety(live.safety.special_instructions),
        },
        processes: live.processes?.map((step) => ({
          ...step,
          process_name: processes(step.process_name),
          name: processes(step.name),
          description: processes(step.description),
          activities: step.activities.map(processes),
        })),
        products: live.products.map((product) => ({
          ...product,
          description: products(product.description),
          steps: product.steps.map((step) => ({ ...step, step_name: products(step.step_name) })),
        })),
        equipment: live.equipment.map((machine) => ({
          ...machine,
          used_in: machine.used_in.map((use) => ({ ...use, step_name: equipment(use.step_name) })),
        })),
        interior: live.interior && { ...live.interior, sub_areas: live.interior.sub_areas.map((zone) => ({ ...zone, name: location(zone.name) })) },
        interiors: live.interiors?.map((floor) => ({ ...floor, sub_areas: floor.sub_areas.map((zone) => ({ ...zone, name: location(zone.name) })) })),
      },
    };
    return { ...localized, live_notes: notes };
  };

  const profile = view.tour.organization.profile;
  const layout = <T extends { areas: { name: string }[] }>(floor: T): T => ({ ...floor, areas: floor.areas.map((area) => ({ ...area, name: plain(area.name) })) });
  return {
    ...view,
    tour: {
      ...view.tour,
      organization: {
        ...view.tour.organization,
        profile: profile && {
          ...profile,
          industry: plain(profile.industry),
          plant: profile.plant && { ...profile.plant, description: plain(profile.plant.description) },
        },
      },
    },
    plant_layout: view.plant_layout && layout(view.plant_layout),
    plant_layouts: view.plant_layouts?.map(layout),
    stops: view.stops.map(localizeStop),
  };
};

import { useQueries, useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { getPlants, getPlantSummary } from '../../api/plants';
import { AttentionList, FigureCards, plural, PlantCards, visitsTrend, type Figure } from '../../components/ui/SummaryParts';
import PlantSummaryTab from '../plants/PlantSummaryTab';

// "Inicio" of a plant manager: with one plant, that plant's summary; with several, what needs
// attention in all of them (each plant's summary is what the plant page already asks for).

const PlantManagerHome = ({ organizationId }: { organizationId?: string }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['plants', 'home', organizationId ?? 'mine'],
    queryFn: () => getPlants({ limit: 100, organization_id: organizationId }),
  });
  const plants = (data?.plants || []).filter((p) => p.is_active);
  const summaries = useQueries({
    queries: plants.length > 1 ? plants.map((p) => ({ queryKey: ['plant-summary', 'home', p.id], queryFn: () => getPlantSummary(p.id) })) : [],
  });

  if (isLoading) {
    return (
      <p className="flex items-center gap-2 text-gray-600">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
      </p>
    );
  }
  if (plants.length === 0) return <p className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">Aún no hay plantas.</p>;
  if (plants.length === 1) return <PlantSummaryTab plant={plants[0]} />;

  const loaded = plants.map((plant, index) => ({ plant, summary: summaries[index]?.data })).filter((x) => x.summary);
  const sum = (pick: (s: NonNullable<(typeof loaded)[number]['summary']>) => number) => loaded.reduce((total, { summary }) => total + pick(summary!), 0);

  const visits = sum((s) => s.tours.visits_30d);
  const figures: Figure[] = [
    { label: 'Plantas', value: plants.length },
    { label: 'Áreas', value: sum((s) => s.counts.areas) },
    { label: 'Personal registrado', value: sum((s) => s.counts.employees) },
    { label: 'Tours publicados', value: sum((s) => s.counts.tours_published), to: '/tours' },
    { label: 'Visitas en 30 días', value: visits, hint: visitsTrend(visits, sum((s) => s.tours.visits_prev_30d)) },
  ];

  // Most urgent first: stopped equipment, certifications, then who is in charge
  const attention = [
    ...loaded.flatMap(({ plant, summary }) => {
      const stopped = summary!.alerts.equipment.filter((e) => e.status === 'out_of_service').length;
      return stopped ? [{ text: `${plant.name}: ${plural(stopped, 'equipo fuera de servicio', 'equipos fuera de servicio')}`, to: `/plants/${plant.id}/resumen` }] : [];
    }),
    ...loaded.flatMap(({ plant, summary }) => {
      const maintenance = summary!.alerts.equipment.filter((e) => e.status === 'maintenance').length;
      return maintenance ? [{ text: `${plant.name}: ${plural(maintenance, 'equipo en mantenimiento', 'equipos en mantenimiento')}`, to: `/plants/${plant.id}/resumen` }] : [];
    }),
    ...loaded.flatMap(({ plant, summary }) => {
      const count = summary!.alerts.certifications.length;
      return count ? [{ text: `${plant.name}: ${plural(count, 'certificación con vencimiento o auditoría próxima', 'certificaciones con vencimiento o auditoría próxima')}`, to: `/plants/${plant.id}/certificaciones` }] : [];
    }),
    ...loaded.flatMap(({ plant, summary }) => {
      const count = summary!.alerts.certified_people.reduce((total, c) => total + c.expiring + c.expired, 0);
      return count ? [{ text: `${plant.name}: ${plural(count, 'certificación de personal vencida o por vencer', 'certificaciones de personal vencidas o por vencer')}`, to: `/plants/${plant.id}/certificaciones` }] : [];
    }),
    ...loaded.flatMap(({ plant, summary }) => {
      const count = summary!.alerts.without_supervisor.total;
      return count ? [{ text: `${plant.name}: ${plural(count, 'área sin supervisor', 'áreas sin supervisor')}`, to: `/plants/${plant.id}/areas` }] : [];
    }),
  ];

  return (
    <div className="space-y-4">
      <FigureCards figures={figures} className="sm:grid-cols-3 xl:grid-cols-5" />
      <AttentionList items={attention} />
      <PlantCards
        plants={plants.map((p) => ({
          id: p.id,
          name: p.name,
          location: p.location,
          is_active: p.is_active,
          cover_url: p.cover_url,
          areas: p.areas_count ?? 0,
          employees: p.employees_count ?? 0,
          tours: p.tours_count ?? 0,
        }))}
      />
    </div>
  );
};

export default PlantManagerHome;

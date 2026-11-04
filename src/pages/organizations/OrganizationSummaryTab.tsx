import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { getOrganizationSummary } from '../../api/organizations';
import SectionHeader from '../../components/ui/SectionHeader';
import { AttentionList, FigureCards, plural, PlantCards, visitsTrend, type Figure } from '../../components/ui/SummaryParts';

// Summary of an organization: key figures, what needs attention and its plants. It is its page's
// "Resumen" tab and the owner's "Inicio" (without the section title).

const OrganizationSummaryTab = ({ organizationId, showHeader = true }: { organizationId: string; showHeader?: boolean }) => {
  const base = `/organizations/${organizationId}`;
  const { data, isLoading, error } = useQuery({
    queryKey: ['organization-summary', organizationId],
    queryFn: () => getOrganizationSummary(organizationId),
  });

  if (isLoading) {
    return (
      <p className="flex items-center gap-2 text-gray-600">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando resumen…
      </p>
    );
  }
  if (error || !data) return <p className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">No se pudo cargar el resumen.</p>;

  const figures: Figure[] = [
    { label: 'Plantas', value: data.plants, to: `${base}/plantas` },
    { label: 'Personal registrado', value: data.employees },
    { label: 'Tours', value: data.tours, hint: plural(data.tours_published, 'publicado', 'publicados'), to: '/tours' },
    { label: 'Visitas en 30 días', value: data.visits_30d, hint: visitsTrend(data.visits_30d, data.visits_prev_30d) },
    { label: 'Documentos', value: data.documents, hint: 'incluye los de sus plantas', to: `${base}/documentos` },
    { label: 'Publicaciones del mes', value: `${data.publications_used} de ${data.publications_limit}`, hint: 'se reinicia el día 1' },
  ];

  const noPlan = data.plants_list.filter((p) => p.is_active && !p.has_plan);
  const nearLimit = data.publications_limit > 0 && data.publications_used / data.publications_limit >= data.near_limit_ratio;
  const attention = [
    ...(data.certifications_alert ? [{ text: `${plural(data.certifications_alert, 'certificación', 'certificaciones')} de la empresa vencida o por vencer`, to: `${base}/documentos` }] : []),
    ...(data.people_certification_alerts
      ? [{ text: `${plural(data.people_certification_alerts, 'persona', 'personas')} con certificaciones vencidas o por vencer`, to: `${base}/plantas` }]
      : []),
    ...(nearLimit ? [{ text: `Cerca del límite: ${data.publications_used} de ${data.publications_limit} publicaciones este mes`, to: `${base}/configuracion` }] : []),
    ...(data.plants === 0 ? [{ text: 'Aún no tiene plantas', to: `${base}/plantas` }] : []),
    ...noPlan.map((p) => ({ text: `${p.name}: sin plano`, to: `/plants/${p.id}/layout` })),
    ...(data.tours_unpublished_changes ? [{ text: `${plural(data.tours_unpublished_changes, 'tour', 'tours')} con cambios sin publicar`, to: '/tours' }] : []),
    ...(data.profile_missing.length ? [{ text: `Perfil incompleto: falta ${data.profile_missing.join(', ')}`, to: `${base}/perfil` }] : []),
  ];

  return (
    <div className="space-y-4">
      {showHeader && <SectionHeader title="Resumen" description="Cómo va la empresa y qué conviene revisar." />}
      <FigureCards figures={figures} />
      <AttentionList items={attention} />
      {data.plants_list.length > 0 && <PlantCards plants={data.plants_list} />}
    </div>
  );
};

export default OrganizationSummaryTab;

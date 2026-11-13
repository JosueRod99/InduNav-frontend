import { useQuery } from '@tanstack/react-query';
import { getTranslationAlerts } from '../api/tourBuilder';
import { useCan } from './usePermissions';

// Items for "Requiere atención" on Inicio: published tours whose plant data the hourly review
// translated since this user last opened them. Opening the tour in the editor turns each one off.

export const useTranslationAlerts = (organizationId?: string) => {
  const canEdit = useCan()('tours.update');
  const { data } = useQuery({
    queryKey: ['translation-alerts', organizationId ?? 'mine'],
    queryFn: () => getTranslationAlerts(organizationId),
    enabled: canEdit,
  });
  return (data ?? []).map((alert) => ({
    text: `${alert.tour_title}: ${alert.texts === 1 ? 'un dato de la planta se tradujo' : `${alert.texts} datos de la planta se tradujeron`} automáticamente. Revísalos`,
    to: `/tours/${alert.tour_id}/edit?tab=live`,
  }));
};

//import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
//import { getOrganization } from '../api/organizations';
import OrganizationSummaryTab from './organizations/OrganizationSummaryTab';
import PlatformHome from './home/PlatformHome';
import PlantManagerHome from './home/PlantManagerHome';
import ToursHome from './home/ToursHome';
//import { previewOrganizationId, previewRole, ROLE_LABELS } from '../utils/homePreview';

// "Inicio": what each person has to look at today, according to their role. The analysis is in Reportes.

const Dashboard = () => {
  const { user } = useAuthStore();
  const role = user?.role?.name;
  const organizationId = user?.organization_id || undefined;

  // TEMPORARY: which organization the preview is showing, or that the id is not one

  /*
  const role = previewRole ?? user?.role?.name;
  const organizationId = previewRole ? previewOrganizationId : user?.organization_id || undefined;
  
  const { data: previewOrganization, isError: previewOrganizationMissing } = useQuery({
    queryKey: ['organization', previewOrganizationId],
    queryFn: () => getOrganization(previewOrganizationId!),
    enabled: !!previewOrganizationId,
    retry: false,
  });*/
  const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-4">
      {/* TEMPORARY: reminder of the preview (src/utils/homePreview.ts) */}
      {
        /*
      previewRole && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Vista de prueba: <strong>{ROLE_LABELS[previewRole]}</strong>
          {previewOrganization && (
            <>
              {' '}
              de <strong>{previewOrganization.name}</strong>
            </>
          )}
          .{previewOrganizationMissing && <strong> VITE_PREVIEW_ORG_ID no corresponde a ninguna empresa (¿es el ID de una planta?), por eso no aparecen datos.</strong>} Usa tu sesión y tus permisos; solo cambia lo que se dibuja en Inicio. Se cambia en <code>frontend/.env.local</code>.
        </p>
      )*/
      }

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Hola, {user?.first_name}</h2>
        <p className="mt-1 text-sm text-gray-600 first-letter:uppercase">{today}</p>
      </div>

      {role === 'platform_admin' ? (
        <PlatformHome />
      ) : !organizationId ? (
        <p className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">
          {
            //previewRole 
            false ? 'Falta VITE_PREVIEW_ORG_ID en frontend/.env.local.' : 'Tu usuario aún no tiene una empresa asignada.'}
        </p>
      ) : role === 'org_owner' ? (
        <OrganizationSummaryTab organizationId={organizationId} showHeader={false} />
      ) : role === 'plant_manager' ? (
        <PlantManagerHome organizationId={organizationId} />
      ) : role === 'tour_creator' ? (
        <ToursHome organizationId={organizationId} />
      ) : (
        <ToursHome organizationId={organizationId} readOnly />
      )}
    </div>
  );
};

export default Dashboard;

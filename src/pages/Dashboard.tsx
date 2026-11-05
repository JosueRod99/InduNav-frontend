import { useAuthStore } from '../store/authStore';
import OrganizationSummaryTab from './organizations/OrganizationSummaryTab';
import PlatformHome from './home/PlatformHome';
import PlantManagerHome from './home/PlantManagerHome';
import ToursHome from './home/ToursHome';
import { useCan } from '../hooks/usePermissions';

// "Inicio": what each person has to look at today, according to what they can do. The analysis is in Reportes.

const Dashboard = () => {
  const { user } = useAuthStore();
  const can = useCan();
  const organizationId = user?.organization_id || undefined;
  const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Hola, {user?.first_name}</h2>
        <p className="mt-1 text-sm text-gray-600 first-letter:uppercase">{today}</p>
      </div>

      {can('system.home') ? (
        <PlatformHome />
      ) : !organizationId ? (
        <p className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">
          Tu usuario aún no tiene una empresa asignada.
        </p>
      ) : can('organizations.read') ? (
        <OrganizationSummaryTab organizationId={organizationId} showHeader={false} />
      ) : can('plants.update') ? (
        <PlantManagerHome organizationId={organizationId} />
      ) : can('tours.read', 'tours.read_published') ? (
        <ToursHome organizationId={organizationId} readOnly={!can('tours.create')} />
      ) : (
        <p className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">
          Usa el menú para ir a las secciones que tienes disponibles.
        </p>
      )}
    </div>
  );
};

export default Dashboard;

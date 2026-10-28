import { NavLink, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPlants } from '../../api/plants';
import { useEffect, useMemo } from 'react';
import {
  AudioLines,
  ScrollText,
  Building2,
  Factory,
  Map,
  Users,
  FileText,
  BarChart3,
  X,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useSidebarStore } from '../../store/sidebarStore';
import { useAuthStore } from '../../store/authStore';

interface NavItem {
  to: string;
  icon: React.ComponentType<any>;
  label: string;
  allowedRoles?: string[]; // If undefined, accessible to all authenticated users
  activePrefix?: string; // highlighted on any page under this path (e.g. a plant's tabs)
}

// Navigation by place: each plant (and its sections: layout, areas, equipment, products,
// personal, tours) and each organization has its own page with tabs.
const generalItems: NavItem[] = [
  { to: '/dashboard', icon: BarChart3, label: 'Inicio' },
  { to: '/plants', icon: Factory, label: 'Plantas', activePrefix: '/plants' },
  { to: '/tours', icon: Map, label: 'Tours' },
  { to: '/reports', icon: FileText, label: 'Reportes' },
];

const adminItems: NavItem[] = [
  { to: '/organizations', icon: Building2, label: 'Organizaciones', activePrefix: '/organizations' },
  { to: '/users', icon: Users, label: 'Usuarios' },
  { to: '/admin/audit', icon: ScrollText, label: 'Auditoría' },
  { to: '/admin/narration-usage', icon: AudioLines, label: 'Consumo de narración' },
];

const Sidebar = () => {
  const { isOpen, isMobileMenuOpen, toggleSidebar, closeMobileMenu } = useSidebarStore();
  const { user } = useAuthStore();
  const { pathname } = useLocation();
  const role = user?.role?.name;
  const isPlatformAdmin = role === 'platform_admin';

  // A company with a single plant goes straight to it
  const { data: plantsData } = useQuery({
    queryKey: ['plants', 'mine'],
    queryFn: () => getPlants({ limit: 100 }),
    enabled: !!user && !isPlatformAdmin,
    staleTime: 5 * 60 * 1000,
  });
  const onlyPlant = !isPlatformAdmin && plantsData?.plants.length === 1 ? plantsData.plants[0] : null;

  const sections = useMemo(() => {
    const general = generalItems
      .filter((item) => !item.allowedRoles || (role && item.allowedRoles.includes(role)))
      .map((item) =>
        item.to === '/plants' && onlyPlant ? { ...item, to: `/plants/${onlyPlant.id}/resumen`, label: 'Mi planta' } : item
      );
    if (role === 'org_owner' && user?.organization_id) {
      general.push({ to: `/organizations/${user.organization_id}/plantas`, icon: Building2, label: 'Mi empresa', activePrefix: '/organizations' });
    }
    return [
      { title: null, items: general },
      ...(isPlatformAdmin ? [{ title: 'Administración', items: adminItems }] : []),
    ];
  }, [role, user?.organization_id, isPlatformAdmin, onlyPlant]);

  // Close mobile menu when route changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isMobileMenuOpen) {
        closeMobileMenu();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileMenuOpen, closeMobileMenu]);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm md:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 bg-gray-900 text-white transition-all duration-300 ease-in-out

          /* Mobile: Drawer que se desliza desde la izquierda */
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          w-64
          md:translate-x-0

          /* Tablet y Desktop: Ancho dinámico según isOpen */
          ${isOpen ? 'md:w-64' : 'md:w-16'}
        `}
      >
        {/* Logo/Header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-800 px-4">
          {/* Logo - muestra según estado */}
          <div className="flex items-center justify-center flex-1">
            <h1
              className={`
                text-2xl font-bold transition-all duration-300
                ${isOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}
              `}
            >
              INAU
            </h1>

            {/* Logo colapsado (IN) */}
            <span
              className={`
                text-xl font-bold transition-all duration-300
                ${!isOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}
              `}
            >
              IN
            </span>
          </div>

          {/* Close button - solo móvil */}
          <button
            onClick={closeMobileMenu}
            className="md:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors flex-shrink-0"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3 overflow-y-auto max-h-[calc(100vh-8rem)]">
          {sections.map((section) => (
            <div key={section.title ?? 'general'} className={section.title ? 'mt-6 border-t border-gray-800 pt-4' : ''}>
              {section.title && (
                <p
                  className={`mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 transition-opacity ${
                    isOpen ? 'opacity-100' : 'h-0 overflow-hidden opacity-0 md:h-0'
                  }`}
                >
                  {section.title}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/dashboard'}
                      onClick={() => {
                        // Close mobile menu when clicking a link
                        if (window.innerWidth < 768) {
                          closeMobileMenu();
                        }
                      }}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${isActive || (item.activePrefix && pathname.startsWith(item.activePrefix))
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`
                      }
                      title={item.label}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span
                        className={`
                          transition-all duration-300 whitespace-nowrap overflow-hidden
                          ${isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}
                        `}
                      >
                        {item.label}
                      </span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Toggle Sidebar Button - solo tablet/desktop */}
          <div className="hidden md:block mt-6 pt-6 border-t border-gray-800">
            <button
              onClick={toggleSidebar}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 text-gray-400 hover:bg-gray-800 hover:text-white w-full"
              title={isOpen ? 'Colapsar sidebar' : 'Expandir sidebar'}
            >
              {isOpen ? (
                <ChevronsLeft className="h-5 w-5 flex-shrink-0" />
              ) : (
                <ChevronsRight className="h-5 w-5 flex-shrink-0" />
              )}
              <span
                className={`
                  transition-all duration-300 whitespace-nowrap overflow-hidden
                  ${isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}
                `}
              >
                Colapsar menú
              </span>
            </button>
          </div>
        </nav>

        {/* Footer */}
        <div
          className={`
            absolute bottom-0 w-full border-t border-gray-800 p-4 transition-opacity duration-300
            ${isOpen ? 'opacity-100' : 'opacity-0 hidden'}
          `}
        >
          <p className="text-xs text-gray-500">v0.1.0</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

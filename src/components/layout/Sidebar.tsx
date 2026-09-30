import { NavLink } from 'react-router-dom';
import { useEffect } from 'react';
import {
  Building2,
  Factory,
  Map,
  QrCode,
  Users,
  LayoutGrid,
  Network,
  FileText,
  BarChart3,
  X,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useSidebarStore } from '../../store/sidebarStore';

interface NavItem {
  to: string;
  icon: React.ComponentType<any>;
  label: string;
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: BarChart3, label: 'Dashboard' },
  { to: '/organizations', icon: Building2, label: 'Organizaciones' },
  { to: '/plants', icon: Factory, label: 'Plantas' },
  { to: '/tours', icon: Map, label: 'Tours' },
  { to: '/stops', icon: QrCode, label: 'Stops & QR' },
  { to: '/layouts', icon: LayoutGrid, label: 'Layout 2D' },
  { to: '/employees', icon: Users, label: 'Empleados' },
  { to: '/org-chart', icon: Network, label: 'Organigrama' },
  { to: '/reports', icon: FileText, label: 'Reportes' },
];

const Sidebar = () => {
  const { isOpen, isMobileMenuOpen, toggleSidebar, closeMobileMenu } = useSidebarStore();

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
              InduNav
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
          <div className="space-y-1">
            {navItems.map((item) => {
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
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive
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

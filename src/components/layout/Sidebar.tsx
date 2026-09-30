import { NavLink } from 'react-router-dom';
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
} from 'lucide-react';

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
  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-gray-800">
        <h1 className="text-2xl font-bold">InduNav</h1>
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-3">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/dashboard'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 w-full border-t border-gray-800 p-4">
        <p className="text-xs text-gray-500">v0.1.0</p>
      </div>
    </aside>
  );
};

export default Sidebar;

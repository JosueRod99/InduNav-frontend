import { useNavigate } from 'react-router-dom';
import { LogOut, User, Menu } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useSidebarStore } from '../../store/sidebarStore';
import Button from '../ui/Button';

const Header = () => {
  const { user, logout } = useAuthStore();
  const { toggleMobileMenu } = useSidebarStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left side: Mobile hamburger */}
        <div className="flex items-center gap-3">
          {/* Mobile Hamburger Menu (< 768px) */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="h-6 w-6 text-gray-600" />
          </button>

          {/* Page title placeholder */}
          <div className="hidden sm:block">
            {/* Breadcrumb or page title can go here */}
          </div>
        </div>

        {/* Right side: User info + Logout */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* User info - hidden on very small screens */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-sm hidden md:block">
              <p className="font-medium text-gray-900">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-gray-500">{user?.role?.display_name}</p>
            </div>
          </div>

          {/* Logout button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;

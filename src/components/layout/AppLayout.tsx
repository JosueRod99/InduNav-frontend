import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useSidebarStore } from '../../store/sidebarStore';

const AppLayout = () => {
  const { isOpen } = useSidebarStore();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div
        className={`
          flex flex-1 flex-col transition-all duration-300 ease-in-out

          /* Mobile: Sin padding (sidebar es overlay) */
          pl-0

          /* Tablet y Desktop: Padding dinámico según estado del sidebar */
          ${isOpen ? 'md:pl-64' : 'md:pl-16'}
        `}
      >
        <Header />

        <main className="flex-1 overflow-y-auto">
          <div
            className={`
              mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 transition-all duration-300
              ${isOpen ? 'max-w-7xl' : 'max-w-full'}
            `}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

/**
 * @file AdminLayout.tsx
 * @description Responsive shell layout for the Super Admin Portal.
 * @systemic_role Provides a consistent sidebar navigation, top bar with user actions, 
 * and a main content area for all admin sub-routes.
 */
import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  FolderTree, 
  FileText, 
  ToggleLeft, 
  Menu, 
  X, 
  LogOut,
  UserCircle
} from 'lucide-react';

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/teams', label: 'Team Management', icon: Users },
  { path: '/admin/employees', label: 'Employees', icon: UserCircle },
  { path: '/admin/categories', label: 'Categories', icon: FolderTree },
  { path: '/admin/settings', label: 'Global Settings', icon: Settings },
  { path: '/admin/audit', label: 'Audit Log', icon: FileText },
  { path: '/admin/flags', label: 'Feature Flags', icon: ToggleLeft },
];

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
          <span className="text-xl font-bold text-[var(--accent)]">Super Admin</span>
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="mt-6 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-[var(--accent-bg)] text-[var(--accent)]' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon size={20} className="mr-3" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-16 items-center justify-between bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-700 lg:hidden"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center space-x-4 ml-auto">
            <Link to="/" className="text-sm text-gray-600 hover:text-[var(--accent)]">
              ← Back to Storefront
            </Link>
            <button className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-[var(--accent)]">
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
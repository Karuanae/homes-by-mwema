import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import UserSidebar from './UserSidebar';

const UserLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Sidebar - Sticky on desktop */}
      <UserSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content - Scrollable */}
      <div className="flex-1 flex flex-col min-h-screen overflow-auto">
        {/* Mobile Header - Sticky */}
        <header className="lg:hidden sticky top-0 z-30 bg-stone-900 text-white px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-medium">Account</span>
        </header>

        {/* Page Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default UserLayout;

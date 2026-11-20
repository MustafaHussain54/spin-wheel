import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Award, Settings, LogOut, ExternalLink } from 'lucide-react';

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const adminUser = JSON.parse(localStorage.getItem('expo_admin_user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('expo_admin_token');
    localStorage.removeItem('expo_admin_user');
    navigate('/admin/login');
  };

  const navItems = [
    { label: 'Overview', to: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Visitors & Winners', to: '/admin/visitors', icon: Users },
    { label: 'Prize & Probability', to: '/admin/prizes', icon: Award },
    { label: 'Expo Settings', to: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800">
      {/* Clean White Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-4 flex-shrink-0">
        <div>
          {/* Logo & Brand Header */}
          <div className="flex flex-col gap-2 px-2 py-3 border-b border-slate-100 mb-5">
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-center">
              <img
                src="/jaliwala-logo.png"
                alt="Jaliwala Innovations"
                className="h-8 w-auto object-contain"
              />
            </div>
            <div className="flex items-center justify-between mt-1 px-1">
              <span className="text-xs font-bold text-slate-800 tracking-wide">SPIN & WIN</span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 text-[#476379] font-bold border border-slate-200">
                ADMIN
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-slate-100 text-[#476379] font-bold border border-slate-200/80'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 text-slate-500" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          {/* Live Kiosk link */}
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <span>Open Kiosk Wheel</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          {/* User badge & Logout */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-800 truncate">{adminUser.name || 'Admin'}</p>
              <p className="text-[10px] text-slate-400 truncate">@{adminUser.username || 'admin'}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-slate-50">
        {children}
      </main>
    </div>
  );
}

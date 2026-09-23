import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck,
  ShieldCheck,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { RoleBadge } from '../ui/Badge';

export const Sidebar: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Leads Pipeline', icon: Users, path: '/leads' },
    { label: 'Properties & Inventory', icon: Building2, path: '/properties' },
    { label: 'Bookings', icon: CalendarCheck, path: '/bookings' },
    ...(isAdmin ? [{ label: 'User Management', icon: ShieldCheck, path: '/users' }] : []),
  ];

  return (
    <aside className="w-64 bg-[#0b1d30] text-slate-200 flex flex-col border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800/80">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm tracking-tight text-white">APEX</span>
            <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
              CRM
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Real Estate Enterprise</p>
        </div>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Main Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150',
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                )
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Quick Help / Info box */}
      <div className="p-3 mx-3 mb-3 rounded-lg bg-slate-800/40 border border-slate-800 text-xs">
        <div className="flex items-center gap-1.5 text-blue-400 font-medium mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Strict Concurrency</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-normal">
          Unit bookings are locked at the database level to prevent double-booking.
        </p>
      </div>

      {/* User profile & Logout */}
      <div className="p-3 border-t border-slate-800 bg-[#081523]">
        <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-800/50">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-blue-700/80 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <div className="flex items-center gap-1">
                {user && <RoleBadge role={user.role} />}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

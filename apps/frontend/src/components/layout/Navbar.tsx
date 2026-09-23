import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { RoleBadge } from '../ui/Badge';

export const Navbar: React.FC<{ title?: string }> = ({ title = 'Overview' }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-800">{user?.name}</p>
            <p className="text-[10px] text-slate-400 font-medium">{user?.email}</p>
          </div>
          {user && <RoleBadge role={user.role} />}
        </div>
      </div>
    </header>
  );
};

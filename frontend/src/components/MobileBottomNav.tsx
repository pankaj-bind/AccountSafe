import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Shield, Key, Settings, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';

export const MobileBottomNav: React.FC = () => {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 pb-safe">
      <div className="flex items-center justify-around h-16">
        <NavLink 
          to="/dashboard"
          className={({ isActive }) => clsx(
            "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
            isActive ? "text-blue-500" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
          )}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-medium">Stats</span>
        </NavLink>

        <NavLink 
          to="/"
          className={({ isActive }) => clsx(
            "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
            isActive ? "text-blue-500" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
          )}
        >
          <Key className="w-5 h-5" />
          <span className="text-[10px] font-medium">Vault</span>
        </NavLink>

        <NavLink 
          to="/security"
          className={({ isActive }) => clsx(
            "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
            isActive ? "text-blue-500" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
          )}
        >
          <Shield className="w-5 h-5" />
          <span className="text-[10px] font-medium">Security</span>
        </NavLink>

        <NavLink 
          to="/vault/trash"
          className={({ isActive }) => clsx(
            "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
            isActive ? "text-blue-500" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
          )}
        >
          <Trash2 className="w-5 h-5" />
          <span className="text-[10px] font-medium">Trash</span>
        </NavLink>

        <NavLink 
          to="/profile"
          className={({ isActive }) => clsx(
            "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
            isActive ? "text-blue-500" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
          )}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-medium">Settings</span>
        </NavLink>
      </div>
    </nav>
  );
};

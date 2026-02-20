import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/components/ThemeProvider';
import { 
  Search, 
  Bell, 
  Sun, 
  Moon,
  User
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ConsoleHeader({ role, onRoleChange }) {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <header className="h-16 bg-neutral-100 dark:bg-slate-900 border-b border-neutral-300 dark:border-slate-800 px-6 flex items-center justify-between transition-colors">
      {/* Search */}
      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input 
          placeholder="Search tasks, agents, constraints..." 
          className="pl-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-750 dark:text-slate-100 transition-colors"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Role Switcher */}
        <select
          value={role}
          onChange={(e) => onRoleChange(e.target.value)}
          className="h-9 px-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all hover:scale-110 active:scale-95"
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4 transition-transform" />
          ) : (
            <Sun className="w-4 h-4 transition-transform rotate-180" />
          )}
        </Button>

        <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 relative transition-all hover:scale-110 active:scale-95">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        </Button>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center ring-2 ring-indigo-200 dark:ring-indigo-800">
            <User className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Demo User</span>
        </div>
      </div>
    </header>
  );
}
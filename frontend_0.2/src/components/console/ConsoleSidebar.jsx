import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { 
  Brain,
  LayoutDashboard,
  ListTodo,
  Users,
  Target,
  FolderKanban,
  BarChart3,
  Settings,
  Shield,
  FileText,
  Activity,
  UserCircle,
  ChevronRight
} from 'lucide-react';

const adminNav = [
  { name: 'Overview', icon: LayoutDashboard, page: 'AdminOverview' },
  { name: 'Agents', icon: Users, page: 'AdminAgents' },
  { name: 'Constraints', icon: Shield, page: 'AdminConstraints' },
  { name: 'Allocation Settings', icon: Settings, page: 'AdminSettings' },
  { name: 'Audit Log', icon: FileText, page: 'AuditLog' }
];

const managerNav = [
  { name: 'Dashboard', icon: LayoutDashboard, page: 'Console' },
  { name: 'Tasks', icon: ListTodo, page: 'Tasks' },
  { name: 'Projects', icon: FolderKanban, page: 'Projects' },
  { name: 'Team', icon: Users, page: 'Team' },
  { name: 'Allocation', icon: Target, page: 'Allocation' },
  { name: 'Analytics', icon: BarChart3, page: 'Analytics' },
  { name: 'Achievements', icon: Activity, page: 'Achievements' }
];

const userNav = [
  { name: 'My Tasks', icon: ListTodo, page: 'MyTasks' },
  { name: 'My Profile', icon: UserCircle, page: 'MyProfile' },
  { name: 'Assignment Reasoning', icon: Activity, page: 'MyReasons' }
];

export default function ConsoleSidebar({ role, onRoleChange }) {
  const location = useLocation();
  
  const navItems = role === 'admin' ? adminNav : role === 'manager' ? managerNav : userNav;

  const isActive = (page) => {
    const currentPath = location.pathname.toLowerCase();
    return currentPath.includes(page.toLowerCase());
  };

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 h-screen flex flex-col transition-colors">
      {/* Logo */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800">
        <Link to={createPageUrl('Home')} className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">KRAFT</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block -mt-1">Console</span>
          </div>
        </Link>
      </div>

      {/* Role Switcher */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800">
        <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2 block">
          Demo Role
        </label>
        <select
          value={role}
          onChange={(e) => onRoleChange(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-slate-200 transition-colors cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-750"
        >
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={createPageUrl(item.page)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
              isActive(item.page)
                ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            <item.icon className={cn(
              "w-4.5 h-4.5 transition-transform",
              isActive(item.page) ? "text-indigo-600 dark:text-indigo-400 scale-110" : "text-slate-400 dark:text-slate-500"
            )} />
            {item.name}
            {isActive(item.page) && (
              <ChevronRight className="w-4 h-4 ml-auto text-indigo-400" />
            )}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <div className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
          Knowledge-Reasoned Allocation
        </div>
      </div>
    </aside>
  );
}
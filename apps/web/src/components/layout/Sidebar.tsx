import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Network,
  CheckSquare,
  AlertTriangle,
  ShieldAlert,
  GitBranch,
  DollarSign,
  Clock,
  FileText,
  BarChart3,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Dự án', href: '/projects', icon: FolderKanban },
  { name: 'Stakeholders', href: '/stakeholders', icon: Users, badge: 2 },
  { name: 'WBS', href: '/wbs', icon: Network },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Rủi ro', href: '/risks', icon: AlertTriangle, badge: 5 },
  { name: 'Issues', href: '/issues', icon: ShieldAlert, badge: 3 },
  { name: 'Thay đổi', href: '/changes', icon: GitBranch },
  { name: 'Ngân sách', href: '/budgets', icon: DollarSign },
  { name: 'Timesheet', href: '/timesheets', icon: Clock },
  { name: 'Tài liệu', href: '/documents', icon: FileText },
  { name: 'Báo cáo', href: '/reports', icon: BarChart3 },
];

export function Sidebar() {
  return (
    <aside className="flex w-64 flex-col border-r bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold text-blue-600">PMInsight</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="flex-1">{item.name}</span>
            {item.badge && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-medium text-white">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Settings */}
      <div className="border-t p-4">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
            )
          }
        >
          <Settings className="h-5 w-5" />
          <span>Cài đặt</span>
        </NavLink>
      </div>
    </aside>
  );
}

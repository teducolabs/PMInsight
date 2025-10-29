import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Network,
  AlertTriangle,
  ShieldAlert,
  GitBranch,
  DollarSign,
  Clock,
  FileText,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProject } from '@/lib/context/ProjectContext';
import { Button } from '@/components/ui/button';

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
  { name: 'WBS & Schedule', href: '/wbs', icon: Network },
  { name: 'Rủi ro', href: '/risks', icon: AlertTriangle, badge: 5 },
  { name: 'Issues', href: '/issues', icon: ShieldAlert, badge: 3 },
  { name: 'Thay đổi', href: '/changes', icon: GitBranch },
  { name: 'Ngân sách', href: '/budgets', icon: DollarSign },
  { name: 'Timesheet', href: '/timesheets', icon: Clock },
  { name: 'Tài liệu', href: '/documents', icon: FileText },
  { name: 'Báo cáo', href: '/reports', icon: BarChart3 },
];

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';

export function Sidebar() {
  const { currentProjectName } = useProject();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, isCollapsed.toString());
  }, [isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <aside className={cn(
      'flex flex-col border-r bg-white transition-all duration-300',
      isCollapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!isCollapsed && (
          <h1 className="text-xl font-bold text-blue-600">PMInsight</h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8 flex-shrink-0"
          title={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Current Project Banner */}
      {currentProjectName && !isCollapsed && (
        <div className="border-b bg-blue-50 px-4 py-3">
          <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
            Dự án hiện tại
          </p>
          <p className="text-sm font-semibold text-blue-900 truncate mt-1">
            {currentProjectName}
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            title={isCollapsed ? item.name : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                isCollapsed && 'justify-center'
              )
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && (
              <>
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-medium text-white">
                    {item.badge}
                  </span>
                )}
              </>
            )}
            {isCollapsed && item.badge && (
              <span className="absolute top-1 right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Settings */}
      <div className="border-t p-4">
        <NavLink
          to="/settings"
          title={isCollapsed ? 'Cài đặt' : undefined}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
              isCollapsed && 'justify-center'
            )
          }
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span>Cài đặt</span>}
        </NavLink>
      </div>
    </aside>
  );
}

import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProject } from '@/lib/context/ProjectContext';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  const { currentProjectName } = useProject();

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
      <Link to="/dashboard" className="hover:text-blue-600 flex items-center">
        <Home className="h-4 w-4" />
      </Link>
      
      {currentProjectName && (
        <>
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-blue-600">{currentProjectName}</span>
        </>
      )}
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4" />
          {item.href ? (
            <Link to={item.href} className="hover:text-blue-600">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-gray-900">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}

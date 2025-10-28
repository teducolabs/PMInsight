import { useQuery } from '@tanstack/react-query';
import { projectApi } from '@/lib/api/project';
import { Project } from '@/types/project';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '@/lib/context/ProjectContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Trash2, Calendar } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { EditProjectDialog } from './EditProjectDialog';
import { DeleteProjectDialog } from './DeleteProjectDialog';

interface ProjectsTableProps {
  searchQuery: string;
  statusFilter: string;
  priorityFilter: string;
}

export function ProjectsTable({ searchQuery, statusFilter, priorityFilter }: ProjectsTableProps) {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectApi.getAll,
  });

  const navigate = useNavigate();
  const { setCurrentProject } = useProject();
  
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  const handleSelectProject = (project: Project) => {
    setCurrentProject(project.id, project.name);
    navigate(`/projects/${project.id}`);
  };

  // Filter projects
  const filteredProjects = projects?.filter((project) => {
    const matchesSearch = 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.code.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      Initiating: 'bg-purple-100 text-purple-800',
      Planning: 'bg-blue-100 text-blue-800',
      Executing: 'bg-green-100 text-green-800',
      MonitoringControlling: 'bg-yellow-100 text-yellow-800',
      Closing: 'bg-gray-100 text-gray-800',
      OnHold: 'bg-orange-100 text-orange-800',
      Cancelled: 'bg-red-100 text-red-800',
    };
    return variants[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, string> = {
      Critical: 'bg-red-100 text-red-800',
      High: 'bg-orange-100 text-orange-800',
      Medium: 'bg-blue-100 text-blue-800',
      Low: 'bg-gray-100 text-gray-800',
    };
    return variants[priority] || 'bg-gray-100 text-gray-800';
  };

  const getHealthIndicator = (health: string) => {
    const colors: Record<string, string> = {
      Green: 'bg-green-500',
      Yellow: 'bg-yellow-500',
      Red: 'bg-red-500',
    };
    return colors[health] || 'bg-gray-500';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!filteredProjects || filteredProjects.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
            ? 'Không tìm thấy dự án'
            : 'Chưa có dự án nào'}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
            ? 'Thử thay đổi bộ lọc hoặc tìm kiếm khác'
            : 'Bắt đầu bằng cách tạo dự án đầu tiên'}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã dự án</TableHead>
            <TableHead>Tên dự án</TableHead>
            <TableHead>PM</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Ưu tiên</TableHead>
            <TableHead>Health</TableHead>
            <TableHead>Tiến độ</TableHead>
            <TableHead>Thời gian</TableHead>
            <TableHead className="text-right">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredProjects.map((project) => (
            <TableRow key={project.id} className="cursor-pointer hover:bg-gray-50">
              <TableCell className="font-mono text-sm">{project.code}</TableCell>
              <TableCell>
                <div className="font-medium">{project.name}</div>
                {project.description && (
                  <div className="text-xs text-gray-500 line-clamp-1">{project.description}</div>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">
                    {project.projectManagerName?.charAt(0) || 'PM'}
                  </div>
                  <span className="text-sm">{project.projectManagerName || 'N/A'}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getStatusBadge(project.status)}>
                  {project.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={getPriorityBadge(project.priority)}>
                  {project.priority}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${getHealthIndicator(project.health)}`} />
                  <span className="text-sm">{project.health}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="w-24">
                  <div className="flex items-center gap-2">
                    <Progress value={project.progress} className="h-2" />
                    <span className="text-xs font-medium">{project.progress}%</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {format(new Date(project.startDate), 'dd/MM/yy', { locale: vi })} - 
                    {format(new Date(project.endDate), 'dd/MM/yy', { locale: vi })}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleSelectProject(project)}
                    title="Xem chi tiết"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingProject(project);
                    }}
                    title="Chỉnh sửa"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-red-600 hover:text-red-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingProject(project);
                    }}
                    title="Xóa"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {/* Edit Dialog */}
      {editingProject && (
        <EditProjectDialog
          open={!!editingProject}
          onOpenChange={(open) => !open && setEditingProject(null)}
          project={editingProject}
        />
      )}
      
      {/* Delete Dialog */}
      {deletingProject && (
        <DeleteProjectDialog
          open={!!deletingProject}
          onOpenChange={(open) => !open && setDeletingProject(null)}
          project={deletingProject}
        />
      )}
    </div>
  );
}

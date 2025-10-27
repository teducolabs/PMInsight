import { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProjectStatsCards } from '@/components/projects/ProjectStatsCards';
import { ProjectsTable } from '@/components/projects/ProjectsTable';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProjectStatus, ProjectPriority } from '@/types/project';

export function ProjectsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'Dự án' }]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Dự án</h1>
          <p className="mt-1 text-sm text-gray-500">
            Theo dõi và quản lý tất cả các dự án của tổ chức
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Tạo dự án mới
        </Button>
      </div>

      {/* PMI Learning Card */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-blue-600 p-2 text-white">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900">📚 PMI: Project Life Cycle</h3>
            <p className="mt-1 text-sm text-blue-800">
              Theo <strong>PMBOK Guide</strong>, dự án trải qua 5 process groups:
              <strong> Initiating → Planning → Executing → Monitoring & Controlling → Closing</strong>.
              Mỗi giai đoạn có mục tiêu và deliverables riêng.
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="rounded bg-blue-100 px-2 py-1">
                🟢 <strong>Green:</strong> On track
              </span>
              <span className="rounded bg-yellow-100 px-2 py-1">
                🟡 <strong>Yellow:</strong> At risk
              </span>
              <span className="rounded bg-red-100 px-2 py-1">
                🔴 <strong>Red:</strong> Critical issues
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <ProjectStatsCards />

      {/* Filters and Search */}
      <div className="flex items-center gap-4 rounded-lg border bg-white p-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Tìm theo tên hoặc mã dự án..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value={ProjectStatus.Initiating}>Initiating</SelectItem>
              <SelectItem value={ProjectStatus.Planning}>Planning</SelectItem>
              <SelectItem value={ProjectStatus.Executing}>Executing</SelectItem>
              <SelectItem value={ProjectStatus.MonitoringControlling}>Monitoring</SelectItem>
              <SelectItem value={ProjectStatus.Closing}>Closing</SelectItem>
              <SelectItem value={ProjectStatus.OnHold}>On Hold</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Độ ưu tiên" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value={ProjectPriority.Critical}>Critical</SelectItem>
              <SelectItem value={ProjectPriority.High}>High</SelectItem>
              <SelectItem value={ProjectPriority.Medium}>Medium</SelectItem>
              <SelectItem value={ProjectPriority.Low}>Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Projects Table */}
      <ProjectsTable 
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
      />

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}

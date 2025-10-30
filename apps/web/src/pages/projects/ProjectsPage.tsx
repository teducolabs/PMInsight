import { useState } from 'react';
import { Plus, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProjectStatsCards, ProjectsTable, CreateProjectDialog } from '@/features/projects';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProjectStatus, ProjectPriority } from '@/features/projects';

export function ProjectsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  
  // Collapse states - default collapsed
  const [isPMICardExpanded, setIsPMICardExpanded] = useState(false);
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

  return (
    <div className="w-full px-6 py-6 space-y-6">
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
      <div className="rounded-lg border border-blue-200 bg-blue-50">
        <button
          onClick={() => setIsPMICardExpanded(!isPMICardExpanded)}
          className="w-full p-4 flex items-center justify-between hover:bg-blue-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-600 p-2 text-white">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-blue-900">📚 PMI: Project Life Cycle</h3>
          </div>
          {isPMICardExpanded ? (
            <ChevronUp className="h-5 w-5 text-blue-600" />
          ) : (
            <ChevronDown className="h-5 w-5 text-blue-600" />
          )}
        </button>
        
        {isPMICardExpanded && (
          <div className="px-4 pb-4">
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
        )}
      </div>

      {/* Stats Cards */}
      <div className="rounded-lg border bg-white">
        <button
          onClick={() => setIsStatsExpanded(!isStatsExpanded)}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <h3 className="font-semibold text-gray-900">📊 Thống kê dự án</h3>
          {isStatsExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-600" />
          )}
        </button>
        
        {isStatsExpanded && (
          <div className="px-4 pb-4">
            <ProjectStatsCards />
          </div>
        )}
      </div>

      {/* Filters and Search */}
      <div className="rounded-lg border bg-white">
        <button
          onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <h3 className="font-semibold text-gray-900">Tìm kiếm & Lọc</h3>
          </div>
          {isFiltersExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-600" />
          )}
        </button>
        
        {isFiltersExpanded && (
          <div className="p-4 pt-0">
            <div className="flex items-center gap-4">
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
        )}
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

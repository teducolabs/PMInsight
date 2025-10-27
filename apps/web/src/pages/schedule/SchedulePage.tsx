import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProject } from '@/lib/context/ProjectContext';
import { activityApi } from '@/lib/api/activity';
import { GanttChart, type ViewMode } from '@/components/schedule/GanttChart';
import { CreateActivityDialog } from '@/components/schedule/CreateActivityDialog';
import { UpdateActivityDialog } from '@/components/schedule/UpdateActivityDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  List, 
  TrendingUp, 
  Plus, 
  Play,
  BarChart3,
  Filter,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  getActivityStatusColor,
  getActivityStatusLabel,
  formatFloat,
} from '@/lib/utils/activityUtils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export function SchedulePage() {
  const { id } = useParams<{ id: string }>();
  const { currentProjectId } = useProject();
  
  // Use projectId from URL params (ProjectDetailPage) or context (WBSPage)
  const projectId = id || currentProjectId;
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [view, setView] = useState<'gantt' | 'list' | 'critical'>('gantt');
  const [wbsFilter, setWbsFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<typeof activities[0] | null>(null);

  // Fetch activities
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activities', projectId, wbsFilter],
    queryFn: () =>
      activityApi.getAll(projectId!, {
        wbsNodeId: wbsFilter !== 'all' ? wbsFilter : undefined,
      }),
    enabled: !!projectId,
  });

  // Fetch critical path
  const { data: criticalPath = [] } = useQuery({
    queryKey: ['critical-path', projectId],
    queryFn: () => activityApi.getCriticalPath(projectId!),
    enabled: !!projectId && view === 'critical',
  });

  // Calculate CPM mutation
  const calculateCPM = useMutation({
    mutationFn: () => activityApi.calculateCriticalPath(projectId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities', projectId] });
      queryClient.invalidateQueries({ queryKey: ['critical-path', projectId] });
    },
  });

  // Calculate stats
  const stats = {
    total: activities.length,
    notStarted: activities.filter(a => a.status === 'NotStarted').length,
    inProgress: activities.filter(a => a.status === 'InProgress').length,
    completed: activities.filter(a => a.status === 'Completed').length,
    critical: activities.filter(a => a.isCritical).length,
  };

  const displayActivities = view === 'critical' ? criticalPath : activities;

  if (!projectId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Vui lòng chọn một dự án để xem lịch trình</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Schedule Management</h1>
          <p className="text-gray-500 mt-1">
            Quản lý lịch trình công việc và Critical Path
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => calculateCPM.mutate()}
            disabled={calculateCPM.isPending}
            variant="outline"
          >
            <Play className="h-4 w-4 mr-2" />
            Tính Critical Path
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm Activity
          </Button>
        </div>
      </div>

      {/* Create Activity Dialog */}
      {projectId && (
        <CreateActivityDialog
          projectId={projectId}
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      )}

      {/* Update Activity Dialog */}
      {projectId && (
        <UpdateActivityDialog
          projectId={projectId}
          activity={selectedActivity}
          open={!!selectedActivity}
          onOpenChange={(open) => !open && setSelectedActivity(null)}
        />
      )}

      {/* PMI Learning Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">📚 PMI Knowledge: Schedule Management</CardTitle>
          <CardDescription className="text-blue-700">
            Schedule Management bao gồm các process để hoàn thành dự án đúng thời hạn
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>
            <strong>Critical Path Method (CPM):</strong> Phương pháp xác định chuỗi công việc dài nhất,
            quyết định thời gian hoàn thành dự án. Các công việc trên Critical Path có Total Float = 0.
          </p>
          <p>
            <strong>Dependencies:</strong> FS (Finish-to-Start), SS (Start-to-Start), 
            FF (Finish-to-Finish), SF (Start-to-Finish)
          </p>
          <p>
            <strong>Lead & Lag:</strong> Lead (âm) = bắt đầu sớm hơn, Lag (dương) = chờ thêm thời gian
          </p>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-gray-500">Tổng Activities</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-600">{stats.notStarted}</div>
            <p className="text-sm text-gray-500">Chưa bắt đầu</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <p className="text-sm text-gray-500">Đang thực hiện</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-sm text-gray-500">Hoàn thành</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
            <p className="text-sm text-gray-500">Critical Path</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="gantt">
              <Calendar className="h-4 w-4 mr-2" />
              Gantt Chart
            </TabsTrigger>
            <TabsTrigger value="list">
              <List className="h-4 w-4 mr-2" />
              Danh sách
            </TabsTrigger>
            <TabsTrigger value="critical">
              <TrendingUp className="h-4 w-4 mr-2" />
              Critical Path
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            {view === 'gantt' && (
              <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Ngày</SelectItem>
                  <SelectItem value="week">Tuần</SelectItem>
                  <SelectItem value="month">Tháng</SelectItem>
                </SelectContent>
              </Select>
            )}

            <Select value={wbsFilter} onValueChange={setWbsFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by WBS" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả WBS</SelectItem>
                {/* TODO: Load WBS nodes dynamically */}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Gantt Chart View */}
        <TabsContent value="gantt" className="mt-6">
          {displayActivities.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Chưa có activity nào</p>
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm activity đầu tiên
                </Button>
              </CardContent>
            </Card>
          ) : (
            <GanttChart
              activities={displayActivities}
              viewMode={viewMode}
              height={600}
              onActivityClick={(activity) => setSelectedActivity(activity)}
            />
          )}
        </TabsContent>

        {/* List View */}
        <TabsContent value="list" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Activity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Start
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      End
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Duration
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Progress
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Float
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {displayActivities.map((activity) => (
                    <tr key={activity.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {activity.isCritical && (
                            <div className="h-2 w-2 rounded-full bg-red-500" />
                          )}
                          <div>
                            <p className="font-medium">{activity.name}</p>
                            {activity.code && (
                              <p className="text-xs text-gray-500">{activity.code}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={getActivityStatusColor(activity.status)}>
                          {getActivityStatusLabel(activity.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {activity.plannedStartDate
                          ? format(new Date(activity.plannedStartDate), 'dd/MM/yyyy', { locale: vi })
                          : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {activity.plannedEndDate
                          ? format(new Date(activity.plannedEndDate), 'dd/MM/yyyy', { locale: vi })
                          : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm">{activity.durationDays} ngày</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                activity.isCritical ? 'bg-red-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${activity.percentComplete}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600 w-10 text-right">
                            {activity.percentComplete}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{formatFloat(activity.totalFloat)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Critical Path View */}
        <TabsContent value="critical" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-red-500" />
                Critical Path Activities
              </CardTitle>
              <CardDescription>
                Các công việc trên đường găng (Critical Path) quyết định thời gian hoàn thành dự án.
                Bất kỳ delay nào trên các công việc này sẽ làm trễ toàn bộ dự án.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {criticalPath.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Chưa tính Critical Path</p>
                  <Button
                    onClick={() => calculateCPM.mutate()}
                    disabled={calculateCPM.isPending}
                    className="mt-4"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Tính CPM
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {criticalPath.map((activity, index) => (
                    <div key={activity.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 font-semibold text-sm flex-shrink-0">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-medium">{activity.name}</h4>
                            {activity.code && (
                              <p className="text-sm text-gray-500">{activity.code}</p>
                            )}
                            <div className="flex gap-4 mt-2 text-sm">
                              <div>
                                <span className="text-gray-500">ES:</span>{' '}
                                {activity.earlyStart
                                  ? format(new Date(activity.earlyStart), 'dd/MM', { locale: vi })
                                  : 'N/A'}
                              </div>
                              <div>
                                <span className="text-gray-500">EF:</span>{' '}
                                {activity.earlyFinish
                                  ? format(new Date(activity.earlyFinish), 'dd/MM', { locale: vi })
                                  : 'N/A'}
                              </div>
                              <div>
                                <span className="text-gray-500">Float:</span>{' '}
                                {formatFloat(activity.totalFloat)}
                              </div>
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-red-100 text-red-800">Critical</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

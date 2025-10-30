import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { projectApi } from '@/features/projects';
import { WBSPage } from '@/pages/wbs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Users,
  FileText,
  AlertTriangle,
  GitBranch,
  CheckCircle,
  Settings,
  BarChart3,
  Clock,
  Target,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectApi.getById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Không tìm thấy dự án</p>
      </div>
    );
  }

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

  const getHealthColor = (health: string) => {
    const colors: Record<string, string> = {
      Green: 'text-green-600 bg-green-50 border-green-200',
      Yellow: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      Red: 'text-red-600 bg-red-50 border-red-200',
    };
    return colors[health] || 'text-gray-600 bg-gray-50 border-gray-200';
  }

  return (
    <div className="w-full px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/projects')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <Badge className={getStatusBadge(project.status)}>{project.status}</Badge>
              <Badge className={getPriorityBadge(project.priority)}>{project.priority}</Badge>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              <span className="font-mono">{project.code}</span> • 
              PM: {project.projectManagerName || 'N/A'}
            </p>
          </div>
        </div>
        <Button>
          <Settings className="h-4 w-4 mr-2" />
          Cài đặt dự án
        </Button>
      </div>

      {/* Project Health & Progress Banner */}
      <div className={`rounded-lg border-2 p-6 ${getHealthColor(project.health)}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5" />
              <h3 className="font-semibold text-lg">Tình trạng dự án: {project.health}</h3>
            </div>
            <p className="text-sm opacity-80">
              {project.health === 'Green' && 'Dự án đang diễn ra tốt, không có vấn đề nghiêm trọng'}
              {project.health === 'Yellow' && 'Dự án có một số rủi ro cần theo dõi'}
              {project.health === 'Red' && 'Dự án có vấn đề nghiêm trọng cần giải quyết ngay'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{project.progress}%</div>
            <p className="text-sm opacity-80">Hoàn thành</p>
          </div>
        </div>
        <div className="mt-4">
          <Progress value={project.progress} className="h-3" />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Thời gian</p>
                <p className="text-lg font-semibold">
                  {format(new Date(project.startDate), 'dd/MM/yyyy', { locale: vi })}
                </p>
                <p className="text-xs text-gray-400">
                  đến {format(new Date(project.endDate), 'dd/MM/yyyy', { locale: vi })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Ngân sách</p>
                <p className="text-lg font-semibold">
                  {project.budget
                    ? `${project.budget.toLocaleString('vi-VN')} ${project.currency || 'VND'}`
                    : 'Chưa xác định'}
                </p>
                <p className="text-xs text-gray-400">Tổng chi phí</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Stakeholders</p>
                <p className="text-lg font-semibold">12</p>
                <p className="text-xs text-gray-400">Đang theo dõi</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-50 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Rủi ro</p>
                <p className="text-lg font-semibold">5</p>
                <p className="text-xs text-gray-400">Đang mở</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">
            <FileText className="h-4 w-4 mr-2" />
            Tổng quan
          </TabsTrigger>
          <TabsTrigger value="stakeholders">
            <Users className="h-4 w-4 mr-2" />
            Stakeholders
          </TabsTrigger>
          <TabsTrigger value="wbs">
            <Calendar className="h-4 w-4 mr-2" />
            WBS & Schedule
          </TabsTrigger>
          <TabsTrigger value="risks">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Rủi ro
          </TabsTrigger>
          <TabsTrigger value="issues">
            <CheckCircle className="h-4 w-4 mr-2" />
            Vấn đề
          </TabsTrigger>
          <TabsTrigger value="reports">
            <BarChart3 className="h-4 w-4 mr-2" />
            Báo cáo
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Project Information */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Thông tin dự án</CardTitle>
                <CardDescription>Chi tiết về mục tiêu và phạm vi dự án</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-500 mb-2">Mô tả</h4>
                  <p className="text-gray-700">{project.description || 'Chưa có mô tả'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <h4 className="font-medium text-sm text-gray-500 mb-1">Project Manager</h4>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
                        {project.projectManagerName?.charAt(0) || 'PM'}
                      </div>
                      <span className="text-sm">{project.projectManagerName || 'N/A'}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-500 mb-1">Sponsor</h4>
                    <p className="text-sm">{project.sponsorName || 'Chưa xác định'}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-500 mb-1">Ngày bắt đầu</h4>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {format(new Date(project.startDate), 'dd/MM/yyyy', { locale: vi })}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-500 mb-1">Ngày kết thúc</h4>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {format(new Date(project.endDate), 'dd/MM/yyyy', { locale: vi })}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Hoạt động gần đây</CardTitle>
                <CardDescription>Các thay đổi mới nhất</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { action: 'Cập nhật tiến độ', time: '2 giờ trước', user: 'Admin User' },
                    { action: 'Thêm stakeholder mới', time: '5 giờ trước', user: 'Admin User' },
                    { action: 'Tạo rủi ro mới', time: '1 ngày trước', user: 'Admin User' },
                  ].map((activity, index) => (
                    <div key={index} className="flex gap-3 text-sm">
                      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        {activity.user.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.action}</p>
                        <p className="text-xs text-gray-500">
                          {activity.user} • {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* PMI Knowledge Areas */}
          <Card>
            <CardHeader>
              <CardTitle>PMI Knowledge Areas</CardTitle>
              <CardDescription>Quản lý dự án theo 10 lĩnh vực kiến thức của PMI</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { name: 'Integration', icon: GitBranch, color: 'blue', link: '/integration' },
                  { name: 'Scope', icon: Target, color: 'green', link: '/wbs' },
                  { name: 'Schedule', icon: Calendar, color: 'purple', link: '/schedule' },
                  { name: 'Cost', icon: DollarSign, color: 'yellow', link: '/budget' },
                  { name: 'Quality', icon: CheckCircle, color: 'teal', link: '/quality' },
                  { name: 'Resource', icon: Users, color: 'orange', link: '/resources' },
                  { name: 'Communications', icon: FileText, color: 'pink', link: '/communications' },
                  { name: 'Risk', icon: AlertTriangle, color: 'red', link: '/risks' },
                  { name: 'Procurement', icon: DollarSign, color: 'indigo', link: '/procurement' },
                  { name: 'Stakeholders', icon: Users, color: 'cyan', link: '/stakeholders' },
                ].map((area) => (
                  <button
                    key={area.name}
                    onClick={() => navigate(`/projects/${id}${area.link}`)}
                    className={`p-4 rounded-lg border-2 hover:border-${area.color}-400 transition-colors text-center group`}
                  >
                    <area.icon className={`h-6 w-6 mx-auto mb-2 text-${area.color}-600 group-hover:scale-110 transition-transform`} />
                    <p className="text-sm font-medium">{area.name}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stakeholders Tab */}
        <TabsContent value="stakeholders">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Stakeholders</CardTitle>
                  <CardDescription>Quản lý các bên liên quan của dự án</CardDescription>
                </div>
                <Button onClick={() => navigate(`/stakeholders?projectId=${id}`)}>
                  <Users className="h-4 w-4 mr-2" />
                  Xem tất cả Stakeholders
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Tính năng đang phát triển...</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WBS & Schedule Tab */}
        <TabsContent value="wbs">
          <WBSPage />
        </TabsContent>

        {/* Risks Tab */}
        <TabsContent value="risks">
          <Card>
            <CardHeader>
              <CardTitle>Risk Management</CardTitle>
              <CardDescription>Quản lý rủi ro và cơ hội của dự án</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Tính năng đang phát triển...</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Issues Tab */}
        <TabsContent value="issues">
          <Card>
            <CardHeader>
              <CardTitle>Issue Tracking</CardTitle>
              <CardDescription>Theo dõi và giải quyết các vấn đề phát sinh</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Tính năng đang phát triển...</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Báo cáo & Phân tích</CardTitle>
              <CardDescription>Dashboard và báo cáo chi tiết về tiến độ dự án</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Tính năng đang phát triển...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Plus, Trash2, Users, TrendingUp, AlertCircle, Edit2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { projectResourceApi } from '../api/projectResourceApi';
import type { ProjectResource, CreateProjectResourceRequest, UpdateProjectResourceRequest } from '../types';
import { COMMON_ROLES } from '../types';

// Temporary toast replacement
const toast = {
  success: (msg: string) => console.log('✓', msg),
  error: (msg: string) => console.error('✗', msg)
};

interface ResourcePoolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function ResourcePoolDialog({ open, onOpenChange, projectId }: ResourcePoolDialogProps) {
  const [resources, setResources] = useState<ProjectResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingResource, setEditingResource] = useState<ProjectResource | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; resourceId: string | null; resourceName: string }>({
    open: false,
    resourceId: null,
    resourceName: '',
  });
  const [formData, setFormData] = useState<CreateProjectResourceRequest>({
    resourceName: '',
    role: null,
    hourlyRate: null,
    monthlyCapacity: null,
  });

  // Load resources
  const loadResources = async () => {
    try {
      setLoading(true);
      const data = await projectResourceApi.getAll(projectId);
      setResources(data);
    } catch (error) {
      console.error('Failed to load resources:', error);
      toast.error('Không thể tải danh sách nguồn lực');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadResources();
      setEditingResource(null);
      setFormData({
        resourceName: '',
        role: null,
        hourlyRate: null,
        monthlyCapacity: null,
      });
    }
  }, [open, projectId]);

  // Handle create or update
  const handleSubmit = async () => {
    if (!formData.resourceName.trim()) {
      toast.error('Tên nguồn lực là bắt buộc');
      return;
    }

    try {
      if (editingResource) {
        // Update existing resource
        const updateData: UpdateProjectResourceRequest = {
          resourceName: formData.resourceName,
          role: formData.role,
          hourlyRate: formData.hourlyRate,
          monthlyCapacity: formData.monthlyCapacity,
        };
        await projectResourceApi.update(projectId, editingResource.id, updateData);
        toast.success('Cập nhật nguồn lực thành công');
        setEditingResource(null);
      } else {
        // Create new resource
        await projectResourceApi.create(projectId, formData);
        toast.success('Tạo nguồn lực thành công');
      }
      
      setFormData({
        resourceName: '',
        role: null,
        hourlyRate: null,
        monthlyCapacity: null,
      });
      loadResources();
    } catch (error) {
      console.error('Failed to save resource:', error);
      toast.error(editingResource ? 'Không thể cập nhật nguồn lực' : 'Không thể tạo nguồn lực');
    }
  };

  // Handle edit
  const handleEdit = (resource: ProjectResource) => {
    setEditingResource(resource);
    setFormData({
      resourceName: resource.resourceName,
      role: resource.role || null,
      hourlyRate: resource.hourlyRate || null,
      monthlyCapacity: resource.monthlyCapacity || null,
    });
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingResource(null);
    setFormData({
      resourceName: '',
      role: null,
      hourlyRate: null,
      monthlyCapacity: null,
    });
  };

  // Handle delete - open confirm dialog
  const handleDeleteClick = (resource: ProjectResource) => {
    setDeleteConfirm({
      open: true,
      resourceId: resource.id,
      resourceName: resource.resourceName,
    });
  };

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.resourceId) return;

    try {
      await projectResourceApi.delete(projectId, deleteConfirm.resourceId);
      toast.success('Xóa nguồn lực thành công');
      loadResources();
    } catch (error) {
      console.error('Failed to delete resource:', error);
      toast.error('Không thể xóa nguồn lực. Nguồn lực có thể đang có phân công.');
    } finally {
      setDeleteConfirm({ open: false, resourceId: null, resourceName: '' });
    }
  };

  // Format utilization
  const formatUtilization = (percent?: number): string => {
    if (percent === undefined || percent === null) return '0%';
    return `${Math.round(percent)}%`;
  };

  // Get utilization color
  const getUtilizationColor = (percent?: number): string => {
    if (!percent) return 'bg-gray-200 text-gray-700';
    if (percent < 50) return 'bg-green-100 text-green-700';
    if (percent < 80) return 'bg-yellow-100 text-yellow-700';
    if (percent < 100) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Quản lý Nguồn lực Dự án
          </DialogTitle>
          <DialogDescription>
            Quản lý nguồn lực dự án. Các nguồn lực được định nghĩa ở đây có thể được phân công vào các công việc WBS.
          </DialogDescription>
        </DialogHeader>

        {/* Create/Edit Resource Form */}
        <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              {editingResource ? (
                <>
                  <Edit2 className="w-4 h-4" />
                  Chỉnh sửa Nguồn lực
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Thêm Nguồn lực Mới
                </>
              )}
            </h3>
            {editingResource && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelEdit}
                className="h-7 text-xs"
              >
                Hủy
              </Button>
            )}
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label htmlFor="resourceName" className="text-xs">
                Tên *
              </Label>
              <Input
                id="resourceName"
                placeholder="VD: Nguyễn Văn A, Dev 1"
                value={formData.resourceName}
                onChange={(e) =>
                  setFormData({ ...formData, resourceName: e.target.value })
                }
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="role" className="text-xs">
                Vai trò
              </Label>
              <Select
                value={formData.role || ''}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value || null })
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="hourlyRate" className="text-xs">
                Đơn giá/giờ
              </Label>
              <Input
                id="hourlyRate"
                type="number"
                placeholder="0.00"
                value={formData.hourlyRate || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hourlyRate: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="monthlyCapacity" className="text-xs">
                Công suất/tháng (giờ)
              </Label>
              <Input
                id="monthlyCapacity"
                type="number"
                placeholder="160"
                value={formData.monthlyCapacity || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    monthlyCapacity: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                className="h-9"
              />
            </div>
          </div>
          <Button onClick={handleSubmit} size="sm" className="w-full">
            {editingResource ? (
              <>
                <Edit2 className="w-4 h-4 mr-2" />
                Cập nhật Nguồn lực
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Thêm Nguồn lực
              </>
            )}
          </Button>
        </div>

        {/* Resource List */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Nguồn lực ({resources.length})
          </h3>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Đang tải...</div>
          ) : resources.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border rounded-lg">
              <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>Chưa có nguồn lực. Thêm nguồn lực đầu tiên ở trên.</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Tên</TableHead>
                    <TableHead className="w-[150px]">Vai trò</TableHead>
                    <TableHead className="w-[100px] text-right">Đơn giá</TableHead>
                    <TableHead className="w-[120px] text-right">Công suất</TableHead>
                    <TableHead className="w-[100px] text-center">
                      <div className="flex items-center justify-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Sử dụng
                      </div>
                    </TableHead>
                    <TableHead className="w-[100px] text-center">Phân công</TableHead>
                    <TableHead className="w-[80px] text-center">Trạng thái</TableHead>
                    <TableHead className="w-[100px] text-center">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resources.map((resource) => (
                    <TableRow key={resource.id}>
                      <TableCell className="font-medium">
                        {resource.resourceName}
                      </TableCell>
                      <TableCell>
                        {resource.role && (
                          <Badge variant="outline" className="text-xs">
                            {resource.role}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {resource.hourlyRate
                          ? `$${resource.hourlyRate.toFixed(2)}/h`
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {resource.monthlyCapacity
                          ? `${resource.monthlyCapacity}h`
                          : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="secondary"
                          className={getUtilizationColor(resource.utilizationPercent)}
                        >
                          {formatUtilization(resource.utilizationPercent)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          {resource.assignmentCount || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={resource.isActive ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {resource.isActive ? 'Hoạt động' : 'Không hoạt động'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(resource)}
                            className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(resource)}
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={!resource.isActive || (resource.assignmentCount || 0) > 0}
                            title="Xóa"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {resources.some(r => (r.utilizationPercent || 0) > 100) && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-900">Cảnh báo Quá tải</p>
                <p className="text-red-700">
                  Một số nguồn lực đang bị phân công quá mức (&gt;100% sử dụng). Hãy xem xét phân công lại công việc hoặc thêm nguồn lực.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => !open && setDeleteConfirm({ open: false, resourceId: null, resourceName: '' })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa nguồn lực</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa nguồn lực <strong>{deleteConfirm.resourceName}</strong>?
              <br />
              <br />
              Thao tác này sẽ thất bại nếu nguồn lực đang có phân công hoạt động.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

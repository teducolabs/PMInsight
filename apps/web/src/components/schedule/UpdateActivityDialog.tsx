import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { activityApi } from '@/lib/api/activity';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Activity, UpdateActivityDto, ActivityStatus } from '@/types/activity';
import { formatFloat } from '@/lib/utils/activityUtils';

interface UpdateActivityDialogProps {
  projectId: string;
  activity: Activity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpdateActivityDialog({
  projectId,
  activity,
  open,
  onOpenChange,
}: UpdateActivityDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<UpdateActivityDto>>({
    name: '',
    code: '',
    description: '',
    durationDays: 5,
    status: 'NotStarted',
    percentComplete: 0,
  });
  const [startDate, setStartDate] = useState<Date | undefined>();

  // Load activity data when dialog opens
  useEffect(() => {
    if (activity) {
      setFormData({
        name: activity.name || '',
        code: activity.code || '',
        description: activity.description || '',
        durationDays: activity.durationDays || 5,
        status: activity.status || 'NotStarted',
        percentComplete: activity.percentComplete || 0,
      });
      setStartDate(
        activity.plannedStartDate ? new Date(activity.plannedStartDate) : undefined
      );
    }
  }, [activity]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateActivityDto) =>
      activityApi.update(projectId, activity!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities', projectId] });
      alert('✅ Đã cập nhật activity thành công!');
      onOpenChange(false);
    },
    onError: (error: any) => {
      alert('❌ ' + (error.message || 'Không thể cập nhật activity'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => activityApi.delete(projectId, activity!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities', projectId] });
      alert('✅ Đã xóa activity thành công!');
      onOpenChange(false);
    },
    onError: (error: any) => {
      alert('❌ ' + (error.message || 'Không thể xóa activity'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      alert('⚠️ Vui lòng nhập tên activity');
      return;
    }

    const updateData: UpdateActivityDto = {
      name: formData.name,
      code: formData.code,
      description: formData.description,
      plannedStartDate: startDate?.toISOString(),
      durationDays: formData.durationDays,
      status: formData.status as ActivityStatus,
      percentComplete: formData.percentComplete,
    };

    console.log('🚀 Update payload:', JSON.stringify(updateData, null, 2));
    updateMutation.mutate(updateData);
  };

  const handleDelete = () => {
    if (confirm('Bạn có chắc chắn muốn xóa activity này?')) {
      deleteMutation.mutate();
    }
  };

  if (!activity) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cập nhật Activity</DialogTitle>
          <DialogDescription>
            Chỉnh sửa thông tin công việc: {activity.code || activity.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name & Code */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Tên Activity <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ví dụ: Thiết kế giao diện"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Mã Activity</Label>
              <Input
                id="code"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Ví dụ: ACT-001"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả chi tiết công việc..."
              rows={3}
            />
          </div>

          {/* Start Date & Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ngày bắt đầu</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? (
                      format(startDate, 'dd/MM/yyyy', { locale: vi })
                    ) : (
                      <span>Chọn ngày</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Thời lượng (ngày)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={formData.durationDays || 5}
                onChange={(e) =>
                  setFormData({ ...formData, durationDays: parseInt(e.target.value) || 5 })
                }
              />
            </div>
          </div>

          {/* Status & Progress */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái</Label>
              <Select
                value={formData.status || 'NotStarted'}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NotStarted">Chưa bắt đầu</SelectItem>
                  <SelectItem value="InProgress">Đang thực hiện</SelectItem>
                  <SelectItem value="Completed">Hoàn thành</SelectItem>
                  <SelectItem value="OnHold">Tạm dừng</SelectItem>
                  <SelectItem value="Cancelled">Hủy bỏ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="progress">Tiến độ (%)</Label>
              <Input
                id="progress"
                type="number"
                min="0"
                max="100"
                value={formData.percentComplete || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    percentComplete: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>

          {/* CPM Information (Read-only) */}
          {activity.isCritical && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-semibold text-red-800 mb-2">
                🔴 Critical Path Activity
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs text-red-700">
                <div>
                  <span className="font-medium">Early Start:</span>{' '}
                  {activity.earlyStart
                    ? format(new Date(activity.earlyStart), 'dd/MM/yyyy')
                    : 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Early Finish:</span>{' '}
                  {activity.earlyFinish
                    ? format(new Date(activity.earlyFinish), 'dd/MM/yyyy')
                    : 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Total Float:</span>{' '}
                  {formatFloat(activity.totalFloat)}
                </div>
                <div>
                  <span className="font-medium">Free Float:</span>{' '}
                  {formatFloat(activity.freeFloat)}
                </div>
              </div>
            </div>
          )}

          {/* Dependencies Info */}
          {(activity.predecessors.length > 0 || activity.successors.length > 0) && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="text-sm font-semibold text-blue-800 mb-2">Dependencies</p>
              <div className="text-xs text-blue-700 space-y-1">
                {activity.predecessors.length > 0 && (
                  <div>
                    <span className="font-medium">Predecessors:</span>{' '}
                    {activity.predecessors.length} activity(ies)
                  </div>
                )}
                {activity.successors.length > 0 && (
                  <div>
                    <span className="font-medium">Successors:</span>{' '}
                    {activity.successors.length} activity(ies)
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Xóa
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateMutation.isPending}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Cập nhật
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

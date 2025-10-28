import { useState } from 'react';
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
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { CreateActivityDto } from '@/types/activity';
import { ActivityStatus } from '@/types/activity';
import { toast } from '@/components/ui/use-toast';

interface CreateActivityDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wbsNodeId?: string;
  wbsNodeName?: string;
}

export function CreateActivityDialog({
  projectId,
  open,
  onOpenChange,
  wbsNodeId,
  wbsNodeName,
}: CreateActivityDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<CreateActivityDto>>({
    name: '',
    code: '',
    description: '',
    durationDays: 5,
    status: ActivityStatus.NotStarted,
    percentComplete: 0,
  });
  const [startDate, setStartDate] = useState<Date>();

  const createMutation = useMutation({
    mutationFn: (data: CreateActivityDto) => activityApi.create(projectId, data),
    onSuccess: async (newActivity) => {
      // Invalidate and refetch queries to reload data
      await queryClient.invalidateQueries({ queryKey: ['activities', projectId] });
      await queryClient.refetchQueries({ queryKey: ['activities', projectId] });
      
      toast({
        variant: "success",
        title: "✅ Thành công!",
        description: `Đã tạo activity "${newActivity.name}" thành công.`,
      });
      
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Lỗi",
        description: error.message || 'Không thể tạo activity. Vui lòng thử lại.',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      durationDays: 5,
      status: ActivityStatus.NotStarted,
      percentComplete: 0,
    });
    setStartDate(undefined);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      alert('⚠️ Vui lòng nhập tên activity');
      return;
    }

    // Calculate plannedEndDate from startDate + durationDays
    let plannedEndDate: string | undefined;
    if (startDate && formData.durationDays) {
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + formData.durationDays);
      plannedEndDate = endDate.toISOString();
    }

    const createData: CreateActivityDto = {
      name: formData.name,
      code: formData.code,
      description: formData.description,
      wbsNodeId: wbsNodeId,
      plannedStartDate: startDate?.toISOString(),
      plannedEndDate: plannedEndDate,
      durationDays: formData.durationDays || 5,
      status: (formData.status as ActivityStatus) || 'NotStarted',
      percentComplete: formData.percentComplete || 0,
    };

    createMutation.mutate(createData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo Activity Mới</DialogTitle>
          <DialogDescription>
            {wbsNodeName ? (
              <>Thêm công việc mới vào <span className="font-semibold text-blue-600">{wbsNodeName}</span></>
            ) : (
              <>Thêm công việc mới vào lịch trình dự án</>
            )}
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

          {/* Calculated End Date - Preview */}
          {startDate && formData.durationDays && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800">
                <span className="font-semibold">📅 Ngày kết thúc dự kiến:</span>{' '}
                {(() => {
                  const endDate = new Date(startDate);
                  endDate.setDate(endDate.getDate() + formData.durationDays);
                  return format(endDate, 'dd/MM/yyyy', { locale: vi });
                })()}
              </div>
            </div>
          )}

          {/* Status & Progress */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái</Label>
              <Select
                value={formData.status || ActivityStatus.NotStarted}
                onValueChange={(value) => setFormData({ ...formData, status: value as ActivityStatus })}
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

          {/* PMI Learning Note */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-sm text-blue-800">
              <strong>💡 PMI Tip:</strong> Activity là công việc nhỏ nhất trong WBS.
              Tổng duration của các activities quyết định thời gian hoàn thành dự án.
              Sử dụng Dependencies để xác định thứ tự thực hiện.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
              disabled={createMutation.isPending}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Tạo Activity
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

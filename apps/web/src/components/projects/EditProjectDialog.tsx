import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApi } from '@/lib/api/project';
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
import { ProjectStatus, ProjectPriority, Project } from '@/types/project';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
}

export function EditProjectDialog({ open, onOpenChange, project }: EditProjectDialogProps) {
  const [formData, setFormData] = useState({
    code: project.code,
    name: project.name,
    description: project.description || '',
    status: project.status,
    priority: project.priority,
    startDate: format(new Date(project.startDate), 'yyyy-MM-dd'),
    endDate: format(new Date(project.endDate), 'yyyy-MM-dd'),
    budget: project.budget?.toString() || '',
  });

  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data: any) => projectApi.update(project.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', project.id] });
      onOpenChange(false);
    },
  });

  useEffect(() => {
    if (open) {
      setFormData({
        code: project.code,
        name: project.name,
        description: project.description || '',
        status: project.status,
        priority: project.priority,
        startDate: format(new Date(project.startDate), 'yyyy-MM-dd'),
        endDate: format(new Date(project.endDate), 'yyyy-MM-dd'),
        budget: project.budget?.toString() || '',
      });
    }
  }, [open, project]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateMutation.mutate({
      ...formData,
      budget: formData.budget ? parseFloat(formData.budget) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa dự án</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin dự án. Các trường đánh dấu * là bắt buộc.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-code">Mã dự án *</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="VD: PRJ-2024-001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-name">Tên dự án *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Website PMInsight"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Mô tả</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả chi tiết về dự án..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-status">Trạng thái *</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as ProjectStatus })}>
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ProjectStatus.Initiating}>Initiating</SelectItem>
                  <SelectItem value={ProjectStatus.Planning}>Planning</SelectItem>
                  <SelectItem value={ProjectStatus.Executing}>Executing</SelectItem>
                  <SelectItem value={ProjectStatus.MonitoringControlling}>Monitoring & Controlling</SelectItem>
                  <SelectItem value={ProjectStatus.Closing}>Closing</SelectItem>
                  <SelectItem value={ProjectStatus.OnHold}>On Hold</SelectItem>
                  <SelectItem value={ProjectStatus.Cancelled}>Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-priority">Độ ưu tiên *</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as ProjectPriority })}>
                <SelectTrigger id="edit-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ProjectPriority.Critical}>Critical</SelectItem>
                  <SelectItem value={ProjectPriority.High}>High</SelectItem>
                  <SelectItem value={ProjectPriority.Medium}>Medium</SelectItem>
                  <SelectItem value={ProjectPriority.Low}>Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-startDate">Ngày bắt đầu *</Label>
              <Input
                id="edit-startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-endDate">Ngày kết thúc *</Label>
              <Input
                id="edit-endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-budget">Ngân sách</Label>
            <Input
              id="edit-budget"
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              placeholder="VD: 1000000000"
              min="0"
              step="1000000"
            />
            <p className="text-xs text-gray-500">Đơn vị: VND</p>
          </div>

          <DialogFooter>
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
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

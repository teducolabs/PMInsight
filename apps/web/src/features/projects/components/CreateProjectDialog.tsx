import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApi } from '../api';
import { ProjectStatus, ProjectPriority } from '../types';
import { useAuth } from '@/lib/context/AuthContext';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Info } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface HintProps {
  children: React.ReactNode;
}

function Hint({ children }: HintProps) {
  return (
    <div className="flex items-start gap-2 rounded-md bg-blue-50 p-3 text-sm text-blue-800">
      <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <span>{children}</span>
    </div>
  );
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    status: ProjectStatus.Initiating,
    priority: ProjectPriority.Medium,
    startDate: new Date(),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // +90 days
    budget: '',
    currency: 'VND',
  });

  const createMutation = useMutation({
    mutationFn: projectApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project-stats'] });
      onOpenChange(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      status: ProjectStatus.Initiating,
      priority: ProjectPriority.Medium,
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      budget: '',
      currency: 'VND',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name: formData.name,
      code: formData.code,
      description: formData.description || undefined,
      status: formData.status,
      priority: formData.priority,
      startDate: formData.startDate.toISOString(),
      endDate: formData.endDate.toISOString(),
      budget: formData.budget ? parseFloat(formData.budget) : undefined,
      currency: formData.currency,
      projectManagerId: user?.id || '',
    });
  };

  // Auto-generate code from name
  const handleNameChange = (name: string) => {
    setFormData({ ...formData, name });
    if (!formData.code) {
      const code = name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 6) + '-001';
      setFormData(prev => ({ ...prev, code }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">🚀 Tạo dự án mới</DialogTitle>
          <DialogDescription>
            Điền thông tin cơ bản để khởi tạo dự án. Bạn có thể bổ sung chi tiết sau trong trang chi tiết dự án.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <h3 className="font-semibold text-lg">Thông tin cơ bản</h3>
            </div>

            {/* Project Name */}
            <div>
              <Label htmlFor="name" className="required">Tên dự án *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="VD: Website Redesign 2025"
                required
                autoFocus
              />
              <Hint>
                <strong>Tip:</strong> Đặt tên ngắn gọn, dễ hiểu. Mã dự án sẽ tự động tạo từ tên.
              </Hint>
            </div>

            {/* Project Code */}
            <div>
              <Label htmlFor="code" className="required">Mã dự án *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="VD: WEB-001"
                required
              />
              <Hint>
                <strong>PMI:</strong> Project Code là unique identifier. Format thường dùng: DEPT-XXX (VD: IT-001, MKT-002).
              </Hint>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Mô tả ngắn</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả ngắn gọn về mục tiêu và phạm vi dự án..."
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                Có thể để trống, bổ sung sau trong Project Charter
              </p>
            </div>
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Trạng thái</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as ProjectStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ProjectStatus.Initiating}>
                    🟣 Initiating (Khởi tạo)
                  </SelectItem>
                  <SelectItem value={ProjectStatus.Planning}>
                    🔵 Planning (Lập kế hoạch)
                  </SelectItem>
                  <SelectItem value={ProjectStatus.Executing}>
                    🟢 Executing (Thực thi)
                  </SelectItem>
                </SelectContent>
              </Select>
              <Hint>
                <strong>PMI:</strong> Dự án mới thường bắt đầu ở <strong>Initiating</strong> (phê duyệt Project Charter).
              </Hint>
            </div>

            <div>
              <Label htmlFor="priority">Độ ưu tiên</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as ProjectPriority })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ProjectPriority.Critical}>🔴 Critical</SelectItem>
                  <SelectItem value={ProjectPriority.High}>🟠 High</SelectItem>
                  <SelectItem value={ProjectPriority.Medium}>🟡 Medium</SelectItem>
                  <SelectItem value={ProjectPriority.Low}>⚪ Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Ngày bắt đầu *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formData.startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? format(formData.startDate, 'dd/MM/yyyy', { locale: vi }) : 'Chọn ngày'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => date && setFormData({ ...formData, startDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Ngày kết thúc (dự kiến) *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formData.endDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate ? format(formData.endDate, 'dd/MM/yyyy', { locale: vi }) : 'Chọn ngày'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.endDate}
                    onSelect={(date) => date && setFormData({ ...formData, endDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Hint>
            <strong>PMI:</strong> Planned Start/End Date là baseline. Actual dates sẽ track trong quá trình thực hiện.
          </Hint>

          {/* Budget (Optional) */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Label htmlFor="budget">Ngân sách (tùy chọn)</Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="VD: 500000000"
              />
            </div>
            <div>
              <Label htmlFor="currency">Đơn vị</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VND">VND</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg bg-green-50 p-4 border border-green-200">
            <p className="text-sm text-green-800">
              ✅ <strong>Sau khi tạo:</strong> Bạn có thể bổ sung thêm Stakeholders, WBS, Tasks, Risks, Budget breakdown trong trang chi tiết dự án.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={createMutation.isPending} size="lg">
              {createMutation.isPending ? 'Đang tạo...' : '🚀 Tạo dự án'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { stakeholderApi } from '@/lib/api/stakeholder';
import { StakeholderType, InfluenceLevel, InterestLevel } from '@/types/stakeholder';
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
import { toast } from '@/components/ui/use-toast';

interface CreateStakeholderDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateStakeholderDialog({ projectId, open, onOpenChange }: CreateStakeholderDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    email: '',
    phone: '',
    type: StakeholderType.Internal,
    influence: InfluenceLevel.Medium,
    interest: InterestLevel.Medium,
    communicationPreference: '',
    notes: '',
  });

  const createMutation = useMutation({
    mutationFn: stakeholderApi.create,
    onSuccess: async (newStakeholder) => {
      await queryClient.invalidateQueries({ queryKey: ['stakeholders', projectId] });
      await queryClient.refetchQueries({ queryKey: ['stakeholders', projectId] });
      
      toast({
        variant: "success",
        title: "✅ Thành công!",
        description: `Đã tạo stakeholder "${newStakeholder.name}" thành công.`,
      });
      
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Lỗi",
        description: error.message || 'Không thể tạo stakeholder. Vui lòng thử lại.',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      email: '',
      phone: '',
      type: StakeholderType.Internal,
      influence: InfluenceLevel.Medium,
      interest: InterestLevel.Medium,
      communicationPreference: '',
      notes: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      projectId,
      ...formData,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thêm Stakeholder Mới</DialogTitle>
          <DialogDescription>
            Thêm một bên liên quan mới cho dự án. Điền đầy đủ thông tin để quản lý hiệu quả.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Name */}
            <div className="col-span-2">
              <Label htmlFor="name">Tên *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nguyễn Văn A"
                required
              />
            </div>

            {/* Role */}
            <div className="col-span-2">
              <Label htmlFor="role">Vai trò *</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="Project Sponsor, Team Lead, Client..."
                required
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+84 123 456 789"
              />
            </div>

            {/* Type */}
            <div>
              <Label htmlFor="type">Loại *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as StakeholderType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={StakeholderType.Internal}>Internal (Nội bộ)</SelectItem>
                  <SelectItem value={StakeholderType.External}>External (Bên ngoài)</SelectItem>
                  <SelectItem value={StakeholderType.Customer}>Customer (Khách hàng)</SelectItem>
                  <SelectItem value={StakeholderType.Vendor}>Vendor (Nhà cung cấp)</SelectItem>
                  <SelectItem value={StakeholderType.Partner}>Partner (Đối tác)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Influence */}
            <div>
              <Label htmlFor="influence">Influence (Ảnh hưởng) *</Label>
              <Select
                value={formData.influence.toString()}
                onValueChange={(value) => setFormData({ ...formData, influence: parseInt(value) as InfluenceLevel })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Very Low</SelectItem>
                  <SelectItem value="2">2 - Low</SelectItem>
                  <SelectItem value="3">3 - Medium</SelectItem>
                  <SelectItem value="4">4 - High</SelectItem>
                  <SelectItem value="5">5 - Very High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Interest */}
            <div className="col-span-2">
              <Label htmlFor="interest">Interest (Mức độ quan tâm) *</Label>
              <Select
                value={formData.interest.toString()}
                onValueChange={(value) => setFormData({ ...formData, interest: parseInt(value) as InterestLevel })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Very Low</SelectItem>
                  <SelectItem value="2">2 - Low</SelectItem>
                  <SelectItem value="3">3 - Medium</SelectItem>
                  <SelectItem value="4">4 - High</SelectItem>
                  <SelectItem value="5">5 - Very High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Communication Preference */}
            <div className="col-span-2">
              <Label htmlFor="communicationPreference">Cách thức giao tiếp ưa thích</Label>
              <Input
                id="communicationPreference"
                value={formData.communicationPreference}
                onChange={(e) => setFormData({ ...formData, communicationPreference: e.target.value })}
                placeholder="Email hàng tuần, Họp trực tiếp hàng tháng..."
              />
            </div>

            {/* Notes */}
            <div className="col-span-2">
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Thông tin bổ sung về stakeholder..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Đang tạo...' : 'Tạo Stakeholder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

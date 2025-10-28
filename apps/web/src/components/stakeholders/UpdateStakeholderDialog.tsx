import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { stakeholderApi } from '@/lib/api/stakeholder';
import { StakeholderType, InfluenceLevel, InterestLevel, type Stakeholder } from '@/types/stakeholder';
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
import { Trash2, Loader2 } from 'lucide-react';

interface UpdateStakeholderDialogProps {
  projectId: string;
  stakeholder: Stakeholder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpdateStakeholderDialog({ 
  projectId, 
  stakeholder, 
  open, 
  onOpenChange 
}: UpdateStakeholderDialogProps) {
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

  // Load stakeholder data when dialog opens
  useEffect(() => {
    if (stakeholder) {
      setFormData({
        name: stakeholder.name || '',
        role: stakeholder.role || '',
        email: stakeholder.email || '',
        phone: stakeholder.phone || '',
        type: stakeholder.type || StakeholderType.Internal,
        influence: stakeholder.influence || InfluenceLevel.Medium,
        interest: stakeholder.interest || InterestLevel.Medium,
        communicationPreference: stakeholder.communicationPreference || '',
        notes: stakeholder.notes || '',
      });
    }
  }, [stakeholder]);

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) => 
      stakeholderApi.update(stakeholder!.id, { ...data, id: stakeholder!.id }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['stakeholders', projectId] });
      await queryClient.refetchQueries({ queryKey: ['stakeholders', projectId] });
      
      toast({
        variant: "success",
        title: "✅ Thành công!",
        description: `Đã cập nhật stakeholder "${formData.name}" thành công.`,
      });
      
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Lỗi",
        description: error.message || 'Không thể cập nhật stakeholder. Vui lòng thử lại.',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => stakeholderApi.delete(stakeholder!.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['stakeholders', projectId] });
      await queryClient.refetchQueries({ queryKey: ['stakeholders', projectId] });
      
      toast({
        variant: "success",
        title: "✅ Thành công!",
        description: `Đã xóa stakeholder "${stakeholder?.name}" thành công.`,
      });
      
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Lỗi",
        description: error.message || 'Không thể xóa stakeholder. Vui lòng thử lại.',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleDelete = () => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa stakeholder "${stakeholder?.name}"?`)) {
      deleteMutation.mutate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cập nhật Stakeholder</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin của stakeholder. Các trường có dấu * là bắt buộc.
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
                  <SelectItem value={StakeholderType.Internal}>Nội bộ</SelectItem>
                  <SelectItem value={StakeholderType.External}>Bên ngoài</SelectItem>
                  <SelectItem value={StakeholderType.Customer}>Khách hàng</SelectItem>
                  <SelectItem value={StakeholderType.Vendor}>Nhà cung cấp</SelectItem>
                  <SelectItem value={StakeholderType.Partner}>Đối tác</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Influence */}
            <div>
              <Label htmlFor="influence">Mức độ ảnh hưởng *</Label>
              <Select
                value={formData.influence.toString()}
                onValueChange={(value) => setFormData({ ...formData, influence: parseInt(value) as InfluenceLevel })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Rất thấp</SelectItem>
                  <SelectItem value="2">2 - Thấp</SelectItem>
                  <SelectItem value="3">3 - Trung bình</SelectItem>
                  <SelectItem value="4">4 - Cao</SelectItem>
                  <SelectItem value="5">5 - Rất cao</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Interest */}
            <div className="col-span-2">
              <Label htmlFor="interest">Mức độ quan tâm *</Label>
              <Select
                value={formData.interest.toString()}
                onValueChange={(value) => setFormData({ ...formData, interest: parseInt(value) as InterestLevel })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Rất thấp</SelectItem>
                  <SelectItem value="2">2 - Thấp</SelectItem>
                  <SelectItem value="3">3 - Trung bình</SelectItem>
                  <SelectItem value="4">4 - Cao</SelectItem>
                  <SelectItem value="5">5 - Rất cao</SelectItem>
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

          <DialogFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Xóa
                </>
              )}
            </Button>
            
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang cập nhật...
                  </>
                ) : (
                  'Cập nhật'
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

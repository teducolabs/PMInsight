import { useState, useEffect } from 'react';
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
import { Loader2, Plus, X } from 'lucide-react';
import type { WBSNode } from '@/lib/api/wbs';

interface EditWBSNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node: WBSNode;
  onSave: (nodeData: Partial<WBSNode>) => Promise<void>;
}

export function EditWBSNodeDialog({
  open,
  onOpenChange,
  node,
  onSave,
}: EditWBSNodeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    deliverables: [''],
    acceptanceCriteria: '',
    estimatedCost: '',
    currency: 'VND',
    responsibleOrganization: '',
    assumptions: [''],
    constraints: [''],
    isWorkPackage: false,
  });

  // Reset form data when node changes or dialog opens
  useEffect(() => {
    if (open && node) {
      setFormData({
        code: node.code || '',
        name: node.name,
        description: node.description || '',
        deliverables: node.deliverables.length > 0 ? node.deliverables : [''],
        acceptanceCriteria: node.acceptanceCriteria || '',
        estimatedCost: node.estimatedCost?.toString() || '',
        currency: node.currency || 'VND',
        responsibleOrganization: node.responsibleOrganization || '',
        assumptions: node.assumptions.length > 0 ? node.assumptions : [''],
        constraints: node.constraints.length > 0 ? node.constraints : [''],
        isWorkPackage: node.isWorkPackage,
      });
    }
  }, [open, node]);

  const handleAddItem = (field: 'deliverables' | 'assumptions' | 'constraints') => {
    setFormData({
      ...formData,
      [field]: [...formData[field], ''],
    });
  };

  const handleRemoveItem = (field: 'deliverables' | 'assumptions' | 'constraints', index: number) => {
    setFormData({
      ...formData,
      [field]: formData[field].filter((_, i) => i !== index),
    });
  };

  const handleUpdateItem = (
    field: 'deliverables' | 'assumptions' | 'constraints',
    index: number,
    value: string
  ) => {
    const updated = [...formData[field]];
    updated[index] = value;
    setFormData({
      ...formData,
      [field]: updated,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const nodeData: Partial<WBSNode> = {
        code: formData.code,
        name: formData.name,
        description: formData.description || undefined,
        deliverables: formData.deliverables.filter(d => d.trim() !== ''),
        acceptanceCriteria: formData.acceptanceCriteria || undefined,
        estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : undefined,
        currency: formData.currency,
        responsibleOrganization: formData.responsibleOrganization || undefined,
        assumptions: formData.assumptions.filter(a => a.trim() !== ''),
        constraints: formData.constraints.filter(c => c.trim() !== ''),
        isWorkPackage: formData.isWorkPackage,
      };

      await onSave(nodeData);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update WBS node:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderArrayField = (
    label: string,
    field: 'deliverables' | 'assumptions' | 'constraints',
    placeholder: string
  ) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => handleAddItem(field)}
        >
          <Plus className="w-3 h-3 mr-1" />
          Thêm
        </Button>
      </div>
      <div className="space-y-2">
        {formData[field].map((item, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={item}
              onChange={(e) => handleUpdateItem(field, index, e.target.value)}
              placeholder={placeholder}
              className="flex-1"
            />
            {formData[field].length > 1 && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => handleRemoveItem(field, index)}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Chỉnh sửa WBS Node</span>
            <span className="text-sm font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
              {node.code}
            </span>
          </DialogTitle>
          <DialogDescription>
            Cập nhật thông tin: <strong className="text-gray-700">{node.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-wbs-code">Mã WBS *</Label>
              <Input
                id="edit-wbs-code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="VD: 1.1"
                required
                className="font-mono font-semibold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-wbs-name">Tên WBS Node *</Label>
              <Input
                id="edit-wbs-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Thiết kế hệ thống"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-wbs-description">Mô tả</Label>
            <Textarea
              id="edit-wbs-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả chi tiết về công việc..."
              rows={2}
            />
          </div>

          {renderArrayField('Deliverables', 'deliverables', 'VD: Tài liệu thiết kế hệ thống')}

          <div className="space-y-2">
            <Label htmlFor="edit-wbs-acceptance">Tiêu chí nghiệm thu</Label>
            <Textarea
              id="edit-wbs-acceptance"
              value={formData.acceptanceCriteria}
              onChange={(e) => setFormData({ ...formData, acceptanceCriteria: e.target.value })}
              placeholder="Các tiêu chí để xác nhận hoàn thành..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-wbs-cost">Chi phí ước tính</Label>
              <Input
                id="edit-wbs-cost"
                type="number"
                value={formData.estimatedCost}
                onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                placeholder="VD: 50000000"
                min="0"
                step="1000000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-wbs-org">Đơn vị chịu trách nhiệm</Label>
              <Input
                id="edit-wbs-org"
                value={formData.responsibleOrganization}
                onChange={(e) => setFormData({ ...formData, responsibleOrganization: e.target.value })}
                placeholder="VD: Phòng IT"
              />
            </div>
          </div>

          {renderArrayField('Giả định (Assumptions)', 'assumptions', 'VD: Đủ nguồn lực kỹ thuật')}

          {renderArrayField('Ràng buộc (Constraints)', 'constraints', 'VD: Phải hoàn thành trong Q1')}

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="edit-wbs-workpackage"
              checked={formData.isWorkPackage}
              onChange={(e) => setFormData({ ...formData, isWorkPackage: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor="edit-wbs-workpackage" className="cursor-pointer">
              Đây là Work Package (cấp thấp nhất, có thể chứa Activities)
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Cập nhật
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

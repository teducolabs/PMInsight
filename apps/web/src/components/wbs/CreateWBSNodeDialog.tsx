import { useState, useEffect, useMemo } from 'react';
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

interface CreateWBSNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentNode?: WBSNode | null; // null = root level
  allNodes: WBSNode[]; // All existing nodes to calculate next code
  onSave: (nodeData: Partial<WBSNode>) => Promise<void>;
}

export function CreateWBSNodeDialog({
  open,
  onOpenChange,
  parentNode,
  allNodes,
  onSave,
}: CreateWBSNodeDialogProps) {
  const [loading, setLoading] = useState(false);
  
  // Auto-generate WBS code
  const suggestedCode = useMemo(() => {
    if (parentNode) {
      // Child node: parent code + next sequence (e.g., 1.1 -> 1.1.1, 1.1.2)
      const childrenCount = parentNode.children?.length || 0;
      return `${parentNode.code}.${childrenCount + 1}`;
    } else {
      // Root level: find max root code and increment (e.g., 1, 2, 3)
      const rootCodes = allNodes
        .map(n => n.code)
        .filter((code): code is string => !!code && !code.includes('.'))
        .map(code => parseInt(code) || 0);
      
      const maxCode = rootCodes.length > 0 ? Math.max(...rootCodes) : 0;
      return `${maxCode + 1}`;
    }
  }, [parentNode, allNodes]);
  
  const [formData, setFormData] = useState({
    code: suggestedCode,
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
  
  // Update code when suggestedCode changes
  useEffect(() => {
    if (open) {
      setFormData(prev => ({ ...prev, code: suggestedCode }));
    }
  }, [open, suggestedCode]);

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
        children: [],
        level: parentNode ? parentNode.level + 1 : 1,
      };

      await onSave(nodeData);
      
      // Reset form (will be regenerated with new code when dialog reopens)
      setFormData({
        code: suggestedCode,
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
      
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create WBS node:', error);
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
            <span>Thêm WBS Node mới</span>
            <span className="text-sm font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
              {suggestedCode}
            </span>
          </DialogTitle>
          <DialogDescription>
            {parentNode ? (
              <span>
                Tạo node con của: <strong className="text-gray-700">{parentNode.code} - {parentNode.name}</strong>
              </span>
            ) : (
              <span>Tạo node gốc (root level) trong cấu trúc WBS</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wbs-code">
                Mã WBS *
                <span className="ml-2 text-xs text-gray-500 font-normal">(Tự động sinh)</span>
              </Label>
              <Input
                id="wbs-code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder={suggestedCode}
                required
                className="font-mono font-semibold"
              />
              <p className="text-xs text-gray-500">
                Mã được đề xuất: <strong className="text-blue-600">{suggestedCode}</strong>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wbs-name">Tên WBS Node *</Label>
              <Input
                id="wbs-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Thiết kế hệ thống"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wbs-description">Mô tả</Label>
            <Textarea
              id="wbs-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả chi tiết về công việc..."
              rows={2}
            />
          </div>

          {renderArrayField('Deliverables', 'deliverables', 'VD: Tài liệu thiết kế hệ thống')}

          <div className="space-y-2">
            <Label htmlFor="wbs-acceptance">Tiêu chí nghiệm thu</Label>
            <Textarea
              id="wbs-acceptance"
              value={formData.acceptanceCriteria}
              onChange={(e) => setFormData({ ...formData, acceptanceCriteria: e.target.value })}
              placeholder="Các tiêu chí để xác nhận hoàn thành..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wbs-cost">Chi phí ước tính</Label>
              <Input
                id="wbs-cost"
                type="number"
                value={formData.estimatedCost}
                onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                placeholder="VD: 50000000"
                min="0"
                step="1000000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wbs-org">Đơn vị chịu trách nhiệm</Label>
              <Input
                id="wbs-org"
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
              id="wbs-workpackage"
              checked={formData.isWorkPackage}
              onChange={(e) => setFormData({ ...formData, isWorkPackage: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor="wbs-workpackage" className="cursor-pointer">
              Đây là Work Package (cấp thấp nhất, có thể chứa Activities)
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Tạo WBS Node
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

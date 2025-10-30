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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, X, Calendar as CalendarIcon, Package, CheckSquare, Flag } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { WBSNode } from '../types';
import { cn } from '@/lib/utils';

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
      const childrenCount = parentNode.children?.length || 0;
      return `${parentNode.code}.${childrenCount + 1}`;
    } else {
      if (!allNodes || !Array.isArray(allNodes)) {
        return '1';
      }
      
      const rootCodes = allNodes
        .map(n => n.code)
        .filter((code): code is string => !!code && !code.includes('.'))
        .map(code => parseInt(code) || 0);
      
      const maxCode = rootCodes.length > 0 ? Math.max(...rootCodes) : 0;
      return `${maxCode + 1}`;
    }
  }, [parentNode, allNodes]);
  
  const [formData, setFormData] = useState({
    // Basic
    code: suggestedCode,
    name: '',
    description: '',
    type: 'Summary' as 'Summary' | 'Task' | 'Milestone',
    
    // Schedule
    plannedStartDate: undefined as Date | undefined,
    durationDays: 5,
    plannedEndDate: undefined as Date | undefined,
    
    // Task-specific
    status: 'NotStarted' as 'NotStarted' | 'InProgress' | 'Completed' | 'OnHold' | 'Cancelled',
    percentComplete: 0,
    estimatedHours: 0,
    plannedCost: '',
    currency: 'VND',
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Critical',
    
    // Summary-specific
    deliverables: [''],
    acceptanceCriteria: '',
    responsibleOrganization: '',
    assumptions: [''],
    scopeConstraints: [''],
    
    // Metadata
    notes: '',
  });
  
  // Update code when suggestedCode changes
  useEffect(() => {
    if (open) {
      setFormData(prev => ({ ...prev, code: suggestedCode }));
    }
  }, [open, suggestedCode]);

  // Auto-calculate end date when start date or duration changes
  useEffect(() => {
    if (formData.plannedStartDate && formData.durationDays > 0) {
      const endDate = addDays(formData.plannedStartDate, formData.durationDays);
      setFormData(prev => ({ ...prev, plannedEndDate: endDate }));
    }
  }, [formData.plannedStartDate, formData.durationDays]);

  const handleAddItem = (field: 'deliverables' | 'assumptions' | 'scopeConstraints') => {
    setFormData({
      ...formData,
      [field]: [...formData[field], ''],
    });
  };

  const handleRemoveItem = (field: 'deliverables' | 'assumptions' | 'scopeConstraints', index: number) => {
    setFormData({
      ...formData,
      [field]: formData[field].filter((_, i) => i !== index),
    });
  };

  const handleUpdateItem = (
    field: 'deliverables' | 'assumptions' | 'scopeConstraints',
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
        type: formData.type as any,
        level: parentNode ? parentNode.level + 1 : 1,
        sortOrder: parentNode ? (parentNode.children?.length || 0) : allNodes.length,
        children: [],
        
        // Schedule
        plannedStartDate: formData.plannedStartDate?.toISOString(),
        plannedEndDate: formData.plannedEndDate?.toISOString(),
        durationDays: formData.durationDays,
        
        // Task-specific (if Task/Milestone)
        ...(formData.type !== 'Summary' && {
          status: formData.status as any,
          percentComplete: formData.percentComplete,
          estimatedHours: formData.estimatedHours,
          actualHours: 0,
          plannedCost: formData.plannedCost ? parseFloat(formData.plannedCost) : undefined,
          currency: formData.currency,
          priority: formData.priority as any,
          predecessors: [],
          successors: [],
          assignedUserIds: [],
          isCritical: false,
          totalFloat: 0,
          freeFloat: 0,
        }),
        
        // Summary-specific (if Summary)
        ...(formData.type === 'Summary' && {
          deliverables: formData.deliverables.filter(d => d.trim() !== ''),
          acceptanceCriteria: formData.acceptanceCriteria || undefined,
          responsibleOrganization: formData.responsibleOrganization || undefined,
          assumptions: formData.assumptions.filter(a => a.trim() !== ''),
          scopeConstraints: formData.scopeConstraints.filter(c => c.trim() !== ''),
        }),
        
        // Metadata
        notes: formData.notes || undefined,
        tags: [],
      };

      await onSave(nodeData);
      
      // Reset form
      setFormData({
        code: suggestedCode,
        name: '',
        description: '',
        type: 'Summary',
        plannedStartDate: undefined,
        durationDays: 5,
        plannedEndDate: undefined,
        status: 'NotStarted',
        percentComplete: 0,
        estimatedHours: 0,
        plannedCost: '',
        currency: 'VND',
        priority: 'Medium',
        deliverables: [''],
        acceptanceCriteria: '',
        responsibleOrganization: '',
        assumptions: [''],
        scopeConstraints: [''],
        notes: '',
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
    field: 'deliverables' | 'assumptions' | 'scopeConstraints',
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
          {/* Basic Info */}
          <div className="grid grid-cols-3 gap-4">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="wbs-name">Tên Node *</Label>
              <Input
                id="wbs-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Thiết kế hệ thống"
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wbs-type">Loại Node *</Label>
              <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Summary">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      <span>Summary (Tóm tắt)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Task">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-4 h-4" />
                      <span>Task (Công việc)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Milestone">
                    <div className="flex items-center gap-2">
                      <Flag className="w-4 h-4" />
                      <span>Milestone (Cột mốc)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
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

          {/* Tabs for different node types */}
          <Tabs defaultValue="schedule" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="schedule">Lịch trình</TabsTrigger>
              <TabsTrigger value="details" disabled={formData.type === 'Task' || formData.type === 'Milestone'}>
                Chi tiết Summary
              </TabsTrigger>
              <TabsTrigger value="task" disabled={formData.type === 'Summary'}>
                Chi tiết Task
              </TabsTrigger>
            </TabsList>

            {/* Schedule Tab */}
            <TabsContent value="schedule" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ngày bắt đầu</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.plannedStartDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.plannedStartDate ? format(formData.plannedStartDate, 'PPP', { locale: vi }) : "Chọn ngày"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.plannedStartDate}
                        onSelect={(date) => setFormData({ ...formData, plannedStartDate: date })}
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
                    min="0"
                    value={formData.durationDays}
                    onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {formData.plannedStartDate && formData.plannedEndDate && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <strong>Ngày kết thúc dự kiến:</strong> {format(formData.plannedEndDate, 'PPP', { locale: vi })}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Summary Details Tab */}
            <TabsContent value="details" className="space-y-4">
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

              <div className="space-y-2">
                <Label htmlFor="wbs-org">Đơn vị chịu trách nhiệm</Label>
                <Input
                  id="wbs-org"
                  value={formData.responsibleOrganization}
                  onChange={(e) => setFormData({ ...formData, responsibleOrganization: e.target.value })}
                  placeholder="VD: Phòng IT"
                />
              </div>

              {renderArrayField('Giả định (Assumptions)', 'assumptions', 'VD: Đủ nguồn lực kỹ thuật')}
              {renderArrayField('Ràng buộc (Scope Constraints)', 'scopeConstraints', 'VD: Phải hoàn thành trong Q1')}
            </TabsContent>

            {/* Task Details Tab */}
            <TabsContent value="task" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Trạng thái</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
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
                    value={formData.percentComplete}
                    onChange={(e) => setFormData({ ...formData, percentComplete: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hours">Giờ ước tính</Label>
                  <Input
                    id="hours"
                    type="number"
                    min="0"
                    value={formData.estimatedHours}
                    onChange={(e) => setFormData({ ...formData, estimatedHours: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Độ ưu tiên</Label>
                  <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Thấp</SelectItem>
                      <SelectItem value="Medium">Trung bình</SelectItem>
                      <SelectItem value="High">Cao</SelectItem>
                      <SelectItem value="Critical">Nghiêm trọng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cost">Chi phí dự kiến</Label>
                  <Input
                    id="cost"
                    type="number"
                    min="0"
                    step="1000000"
                    value={formData.plannedCost}
                    onChange={(e) => setFormData({ ...formData, plannedCost: e.target.value })}
                    placeholder="VD: 50000000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Đơn vị tiền</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
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
            </TabsContent>
          </Tabs>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ghi chú thêm..."
              rows={2}
            />
          </div>

          {/* PMI Learning Note */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-sm text-blue-800">
              <strong>💡 PMI Tip:</strong> Summary chứa Deliverables và Work Packages. 
              Task/Milestone có Schedule và Dependencies. Sử dụng WBS Dictionary để mô tả chi tiết.
            </p>
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


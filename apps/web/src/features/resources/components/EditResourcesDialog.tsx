import { useState, useEffect } from 'react';
import { Plus, X, Save, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { resourceAssignmentApi } from '../api/resourceAssignmentApi';
import { projectResourceApi } from '../api/projectResourceApi';
import type { ResourceAssignment, AddResourceAssignmentRequest, UpdateResourceAssignmentRequest, ProjectResource } from '../types';
import { type WBSNode } from '@/features/wbs';

// Temporary toast replacement
const toast = {
  success: (msg: string) => console.log('✓', msg),
  error: (msg: string) => console.error('✗', msg)
};

interface EditResourcesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  node: WBSNode | null;
  wbsId: string;
  onUpdate: () => void;
  projectId?: string;
}

interface AssignmentForm extends ResourceAssignment {
  isNew?: boolean;
}

export function EditResourcesDialog({ isOpen, onClose, node, wbsId, onUpdate, projectId }: EditResourcesDialogProps) {
  const [assignments, setAssignments] = useState<AssignmentForm[]>([]);
  const [availableResources, setAvailableResources] = useState<ProjectResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadResources = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const resources = await projectResourceApi.getAll(projectId);
      setAvailableResources(resources.filter(r => r.isActive));
    } catch (error) {
      console.error('Failed to load resources:', error);
      toast.error('Không thể tải danh sách nguồn lực');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && node) {
      loadResources();
      setAssignments((node.resourceAssignments || []).map(a => ({ ...a, projectResourceId: a.projectResourceId || undefined })));
    }
  }, [isOpen, node, projectId]);

  const handleAddAssignment = () => {
    setAssignments([...assignments, {
      id: `temp-${Date.now()}`,
      projectResourceId: '',
      resourceName: '',
      allocationPercent: 100,
      estimatedHours: 0,
      actualHours: 0,
      isPrimary: false,
      isNew: true,
      createdAt: new Date().toISOString(),
    }]);
  };

  const handleRemoveAssignment = async (index: number) => {
    const assignment = assignments[index];
    if (assignment.isNew) {
      setAssignments(assignments.filter((_, i) => i !== index));
    } else if (node) {
      try {
        await resourceAssignmentApi.removeAssignment(wbsId, node.id, assignment.id!);
        toast.success('Đã xóa nguồn lực');
        setAssignments(assignments.filter((_, i) => i !== index));
        onUpdate();
      } catch (error) {
        console.error('Failed to remove resource:', error);
        toast.error('Không thể xóa nguồn lực');
      }
    }
  };

  const handleUpdateField = (index: number, field: keyof AssignmentForm, value: any) => {
    const updated = [...assignments];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'projectResourceId') {
      const resource = availableResources.find(r => r.id === value);
      if (resource) {
        updated[index].resourceName = resource.resourceName;
        updated[index].role = resource.role || undefined;
        updated[index].hourlyRate = resource.hourlyRate || undefined;
      }
    }
    setAssignments(updated);
  };

  const handleSave = async () => {
    if (!node) return;
    const invalidAssignments = assignments.filter(a => !a.projectResourceId);
    if (invalidAssignments.length > 0) {
      toast.error('Vui lòng chọn nguồn lực cho tất cả phân công');
      return;
    }
    try {
      setSaving(true);
      const newAssignments = assignments.filter(a => a.isNew);
      for (const assignment of newAssignments) {
        const request: AddResourceAssignmentRequest = {
          projectResourceId: assignment.projectResourceId!,
          allocationPercent: assignment.allocationPercent || 100,
          estimatedHours: assignment.estimatedHours || 0,
          isPrimary: assignment.isPrimary || false,
          assignmentStartDate: assignment.assignmentStartDate,
          assignmentEndDate: assignment.assignmentEndDate,
          notes: assignment.notes,
        };
        await resourceAssignmentApi.addAssignment(wbsId, node.id, request);
      }
      const updatedAssignments = assignments.filter(a => !a.isNew);
      for (const assignment of updatedAssignments) {
        const request: UpdateResourceAssignmentRequest = {
          projectResourceId: assignment.projectResourceId || undefined,
          allocationPercent: assignment.allocationPercent,
          estimatedHours: assignment.estimatedHours,
          actualHours: assignment.actualHours,
          isPrimary: assignment.isPrimary,
          assignmentStartDate: assignment.assignmentStartDate,
          assignmentEndDate: assignment.assignmentEndDate,
          notes: assignment.notes,
        };
        await resourceAssignmentApi.updateAssignment(wbsId, node.id, assignment.id!, request);
      }
      toast.success('Cập nhật nguồn lực thành công');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to save resources:', error);
      toast.error('Không thể lưu nguồn lực');
    } finally {
      setSaving(false);
    }
  };

  const getResourceInfo = (projectResourceId?: string): ProjectResource | undefined => {
    return availableResources.find(r => r.id === projectResourceId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Phân công Nguồn lực - {node?.name}
          </DialogTitle>
          <DialogDescription>Phân công nguồn lực từ Resource Pool cho công việc này.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Đang tải nguồn lực...</div>
          ) : availableResources.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border rounded-lg bg-gray-50">
              <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="mb-2">Chưa có nguồn lực trong pool.</p>
            </div>
          ) : (
            <>
              {assignments.map((assignment, index) => {
                const resource = getResourceInfo(assignment.projectResourceId || undefined);
                return (
                  <div key={assignment.id} className="border rounded-lg p-4 space-y-3 bg-white">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs">Nguồn lực *</Label>
                          <Select value={assignment.projectResourceId || ''} onValueChange={(value) => handleUpdateField(index, 'projectResourceId', value)}>
                            <SelectTrigger><SelectValue placeholder="Chọn nguồn lực từ pool" /></SelectTrigger>
                            <SelectContent>
                              {availableResources.map(res => (
                                <SelectItem key={res.id} value={res.id}>
                                  <div className="flex items-center gap-2">
                                    <span>{res.resourceName}</span>
                                    {res.role && <Badge variant="outline" className="text-xs">{res.role}</Badge>}
                                    {res.utilizationPercent !== undefined && <Badge variant="secondary" className="text-xs">{Math.round(res.utilizationPercent)}% sử dụng</Badge>}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {resource && (
                            <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                              {resource.role && <span>Vai trò: {resource.role}</span>}
                              {resource.hourlyRate && <span> Đơn giá: ${resource.hourlyRate.toFixed(2)}/h</span>}
                              {resource.utilizationPercent !== undefined && <span> Sử dụng: {Math.round(resource.utilizationPercent)}%</span>}
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Phân bổ %</Label>
                          <Input type="number" min="0" max="100" value={assignment.allocationPercent || 100} onChange={(e) => handleUpdateField(index, 'allocationPercent', parseFloat(e.target.value) || 0)} className="h-9" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Ước tính (giờ)</Label>
                          <Input type="number" min="0" value={assignment.estimatedHours || 0} onChange={(e) => handleUpdateField(index, 'estimatedHours', parseFloat(e.target.value) || 0)} className="h-9" />
                        </div>
                        <div className="col-span-2 flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            id={`primary-${assignment.id}`} 
                            checked={assignment.isPrimary || false} 
                            onChange={(e) => { 
                              handleUpdateField(index, 'isPrimary', e.target.checked); 
                              if (e.target.checked) { 
                                const updated = assignments.map((a, i) => ({ ...a, isPrimary: i === index })); 
                                setAssignments(updated); 
                              }
                            }} 
                            className="w-4 h-4"
                          />
                          <Label htmlFor={`primary-${assignment.id}`} className="text-xs cursor-pointer">Người chịu trách nhiệm chính</Label>
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs">Ghi chú</Label>
                          <Textarea value={assignment.notes || ''} onChange={(e) => handleUpdateField(index, 'notes', e.target.value)} placeholder="Ghi chú thêm..." className="h-16 text-xs" />
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveAssignment(index)} className="text-red-600 hover:text-red-700 hover:bg-red-50"><X className="w-4 h-4" /></Button>
                    </div>
                  </div>
                );
              })}
              <Button variant="outline" onClick={handleAddAssignment} className="w-full"><Plus className="w-4 h-4 mr-2" />Thêm Phân công</Button>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={handleSave} disabled={saving || assignments.length === 0}><Save className="w-4 h-4 mr-2" />{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

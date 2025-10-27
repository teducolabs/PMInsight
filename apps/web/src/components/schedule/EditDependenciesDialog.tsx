import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Link } from 'lucide-react';
import type { Activity, ActivityDependency } from '@/types/activity';
import { DependencyType } from '@/types/activity';

interface EditDependenciesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: Activity;
  allActivities: Activity[];
  onSave: (activityId: string, dependencies: ActivityDependency[]) => void;
}

const DEPENDENCY_TYPES: { value: DependencyType; label: string; description: string }[] = [
  { value: DependencyType.FS, label: 'FS (Finish-to-Start)', description: 'Bắt đầu sau khi task trước kết thúc' },
  { value: DependencyType.SS, label: 'SS (Start-to-Start)', description: 'Bắt đầu cùng lúc với task trước' },
  { value: DependencyType.FF, label: 'FF (Finish-to-Finish)', description: 'Kết thúc cùng lúc với task trước' },
  { value: DependencyType.SF, label: 'SF (Start-to-Finish)', description: 'Kết thúc sau khi task trước bắt đầu' },
];

export function EditDependenciesDialog({
  open,
  onOpenChange,
  activity,
  allActivities,
  onSave,
}: EditDependenciesDialogProps) {
  const [dependencies, setDependencies] = useState<ActivityDependency[]>([]);

  useEffect(() => {
    if (open && activity) {
      setDependencies(activity.predecessors || []);
    }
  }, [open, activity]);

  const addDependency = () => {
    const newDep: ActivityDependency = {
      activityId: '',
      activityName: '',
      type: DependencyType.FS,
      lagDays: 0,
    };
    setDependencies([...dependencies, newDep]);
  };

  const removeDependency = (index: number) => {
    setDependencies(dependencies.filter((_, i) => i !== index));
  };

  const updateDependency = (index: number, field: keyof ActivityDependency, value: any) => {
    setDependencies(
      dependencies.map((dep, i) => {
        if (i === index) {
          if (field === 'activityId') {
            const selectedActivity = allActivities.find(a => a.id === value);
            return { 
              ...dep, 
              activityId: value,
              activityName: selectedActivity?.name || '',
              activityCode: selectedActivity?.code,
            };
          }
          return { ...dep, [field]: value };
        }
        return dep;
      })
    );
  };

  const handleSave = () => {
    // Filter out empty dependencies
    const validDeps = dependencies.filter(d => d.activityId);
    onSave(activity.id, validDeps);
    onOpenChange(false);
  };

  // Available predecessors (exclude self and already selected)
  const getAvailablePredecessors = (currentIndex: number) => {
    const selectedIds = dependencies
      .map((d, i) => (i !== currentIndex ? d.activityId : null))
      .filter(Boolean);
    return allActivities.filter(a => a.id !== activity.id && !selectedIds.includes(a.id));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="w-5 h-5 text-blue-600" />
            Quản lý Dependencies - {activity.code}: {activity.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Dependencies */}
          {dependencies.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Link className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Chưa có predecessor nào</p>
              <p className="text-sm mt-1">Click "Thêm Predecessor" để bắt đầu</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dependencies.map((dep, index) => {
                const predecessor = allActivities.find(a => a.id === dep.activityId);
                return (
                  <div key={index} className="flex items-start gap-3 p-4 border rounded-lg bg-gray-50">
                    {/* Predecessor Select */}
                    <div className="flex-1 space-y-2">
                      <Label className="text-xs text-gray-600">Predecessor Activity</Label>
                      <Select
                        value={dep.activityId}
                        onValueChange={(value) => updateDependency(index, 'activityId', value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn predecessor..." />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailablePredecessors(index).map((act) => (
                            <SelectItem key={act.id} value={act.id}>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-gray-600">{act.code}</span>
                                <span className="text-sm">{act.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {predecessor && (
                        <div className="text-xs text-gray-500">
                          Duration: {predecessor.durationDays} ngày
                        </div>
                      )}
                    </div>

                    {/* Dependency Type */}
                    <div className="w-48 space-y-2">
                      <Label className="text-xs text-gray-600">Loại quan hệ</Label>
                      <Select
                        value={dep.type}
                        onValueChange={(value) => updateDependency(index, 'type', value as DependencyType)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DEPENDENCY_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div>
                                <div className="font-semibold">{type.label}</div>
                                <div className="text-xs text-gray-500">{type.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Lag/Lead */}
                    <div className="w-32 space-y-2">
                      <Label className="text-xs text-gray-600">Lag/Lead (days)</Label>
                      <Input
                        type="number"
                        value={dep.lagDays || 0}
                        onChange={(e) => updateDependency(index, 'lagDays', parseInt(e.target.value) || 0)}
                        className="text-center"
                        placeholder="0"
                      />
                      <div className="text-xs text-center text-gray-500">
                        {(dep.lagDays || 0) > 0 ? `+${dep.lagDays} lag` : (dep.lagDays || 0) < 0 ? `${dep.lagDays} lead` : 'No lag'}
                      </div>
                    </div>

                    {/* Delete Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDependency(index)}
                      className="mt-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Button */}
          <Button
            variant="outline"
            onClick={addDependency}
            className="w-full border-dashed"
            disabled={dependencies.length >= allActivities.length - 1}
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm Predecessor
          </Button>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <div className="font-semibold text-blue-900 mb-2">💡 Hướng dẫn sử dụng:</div>
            <ul className="space-y-1 text-blue-800">
              <li><strong>FS (Finish-to-Start):</strong> Task này bắt đầu sau khi predecessor kết thúc (phổ biến nhất)</li>
              <li><strong>SS (Start-to-Start):</strong> Task này bắt đầu cùng lúc với predecessor</li>
              <li><strong>FF (Finish-to-Finish):</strong> Task này kết thúc cùng lúc với predecessor</li>
              <li><strong>SF (Start-to-Finish):</strong> Task này kết thúc sau khi predecessor bắt đầu (ít dùng)</li>
              <li><strong>Lag (&gt;0):</strong> Trì hoãn thêm X ngày sau predecessor</li>
              <li><strong>Lead (&lt;0):</strong> Bắt đầu sớm hơn X ngày trước khi predecessor kết thúc</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSave}>
            💾 Lưu Dependencies
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

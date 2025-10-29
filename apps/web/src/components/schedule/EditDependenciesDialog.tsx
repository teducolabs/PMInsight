import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Link, FolderTree } from 'lucide-react';
import type { WBSNode, ActivityDependency } from '@/types/wbs';
import { DependencyType, flattenWBSTree } from '@/types/wbs';

interface EditDependenciesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node: WBSNode;
  allNodes: WBSNode[];
  onSave: (nodeId: string, dependencies: ActivityDependency[]) => void;
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
  node,
  allNodes,
  onSave,
}: EditDependenciesDialogProps) {
  const [dependencies, setDependencies] = useState<ActivityDependency[]>([]);
  const [includeSummaries, setIncludeSummaries] = useState(true); // Allow Summary nodes as predecessors

  // Get all task/milestone nodes (flatten the tree)
  const allFlattenedNodes = flattenWBSTree(allNodes);
  const allTaskNodes = allFlattenedNodes.filter(n => {
    // Exclude current node
    if (n.id === node.id) return false;
    
    // Include Task/Milestone always
    if (n.type === 'Task' || n.type === 'Milestone') return true;
    
    // Include Summary if option enabled
    if (n.type === 'Summary' && includeSummaries) return true;
    
    return false;
  });

  useEffect(() => {
    if (open && node) {
      const loadedDeps = node.predecessors || [];
      
      // Check if loaded dependencies have valid nodeIds (for debugging)
      loadedDeps.forEach(dep => {
        const exists = allTaskNodes.find(n => n.id === dep.nodeId);
        if (!exists) {
          console.warn('⚠️ Predecessor node not found:', dep.nodeId, dep.nodeName);
          console.warn('💡 Try enabling "Include Summary nodes" option');
        }
      });
      
      setDependencies(loadedDeps);
    }
  }, [open, node, allTaskNodes]);

  const addDependency = () => {
    const newDep: ActivityDependency = {
      nodeId: '',
      nodeName: '',
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
          if (field === 'nodeId') {
            const selectedNode = allTaskNodes.find(n => n.id === value);
            return { 
              ...dep, 
              nodeId: value,
              nodeName: selectedNode?.name || '',
              nodeCode: selectedNode?.code,
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
    const validDeps = dependencies.filter(d => d.nodeId && d.nodeId.trim() !== '');
    onSave(node.id, validDeps);
    onOpenChange(false);
  };

  // Available predecessors (exclude already selected EXCEPT current one)
  const getAvailablePredecessors = (currentIndex: number) => {
    const currentDep = dependencies[currentIndex];
    const selectedIds = dependencies
      .map((d, i) => (i !== currentIndex ? d.nodeId : null))
      .filter(Boolean) as string[];
    
    // Include all task/milestone nodes, but mark already selected ones
    return allTaskNodes.filter(n => 
      // Include if not selected by other dependencies, OR if it's the current selection
      !selectedIds.includes(n.id) || n.id === currentDep?.nodeId
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="w-5 h-5 text-blue-600" />
            Quản lý Dependencies - {node.code}: {node.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Filter Options */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
            <input
              type="checkbox"
              id="include-summaries"
              checked={includeSummaries}
              onChange={(e) => setIncludeSummaries(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <Label htmlFor="include-summaries" className="text-sm cursor-pointer flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-amber-600" />
              <span>Cho phép chọn Summary nodes làm predecessor</span>
              <span className="text-xs text-gray-500">
                ({includeSummaries ? `${allTaskNodes.length} nodes khả dụng` : `Chỉ Task/Milestone`})
              </span>
            </Label>
          </div>

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
                const predecessor = allTaskNodes.find(n => n.id === dep.nodeId);
                const availableNodes = getAvailablePredecessors(index);
                const currentNodeExists = availableNodes.some(n => n.id === dep.nodeId);
                
                return (
                  <div key={index} className="flex items-start gap-3 p-4 border rounded-lg bg-gray-50">
                    {/* Predecessor Select */}
                    <div className="flex-1 space-y-2">
                      <Label className="text-xs text-gray-600">
                        Predecessor {includeSummaries ? 'Node' : 'Task/Milestone'}
                      </Label>
                      {!currentNodeExists && dep.nodeId && (
                        <div className="text-xs text-amber-600 mb-1">
                          ⚠️ Node "{dep.nodeName}" (ID: {dep.nodeId}) không tìm thấy trong danh sách
                        </div>
                      )}
                      <Select
                        value={currentNodeExists ? dep.nodeId : ''}
                        onValueChange={(value) => updateDependency(index, 'nodeId', value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={dep.nodeId && !currentNodeExists ? `${dep.nodeName} (không tồn tại)` : "Chọn predecessor..."} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableNodes.length === 0 ? (
                            <div className="p-2 text-sm text-gray-500">
                              {includeSummaries 
                                ? 'Không có node nào khả dụng' 
                                : 'Không có task/milestone nào. Thử bật "Cho phép Summary"'
                              }
                            </div>
                          ) : (
                            availableNodes.map((n) => (
                              <SelectItem key={n.id} value={n.id}>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs">
                                    {n.type === 'Summary' ? '📁' : n.type === 'Milestone' ? '🏁' : '📋'}
                                  </span>
                                  <span className="font-mono text-xs text-gray-600">{n.code}</span>
                                  <span className="text-sm">{n.name}</span>
                                  {n.type === 'Summary' && (
                                    <span className="text-xs text-amber-600">(Summary)</span>
                                  )}
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {predecessor && (
                        <div className="text-xs text-gray-500">
                          {predecessor.type === 'Milestone' 
                            ? `Milestone: ${predecessor.plannedEndDate ? new Date(predecessor.plannedEndDate).toLocaleDateString('vi-VN') : 'N/A'}`
                            : `Duration: ${predecessor.durationDays || 0} ngày`
                          }
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
            disabled={dependencies.length >= allTaskNodes.length}
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

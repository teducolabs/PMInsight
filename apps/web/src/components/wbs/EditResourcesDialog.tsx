import { useState, useEffect } from 'react';
import { Plus, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { WBSNode, ResourceAssignment, AddResourceAssignmentRequest, UpdateResourceAssignmentRequest } from '@/types/wbs';
import { wbsApi } from '@/lib/api/wbs';
import { toast } from '@/components/ui/use-toast';

interface EditResourcesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  node: WBSNode | null;
  wbsId: string;
  onUpdate: () => void;
}

// Mock users - In production, this should come from an API
const MOCK_USERS = [
  { id: 'user-1', name: 'Nguyễn Văn A', email: 'nguyen.a@example.com' },
  { id: 'user-2', name: 'Trần Thị B', email: 'tran.b@example.com' },
  { id: 'user-3', name: 'Lê Văn C', email: 'le.c@example.com' },
  { id: 'user-4', name: 'Phạm Thị D', email: 'pham.d@example.com' },
  { id: 'user-5', name: 'Hoàng Văn E', email: 'hoang.e@example.com' },
];

const ROLE_OPTIONS = [
  'Developer',
  'Senior Developer',
  'Tech Lead',
  'Tester',
  'QA',
  'Designer',
  'Project Manager',
  'Business Analyst',
  'DevOps',
  'Architect',
];

export function EditResourcesDialog({
  isOpen,
  onClose,
  node,
  wbsId,
  onUpdate,
}: EditResourcesDialogProps) {
  const [assignments, setAssignments] = useState<ResourceAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [newAssignment, setNewAssignment] = useState<Partial<AddResourceAssignmentRequest>>({
    allocationPercent: 100,
    estimatedHours: 0,
    isPrimary: false,
  });

  useEffect(() => {
    if (node && isOpen) {
      setAssignments(node.resourceAssignments || []);
    }
  }, [node, isOpen]);

  const handleAddResource = async () => {
    if (!selectedUserId || !node) return;

    const selectedUser = MOCK_USERS.find(u => u.id === selectedUserId);
    if (!selectedUser) return;

    try {
      setLoading(true);

      const request: AddResourceAssignmentRequest = {
        userId: selectedUserId,
        allocationPercent: newAssignment.allocationPercent || 100,
        role: newAssignment.role,
        estimatedHours: newAssignment.estimatedHours || 0,
        plannedCost: newAssignment.plannedCost,
        currency: newAssignment.currency || 'VND',
        isPrimary: newAssignment.isPrimary || false,
      };

      const result = await wbsApi.addResourceAssignment(wbsId, node.id, request);
      
      setAssignments([...assignments, result]);
      
      // Reset form
      setSelectedUserId('');
      setNewAssignment({
        allocationPercent: 100,
        estimatedHours: 0,
        isPrimary: false,
      });

      toast({
        title: 'Resource Added',
        description: `${selectedUser.name} has been assigned to this task.`,
      });

      onUpdate();
    } catch (error: any) {
      console.error('Failed to add resource:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to add resource',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAssignment = async (
    assignmentId: string,
    updates: UpdateResourceAssignmentRequest
  ) => {
    if (!node) return;

    try {
      setLoading(true);

      const result = await wbsApi.updateResourceAssignment(
        wbsId,
        node.id,
        assignmentId,
        updates
      );

      setAssignments(
        assignments.map((a) => (a.id === assignmentId ? result : a))
      );

      toast({
        title: 'Resource Updated',
        description: 'Assignment has been updated successfully.',
      });

      onUpdate();
    } catch (error: any) {
      console.error('Failed to update resource:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update resource',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!node) return;

    try {
      setLoading(true);

      await wbsApi.removeResourceAssignment(wbsId, node.id, assignmentId);

      setAssignments(assignments.filter((a) => a.id !== assignmentId));

      toast({
        title: 'Resource Removed',
        description: 'Assignment has been removed.',
      });

      onUpdate();
    } catch (error: any) {
      console.error('Failed to remove resource:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to remove resource',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetPrimary = async (assignmentId: string) => {
    await handleUpdateAssignment(assignmentId, { isPrimary: true });
  };

  const availableUsers = MOCK_USERS.filter(
    (user) => !assignments.some((a) => a.userId === user.id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Resources - {node?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Assignments */}
          {assignments.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">
                Current Assignments ({assignments.length})
              </h3>
              
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {assignment.userName || 'Unknown User'}
                        </span>
                        {assignment.isPrimary && (
                          <Badge variant="default" className="bg-yellow-500">
                            <Star className="w-3 h-3 mr-1" />
                            Primary
                          </Badge>
                        )}
                        {assignment.role && (
                          <Badge variant="outline">{assignment.role}</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {assignment.userEmail}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!assignment.isPrimary && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetPrimary(assignment.id)}
                          disabled={loading}
                          title="Set as primary resource"
                        >
                          <Star className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAssignment(assignment.id)}
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <Label className="text-xs text-gray-500">Allocation</Label>
                      <div className="font-medium">
                        {assignment.allocationPercent}%
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">
                        Estimated Hours
                      </Label>
                      <div className="font-medium">
                        {assignment.estimatedHours}h
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">
                        Actual Hours
                      </Label>
                      <div className="font-medium text-blue-600">
                        {assignment.actualHours}h
                      </div>
                    </div>
                  </div>

                  {(assignment.plannedCost || assignment.actualCost) && (
                    <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t">
                      <div>
                        <Label className="text-xs text-gray-500">
                          Planned Cost
                        </Label>
                        <div className="font-medium">
                          {assignment.plannedCost?.toLocaleString() || 0}{' '}
                          {assignment.currency || 'VND'}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">
                          Actual Cost
                        </Label>
                        <div className="font-medium text-blue-600">
                          {assignment.actualCost?.toLocaleString() || 0}{' '}
                          {assignment.currency || 'VND'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add New Resource */}
          {availableUsers.length > 0 && (
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-sm font-semibold text-gray-700">
                Add New Resource
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>User *</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Role</Label>
                  <Select
                    value={newAssignment.role}
                    onValueChange={(value) =>
                      setNewAssignment({ ...newAssignment, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Allocation %</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={newAssignment.allocationPercent}
                    onChange={(e) =>
                      setNewAssignment({
                        ...newAssignment,
                        allocationPercent: Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Estimated Hours</Label>
                  <Input
                    type="number"
                    min="0"
                    value={newAssignment.estimatedHours}
                    onChange={(e) =>
                      setNewAssignment({
                        ...newAssignment,
                        estimatedHours: Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Planned Cost</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Optional"
                    value={newAssignment.plannedCost || ''}
                    onChange={(e) =>
                      setNewAssignment({
                        ...newAssignment,
                        plannedCost: Number(e.target.value) || undefined,
                      })
                    }
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAssignment.isPrimary}
                      onChange={(e) =>
                        setNewAssignment({
                          ...newAssignment,
                          isPrimary: e.target.checked,
                        })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Set as primary resource</span>
                  </label>
                </div>
              </div>

              <Button
                onClick={handleAddResource}
                disabled={!selectedUserId || loading}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Resource
              </Button>
            </div>
          )}

          {availableUsers.length === 0 && assignments.length > 0 && (
            <div className="text-center text-gray-500 text-sm py-4">
              All available users have been assigned
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

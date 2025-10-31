import { useState } from 'react';
import {
  Dialog,
  DialogContent,
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
import type { WBSNode } from '../types/wbs';

type InsertPosition = 'above' | 'below' | 'child';

interface QuickInsertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetNode: WBSNode;
  position: InsertPosition;
  onSave: (data: {
    name: string;
    type: 'Summary' | 'Task' | 'Milestone';
  }) => Promise<void>;
}

const POSITION_LABELS = {
  above: 'phía trên',
  below: 'phía dưới',
  child: 'con của',
};

const NODE_TYPE_OPTIONS = [
  { value: 'Summary', label: '📦 Tổng hợp', icon: '📦' },
  { value: 'Task', label: '✓ Công việc', icon: '✓' },
  { value: 'Milestone', label: '🏁 Mốc quan trọng', icon: '🏁' },
];

export function QuickInsertDialog({
  open,
  onOpenChange,
  targetNode,
  position,
  onSave,
}: QuickInsertDialogProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'Summary' | 'Task' | 'Milestone'>('Task');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;

    try {
      setLoading(true);
      await onSave({ name: name.trim(), type });
      
      // Reset form
      setName('');
      setType('Task');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to insert node:', error);
      // Error will be handled by parent component
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            Thêm mục mới {POSITION_LABELS[position]} "{targetNode.name}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Tên công việc <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tên công việc..."
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Loại</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as 'Summary' | 'Task' | 'Milestone')}
              disabled={loading}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NODE_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-md border border-blue-200">
            <p>
              <strong>Vị trí:</strong> Mục mới sẽ được thêm{' '}
              <strong>{POSITION_LABELS[position]}</strong> mục "
              {targetNode.name}"
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || loading}>
            {loading ? 'Đang thêm...' : 'Thêm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

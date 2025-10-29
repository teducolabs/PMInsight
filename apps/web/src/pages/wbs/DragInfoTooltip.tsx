import type { WBSNode } from '@/types/wbs';
import { flattenWBSTree } from '@/types/wbs';
import { validateTaskMove, calculateCascadingUpdates } from '@/lib/dependency-scheduler';

interface DragInfoTooltipProps {
  draggingTask: string;
  dragMode: 'move' | 'resize-start' | 'resize-end';
  dragInfo: {
    startDate: string;
    endDate: string;
    days: number;
    newStartDate?: Date;
    newEndDate?: Date;
  };
  wbsNodes: WBSNode[];
}

export function DragInfoTooltip({ draggingTask, dragMode, dragInfo, wbsNodes }: DragInfoTooltipProps) {
  // Check validation while dragging
  const flatNodes = flattenWBSTree(wbsNodes);
  const draggedNode = flatNodes.find(n => n.id === draggingTask);
  const validation = draggedNode && dragInfo.newStartDate && dragInfo.newEndDate
    ? validateTaskMove(draggedNode, dragInfo.newStartDate, dragInfo.newEndDate, flatNodes)
    : { valid: true, errors: [] };
  
  // Calculate cascading updates count
  const cascadingCount = draggedNode && dragInfo.newStartDate && dragInfo.newEndDate
    ? calculateCascadingUpdates(draggedNode, dragInfo.newStartDate, dragInfo.newEndDate, flatNodes).size
    : 0;

  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${validation.valid ? 'bg-blue-600' : 'bg-red-600'} text-white`}>
      <div className="text-xs font-semibold mb-1">
        {dragMode === 'move' ? '🔄 Di chuyển task' :
          dragMode === 'resize-start' ? '⬅️ Thay đổi ngày bắt đầu' :
            '➡️ Thay đổi ngày kết thúc'}
      </div>
      <div className="text-sm">
        <div>📅 {dragInfo.startDate} → {dragInfo.endDate}</div>
        <div className="mt-1">⏱️ {dragInfo.days} ngày</div>
        {cascadingCount > 0 && (
          <div className="mt-1">🔗 {cascadingCount} task(s) sẽ tự động cập nhật</div>
        )}
        {!validation.valid && (
          <div className="mt-2 pt-2 border-t border-red-400">
            <div className="font-semibold mb-1">⚠️ Vi phạm dependencies:</div>
            {validation.errors.map((err, i) => (
              <div key={i} className="text-xs">• {err}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

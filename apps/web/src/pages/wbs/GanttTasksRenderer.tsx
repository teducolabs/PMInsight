import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { WBSNode } from '@/features/wbs';
import { GanttTask, WBSSummaryBar } from '@/features/schedule';
import { ROW_HEIGHT } from './columnConfig';

interface GanttTasksRendererProps {
  visibleRows: Array<{ node: WBSNode; depth: number }>;
  startDate: Date;
  columnWidth: number;
  draggingTask: string | null;
  dragInfo: {
    startDate: string;
    endDate: string;
    days: number;
    newStartDate?: Date;
    newEndDate?: Date;
  } | null;
  hoveredTask: string | null;
  getTaskPosition: (node: WBSNode) => { x: number; width: number; y: number } | null;
  getWBSPosition: (node: WBSNode) => { x: number; width: number; dateRange: { startDate: Date; endDate: Date } } | null;
  getWBSProgress: (node: WBSNode) => number;
  onSetHoveredTask: (taskId: string | null) => void;
  onEditNode: (node: WBSNode) => void;
  onTaskMouseDown: (e: React.MouseEvent, nodeId: string, mode: 'move' | 'resize-start' | 'resize-end') => void;
}

export function GanttTasksRenderer({
  visibleRows,
  startDate,
  columnWidth,
  draggingTask,
  dragInfo,
  hoveredTask,
  getTaskPosition,
  getWBSPosition,
  getWBSProgress,
  onSetHoveredTask,
  onEditNode,
  onTaskMouseDown,
}: GanttTasksRendererProps) {
  return (
    <>
      {visibleRows.map((row, index) => {
        const { node } = row;

        // For ALL nodes with dates: show task bar
        if (!node.plannedStartDate || !node.plannedEndDate) {
          return null; // Skip nodes without dates
        }

        // For Summary nodes: show summary bar (regardless of expand state)
        if (node.type === 'Summary') {
          const position = getWBSPosition(node);
          if (!position) return null;

          const progress = getWBSProgress(node);
          const isHovered = hoveredTask === `wbs-${node.id}`;
          const isDragging = draggingTask === node.id;
          
          // Calculate preview position when dragging
          let displayX = position.x;
          let displayWidth = position.width;

          if (isDragging && dragInfo?.newStartDate && dragInfo?.newEndDate) {
            const daysSinceStart = Math.floor(
              (dragInfo.newStartDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            const duration = Math.max(1, Math.ceil(
              (dragInfo.newEndDate.getTime() - dragInfo.newStartDate.getTime()) / (1000 * 60 * 60 * 24)
            ));

            displayX = Math.floor(daysSinceStart / 7) * columnWidth;
            displayWidth = Math.max(1, Math.ceil(duration / 7)) * columnWidth;
          }
          
          const tooltipContent = (
            <div className="text-xs">
              <div className="font-semibold mb-1">{node.name}</div>
              <div className="text-gray-400">
                {format(position.dateRange.startDate, 'dd/MM/yyyy', { locale: vi })} → {' '}
                {format(position.dateRange.endDate, 'dd/MM/yyyy', { locale: vi })}
              </div>
              <div className="mt-1">Tiến độ: {progress}%</div>
            </div>
          );

          const summaryY = index * ROW_HEIGHT + (ROW_HEIGHT - 32) / 2;

          return (
            <g key={`wbs-${node.id}`}>
              <WBSSummaryBar
                x={displayX}
                y={summaryY}
                width={displayWidth}
                height={32}
                label={`${progress}%`}
                progress={progress}
                tooltipContent={tooltipContent}
                isHovered={isHovered}
                onMouseEnter={() => onSetHoveredTask(`wbs-${node.id}`)}
                onMouseLeave={() => onSetHoveredTask(null)}
                onDoubleClick={() => onEditNode(node)}
                onStartDrag={(e) => onTaskMouseDown(e, node.id, 'resize-start')}
                onEndDrag={(e) => onTaskMouseDown(e, node.id, 'resize-end')}
                onBarDrag={(e) => onTaskMouseDown(e, node.id, 'move')}
              />
              
              {/* Dashed outline when dragging */}
              {isDragging && (
                <rect
                  x={displayX - 2}
                  y={summaryY - 2}
                  width={displayWidth + 4}
                  height={32 + 4}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  pointerEvents="none"
                />
              )}
            </g>
          );
        }

        // For Task/Milestone nodes: show task bar with drag handles
        if (node.type === 'Task' || node.type === 'Milestone') {
          const position = getTaskPosition(node);
          if (!position) return null;

          const isDragging = draggingTask === node.id;
          const isHovered = hoveredTask === node.id;
          const taskY = index * ROW_HEIGHT + (ROW_HEIGHT - 32) / 2;

          // Calculate preview position when dragging
          let displayX = position.x;
          let displayWidth = position.width;

          if (isDragging && dragInfo?.newStartDate && dragInfo?.newEndDate) {
            const daysSinceStart = Math.floor(
              (dragInfo.newStartDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            const duration = Math.max(1, Math.ceil(
              (dragInfo.newEndDate.getTime() - dragInfo.newStartDate.getTime()) / (1000 * 60 * 60 * 24)
            ));

            displayX = Math.floor(daysSinceStart / 7) * columnWidth;
            displayWidth = Math.max(1, Math.ceil(duration / 7)) * columnWidth;
          }

          return (
            <g key={node.id}>
              {/* Main task bar */}
              <GanttTask
                node={node}
                x={displayX}
                y={taskY}
                width={displayWidth}
                height={32}
                isHovered={isHovered}
                onMouseEnter={() => onSetHoveredTask(node.id)}
                onMouseLeave={() => onSetHoveredTask(null)}
                onDoubleClick={() => onEditNode(node)}
              />

              {/* Dashed outline when dragging */}
              {isDragging && (
                <rect
                  x={displayX - 2}
                  y={taskY - 2}
                  width={displayWidth + 4}
                  height={32 + 4}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  pointerEvents="none"
                />
              )}

              {/* Left resize handle - always visible on hover */}
              <rect
                x={displayX - 4}
                y={taskY + 2}
                width={8}
                height={32 - 4}
                fill={(isHovered || isDragging) ? "#3b82f6" : "transparent"}
                stroke={(isHovered || isDragging) ? "#fff" : "none"}
                strokeWidth={1}
                cursor="ew-resize"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onTaskMouseDown(e, node.id, 'resize-start');
                }}
                onMouseEnter={() => onSetHoveredTask(node.id)}
              />

              {/* Right resize handle - always visible on hover */}
              <rect
                x={displayX + displayWidth - 4}
                y={taskY + 2}
                width={8}
                height={32 - 4}
                fill={(isHovered || isDragging) ? "#3b82f6" : "transparent"}
                stroke={(isHovered || isDragging) ? "#fff" : "none"}
                strokeWidth={1}
                cursor="ew-resize"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onTaskMouseDown(e, node.id, 'resize-end');
                }}
                onMouseEnter={() => onSetHoveredTask(node.id)}
              />

              {/* Center drag area for moving - higher z-index */}
              <rect
                x={displayX + 8}
                y={taskY}
                width={Math.max(0, displayWidth - 16)}
                height={32}
                fill="transparent"
                cursor={isDragging ? 'grabbing' : 'grab'}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onTaskMouseDown(e, node.id, 'move');
                }}
                onMouseEnter={() => onSetHoveredTask(node.id)}
                onMouseLeave={() => {
                  if (!isDragging) onSetHoveredTask(null);
                }}
              />
            </g>
          );
        }

        // For other node types (shouldn't happen), return null
        return null;
      })}
    </>
  );
}


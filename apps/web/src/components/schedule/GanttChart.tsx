import { useState, useMemo } from 'react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { WBSNode } from '@/types/wbs';
import { GanttHeader } from './GanttHeader';
import { GanttGrid } from './GanttGrid';
import { GanttTask } from './GanttTask';
import { GanttDependency } from './GanttDependency';
import { GanttTimeline } from './GanttTimeline';

export type ViewMode = 'day' | 'week' | 'month';

interface GanttChartProps {
  nodes: WBSNode[];
  viewMode?: ViewMode;
  onNodeClick?: (node: WBSNode) => void;
  onNodeUpdate?: (nodeId: string, start: Date, end: Date) => void;
  height?: number;
}

const ROW_HEIGHT = 50;
const HEADER_HEIGHT = 80;
const TASK_BAR_HEIGHT = 32;

export function GanttChart({
  nodes,
  viewMode = 'week',
  onNodeClick,
  onNodeUpdate,
  height = 600,
}: GanttChartProps) {
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);

  // Flatten all nodes (including nested children) for display
  const flattenedNodes = useMemo(() => {
    const result: WBSNode[] = [];
    const flatten = (nodeList: WBSNode[]) => {
      if (!nodeList || !Array.isArray(nodeList)) return;
      nodeList.forEach(node => {
        // Only include Task and Milestone nodes in Gantt
        if (node.type === 'Task' || node.type === 'Milestone') {
          result.push(node);
        }
        if (node.children && node.children.length > 0) {
          flatten(node.children);
        }
      });
    };
    flatten(nodes);
    return result;
  }, [nodes]);

  // Calculate date range
  const { startDate, endDate } = useMemo(() => {
    if (flattenedNodes.length === 0) {
      const today = new Date();
      return {
        startDate: startOfMonth(today),
        endDate: endOfMonth(addDays(today, 90)),
      };
    }

    const dates = flattenedNodes
      .flatMap(n => [
        n.plannedStartDate ? new Date(n.plannedStartDate) : null,
        n.plannedEndDate ? new Date(n.plannedEndDate) : null,
      ])
      .filter((d): d is Date => d !== null);

    if (dates.length === 0) {
      const today = new Date();
      return {
        startDate: startOfMonth(today),
        endDate: endOfMonth(addDays(today, 90)),
      };
    }

    const min = new Date(Math.min(...dates.map(d => d.getTime())));
    const max = new Date(Math.max(...dates.map(d => d.getTime())));

    // Add padding
    return {
      startDate: startOfMonth(addDays(min, -7)),
      endDate: endOfMonth(addDays(max, 14)),
    };
  }, [flattenedNodes]);

  // Calculate column width based on view mode
  const columnWidth = useMemo(() => {
    switch (viewMode) {
      case 'day':
        return 40;
      case 'week':
        return 60;
      case 'month':
        return 120;
    }
  }, [viewMode]);

  // Generate time columns
  const columns = useMemo(() => {
    switch (viewMode) {
      case 'day':
        return eachDayOfInterval({ start: startDate, end: endDate });
      case 'week':
        return eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 });
      case 'month':
        return eachMonthOfInterval({ start: startDate, end: endDate });
    }
  }, [startDate, endDate, viewMode]);

  const totalWidth = columns.length * columnWidth;

  // Calculate task positions
  const getTaskPosition = (node: WBSNode) => {
    if (!node.plannedStartDate || !node.plannedEndDate) {
      return null;
    }

    const taskStart = new Date(node.plannedStartDate);
    const taskEnd = new Date(node.plannedEndDate);

    // Calculate X position
    const daysSinceStart = Math.floor((taskStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const taskDuration = Math.max(1, Math.floor((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)));

    let x = 0;
    let width = 0;

    switch (viewMode) {
      case 'day':
        x = daysSinceStart * columnWidth;
        width = taskDuration * columnWidth;
        break;
      case 'week':
        x = Math.floor(daysSinceStart / 7) * columnWidth;
        width = Math.max(1, Math.ceil(taskDuration / 7)) * columnWidth;
        break;
      case 'month':
        // Simplified month calculation
        const monthsSinceStart = (taskStart.getFullYear() - startDate.getFullYear()) * 12 + (taskStart.getMonth() - startDate.getMonth());
        const taskMonths = Math.max(1, (taskEnd.getFullYear() - taskStart.getFullYear()) * 12 + (taskEnd.getMonth() - taskStart.getMonth()) + 1);
        x = monthsSinceStart * columnWidth;
        width = taskMonths * columnWidth;
        break;
    }

    return { x, width };
  };

  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      {/* Header */}
      <div className="border-b">
        <GanttHeader
          columns={columns}
          columnWidth={columnWidth}
          viewMode={viewMode}
        />
      </div>

      {/* Main chart area */}
      <div
        className="overflow-auto relative"
        style={{ height: height - HEADER_HEIGHT }}
      >
        {/* Task list sidebar with grid lines */}
        <div className="absolute left-0 top-0 w-64 bg-gray-50 border-r z-10">
          <div className="sticky top-0 bg-gray-100 px-4 py-3 font-medium text-sm border-b">
            Tasks & Milestones
          </div>
          
          {/* Horizontal lines for each row */}
          <svg
            className="absolute top-0 left-0 w-full pointer-events-none"
            height={flattenedNodes.length * ROW_HEIGHT}
          >
            {flattenedNodes.map((_, index) => (
              <line
                key={index}
                x1={0}
                y1={index * ROW_HEIGHT}
                x2={256}
                y2={index * ROW_HEIGHT}
                stroke="#e5e7eb"
                strokeWidth={1}
              />
            ))}
          </svg>

          {flattenedNodes.map((node, index) => {
            const startDate = node.plannedStartDate ? new Date(node.plannedStartDate) : null;
            const endDate = node.plannedEndDate ? new Date(node.plannedEndDate) : null;
            
            return (
              <div
                key={node.id}
                className="px-4 py-3 text-sm hover:bg-gray-100 cursor-pointer relative"
                style={{ height: ROW_HEIGHT }}
                onClick={() => onNodeClick?.(node)}
              >
                <div className="font-medium truncate">{node.name}</div>
                <div className="text-xs text-gray-500 truncate">
                  {node.code || `#${index + 1}`}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {startDate && endDate ? (
                    <>
                      {format(startDate, 'dd/MM', { locale: vi })} → {format(endDate, 'dd/MM/yyyy', { locale: vi })}
                      <span className="ml-1 text-gray-500">({node.durationDays}d)</span>
                    </>
                  ) : (
                    <span className="text-gray-300">Chưa có timeline</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Chart area */}
        <div
          className="ml-64"
          style={{
            width: totalWidth,
            minHeight: flattenedNodes.length * ROW_HEIGHT,
          }}
        >
          {/* Grid */}
          <GanttGrid
            columns={columns}
            columnWidth={columnWidth}
            rowHeight={ROW_HEIGHT}
            rowCount={flattenedNodes.length}
          />

          {/* Tasks */}
          <svg
            width={totalWidth}
            height={flattenedNodes.length * ROW_HEIGHT}
            className="absolute top-0 left-0"
          >
            {/* Today marker */}
            <GanttTimeline
              startDate={startDate}
              columnWidth={columnWidth}
              viewMode={viewMode}
              totalHeight={flattenedNodes.length * ROW_HEIGHT}
            />

            {/* Dependencies first (so they appear behind tasks) */}
            {flattenedNodes.map(node =>
              (node.predecessors || []).map(pred => {
                const predecessorNode = flattenedNodes.find(n => n.id === pred.nodeId);
                if (!predecessorNode) return null;

                const successorPos = getTaskPosition(node);
                const predecessorPos = getTaskPosition(predecessorNode);
                const successorIndex = flattenedNodes.findIndex(n => n.id === node.id);
                const predecessorIndex = flattenedNodes.findIndex(n => n.id === pred.nodeId);

                if (!successorPos || !predecessorPos) return null;

                return (
                  <GanttDependency
                    key={`${pred.nodeId}-${node.id}`}
                    type={pred.type}
                    fromX={predecessorPos.x + predecessorPos.width}
                    fromY={predecessorIndex * ROW_HEIGHT + ROW_HEIGHT / 2}
                    toX={successorPos.x}
                    toY={successorIndex * ROW_HEIGHT + ROW_HEIGHT / 2}
                  />
                );
              })
            )}

            {/* Task bars */}
            {flattenedNodes.map((node, index) => {
              const position = getTaskPosition(node);
              if (!position) return null;

              return (
                <GanttTask
                  key={node.id}
                  node={node}
                  x={position.x}
                  y={index * ROW_HEIGHT + (ROW_HEIGHT - TASK_BAR_HEIGHT) / 2}
                  width={position.width}
                  height={TASK_BAR_HEIGHT}
                  isHovered={hoveredTask === node.id}
                  onMouseEnter={() => setHoveredTask(node.id)}
                  onMouseLeave={() => setHoveredTask(null)}
                  onClick={() => onNodeClick?.(node)}
                />
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}

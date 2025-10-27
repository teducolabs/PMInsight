import { useState, useMemo } from 'react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { Activity } from '@/types/activity';
import { GanttHeader } from './GanttHeader';
import { GanttGrid } from './GanttGrid';
import { GanttTask } from './GanttTask';
import { GanttDependency } from './GanttDependency';
import { GanttTimeline } from './GanttTimeline';

export type ViewMode = 'day' | 'week' | 'month';

interface GanttChartProps {
  activities: Activity[];
  viewMode?: ViewMode;
  onActivityClick?: (activity: Activity) => void;
  onActivityUpdate?: (activityId: string, start: Date, end: Date) => void;
  height?: number;
}

const ROW_HEIGHT = 50;
const HEADER_HEIGHT = 80;
const TASK_BAR_HEIGHT = 32;

export function GanttChart({
  activities,
  viewMode = 'week',
  onActivityClick,
  onActivityUpdate,
  height = 600,
}: GanttChartProps) {
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);

  // Calculate date range
  const { startDate, endDate } = useMemo(() => {
    if (activities.length === 0) {
      const today = new Date();
      return {
        startDate: startOfMonth(today),
        endDate: endOfMonth(addDays(today, 90)),
      };
    }

    const dates = activities
      .flatMap(a => [
        a.plannedStartDate ? new Date(a.plannedStartDate) : null,
        a.plannedEndDate ? new Date(a.plannedEndDate) : null,
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
  }, [activities]);

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
  const getTaskPosition = (activity: Activity) => {
    if (!activity.plannedStartDate || !activity.plannedEndDate) {
      return null;
    }

    const taskStart = new Date(activity.plannedStartDate);
    const taskEnd = new Date(activity.plannedEndDate);

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
        {/* Task list sidebar */}
        <div className="absolute left-0 top-0 w-64 bg-gray-50 border-r z-10">
          <div className="sticky top-0 bg-gray-100 px-4 py-3 font-medium text-sm border-b">
            Công việc
          </div>
          {activities.map((activity, index) => (
            <div
              key={activity.id}
              className="px-4 py-3 border-b text-sm hover:bg-gray-100 cursor-pointer truncate"
              style={{ height: ROW_HEIGHT }}
              onClick={() => onActivityClick?.(activity)}
            >
              <div className="font-medium truncate">{activity.name}</div>
              <div className="text-xs text-gray-500 truncate">
                {activity.code || `#${index + 1}`}
              </div>
            </div>
          ))}
        </div>

        {/* Chart area */}
        <div
          className="ml-64"
          style={{
            width: totalWidth,
            minHeight: activities.length * ROW_HEIGHT,
          }}
        >
          {/* Grid */}
          <GanttGrid
            columns={columns}
            columnWidth={columnWidth}
            rowHeight={ROW_HEIGHT}
            rowCount={activities.length}
          />

          {/* Tasks */}
          <svg
            width={totalWidth}
            height={activities.length * ROW_HEIGHT}
            className="absolute top-0 left-0"
          >
            {/* Today marker */}
            <GanttTimeline
              startDate={startDate}
              columnWidth={columnWidth}
              viewMode={viewMode}
              totalHeight={activities.length * ROW_HEIGHT}
            />

            {/* Dependencies first (so they appear behind tasks) */}
            {activities.map(activity =>
              activity.predecessors.map(pred => {
                const predecessorActivity = activities.find(a => a.id === pred.activityId);
                if (!predecessorActivity) return null;

                const successorPos = getTaskPosition(activity);
                const predecessorPos = getTaskPosition(predecessorActivity);
                const successorIndex = activities.findIndex(a => a.id === activity.id);
                const predecessorIndex = activities.findIndex(a => a.id === pred.activityId);

                if (!successorPos || !predecessorPos) return null;

                return (
                  <GanttDependency
                    key={`${pred.activityId}-${activity.id}`}
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
            {activities.map((activity, index) => {
              const position = getTaskPosition(activity);
              if (!position) return null;

              return (
                <GanttTask
                  key={activity.id}
                  activity={activity}
                  x={position.x}
                  y={index * ROW_HEIGHT + (ROW_HEIGHT - TASK_BAR_HEIGHT) / 2}
                  width={position.width}
                  height={TASK_BAR_HEIGHT}
                  isHovered={hoveredTask === activity.id}
                  onMouseEnter={() => setHoveredTask(activity.id)}
                  onMouseLeave={() => setHoveredTask(null)}
                  onClick={() => onActivityClick?.(activity)}
                />
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}

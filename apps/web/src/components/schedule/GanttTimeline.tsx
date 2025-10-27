import type { ViewMode } from './GanttChart';

interface GanttTimelineProps {
  startDate: Date;
  columnWidth: number;
  viewMode: ViewMode;
  totalHeight: number;
}

export function GanttTimeline({
  startDate,
  columnWidth,
  viewMode,
  totalHeight,
}: GanttTimelineProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate X position of today
  const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  let x = 0;

  switch (viewMode) {
    case 'day':
      x = daysSinceStart * columnWidth;
      break;
    case 'week':
      x = Math.floor(daysSinceStart / 7) * columnWidth;
      break;
    case 'month':
      const monthsSinceStart = (today.getFullYear() - startDate.getFullYear()) * 12 +
        (today.getMonth() - startDate.getMonth());
      x = monthsSinceStart * columnWidth;
      break;
  }

  // Don't render if today is outside the visible range
  if (x < 0) {
    return null;
  }

  return (
    <g className="today-marker">
      {/* Vertical line */}
      <line
        x1={x}
        y1={0}
        x2={x}
        y2={totalHeight}
        stroke="#ef4444"
        strokeWidth={2}
        strokeDasharray="none"
        opacity={0.7}
      />

      {/* Label at top */}
      <rect
        x={x - 30}
        y={4}
        width={60}
        height={20}
        fill="#ef4444"
        rx={4}
      />
      <text
        x={x}
        y={14}
        textAnchor="middle"
        fontSize="11"
        fill="white"
        fontWeight="600"
        dy="0.35em"
      >
        Hôm nay
      </text>
    </g>
  );
}

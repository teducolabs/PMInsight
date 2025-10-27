interface GanttGridProps {
  columns: Date[];
  columnWidth: number;
  rowHeight: number;
  rowCount: number;
}

export function GanttGrid({ columns, columnWidth, rowHeight, rowCount }: GanttGridProps) {
  const totalWidth = columns.length * columnWidth;
  const totalHeight = rowCount * rowHeight;

  return (
    <svg
      width={totalWidth}
      height={totalHeight}
      className="absolute top-0 left-0 pointer-events-none"
    >
      {/* Vertical lines */}
      {columns.map((column, index) => {
        const x = index * columnWidth;
        const isWeekend = column.getDay() === 0 || column.getDay() === 6;

        return (
          <line
            key={`v-${index}`}
            x1={x}
            y1={0}
            x2={x}
            y2={totalHeight}
            stroke={isWeekend ? '#e5e7eb' : '#f3f4f6'}
            strokeWidth={isWeekend ? 2 : 1}
          />
        );
      })}

      {/* Horizontal lines */}
      {Array.from({ length: rowCount + 1 }).map((_, index) => {
        const y = index * rowHeight;
        return (
          <line
            key={`h-${index}`}
            x1={0}
            y1={y}
            x2={totalWidth}
            y2={y}
            stroke="#f3f4f6"
            strokeWidth={1}
          />
        );
      })}
    </svg>
  );
}

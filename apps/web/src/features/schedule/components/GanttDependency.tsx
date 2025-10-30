import type { DependencyType } from '@/features/wbs';

interface GanttDependencyProps {
  type: DependencyType;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export function GanttDependency({
  type,
  fromX,
  fromY,
  toX,
  toY,
}: GanttDependencyProps) {
  // Calculate path based on dependency type
  const getPath = () => {
    const midX = (fromX + toX) / 2;
    const arrowSize = 6;

    switch (type) {
      case 'FS': // Finish-to-Start (most common)
        if (toX > fromX) {
          // Normal flow: predecessor finishes before successor starts
          return {
            path: `M ${fromX} ${fromY} H ${midX} V ${toY} H ${toX - arrowSize}`,
            arrowX: toX - arrowSize,
            arrowY: toY,
          };
        } else {
          // Overlap: successor starts before predecessor finishes
          return {
            path: `M ${fromX} ${fromY} H ${fromX + 20} V ${toY} H ${toX - arrowSize}`,
            arrowX: toX - arrowSize,
            arrowY: toY,
          };
        }

      case 'SS': // Start-to-Start
        return {
          path: `M ${fromX - 20} ${fromY} V ${toY} H ${toX - arrowSize}`,
          arrowX: toX - arrowSize,
          arrowY: toY,
        };

      case 'FF': // Finish-to-Finish
        return {
          path: `M ${fromX} ${fromY} H ${Math.max(fromX, toX) + 20} V ${toY} H ${toX + arrowSize}`,
          arrowX: toX + arrowSize,
          arrowY: toY,
        };

      case 'SF': // Start-to-Finish (rare)
        return {
          path: `M ${fromX - 20} ${fromY} V ${fromY - 20} H ${toX + 20} V ${toY} H ${toX + arrowSize}`,
          arrowX: toX + arrowSize,
          arrowY: toY,
        };

      default:
        return {
          path: `M ${fromX} ${fromY} L ${toX} ${toY}`,
          arrowX: toX,
          arrowY: toY,
        };
    }
  };

  const { path, arrowX, arrowY } = getPath();
  const arrowSize = 6;

  return (
    <g className="dependency-arrow">
      {/* Line */}
      <path
        d={path}
        fill="none"
        stroke="#6b7280"
        strokeWidth={2}
        strokeDasharray="4 2"
        opacity={0.6}
      />

      {/* Arrow head */}
      <polygon
        points={`${arrowX},${arrowY} ${arrowX - arrowSize},${arrowY - arrowSize / 2} ${arrowX - arrowSize},${arrowY + arrowSize / 2}`}
        fill="#6b7280"
        opacity={0.6}
      />
    </g>
  );
}

import type { WBSNode } from '@/types/wbs';

interface GanttDependencyArrowsProps {
  nodes: WBSNode[];
  getTaskPosition: (node: WBSNode) => { x: number; width: number; y: number } | null;
  rowHeight: number;
  taskBarHeight: number;
}

export function GanttDependencyArrows({
  nodes,
  getTaskPosition,
  taskBarHeight,
}: GanttDependencyArrowsProps) {
  const arrows: JSX.Element[] = [];

  // Debug: Log nodes with predecessors
  const nodesWithDeps = nodes.filter(n => n.predecessors && n.predecessors.length > 0);
  if (nodesWithDeps.length > 0) {
    console.log('🔗 Nodes with dependencies:', nodesWithDeps.map(n => ({ id: n.id, name: n.name, predecessors: n.predecessors })));
  }

  nodes.forEach((node) => {
    // Only task and milestone nodes can have dependencies
    if (node.type !== 'Task' && node.type !== 'Milestone') return;
    if (!node.predecessors || node.predecessors.length === 0) return;

    const successorPos = getTaskPosition(node);
    if (!successorPos) {
      console.log('⚠️ No position found for successor:', node.name);
      return;
    }

    node.predecessors.forEach((dep, index) => {
      const predecessor = nodes.find((n) => n.id === dep.nodeId);
      if (!predecessor) {
        console.log('⚠️ Predecessor not found:', dep.nodeId);
        return;
      }

      const predecessorPos = getTaskPosition(predecessor);
      if (!predecessorPos) {
        console.log('⚠️ No position found for predecessor:', predecessor.name);
        return;
      }

      // Calculate connection points based on dependency type
      let startX: number, startY: number, endX: number, endY: number;
      const midY = taskBarHeight / 2;

      switch (dep.type) {
        case 'FS': // Finish-to-Start (most common)
          startX = predecessorPos.x + predecessorPos.width; // End of predecessor
          startY = predecessorPos.y + midY;
          endX = successorPos.x; // Start of successor
          endY = successorPos.y + midY;
          break;

        case 'SS': // Start-to-Start
          startX = predecessorPos.x; // Start of predecessor
          startY = predecessorPos.y + midY;
          endX = successorPos.x; // Start of successor
          endY = successorPos.y + midY;
          break;

        case 'FF': // Finish-to-Finish
          startX = predecessorPos.x + predecessorPos.width; // End of predecessor
          startY = predecessorPos.y + midY;
          endX = successorPos.x + successorPos.width; // End of successor
          endY = successorPos.y + midY;
          break;

        case 'SF': // Start-to-Finish (rare)
          startX = predecessorPos.x; // Start of predecessor
          startY = predecessorPos.y + midY;
          endX = successorPos.x + successorPos.width; // End of successor
          endY = successorPos.y + midY;
          break;

        default:
          return;
      }

      // Calculate path with corner routing
      const path = calculateArrowPath(startX, startY, endX, endY);

      // Color based on dependency type and lag
      const color = dep.lagDays !== 0 
        ? dep.lagDays > 0 
          ? '#f59e0b' // Orange for lag
          : '#10b981' // Green for lead
        : '#6b7280'; // Gray for normal

      const key = `dep-${predecessor.id}-${node.id}-${index}`;

      arrows.push(
        <g key={key}>
          {/* Arrow path */}
          <path
            d={path}
            stroke={color}
            strokeWidth={2}
            fill="none"
            markerEnd={`url(#arrowhead-${color.replace('#', '')})`}
            opacity={0.7}
          />
          
          {/* Lag/Lead label */}
          {dep.lagDays !== 0 && (
            <text
              x={(startX + endX) / 2}
              y={(startY + endY) / 2 - 5}
              fontSize="10"
              fill={color}
              fontWeight="600"
              textAnchor="middle"
              className="pointer-events-none"
            >
              {dep.lagDays > 0 ? `+${dep.lagDays}d` : `${dep.lagDays}d`}
            </text>
          )}
        </g>
      );
    });
  });

  return (
    <g>
      {/* Define arrowhead markers */}
      <defs>
        <marker
          id="arrowhead-6b7280"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 10 3, 0 6" fill="#6b7280" />
        </marker>
        <marker
          id="arrowhead-f59e0b"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 10 3, 0 6" fill="#f59e0b" />
        </marker>
        <marker
          id="arrowhead-10b981"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 10 3, 0 6" fill="#10b981" />
        </marker>
      </defs>
      
      {arrows}
    </g>
  );
}

// Calculate path with corner routing (90-degree turns)
function calculateArrowPath(
  startX: number,
  startY: number,
  endX: number,
  endY: number
): string {
  const gap = 20; // Gap from task bars
  const cornerRadius = 8;

  // Simple case: same row or direct line
  if (Math.abs(startY - endY) < 5) {
    return `M ${startX + gap} ${startY} L ${endX - gap} ${endY}`;
  }

  // Calculate intermediate points for corner routing
  if (endX > startX + gap * 2) {
    // Forward dependency: straight line with corners
    return `
      M ${startX} ${startY}
      L ${startX + gap} ${startY}
      Q ${startX + gap + cornerRadius} ${startY} ${startX + gap + cornerRadius} ${startY + (endY > startY ? cornerRadius : -cornerRadius)}
      L ${startX + gap + cornerRadius} ${endY - (endY > startY ? cornerRadius : -cornerRadius)}
      Q ${startX + gap + cornerRadius} ${endY} ${startX + gap + cornerRadius * 2} ${endY}
      L ${endX - gap} ${endY}
    `.trim();
  } else {
    // Backward dependency: route around
    const topY = Math.min(startY, endY) - 20;
    return `
      M ${startX} ${startY}
      L ${startX + gap} ${startY}
      Q ${startX + gap + cornerRadius} ${startY} ${startX + gap + cornerRadius} ${startY - cornerRadius}
      L ${startX + gap + cornerRadius} ${topY + cornerRadius}
      Q ${startX + gap + cornerRadius} ${topY} ${startX + gap + cornerRadius * 2} ${topY}
      L ${endX - gap - cornerRadius * 2} ${topY}
      Q ${endX - gap - cornerRadius} ${topY} ${endX - gap - cornerRadius} ${topY + cornerRadius}
      L ${endX - gap - cornerRadius} ${endY - cornerRadius}
      Q ${endX - gap - cornerRadius} ${endY} ${endX - gap} ${endY}
      L ${endX} ${endY}
    `.trim();
  }
}

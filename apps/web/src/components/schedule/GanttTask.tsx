import type { WBSNode } from '@/types/wbs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface GanttTaskProps {
  node: WBSNode;
  x: number;
  y: number;
  width: number;
  height: number;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick?: () => void;
  onDoubleClick?: () => void;
}

export function GanttTask({
  node,
  x,
  y,
  width,
  height,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onClick,
  onDoubleClick,
}: GanttTaskProps) {
  // Task bar color based on node type, critical path and status
  const getTaskColor = () => {
    // Milestone - yellow/amber
    if (node.type === 'Milestone') {
      return { bg: '#fbbf24', progress: '#f59e0b', border: '#d97706' };
    }
    
    // Status-based colors
    if (node.status === 'Completed') {
      return { bg: '#10b981', progress: '#059669', border: '#047857' };
    }
    if (node.status === 'Cancelled') {
      return { bg: '#6b7280', progress: '#4b5563', border: '#374151' };
    }
    
    // Critical path - red
    if (node.isCritical) {
      return { bg: '#ef4444', progress: '#dc2626', border: '#b91c1c' };
    }
    
    // Default task - blue
    return { bg: '#3b82f6', progress: '#2563eb', border: '#1d4ed8' };
  };

  const colors = getTaskColor();
  const progressWidth = (width * (node.percentComplete || 0)) / 100;

  // Milestone rendering (diamond shape)
  if (node.type === 'Milestone') {
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const size = height * 0.8;
    
    return (
      <TooltipProvider>
        <Tooltip open={isHovered}>
          <TooltipTrigger asChild>
            <g
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
              onClick={onClick}
              onDoubleClick={onDoubleClick}
              style={{ cursor: 'pointer' }}
            >
              {/* Diamond shape for milestone */}
              <path
                d={`M ${centerX} ${centerY - size/2} L ${centerX + size/2} ${centerY} L ${centerX} ${centerY + size/2} L ${centerX - size/2} ${centerY} Z`}
                fill={colors.bg}
                stroke={colors.border}
                strokeWidth={isHovered ? 2 : 1}
                opacity={0.9}
              />
              
              {/* Critical indicator */}
              {node.isCritical && (
                <circle
                  cx={centerX}
                  cy={centerY - size/2 - 6}
                  r={4}
                  fill="#ef4444"
                  stroke="white"
                  strokeWidth={2}
                />
              )}
            </g>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-sm">
            <div className="space-y-2">
              <div>
                <p className="font-semibold">🏁 {node.name}</p>
                {node.code && (
                  <p className="text-xs text-gray-500">{node.code}</p>
                )}
                <p className="text-xs text-amber-600 font-medium mt-1">Milestone</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Ngày đạt:</span>
                  <p className="font-medium">
                    {node.plannedEndDate
                      ? format(new Date(node.plannedEndDate), 'dd/MM/yyyy', { locale: vi })
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Trạng thái:</span>
                  <p className="font-medium">{node.status || 'Not Started'}</p>
                </div>
              </div>

              {node.isCritical && (
                <div className="pt-2 border-t">
                  <p className="text-xs font-semibold text-red-600">🔴 Critical Path</p>
                  <div className="text-xs space-y-1 mt-1">
                    <p>Total Float: {node.totalFloat?.toFixed(1) || 0} days</p>
                    <p>Free Float: {node.freeFloat?.toFixed(1) || 0} days</p>
                  </div>
                </div>
              )}

              {node.description && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-500">{node.description}</p>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Task rendering (bar shape)
  return (
    <TooltipProvider>
      <Tooltip open={isHovered}>
        <TooltipTrigger asChild>
          <g
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            style={{ cursor: 'pointer' }}
          >
            {/* Main task bar */}
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              fill={colors.bg}
              stroke={colors.border}
              strokeWidth={isHovered ? 2 : 1}
              rx={4}
              opacity={0.9}
            />

            {/* Progress indicator */}
            {(node.percentComplete || 0) > 0 && (
              <rect
                x={x}
                y={y}
                width={progressWidth}
                height={height}
                fill={colors.progress}
                rx={4}
                opacity={1}
              />
            )}

            {/* Task label */}
            {width > 100 && (
              <text
                x={x + 8}
                y={y + height / 2}
                dy="0.35em"
                fontSize="12"
                fill="white"
                fontWeight="500"
                className="pointer-events-none"
              >
                {node.name.length > 20
                  ? `${node.name.substring(0, 20)}...`
                  : node.name}
              </text>
            )}

            {/* Progress percentage */}
            {width > 60 && (node.percentComplete || 0) > 0 && (
              <text
                x={x + width - 8}
                y={y + height / 2}
                dy="0.35em"
                fontSize="11"
                fill="white"
                textAnchor="end"
                className="pointer-events-none"
              >
                {node.percentComplete}%
              </text>
            )}

            {/* Critical path indicator */}
            {node.isCritical && (
              <circle
                cx={x - 6}
                cy={y + height / 2}
                r={4}
                fill="#ef4444"
                stroke="white"
                strokeWidth={2}
              />
            )}
          </g>
        </TooltipTrigger>

        <TooltipContent side="top" className="max-w-sm">
          <div className="space-y-2">
            <div>
              <p className="font-semibold">{node.name}</p>
              {node.code && (
                <p className="text-xs text-gray-500">{node.code}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Bắt đầu:</span>
                <p className="font-medium">
                  {node.plannedStartDate
                    ? format(new Date(node.plannedStartDate), 'dd/MM/yyyy', { locale: vi })
                    : 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Kết thúc:</span>
                <p className="font-medium">
                  {node.plannedEndDate
                    ? format(new Date(node.plannedEndDate), 'dd/MM/yyyy', { locale: vi })
                    : 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Tiến độ:</span>
                <p className="font-medium">{node.percentComplete || 0}%</p>
              </div>
              <div>
                <span className="text-gray-500">Thời gian:</span>
                <p className="font-medium">{node.durationDays || 0} ngày</p>
              </div>
            </div>

            {node.isCritical && (
              <div className="pt-2 border-t">
                <p className="text-xs font-semibold text-red-600">🔴 Critical Path</p>
                <div className="text-xs space-y-1 mt-1">
                  <p>Total Float: {node.totalFloat?.toFixed(1) || 0} days</p>
                  <p>Free Float: {node.freeFloat?.toFixed(1) || 0} days</p>
                </div>
              </div>
            )}

            {node.assignedUserNames && node.assignedUserNames.length > 0 && (
              <div className="pt-2 border-t">
                <span className="text-xs text-gray-500">Người thực hiện:</span>
                <p className="text-xs font-medium">
                  {node.assignedUserNames.join(', ')}
                </p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

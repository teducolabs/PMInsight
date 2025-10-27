import type { Activity } from '@/types/activity';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { formatFloat } from '@/lib/utils/activityUtils';

interface GanttTaskProps {
  activity: Activity;
  x: number;
  y: number;
  width: number;
  height: number;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}

export function GanttTask({
  activity,
  x,
  y,
  width,
  height,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: GanttTaskProps) {
  // Task bar color based on critical path and status
  const getTaskColor = () => {
    if (activity.status === 'Completed') {
      return { bg: '#10b981', progress: '#059669', border: '#047857' };
    }
    if (activity.status === 'Cancelled') {
      return { bg: '#6b7280', progress: '#4b5563', border: '#374151' };
    }
    if (activity.isCritical) {
      return { bg: '#ef4444', progress: '#dc2626', border: '#b91c1c' };
    }
    return { bg: '#3b82f6', progress: '#2563eb', border: '#1d4ed8' };
  };

  const colors = getTaskColor();
  const progressWidth = (width * activity.percentComplete) / 100;

  return (
    <TooltipProvider>
      <Tooltip open={isHovered}>
        <TooltipTrigger asChild>
          <g
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onClick={onClick}
            className="cursor-pointer"
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
            {activity.percentComplete > 0 && (
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
                {activity.name.length > 20
                  ? `${activity.name.substring(0, 20)}...`
                  : activity.name}
              </text>
            )}

            {/* Progress percentage */}
            {width > 60 && activity.percentComplete > 0 && (
              <text
                x={x + width - 8}
                y={y + height / 2}
                dy="0.35em"
                fontSize="11"
                fill="white"
                textAnchor="end"
                className="pointer-events-none"
              >
                {activity.percentComplete}%
              </text>
            )}

            {/* Critical path indicator */}
            {activity.isCritical && (
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
              <p className="font-semibold">{activity.name}</p>
              {activity.code && (
                <p className="text-xs text-gray-500">{activity.code}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Bắt đầu:</span>
                <p className="font-medium">
                  {activity.plannedStartDate
                    ? format(new Date(activity.plannedStartDate), 'dd/MM/yyyy', { locale: vi })
                    : 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Kết thúc:</span>
                <p className="font-medium">
                  {activity.plannedEndDate
                    ? format(new Date(activity.plannedEndDate), 'dd/MM/yyyy', { locale: vi })
                    : 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Tiến độ:</span>
                <p className="font-medium">{activity.percentComplete}%</p>
              </div>
              <div>
                <span className="text-gray-500">Thời gian:</span>
                <p className="font-medium">{activity.durationDays} ngày</p>
              </div>
            </div>

            {activity.isCritical && (
              <div className="pt-2 border-t">
                <p className="text-xs font-semibold text-red-600">🔴 Critical Path</p>
                <div className="text-xs space-y-1 mt-1">
                  <p>Total Float: {formatFloat(activity.totalFloat)}</p>
                  <p>Free Float: {formatFloat(activity.freeFloat)}</p>
                </div>
              </div>
            )}

            {activity.assignedUserNames.length > 0 && (
              <div className="pt-2 border-t">
                <span className="text-xs text-gray-500">Người thực hiện:</span>
                <p className="text-xs font-medium">
                  {activity.assignedUserNames.join(', ')}
                </p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

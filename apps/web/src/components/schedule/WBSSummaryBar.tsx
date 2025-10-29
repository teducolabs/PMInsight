import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface WBSSummaryBarProps {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  progress?: number;
  tooltipContent?: React.ReactNode;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onStartDrag?: (e: React.MouseEvent) => void;
  onEndDrag?: (e: React.MouseEvent) => void;
  onBarDrag?: (e: React.MouseEvent) => void;
  isHovered?: boolean;
}

export function WBSSummaryBar({
  x,
  y,
  width,
  height,
  label,
  progress = 0,
  tooltipContent,
  onMouseEnter,
  onMouseLeave,
  onClick,
  onDoubleClick,
  onStartDrag,
  onEndDrag,
  onBarDrag,
  isHovered = false,
}: WBSSummaryBarProps) {
  const barElement = (
    <g
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className="cursor-pointer"
    >
      {/* Summary bar shape (trapezoid with endpoints) */}
      <path
        d={`
          M ${x} ${y + height / 2}
          L ${x + 6} ${y}
          L ${x + width - 6} ${y}
          L ${x + width} ${y + height / 2}
          L ${x + width - 6} ${y + height}
          L ${x + 6} ${y + height}
          Z
        `}
        fill="#3b82f6"
        stroke="#1e40af"
        strokeWidth={2}
        opacity={0.8}
      />
      
      {/* Progress overlay - Trapezoid shape matching the bar */}
      {progress > 0 && (
        <>
          <defs>
            <clipPath id={`progress-clip-${x}-${y}`}>
              <path
                d={`
                  M ${x} ${y + height / 2}
                  L ${x + 6} ${y}
                  L ${x + width - 6} ${y}
                  L ${x + width} ${y + height / 2}
                  L ${x + width - 6} ${y + height}
                  L ${x + 6} ${y + height}
                  Z
                `}
              />
            </clipPath>
          </defs>
          <rect
            x={x}
            y={y}
            width={width * (progress / 100)}
            height={height}
            fill="#1e40af"
            opacity={0.7}
            clipPath={`url(#progress-clip-${x}-${y})`}
          />
        </>
      )}
      
      {/* Start endpoint */}
      <circle
        cx={x}
        cy={y + height / 2}
        r={4}
        fill="#1e40af"
        stroke="#fff"
        strokeWidth={2}
      />
      
      {/* End endpoint */}
      <circle
        cx={x + width}
        cy={y + height / 2}
        r={4}
        fill="#1e40af"
        stroke="#fff"
        strokeWidth={2}
      />
      
      {/* Drag handles (show on hover) */}
      {isHovered && onStartDrag && (
        <g
          onMouseDown={onStartDrag}
          className="cursor-ew-resize"
          style={{ pointerEvents: 'all' }}
        >
          <rect
            x={x - 4}
            y={y}
            width={8}
            height={height}
            fill="#1e40af"
            opacity={0.8}
            rx={2}
          />
        </g>
      )}
      
      {isHovered && onEndDrag && (
        <g
          onMouseDown={onEndDrag}
          className="cursor-ew-resize"
          style={{ pointerEvents: 'all' }}
        >
          <rect
            x={x + width - 4}
            y={y}
            width={8}
            height={height}
            fill="#1e40af"
            opacity={0.8}
            rx={2}
          />
        </g>
      )}
      
      {/* Drag bar overlay for moving entire task */}
      {onBarDrag && (
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill="transparent"
          onMouseDown={onBarDrag}
          className="cursor-move"
          style={{ pointerEvents: 'all' }}
        />
      )}
      
      {/* Label */}
      {width > 60 && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#fff"
          fontSize="11"
          fontWeight="600"
          pointerEvents="none"
        >
          {label}
        </text>
      )}
    </g>
  );

  if (tooltipContent) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <g>{barElement}</g>
          </TooltipTrigger>
          <TooltipContent>
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return barElement;
}

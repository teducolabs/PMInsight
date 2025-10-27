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
}: WBSSummaryBarProps) {
  const barElement = (
    <g
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
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
      
      {/* Progress overlay */}
      {progress > 0 && (
        <path
          d={`
            M ${x} ${y + height / 2}
            L ${x + 6} ${y}
            L ${x + 6 + (width - 12) * (progress / 100)} ${y}
            L ${x + 6 + (width - 12) * (progress / 100)} ${y + height}
            L ${x + 6} ${y + height}
            Z
          `}
          fill="#1e40af"
          opacity={0.6}
        />
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

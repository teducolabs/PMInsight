import { Clock, TrendingUp, TrendingDown } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { WBSNode } from '@/features/wbs';

interface EffortColumnProps {
  node: WBSNode;
  width: number;
}

export function EffortColumn({ node, width }: EffortColumnProps) {
  const estimatedHours = node.estimatedHours || 0;
  const actualHours = node.actualHours || 0;
  const variance = actualHours - estimatedHours;
  const variancePercent = estimatedHours > 0 ? (variance / estimatedHours) * 100 : 0;

  // Determine status color
  const getStatusColor = (): string => {
    if (actualHours === 0) return 'text-gray-400';
    if (variance > 0) return 'text-red-500'; // Over estimate
    if (variance < 0) return 'text-green-500'; // Under estimate
    return 'text-gray-600'; // On target
  };

  // Format hours with 1 decimal place
  const formatHours = (hours: number): string => {
    if (hours === 0) return '0';
    if (hours < 10) return hours.toFixed(1);
    return Math.round(hours).toString();
  };

  return (
    <div
      className="flex items-center gap-2 py-2 px-4 border-r"
      style={{ width }}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 cursor-help flex-1">
              <Clock className="w-4 h-4 text-gray-400" />
              
              <div className="flex flex-col flex-1">
                {/* Estimated Hours */}
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-gray-500">Est:</span>
                  <span className="font-medium text-gray-700">
                    {formatHours(estimatedHours)}h
                  </span>
                </div>

                {/* Actual Hours */}
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-gray-500">Act:</span>
                  <span className={`font-medium ${getStatusColor()}`}>
                    {formatHours(actualHours)}h
                  </span>
                  
                  {/* Variance Indicator */}
                  {actualHours > 0 && variance !== 0 && (
                    <span className={`flex items-center ${getStatusColor()}`}>
                      {variance > 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span className="ml-0.5">
                        {Math.abs(variancePercent).toFixed(0)}%
                      </span>
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Bar (if has data) */}
              {estimatedHours > 0 && (
                <div className="w-12 h-8 flex flex-col justify-center">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        actualHours > estimatedHours
                          ? 'bg-red-500'
                          : actualHours === 0
                          ? 'bg-gray-300'
                          : 'bg-blue-500'
                      }`}
                      style={{
                        width: `${Math.min((actualHours / estimatedHours) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="text-sm space-y-1">
              <div className="font-semibold">Work Effort</div>
              <div>Estimated: {formatHours(estimatedHours)} hours</div>
              <div>Actual: {formatHours(actualHours)} hours</div>
              {variance !== 0 && (
                <div className={getStatusColor()}>
                  Variance: {variance > 0 ? '+' : ''}{formatHours(variance)}h
                  ({variancePercent > 0 ? '+' : ''}{variancePercent.toFixed(1)}%)
                </div>
              )}
              {estimatedHours > 0 && (
                <div className="text-gray-400 mt-2">
                  {actualHours === 0 && 'Not started'}
                  {actualHours > 0 && actualHours < estimatedHours && 'In progress'}
                  {actualHours >= estimatedHours && variance > 0 && 'Over estimate'}
                  {actualHours === estimatedHours && 'Completed on estimate'}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

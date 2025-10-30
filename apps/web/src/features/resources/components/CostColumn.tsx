import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { WBSNode } from '@/features/wbs';

interface CostColumnProps {
  node: WBSNode;
  width: number;
}

export function CostColumn({ node, width }: CostColumnProps) {
  const plannedCost = node.plannedCost || 0;
  const actualCost = node.actualCost || 0;
  const currency = node.currency || 'VND';
  const variance = actualCost - plannedCost;
  const variancePercent = plannedCost > 0 ? (variance / plannedCost) * 100 : 0;

  // Determine status color
  const getStatusColor = (): string => {
    if (actualCost === 0) return 'text-gray-400';
    if (variance > 0) return 'text-red-500'; // Over budget
    if (variance < 0) return 'text-green-500'; // Under budget
    return 'text-gray-600'; // On budget
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    if (amount === 0) return '0';
    
    if (currency === 'VND') {
      // Format Vietnamese Dong with thousands separator
      if (amount >= 1_000_000) {
        return `${(amount / 1_000_000).toFixed(1)}M`;
      }
      if (amount >= 1_000) {
        return `${(amount / 1_000).toFixed(0)}K`;
      }
      return amount.toFixed(0);
    }
    
    if (currency === 'USD') {
      if (amount >= 1_000_000) {
        return `$${(amount / 1_000_000).toFixed(1)}M`;
      }
      if (amount >= 1_000) {
        return `$${(amount / 1_000).toFixed(1)}K`;
      }
      return `$${amount.toFixed(0)}`;
    }

    // Default format
    return amount.toLocaleString();
  };

  const getCurrencySymbol = (): string => {
    switch (currency) {
      case 'USD': return '$';
      case 'VND': return '₫';
      case 'EUR': return '€';
      default: return currency;
    }
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
              <DollarSign className="w-4 h-4 text-gray-400" />
              
              <div className="flex flex-col flex-1">
                {/* Planned Cost */}
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-gray-500">Plan:</span>
                  <span className="font-medium text-gray-700">
                    {formatCurrency(plannedCost)}
                  </span>
                </div>

                {/* Actual Cost */}
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-gray-500">Act:</span>
                  <span className={`font-medium ${getStatusColor()}`}>
                    {formatCurrency(actualCost)}
                  </span>
                  
                  {/* Variance Indicator */}
                  {actualCost > 0 && variance !== 0 && (
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

              {/* Budget Progress Bar (if has data) */}
              {plannedCost > 0 && (
                <div className="w-12 h-8 flex flex-col justify-center">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        actualCost > plannedCost
                          ? 'bg-red-500'
                          : actualCost === 0
                          ? 'bg-gray-300'
                          : 'bg-green-500'
                      }`}
                      style={{
                        width: `${Math.min((actualCost / plannedCost) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="text-sm space-y-1">
              <div className="font-semibold">Budget</div>
              <div>
                Planned: {plannedCost.toLocaleString()} {getCurrencySymbol()}
              </div>
              <div>
                Actual: {actualCost.toLocaleString()} {getCurrencySymbol()}
              </div>
              {variance !== 0 && (
                <div className={getStatusColor()}>
                  Variance: {variance > 0 ? '+' : ''}{variance.toLocaleString()} {getCurrencySymbol()}
                  ({variancePercent > 0 ? '+' : ''}{variancePercent.toFixed(1)}%)
                </div>
              )}
              {plannedCost > 0 && (
                <div className="text-gray-400 mt-2">
                  {actualCost === 0 && 'No costs incurred'}
                  {actualCost > 0 && actualCost < plannedCost && 'Under budget'}
                  {actualCost > plannedCost && 'Over budget'}
                  {actualCost === plannedCost && 'On budget'}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

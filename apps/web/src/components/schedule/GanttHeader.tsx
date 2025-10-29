import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { ViewMode } from './types';

interface GanttHeaderProps {
  columns: Date[];
  columnWidth: number;
  viewMode: ViewMode;
}

export function GanttHeader({ columns, columnWidth, viewMode }: GanttHeaderProps) {
  const formatColumn = (date: Date) => {
    switch (viewMode) {
      case 'day':
        return {
          primary: format(date, 'd', { locale: vi }),
          secondary: format(date, 'EEE', { locale: vi }),
        };
      case 'week':
        return {
          primary: format(date, 'dd/MM', { locale: vi }),
          secondary: `Tuần ${format(date, 'w', { locale: vi })}`,
        };
      case 'month':
        return {
          primary: format(date, 'MMM', { locale: vi }),
          secondary: format(date, 'yyyy', { locale: vi }),
        };
    }
  };

  return (
    <div className="flex h-full">
      {/* Timeline columns */}
      {columns.map((column, index) => {
        const { primary, secondary } = formatColumn(column);
        const isWeekend = column.getDay() === 0 || column.getDay() === 6;

        return (
          <div
            key={index}
            className={`border-r text-center ${isWeekend ? 'bg-gray-50' : ''}`}
            style={{ width: columnWidth, minWidth: columnWidth }}
          >
            <div className="py-1 text-xs font-medium text-gray-700">
              {primary}
            </div>
            <div className="py-1 text-xs text-gray-500">
              {secondary}
            </div>
          </div>
        );
      })}
    </div>
  );
}

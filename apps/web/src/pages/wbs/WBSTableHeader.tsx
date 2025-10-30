import React from 'react';
import { GanttHeader } from '@/features/schedule';
import { type ColumnConfig } from './columnConfig';

type ViewMode = 'day' | 'week' | 'month';

interface WBSTableHeaderProps {
  columns: ColumnConfig[];
  ganttColumns: Date[];
  columnWidth: number;
  viewMode: ViewMode;
  projectStartDate: Date;
  onColumnResizeStart: (e: React.MouseEvent, columnId: string) => void;
}

export function WBSTableHeader({
  columns,
  ganttColumns,
  columnWidth,
  viewMode,
  projectStartDate,
  onColumnResizeStart,
}: WBSTableHeaderProps) {
  return (
    <div className="flex border-b bg-gray-100">
      {/* WBS Columns Headers */}
      {columns.filter(col => col.visible).map((col) => (
        <div key={col.id} className="relative flex items-center">
          <div
            className="px-4 py-3 font-semibold text-sm border-r flex items-center justify-between"
            style={{ width: col.width }}
            title={col.id === 'dependencies' ? 'Cú pháp: <ID><Type><Lag>. VD: 3FS, 5SS+2d, 6FF-1d' : undefined}
          >
            <span>{col.label}</span>
            {col.resizable && (
              <div
                className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 transition-colors group"
                onMouseDown={(e) => onColumnResizeStart(e, col.id)}
                title="Kéo để thay đổi kích thước"
              >
                <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 bg-gray-400 group-hover:bg-blue-600 transition-colors" />
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Gantt Header */}
      <div className="flex-1 border-l">
        <GanttHeader
          columns={ganttColumns}
          columnWidth={columnWidth}
          viewMode={viewMode}
          projectStartDate={projectStartDate}
        />
      </div>
    </div>
  );
}

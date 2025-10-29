import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Columns3, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { COLUMN_DEFINITIONS, type ColumnConfig } from './columnConfig';

interface ColumnsDropdownProps {
  columns: ColumnConfig[];
  onToggleColumn: (columnId: string) => void;
  onResetColumns: () => void;
}

export function ColumnsDropdown({
  columns,
  onToggleColumn,
  onResetColumns,
}: ColumnsDropdownProps) {
  const visibleCount = columns.filter(col => col.visible).length;
  const totalCount = columns.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Columns3 className="w-4 h-4" />
          <span>Columns ({visibleCount}/{totalCount})</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
          Show/Hide Columns
        </div>
        <DropdownMenuSeparator />
        
        {columns.map((col) => {
          const definition = COLUMN_DEFINITIONS.find(def => def.key === col.id);
          const isLocked = definition?.locked || false;
          const description = definition?.description;

          return (
            <DropdownMenuCheckboxItem
              key={col.id}
              checked={col.visible}
              disabled={isLocked}
              onCheckedChange={() => onToggleColumn(col.id)}
              className="gap-2"
            >
              <div className="flex items-center gap-2 flex-1">
                {col.visible ? (
                  <Eye className="w-3 h-3 text-blue-600" />
                ) : (
                  <EyeOff className="w-3 h-3 text-gray-400" />
                )}
                <div className="flex-1">
                  <div className="font-medium">{col.label}</div>
                  {description && (
                    <div className="text-xs text-muted-foreground truncate">
                      {description}
                    </div>
                  )}
                </div>
                {isLocked && (
                  <span className="text-xs text-blue-600 font-semibold">Required</span>
                )}
              </div>
            </DropdownMenuCheckboxItem>
          );
        })}

        <DropdownMenuSeparator />
        <div className="p-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-xs"
            onClick={onResetColumns}
          >
            <RotateCcw className="w-3 h-3" />
            Reset to Defaults
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Columns3, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { COLUMN_DEFINITIONS, type ColumnConfig } from './columnConfig';
import { useEffect, useState } from 'react';

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
  const [open, setOpen] = useState(false);
  const visibleCount = columns.filter(col => col.visible).length;
  const totalCount = columns.length;

  // Check if columns are in non-default state
  const hasCustomVisibility = columns.some(col => {
    const definition = COLUMN_DEFINITIONS.find(def => def.key === col.id);
    return col.visible !== definition?.defaultVisible;
  });

  // Keyboard shortcut: Ctrl+Shift+C
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 relative"
          title="Show/hide columns (Ctrl+Shift+C)"
        >
          <Columns3 className="w-4 h-4" />
          <span>Columns ({visibleCount}/{totalCount})</span>
          {hasCustomVisibility && (
            <Badge 
              variant="secondary" 
              className="ml-1 h-4 w-4 p-0 flex items-center justify-center bg-blue-100 text-blue-700 hover:bg-blue-100"
            >
              *
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground flex items-center justify-between">
          <span>Show/Hide Columns</span>
          <kbd className="text-xs bg-gray-100 px-1.5 py-0.5 rounded border">Ctrl+Shift+C</kbd>
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
              title={isLocked ? `${col.label} is required and cannot be hidden` : description}
            >
              <div className="flex items-center gap-2 flex-1">
                {col.visible ? (
                  <Eye className="w-3 h-3 text-blue-600" />
                ) : (
                  <EyeOff className="w-3 h-3 text-gray-400" />
                )}
                <div className="flex-1">
                  <div className={`font-medium ${isLocked ? 'text-blue-600' : ''}`}>
                    {col.label}
                  </div>
                  {description && !isLocked && (
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

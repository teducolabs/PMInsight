/**
 * Column configuration for WBS table
 * Defines all available columns with visibility, resize, and lock settings
 */

export const ROW_HEIGHT = 50;

// Legacy ColumnConfig for backward compatibility
export interface ColumnConfig {
  id: string;
  label: string;
  width: number;
  minWidth: number;
  maxWidth: number;
  visible: boolean;
  resizable: boolean;
}

// Column definition with visibility control
export interface ColumnDefinition {
  key: string;
  label: string;
  width: number;
  minWidth: number;
  maxWidth: number;
  defaultVisible: boolean;
  locked: boolean; // Cannot be hidden
  resizable: boolean;
  description?: string;
}

/**
 * All available columns for WBS table
 * - locked: true = cannot be hidden (ID, WBS/Activity)
 * - defaultVisible: true = visible by default
 * - defaultVisible: false = hidden by default (Resources, Effort, Cost for Phase 3)
 */
export const COLUMN_DEFINITIONS: readonly ColumnDefinition[] = [
  { 
    key: 'id', 
    label: 'ID', 
    width: 60, 
    minWidth: 50, 
    maxWidth: 80, 
    defaultVisible: true, 
    locked: true,
    resizable: true,
    description: 'Sequence ID for referencing in dependencies'
  },
  { 
    key: 'tree', 
    label: 'WBS/Activity', 
    width: 400, 
    minWidth: 250, 
    maxWidth: 700, 
    defaultVisible: true, 
    locked: true,
    resizable: true,
    description: 'Work Breakdown Structure hierarchy'
  },
  { 
    key: 'duration', 
    label: 'Duration', 
    width: 120, 
    minWidth: 100, 
    maxWidth: 180, 
    defaultVisible: true,
    locked: false,
    resizable: true,
    description: 'Task duration in days'
  },
  { 
    key: 'dates', 
    label: 'Dates', 
    width: 180, 
    minWidth: 150, 
    maxWidth: 250, 
    defaultVisible: true,
    locked: false,
    resizable: true,
    description: 'Start and end dates'
  },
 
  { 
    key: 'progress', 
    label: 'Progress', 
    width: 120, 
    minWidth: 100, 
    maxWidth: 180, 
    defaultVisible: true,
    locked: false,
    resizable: true,
    description: 'Completion percentage'
  },
  { 
    key: 'dependencies', 
    label: 'Predecessors', 
    width: 180, 
    minWidth: 120, 
    maxWidth: 300, 
    defaultVisible: true,
    locked: false,
    resizable: true,
    description: 'Task dependencies (e.g., 3FS, 5SS+2d)'
  },
   { 
    key: 'resources', 
    label: 'Resources', 
    width: 200, 
    minWidth: 150, 
    maxWidth: 300, 
    defaultVisible: false, // Hidden by default - will be shown in Phase 3
    locked: false,
    resizable: true,
    description: 'Assigned resource roles'
  },
  { 
    key: 'effort', 
    label: 'Effort (h)', 
    width: 100, 
    minWidth: 80, 
    maxWidth: 150, 
    defaultVisible: false, // Hidden by default - will be shown in Phase 3
    locked: false,
    resizable: true,
    description: 'Work effort in hours'
  },
  { 
    key: 'cost', 
    label: 'Cost', 
    width: 120, 
    minWidth: 100, 
    maxWidth: 200, 
    defaultVisible: false, // Hidden by default - will be shown in Phase 3
    locked: false,
    resizable: true,
    description: 'Calculated cost based on effort × rate'
  },
] as const;

export type ColumnKey = typeof COLUMN_DEFINITIONS[number]['key'];

/**
 * Convert COLUMN_DEFINITIONS to legacy ColumnConfig format
 * Used for backward compatibility with existing code
 */
export const DEFAULT_COLUMNS: ColumnConfig[] = COLUMN_DEFINITIONS.map(col => ({
  id: col.key,
  label: col.label,
  width: col.width,
  minWidth: col.minWidth,
  maxWidth: col.maxWidth,
  visible: col.defaultVisible,
  resizable: col.resizable,
}));

/**
 * Get visible columns count (for UI display)
 */
export function getVisibleColumnsCount(columns: ColumnConfig[]): number {
  return columns.filter(col => col.visible).length;
}

/**
 * Get total columns count
 */
export function getTotalColumnsCount(): number {
  return COLUMN_DEFINITIONS.length;
}

/**
 * Reset columns to default visibility
 */
export function resetColumnsToDefault(): ColumnConfig[] {
  return [...DEFAULT_COLUMNS];
}

import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronRight, FolderTree, CheckSquare, Diamond, Pencil, Plus } from 'lucide-react';
import type { WBSNode } from '@/types/wbs';
import { flattenWBSTree } from '@/types/wbs';
import { parseDependencyString, dependenciesToString } from '@/lib/dependencies-parser';
import { ROW_HEIGHT, type ColumnConfig } from './columnConfig';

interface WBSTableRowProps {
  node: WBSNode;
  depth: number;
  columns: ColumnConfig[];
  expandedNodes: Set<string>;
  wbsNodes: WBSNode[];
  editingProgress: string | null;
  progressValue: string;
  editingDuration: string | null;
  durationValue: string;
  editingDependenciesInline: string | null;
  dependenciesValue: string;
  dependenciesErrors: string[];
  onToggleNode: (nodeId: string) => void;
  onEditNode: (node: WBSNode) => void;
  onAddChild: (node: WBSNode) => void;
  onSetProgressValue: (value: string) => void;
  onSetEditingProgress: (nodeId: string | null) => void;
  onProgressSave: (nodeId: string) => Promise<void>;
  onSetDurationValue: (value: string) => void;
  onSetEditingDuration: (nodeId: string | null) => void;
  onDurationSave: (nodeId: string) => Promise<void>;
  onSetDependenciesValue: (value: string) => void;
  onSetDependenciesErrors: (errors: string[]) => void;
  onSetEditingDependenciesInline: (nodeId: string | null) => void;
  onDependenciesSave: (nodeId: string) => Promise<void>;
  getWBSProgress: (node: WBSNode) => number;
}

export function WBSTableRow({
  node,
  depth,
  columns,
  expandedNodes,
  wbsNodes,
  editingProgress,
  progressValue,
  editingDuration,
  durationValue,
  editingDependenciesInline,
  dependenciesValue,
  dependenciesErrors,
  onToggleNode,
  onEditNode,
  onAddChild,
  onSetProgressValue,
  onSetEditingProgress,
  onProgressSave,
  onSetDurationValue,
  onSetEditingDuration,
  onDurationSave,
  onSetDependenciesValue,
  onSetDependenciesErrors,
  onSetEditingDependenciesInline,
  onDependenciesSave,
  getWBSProgress,
}: WBSTableRowProps) {

  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = node.children && node.children.length > 0;

  // Debug: Log visible columns
  const visibleColumns = columns.filter(c => c.visible);
  console.log('WBSTableRow - Node:', node.code, 'Visible columns:', visibleColumns.map(c => c.id));

  // Render a single column based on its ID
  const renderColumn = (col: ColumnConfig) => {
    if (!col.visible) return null;

    switch (col.id) {
      case 'id':
        return (
          <div
            key={col.id}
            className="flex items-center justify-center py-2 px-2 border-r bg-gray-50"
            style={{ width: col.width }}
          >
            <span className="text-sm font-mono font-semibold text-blue-600">
              {node.sequenceId || '-'}
            </span>
          </div>
        );

      case 'tree':
        return (
          <div
            key={col.id}
            className="flex items-center gap-2 py-2 px-4 border-r"
            style={{
              width: col.width,
              paddingLeft: `${depth * 24 + 16}px`,
            }}
          >
            <button
              onClick={() => onToggleNode(node.id)}
              className="w-5 h-5 flex items-center justify-center hover:bg-gray-200 rounded flex-shrink-0"
            >
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )
              ) : (
                <span className="w-4" />
              )}
            </button>

            {/* Icon based on node type */}
            {node.type === 'Summary' && (
              <FolderTree className="w-4 h-4 text-blue-600 flex-shrink-0" />
            )}
            {node.type === 'Task' && (
              <CheckSquare className="w-4 h-4 text-green-600 flex-shrink-0" />
            )}
            {node.type === 'Milestone' && (
              <Diamond className="w-4 h-4 text-purple-600 flex-shrink-0 fill-purple-600" />
            )}

            <div className="flex items-baseline gap-2 flex-1 min-w-0">
              <span className="font-mono text-xs text-blue-600 font-semibold flex-shrink-0 bg-blue-50 px-2 py-0.5 rounded">
                {node.code}
              </span>
              <span className="font-semibold truncate text-gray-900">{node.name}</span>
            </div>

            <div className="ml-auto flex items-center gap-1 flex-shrink-0">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditNode(node);
                }}
                title="Chỉnh sửa WBS node"
                className="h-7 w-7 p-0"
              >
                <Pencil className="w-3 h-3" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddChild(node);
                }}
                title="Thêm WBS node con"
                className="h-7 px-2"
              >
                <Plus className="w-3 h-3 mr-1" />
                WBS
              </Button>
            </div>
          </div>
        );

      case 'duration':
        return (
          <div 
            key={col.id}
            className="flex items-center py-2 px-4 border-r" 
            style={{ width: col.width }}
          >
            {editingDuration === node.id ? (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min="0"
                  value={durationValue}
                  onChange={(e) => onSetDurationValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onDurationSave(node.id);
                    } else if (e.key === 'Escape') {
                      onSetEditingDuration(null);
                    }
                  }}
                  onBlur={() => onDurationSave(node.id)}
                  className="h-7 w-20 text-sm"
                  autoFocus
                />
                <span className="text-xs text-gray-500">days</span>
              </div>
            ) : (
              <div 
                className="cursor-pointer hover:bg-gray-50 px-2 py-1 rounded text-sm"
                onClick={() => {
                  onSetDurationValue(node.durationDays?.toString() || '0');
                  onSetEditingDuration(node.id);
                }}
              >
                {node.durationDays || 0}
              </div>
            )}
          </div>
        );

      case 'progress':
        return (
          <div 
            key={col.id}
            className="flex items-center gap-2 py-2 px-4 border-r" 
            style={{ width: col.width }}
          >
            {editingProgress === node.id ? (
              <div className="flex items-center gap-1 w-full">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={progressValue}
                  onChange={(e) => onSetProgressValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onProgressSave(node.id);
                    } else if (e.key === 'Escape') {
                      onSetEditingProgress(null);
                    }
                  }}
                  onBlur={() => onProgressSave(node.id)}
                  className="h-7 w-16 text-sm"
                  autoFocus
                />
                <span className="text-xs">%</span>
              </div>
            ) : (
              (() => {
                const hasChildrenTasks = node.type === 'Summary' && node.children && node.children.length > 0;
                const displayProgress = node.type === 'Summary' ? getWBSProgress(node) : (node.percentComplete || 0);
                const canEdit = !(node.type === 'Summary' && hasChildrenTasks);
                
                return (
                  <div 
                    className={`flex items-center gap-2 w-full rounded px-1 ${canEdit ? 'cursor-pointer hover:bg-gray-50' : 'cursor-not-allowed opacity-60'}`}
                    onClick={() => {
                      if (canEdit) {
                        onSetProgressValue(node.percentComplete?.toString() || '0');
                        onSetEditingProgress(node.id);
                      }
                    }}
                    title={hasChildrenTasks ? 'Progress được tính tự động từ các task con' : 'Click để chỉnh sửa progress'}
                  >
                    <div className="flex-1 bg-gray-200 rounded-full h-2 relative">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${displayProgress}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700 w-10 text-right">
                      {displayProgress}%
                    </span>
                  </div>
                );
              })()
            )}
          </div>
        );

      case 'dependencies':
        return (
          <div 
            key={col.id}
            className="flex items-center py-2 px-2 border-r relative group" 
            style={{ width: col.width }}
          >
            {editingDependenciesInline === node.id ? (
              <div className="w-full">
                <Input
                  type="text"
                  value={dependenciesValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    onSetDependenciesValue(value);
                    
                    // Parse and validate in real-time
                    const allNodesFlat = flattenWBSTree(wbsNodes);
                    const { errors } = parseDependencyString(value, allNodesFlat);
                    onSetDependenciesErrors(errors);
                  }}
                  onBlur={() => onDependenciesSave(node.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
                    } else if (e.key === 'Escape') {
                      onSetEditingDependenciesInline(null);
                    }
                  }}
                  className={`h-7 px-2 text-xs font-mono ${dependenciesErrors.length > 0 ? 'border-red-500' : ''}`}
                  placeholder="3FS, 5SS+2d"
                  autoFocus
                />
                {dependenciesErrors.length > 0 && (
                  <div className="absolute z-10 top-full left-0 mt-1 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600 shadow-lg whitespace-nowrap">
                    {dependenciesErrors.map((err, i) => (
                      <div key={i}>• {err}</div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div
                onClick={() => {
                  const allNodesFlat = flattenWBSTree(wbsNodes);
                  const depsString = dependenciesToString(node.predecessors || [], allNodesFlat);
                  onSetDependenciesValue(depsString);
                  onSetEditingDependenciesInline(node.id);
                }}
                className="w-full h-full flex items-center cursor-pointer hover:bg-blue-50 px-2 rounded"
                title="Click để chỉnh sửa. Ví dụ: 3FS, 5SS+2d"
              >
                {node.predecessors && node.predecessors.length > 0 ? (
                  <span className="text-xs font-mono text-blue-600">
                    {dependenciesToString(node.predecessors, flattenWBSTree(wbsNodes))}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">-</span>
                )}
              </div>
            )}
          </div>
        );

      case 'dates':
        return (
          <div 
            key={col.id}
            className="flex items-center gap-2 py-2 px-3 border-r" 
            style={{ width: col.width }}
          >
            {node.plannedStartDate && node.plannedEndDate ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-700">
                  {format(new Date(node.plannedStartDate), 'dd/MM/yy', { locale: vi })}
                </span>
                <span className="text-xs text-gray-400">→</span>
                <span className="text-xs font-medium text-gray-700">
                  {format(new Date(node.plannedEndDate), 'dd/MM/yy', { locale: vi })}
                </span>
              </div>
            ) : (
              <span className="text-xs text-gray-400">No dates</span>
            )}
          </div>
        );

      // Hidden columns (for Phase 3)
      case 'resources':
      case 'effort':
      case 'cost':
        return null;

      default:
        return null;
    }
  };

  return (
    <div
      key={`row-${node.id}-${visibleColumns.length}`}
      className="flex border-b hover:bg-gray-50"
      style={{ height: ROW_HEIGHT }}
    >
      {/* Render columns dynamically based on order and visibility */}
      {columns.map(col => renderColumn(col))}
    </div>
  );
}

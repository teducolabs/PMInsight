import { useState, useMemo, useRef, useEffect } from 'react';
import { useProject } from '@/lib/context/ProjectContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2, Maximize2, Minimize2, Users } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { GanttGrid, GanttTimeline, GanttDependencyArrows } from '@/features/schedule';
import { CreateWBSNodeDialog, EditWBSNodeDialog, wbsApi, type WBSNode, flattenWBSTree } from '@/features/wbs';
import { EditResourcesDialog, ResourcePoolDialog } from '@/features/resources';
import { projectApi, type Project, ProjectStatus } from '@/features/projects';
import { 
  parseDependencyString, 
  validateDependencies,
  assignSequenceIds 
} from '@/lib/dependencies-parser';
import {
  validateTaskMove,
  calculateCascadingUpdates
} from '@/lib/dependency-scheduler';
import { ProjectInfoBanner } from './ProjectInfoBanner';
import { DependenciesHelpCard } from './DependenciesHelpCard';
import { DragInfoTooltip } from './DragInfoTooltip';
import { WBSTableHeader } from './WBSTableHeader';
import { WBSTableRow } from './WBSTableRow';
import { GanttTasksRenderer } from './GanttTasksRenderer';
import { ColumnsDropdown } from './ColumnsDropdown';
import { 
  ROW_HEIGHT, 
  DEFAULT_COLUMNS, 
  COLUMN_DEFINITIONS,
  resetColumnsToDefault,
  type ColumnConfig 
} from './columnConfig';


type ViewMode = 'day' | 'week' | 'month';

const STORAGE_KEY_VISIBLE_COLUMNS = 'wbs-visible-columns';

export function WBSPage() {
  const { currentProjectId } = useProject();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  
  // Initialize columns from localStorage or defaults
  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VISIBLE_COLUMNS);
      if (saved) {
        const visibleColumnIds = new Set<string>(JSON.parse(saved));
        return DEFAULT_COLUMNS.map(col => ({
          ...col,
          visible: visibleColumnIds.has(col.id),
        }));
      }
    } catch (error) {
      console.error('Failed to load column visibility from localStorage:', error);
    }
    return DEFAULT_COLUMNS;
  });

  // Persist column visibility to localStorage
  useEffect(() => {
    try {
      const visibleColumnIds = columns
        .filter(col => col.visible)
        .map(col => col.id);
      localStorage.setItem(STORAGE_KEY_VISIBLE_COLUMNS, JSON.stringify(visibleColumnIds));
    } catch (error) {
      console.error('Failed to save column visibility to localStorage:', error);
    }
  }, [columns]);

  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [draggingTask, setDraggingTask] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dragMode, setDragMode] = useState<'move' | 'resize-start' | 'resize-end' | null>(null);
  const [dragInfo, setDragInfo] = useState<{
    startDate: string;
    endDate: string;
    days: number;
    newStartDate?: Date;
    newEndDate?: Date;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Progress edit state
  const [editingProgress, setEditingProgress] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState<string>('');
  
  // Duration edit state
  const [editingDuration, setEditingDuration] = useState<string | null>(null);
  const [durationValue, setDurationValue] = useState<string>('');

  // Dependencies inline edit state
  const [editingDependenciesInline, setEditingDependenciesInline] = useState<string | null>(null);
  const [dependenciesValue, setDependenciesValue] = useState<string>('');
  const [dependenciesErrors, setDependenciesErrors] = useState<string[]>([]);

  // Node edit state (unified for WBS and tasks)
  const [creatingNode, setCreatingNode] = useState(false);
  const [parentNodeForCreate, setParentNodeForCreate] = useState<WBSNode | null>(null);
  const [editingNode, setEditingNode] = useState<WBSNode | null>(null);

  // Resource management state (Phase 3)
  const [editingResources, setEditingResources] = useState<WBSNode | null>(null);
  const [resourcePoolOpen, setResourcePoolOpen] = useState(false);

  // Data loading state
  const [loading, setLoading] = useState(true);
  const [wbsId, setWbsId] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [wbsNodes, setWbsNodes] = useState<WBSNode[]>([]);

  // Load data from API
  useEffect(() => {
    if (!currentProjectId) return;

    const loadData = async () => {
      try {
        setLoading(true);

        // Load project first
        const projectData = await projectApi.getById(currentProjectId);
        setProject(projectData);

        // Try to load WBS
        let wbsData = await wbsApi.getByProjectId(currentProjectId);

        // If no WBS exists, create one automatically
        if (!wbsData) {
          wbsData = await wbsApi.create({
            projectId: currentProjectId,
            tree: [], // Empty tree initially
          });
        }

        setWbsId(wbsData.id);
        
        // Auto-assign sequence IDs (1, 2, 3...) for easy reference
        const nodesWithIds = assignSequenceIds(wbsData.tree || []);
        setWbsNodes(nodesWithIds);

        // Auto-expand first level
        if (wbsData.tree && wbsData.tree.length > 0) {
          const firstLevelIds = wbsData.tree.map((n: WBSNode) => n.id);
          setExpandedNodes(new Set(firstLevelIds));
        }
      } catch (error) {
        console.error('Failed to load WBS data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentProjectId]);

  // Helper function to reload WBS with auto-assigned sequence IDs
  const reloadWBS = async () => {
    if (!wbsId) return;
    try {
      const updatedWBS = await wbsApi.getById(wbsId);
      if (updatedWBS) {
        const nodesWithIds = assignSequenceIds(updatedWBS.tree);
        setWbsNodes(nodesWithIds);
      }
    } catch (error) {
      console.error('Failed to reload WBS:', error);
    }
  };

  // Calculate project info from WBS nodes (including task nodes)
  const projectInfo = useMemo(() => {
    if (!project) {
      return {
        name: 'Đang tải...',
        startDate: new Date(),
        endDate: new Date(),
        currentPhase: '-',
        progress: 0,
      };
    }

    // Collect all task nodes from the tree
    const allTasks: WBSNode[] = [];
    const collectTasks = (nodes: WBSNode[]) => {
      if (!nodes || !Array.isArray(nodes)) return;
      nodes.forEach(node => {
        if (node.type === 'Task' || node.type === 'Milestone') {
          allTasks.push(node);
        }
        if (node.children && node.children.length > 0) {
          collectTasks(node.children);
        }
      });
    };
    collectTasks(wbsNodes);

    if (allTasks.length === 0) {
      return {
        name: project.name,
        startDate: project.startDate ? new Date(project.startDate) : new Date(),
        endDate: project.endDate ? new Date(project.endDate) : new Date(),
        currentPhase: project.status || '-',
        progress: 0,
      };
    }

    // Calculate actual start/end dates from task nodes
    const dates = allTasks
      .filter((a: WBSNode) => a.plannedStartDate && a.plannedEndDate)
      .flatMap((a: WBSNode) => [new Date(a.plannedStartDate!), new Date(a.plannedEndDate!)]);

    const actualStartDate = dates.length > 0
      ? new Date(Math.min(...dates.map((d: Date) => d.getTime())))
      : project.startDate ? new Date(project.startDate) : new Date();

    const actualEndDate = dates.length > 0
      ? new Date(Math.max(...dates.map((d: Date) => d.getTime())))
      : project.endDate ? new Date(project.endDate) : new Date();

    // Calculate progress from task nodes
    const totalProgress = allTasks.reduce((sum: number, a: WBSNode) => sum + a.percentComplete, 0);
    const avgProgress = allTasks.length > 0 ? Math.round(totalProgress / allTasks.length) : 0;

    // Determine current phase based on project status
    const currentPhase = project.status || ProjectStatus.Planning;

    return {
      name: project.name,
      startDate: actualStartDate,
      endDate: actualEndDate,
      currentPhase,
      progress: avgProgress,
    };
  }, [wbsNodes, project]);

  // Build flat list of visible rows (unified WBS nodes)
  type RowItem = { node: WBSNode; depth: number };

  const visibleRows = useMemo(() => {
    const rows: RowItem[] = [];

    if (!wbsNodes || !Array.isArray(wbsNodes)) {
      return rows;
    }

    const processNode = (node: WBSNode, depth: number) => {
      rows.push({ node, depth });

      const isExpanded = expandedNodes.has(node.id);

      if (isExpanded && node.children && node.children.length > 0) {
        // Add child nodes recursively (children can be Summary, Task, or Milestone)
        node.children.forEach(child => processNode(child, depth + 1));
      }
    };

    wbsNodes.forEach(node => processNode(node, 0));
    return rows;
  }, [expandedNodes, wbsNodes]);

  // Calculate WBS node date range (use node's own dates or roll-up from children)
  const getWBSNodeDateRange = (node: WBSNode): { startDate: Date; endDate: Date } | null => {
    // First, check if node itself has dates
    if (node.plannedStartDate && node.plannedEndDate) {
      return {
        startDate: new Date(node.plannedStartDate),
        endDate: new Date(node.plannedEndDate),
      };
    }

    // If no own dates, roll-up from children
    const allTasks: WBSNode[] = [];

    const collectTasks = (n: WBSNode) => {
      // Add tasks/milestones from this node
      if (n.type === 'Task' || n.type === 'Milestone') {
        allTasks.push(n);
      }

      // Recursively collect from children
      if (n.children && n.children.length > 0) {
        n.children.forEach(collectTasks);
      }
    };

    collectTasks(node);

    const validTasks = allTasks.filter((a: WBSNode) => a.plannedStartDate && a.plannedEndDate);
    if (validTasks.length === 0) return null;

    const dates = validTasks.flatMap((a: WBSNode) => [
      new Date(a.plannedStartDate!),
      new Date(a.plannedEndDate!),
    ]);

    return {
      startDate: new Date(Math.min(...dates.map((d: Date) => d.getTime()))),
      endDate: new Date(Math.max(...dates.map((d: Date) => d.getTime()))),
    };
  };

  // Calculate Gantt date range from all nodes (Summary, Task, Milestone)
  const { startDate, ganttColumns, columnWidth } = useMemo(() => {
    // Collect all nodes with dates from WBS tree
    const allNodes: WBSNode[] = [];
    const collectNodes = (nodes: WBSNode[]) => {
      if (!nodes || !Array.isArray(nodes)) return;
      nodes.forEach(node => {
        // Include ALL node types (Summary, Task, Milestone)
        allNodes.push(node);
        if (node.children && node.children.length > 0) {
          collectNodes(node.children);
        }
      });
    };
    collectNodes(wbsNodes);

    if (allNodes.length === 0) {
      // Default range if no nodes
      const now = new Date();
      return {
        startDate: now,
        ganttColumns: [now],
        columnWidth: 60,
      };
    }

    const dates = allNodes
      .filter((a: WBSNode) => a.plannedStartDate && a.plannedEndDate)
      .flatMap((a: WBSNode) => [new Date(a.plannedStartDate!), new Date(a.plannedEndDate!)]);

    if (dates.length === 0) {
      const now = new Date();
      return {
        startDate: now,
        ganttColumns: [now],
        columnWidth: 60,
      };
    }

    const minDate = new Date(Math.min(...dates.map((d: Date) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d: Date) => d.getTime())));

    // Round to start of week (Monday) for better alignment
    const start = addDays(minDate, -7);
    start.setDate(start.getDate() - start.getDay() + 1); // Monday of that week

    const end = addDays(maxDate, 14);

    const width = viewMode === 'day' ? 40 : viewMode === 'week' ? 60 : 120;

    // Generate columns based on viewMode
    let cols: Date[] = [];
    let daysPerColumn = 1;
    
    if (viewMode === 'day') {
      daysPerColumn = 1;
      let current = new Date(start);
      while (current <= end) {
        cols.push(new Date(current));
        current = addDays(current, 1);
      }
    } else if (viewMode === 'week') {
      daysPerColumn = 7;
      let current = new Date(start);
      while (current <= end) {
        cols.push(new Date(current));
        current = addDays(current, 7);
      }
    } else if (viewMode === 'month') {
      daysPerColumn = 30; // Approximation for positioning
      let current = new Date(start);
      while (current <= end) {
        cols.push(new Date(current));
        // Move to next month properly
        const nextMonth = new Date(current);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        current = nextMonth;
      }
    }

    return {
      startDate: start,
      ganttColumns: cols,
      columnWidth: width,
      daysPerColumn,
    };
  }, [viewMode, wbsNodes]);

  const totalWidth = ganttColumns.length * columnWidth;
  const { daysPerColumn } = useMemo(() => ({ 
    daysPerColumn: viewMode === 'day' ? 1 : viewMode === 'week' ? 7 : 30 
  }), [viewMode]);

  // Calculate task position in Gantt (for Task/Milestone nodes)
  const getTaskPosition = (node: WBSNode) => {
    if (!node.plannedStartDate || !node.plannedEndDate) return null;

    const taskStart = new Date(node.plannedStartDate);
    const taskEnd = new Date(node.plannedEndDate);

    // Calculate days since start
    const daysSinceStart = Math.floor((taskStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate which column the task starts in based on viewMode
    const columnIndex = Math.floor(daysSinceStart / daysPerColumn);

    // Calculate task duration in days
    const taskDuration = Math.max(1, Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Calculate how many columns this task spans
    const columnsSpan = Math.ceil(taskDuration / daysPerColumn);

    const x = columnIndex * columnWidth;
    const width = columnsSpan * columnWidth;

    // Find row index for y position - return null if node is not visible
    const rowIndex = visibleRows.findIndex(r => r.node.id === node.id);
    if (rowIndex < 0) return null; // Node is collapsed/hidden
    
    const y = rowIndex * ROW_HEIGHT + (ROW_HEIGHT - 32) / 2;

    return { x, width, y };
  };

  // Calculate WBS summary bar position
  const getWBSPosition = (node: WBSNode) => {
    const dateRange = getWBSNodeDateRange(node);
    if (!dateRange) return null;

    // Calculate days since start
    const daysSinceStart = Math.floor((dateRange.startDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate which column the WBS starts in based on viewMode
    const columnIndex = Math.floor(daysSinceStart / daysPerColumn);

    // Calculate duration in days
    const duration = Math.max(1, Math.ceil((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Calculate how many columns this WBS spans
    const columnsSpan = Math.ceil(duration / daysPerColumn);

    const x = columnIndex * columnWidth;
    const width = columnsSpan * columnWidth;

    return { x, width, dateRange };
  };

  // Calculate progress for WBS node (rollup from child tasks)
  const getWBSProgress = (node: WBSNode): number => {
    const allTasks: WBSNode[] = [];

    const collectTasks = (n: WBSNode) => {
      // Add tasks/milestones from this node
      if (n.type === 'Task' || n.type === 'Milestone') {
        allTasks.push(n);
      }

      // Recursively collect from children
      if (n.children && n.children.length > 0) {
        n.children.forEach(collectTasks);
      }
    };

    collectTasks(node);

    // If no children tasks, use the node's own progress
    if (allTasks.length === 0) {
      return node.percentComplete || 0;
    }

    // If has children tasks, calculate average
    const totalProgress = allTasks.reduce((sum: number, a: WBSNode) => sum + (a.percentComplete || 0), 0);
    return Math.round(totalProgress / allTasks.length);
  };

  // Toggle WBS node expand/collapse
  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // Handle column resize
  const handleColumnResizeStart = (e: React.MouseEvent, columnId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const column = columns.find(c => c.id === columnId);
    if (!column) return;

    setResizingColumn(columnId);
    setResizeStartX(e.clientX);
    setResizeStartWidth(column.width);
  };

  const handleColumnResizeMove = (e: MouseEvent) => {
    if (!resizingColumn) return;

    const column = columns.find(c => c.id === resizingColumn);
    if (!column) return;

    const deltaX = e.clientX - resizeStartX;
    const newWidth = Math.max(column.minWidth, Math.min(column.maxWidth, resizeStartWidth + deltaX));

    setColumns(prev => prev.map(col =>
      col.id === resizingColumn ? { ...col, width: newWidth } : col
    ));
  };

  const handleColumnResizeEnd = () => {
    setResizingColumn(null);
  };

  // Add/remove resize listeners
  useEffect(() => {
    if (resizingColumn) {
      document.addEventListener('mousemove', handleColumnResizeMove);
      document.addEventListener('mouseup', handleColumnResizeEnd);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleColumnResizeMove);
      document.removeEventListener('mouseup', handleColumnResizeEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleColumnResizeMove);
      document.removeEventListener('mouseup', handleColumnResizeEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [resizingColumn, resizeStartX, resizeStartWidth]);

  // Toggle column visibility
  const toggleColumnVisibility = (columnId: string) => {
    setColumns(prev => prev.map(col => {
      if (col.id === columnId) {
        // Check if this column is locked (cannot be hidden)
        const definition = COLUMN_DEFINITIONS.find(def => def.key === columnId);
        if (definition?.locked) {
          return col; // Don't toggle locked columns
        }
        return { ...col, visible: !col.visible };
      }
      return col;
    }));
  };

  // Reset columns to default
  const handleResetColumns = () => {
    setColumns(resetColumnsToDefault());
  };

  // Helper to find node by ID in tree
  const findNodeById = (nodes: WBSNode[], id: string): WBSNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children.length > 0) {
        const found = findNodeById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Drag handlers (for Task/Milestone nodes)
  const handleTaskMouseDown = (e: React.MouseEvent, nodeId: string, mode: 'move' | 'resize-start' | 'resize-end') => {
    e.stopPropagation();
    e.preventDefault();

    const node = findNodeById(wbsNodes, nodeId);
    if (!node) return; // Allow drag for all node types

    setDraggingTask(nodeId);
    setDragMode(mode);
    setDragStartX(e.clientX);

    // Set initial drag info
    setDragInfo({
      startDate: format(new Date(node.plannedStartDate!), 'dd/MM/yyyy', { locale: vi }),
      endDate: format(new Date(node.plannedEndDate!), 'dd/MM/yyyy', { locale: vi }),
      days: node.durationDays || 0,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingTask || !dragMode || !svgRef.current) return;

    const deltaX = e.clientX - dragStartX;
    // Convert pixels to days based on current viewMode
    const daysDelta = Math.round((deltaX / columnWidth) * daysPerColumn);

    const node = findNodeById(wbsNodes, draggingTask);
    if (!node) return;

    let newStartDate = new Date(node.plannedStartDate!);
    let newEndDate = new Date(node.plannedEndDate!);

    if (dragMode === 'move') {
      newStartDate = addDays(newStartDate, daysDelta);
      newEndDate = addDays(newEndDate, daysDelta);
    } else if (dragMode === 'resize-start') {
      newStartDate = addDays(newStartDate, daysDelta);
    } else if (dragMode === 'resize-end') {
      newEndDate = addDays(newEndDate, daysDelta);
    }

    const newDuration = Math.max(1, Math.ceil((newEndDate.getTime() - newStartDate.getTime()) / (1000 * 60 * 60 * 24)));

    setDragInfo({
      startDate: format(newStartDate, 'dd/MM/yyyy', { locale: vi }),
      endDate: format(newEndDate, 'dd/MM/yyyy', { locale: vi }),
      days: newDuration,
      newStartDate,
      newEndDate,
    });
  };

  const handleMouseUp = async () => {
    if (draggingTask && dragMode && dragInfo && dragInfo.newStartDate && dragInfo.newEndDate && wbsId) {
      // Save task ID before clearing state
      const taskId = draggingTask;
      const newStart = dragInfo.newStartDate;
      const newEnd = dragInfo.newEndDate;

      // Find the node being dragged
      const flatNodes = flattenWBSTree(wbsNodes);
      const draggedNode = flatNodes.find(n => n.id === taskId);
      
      if (!draggedNode) {
        setDraggingTask(null);
        setDragMode(null);
        setDragInfo(null);
        return;
      }

      // Validate the move against dependencies
      const validation = validateTaskMove(draggedNode, newStart, newEnd, flatNodes);
      
      if (!validation.valid) {
        // Show error and revert
        alert(`Không thể di chuyển task:\n\n${validation.errors.join('\n')}`);
        setDraggingTask(null);
        setDragMode(null);
        setDragInfo(null);
        return;
      }

      // Calculate cascading updates for dependent tasks
      const cascadingUpdates = calculateCascadingUpdates(draggedNode, newStart, newEnd, flatNodes);

      // Optimistic update: Update local state immediately
      setWbsNodes(prevNodes => updateNodeInTree(prevNodes, taskId, {
        plannedStartDate: newStart.toISOString(),
        plannedEndDate: newEnd.toISOString(),
      }));

      // Reset drag state IMMEDIATELY to prevent flickering
      setDraggingTask(null);
      setDragMode(null);
      setDragInfo(null);

      try {
        // Update main node in backend
        await wbsApi.updateNode(wbsId, taskId, {
          plannedStartDate: newStart.toISOString(),
          plannedEndDate: newEnd.toISOString(),
        });

        // Apply cascading updates to dependent tasks
        if (cascadingUpdates.size > 0) {
          console.log(`🔄 Applying ${cascadingUpdates.size} cascading updates...`);
          
          for (const [nodeId, dates] of cascadingUpdates) {
            await wbsApi.updateNode(wbsId, nodeId, dates);
          }
          
          console.log('✅ Cascading updates completed');
        }

        // Reload WBS data to sync with backend (in case of rollup calculations)
        await reloadWBS();
      } catch (error) {
        console.error('Failed to update node dates:', error);
        // Reload to revert optimistic update on error
        await reloadWBS();
      }
    } else {
      // Reset drag state even if no drag was active
      setDraggingTask(null);
      setDragMode(null);
      setDragInfo(null);
    }
  };

  // Handle create WBS node (Summary/Task/Milestone)
  const handleCreateWBSNode = async (nodeData: any) => {
    if (!currentProjectId || !wbsId) return;

    try {
      // Use new unified API to create the node
      await wbsApi.createNode(wbsId, {
        name: nodeData.name,
        code: nodeData.code,
        description: nodeData.description,
        type: nodeData.type || 'Summary',
        parentNodeId: parentNodeForCreate?.id,
        plannedStartDate: nodeData.plannedStartDate,
        plannedEndDate: nodeData.plannedEndDate,
        durationDays: nodeData.durationDays,
        assignedUserIds: nodeData.assignedUserIds,
        estimatedHours: nodeData.estimatedHours,
        plannedCost: nodeData.plannedCost,
      });

      // Reload the entire WBS tree to get fresh data
      await reloadWBS();

      // Expand parent if creating child
      if (parentNodeForCreate) {
        setExpandedNodes(prev => new Set([...prev, parentNodeForCreate.id]));
      }
    } catch (error) {
      console.error('❌ Failed to create WBS node:', error);
      throw error;
    }
  };

  // Handle update WBS node
  const handleUpdateWBSNode = async (nodeData: any) => {
    if (!currentProjectId || !editingNode || !wbsId) return;

    try {
      // Use new unified API to update the node
      await wbsApi.updateNode(wbsId, editingNode.id, {
        code: nodeData.code,
        name: nodeData.name,
        description: nodeData.description,
        type: nodeData.type, // Add type field
        scheduleMode: nodeData.scheduleMode,
        plannedStartDate: nodeData.plannedStartDate,
        plannedEndDate: nodeData.plannedEndDate,
        durationDays: nodeData.durationDays,
        actualStartDate: nodeData.actualStartDate,
        actualEndDate: nodeData.actualEndDate,
        percentComplete: nodeData.percentComplete,
        status: nodeData.status,
        assignedUserIds: nodeData.assignedUserIds,
        estimatedHours: nodeData.estimatedHours,
        actualHours: nodeData.actualHours,
        plannedCost: nodeData.plannedCost,
        actualCost: nodeData.actualCost,
        currency: nodeData.currency,
        predecessors: nodeData.predecessors,
        constraint: nodeData.constraint,
        priority: nodeData.priority,
        deliverables: nodeData.deliverables,
        acceptanceCriteria: nodeData.acceptanceCriteria,
        responsibleOrganization: nodeData.responsibleOrganization,
        assumptions: nodeData.assumptions,
        scopeConstraints: nodeData.scopeConstraints,
        notes: nodeData.notes,
      });
      // Reload the entire WBS tree to get fresh data
      await reloadWBS();
    } catch (error) {
      console.error('❌ Failed to update WBS node:', error);
      throw error;
    }
  };

  // Helper: Add node to tree
  const addNodeToTree = (nodes: WBSNode[], parentId: string, newNode: WBSNode): WBSNode[] => {
    return nodes.map(node => {
      if (node.id === parentId) {
        return {
          ...node,
          children: [...node.children, newNode],
        };
      }
      if (node.children.length > 0) {
        return {
          ...node,
          children: addNodeToTree(node.children, parentId, newNode),
        };
      }
      return node;
    });
  };

  // Helper: Update node in tree
  const updateNodeInTree = (nodes: WBSNode[], nodeId: string, updates: Partial<WBSNode>): WBSNode[] => {
    return nodes.map(node => {
      if (node.id === nodeId) {
        return { ...node, ...updates };
      }
      if (node.children.length > 0) {
        return {
          ...node,
          children: updateNodeInTree(node.children, nodeId, updates),
        };
      }
      return node;
    });
  };

  // Handle progress update
  const handleProgressSave = async (nodeId: string) => {
    if (!wbsId || !editingProgress) return;

    try {
      const progress = parseInt(progressValue) || 0;
      const clampedProgress = Math.max(0, Math.min(100, progress));
      await wbsApi.updateNodeProgress(wbsId, nodeId, clampedProgress);
      
      // Reload WBS after update
      await reloadWBS();
      
      setEditingProgress(null);
    } catch (error) {
      console.error('❌ Failed to update progress:', error);
      setEditingProgress(null);
    }
  };

  // Handle duration update
  const handleDurationSave = async (nodeId: string) => {
    if (!wbsId || !editingDuration) return;

    try {
      const duration = parseInt(durationValue) || 0;
      if (duration < 0) return;
      // Find node to get startDate
      const node = findNodeById(wbsNodes, nodeId);
      if (node && node.plannedStartDate) {
        // Calculate new endDate from startDate + duration
        const startDate = new Date(node.plannedStartDate);
        const endDate = addDays(startDate, duration);

        await wbsApi.updateNode(wbsId, nodeId, {
          durationDays: duration,
          plannedEndDate: endDate.toISOString(),
        });

        // Reload WBS after update
        await reloadWBS();
      }

      setEditingDuration(null);
    } catch (error) {
      console.error('❌ Failed to update duration:', error);
      setEditingDuration(null);
    }
  };

  // Handle dependencies save
  const handleDependenciesSave = async (nodeId: string) => {
    if (!wbsId) return;
    
    try {
      const allNodesFlat = flattenWBSTree(wbsNodes);
      const { dependencies, errors } = parseDependencyString(dependenciesValue, allNodesFlat);
      
      if (errors.length === 0) {
        // Validate logic
        const warnings = validateDependencies(nodeId, dependencies, allNodesFlat);
        if (warnings.length > 0) {
          console.warn('Dependency warnings:', warnings);
        }
        
        // Save to API
        await wbsApi.updateNode(wbsId, nodeId, { predecessors: dependencies });
        
        // Reload data
        await reloadWBS();
      } else {
        console.error('Parse errors:', errors);
        alert(`Lỗi cú pháp:\n${errors.join('\n')}`);
      }
    } catch (error) {
      console.error('Failed to update dependencies:', error);
    } finally {
      setEditingDependenciesInline(null);
      setDependenciesErrors([]);
    }
  };

  const renderRow = (row: RowItem) => {
    const { node, depth } = row;
    
    return (
      <WBSTableRow
        key={`node-${node.id}`}
        node={node}
        depth={depth}
        columns={columns}
        expandedNodes={expandedNodes}
        wbsNodes={wbsNodes}
        editingProgress={editingProgress}
        progressValue={progressValue}
        editingDuration={editingDuration}
        durationValue={durationValue}
        editingDependenciesInline={editingDependenciesInline}
        dependenciesValue={dependenciesValue}
        dependenciesErrors={dependenciesErrors}
        onToggleNode={toggleNode}
        onEditNode={setEditingNode}
        onAddChild={(node: WBSNode) => {
          setParentNodeForCreate(node);
          setCreatingNode(true);
        }}
        onEditResources={setEditingResources}
        onSetProgressValue={setProgressValue}
        onSetEditingProgress={setEditingProgress}
        onProgressSave={handleProgressSave}
        onSetDurationValue={setDurationValue}
        onSetEditingDuration={setEditingDuration}
        onDurationSave={handleDurationSave}
        onSetDependenciesValue={setDependenciesValue}
        onSetDependenciesErrors={setDependenciesErrors}
        onSetEditingDependenciesInline={setEditingDependenciesInline}
        onDependenciesSave={handleDependenciesSave}
        getWBSProgress={getWBSProgress}
      />
    );
  };

  // Redirect to projects if no project selected
  if (!currentProjectId) {
    return <Navigate to="/projects" replace />;
  }

  // Show loading state
  if (loading) {
    return (
      <div className="w-full px-6 py-6">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-lg">Đang tải dữ liệu WBS & Activities...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={isFullscreen ? 'fixed inset-0 z-50 bg-white overflow-auto p-6 space-y-6' : 'w-full px-6 py-6 space-y-6'}>
      {/* Create WBS Node Dialog (unified for Summary/Task/Milestone) */}
      <CreateWBSNodeDialog
        open={creatingNode}
        onOpenChange={(open) => {
          setCreatingNode(open);
          if (!open) setParentNodeForCreate(null);
        }}
        parentNode={parentNodeForCreate}
        allNodes={wbsNodes}
        onSave={handleCreateWBSNode}
      />

      {/* Edit WBS Node Dialog (unified) */}
      {editingNode && (
        <EditWBSNodeDialog
          open={!!editingNode}
          onOpenChange={(open) => !open && setEditingNode(null)}
          node={editingNode}
          onSave={handleUpdateWBSNode}
        />
      )}

      {/* Edit Resources Dialog (Phase 3) */}
      <EditResourcesDialog
        isOpen={!!editingResources}
        onClose={() => setEditingResources(null)}
        node={editingResources}
        wbsId={wbsId || ''}
        onUpdate={reloadWBS}
        projectId={currentProjectId || undefined}
      />

      {/* Resource Pool Dialog */}
      <ResourcePoolDialog
        open={resourcePoolOpen}
        onOpenChange={setResourcePoolOpen}
        projectId={currentProjectId || ''}
      />

      {/* Project Info Banner */}
      <ProjectInfoBanner
        projectName={projectInfo.name}
        startDate={projectInfo.startDate}
        endDate={projectInfo.endDate}
        currentPhase={projectInfo.currentPhase}
        progress={projectInfo.progress}
      />

      {/* Dependencies Help Card */}
      <DependenciesHelpCard />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">WBS & Lịch trình</h1>
          <p className="text-muted-foreground mt-2">
            Cấu trúc phân rã công việc với Gantt chart tích hợp - Unified WBS/Task structure
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Ngày</SelectItem>
              <SelectItem value="week">Tuần</SelectItem>
              <SelectItem value="month">Tháng</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
          <ColumnsDropdown
            columns={columns}
            onToggleColumn={toggleColumnVisibility}
            onResetColumns={handleResetColumns}
          />
          <Button
            variant="outline"
            onClick={() => setResourcePoolOpen(true)}
          >
            <Users className="w-4 h-4 mr-2" />
            Quản lý Nguồn lực
          </Button>
          <Button
            onClick={() => {
              setParentNodeForCreate(null);
              setCreatingNode(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm WBS Node
          </Button>
        </div>
      </div>
      <div className="rounded-lg border bg-white overflow-hidden">
        {/* Drag info tooltip */}
        {draggingTask && dragInfo && dragMode && (
          <DragInfoTooltip
            draggingTask={draggingTask}
            dragMode={dragMode}
            dragInfo={dragInfo}
            wbsNodes={wbsNodes}
          />
        )}

        {/* Header */}
        <WBSTableHeader
          columns={columns}
          ganttColumns={ganttColumns}
          columnWidth={columnWidth}
          viewMode={viewMode}
          projectStartDate={projectInfo.startDate}
          onColumnResizeStart={handleColumnResizeStart}
        />

        {/* Content */}
        <div className="flex overflow-auto" style={{ maxHeight: 600 }}>
          {/* Left: WBS Tree with Columns */}
          <div className="border-r overflow-y-auto" style={{ minWidth: columns.reduce((sum, col) => sum + (col.visible ? col.width : 0), 0) }}>
            {visibleRows.map((row) => renderRow(row))}
          </div>

          {/* Right: Gantt Chart */}
          <div
            className="flex-1 relative"
            style={{ minWidth: totalWidth }}
          >
            {/* Grid */}
            <GanttGrid
              columns={ganttColumns}
              columnWidth={columnWidth}
              rowHeight={ROW_HEIGHT}
              rowCount={visibleRows.length}
            />

            {/* SVG for tasks */}
            <svg
              ref={svgRef}
              width={totalWidth}
              height={visibleRows.length * ROW_HEIGHT}
              className="absolute top-0 left-0"
              style={{
                cursor: draggingTask ? 'grabbing' : 'default',
                userSelect: 'none',
              }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Today marker */}
              <GanttTimeline
                startDate={startDate}
                columnWidth={columnWidth}
                viewMode={viewMode}
                totalHeight={visibleRows.length * ROW_HEIGHT}
              />

              {/* WBS Summary Bars & Task bars */}
              <GanttTasksRenderer
                visibleRows={visibleRows}
                startDate={startDate}
                columnWidth={columnWidth}
                draggingTask={draggingTask}
                dragInfo={dragInfo}
                hoveredTask={hoveredTask}
                getTaskPosition={getTaskPosition}
                getWBSPosition={getWBSPosition}
                getWBSProgress={getWBSProgress}
                onSetHoveredTask={setHoveredTask}
                onEditNode={setEditingNode}
                onTaskMouseDown={handleTaskMouseDown}
              />

              {/* Dependency Arrows */}
              <GanttDependencyArrows
                nodes={flattenWBSTree(wbsNodes)}
                getTaskPosition={getTaskPosition}
                rowHeight={40}
                taskBarHeight={32}
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

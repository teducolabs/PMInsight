import { useState, useMemo, useRef, useEffect } from 'react';
import { useProject } from '@/lib/context/ProjectContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, ChevronRight, ChevronDown, FolderTree, TrendingUp, Loader2, Pencil, CheckSquare, Diamond, Maximize2, Minimize2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { WBSNode } from '@/types/wbs';
import WBSNodeDependency, { flattenWBSTree } from '@/types/wbs';
import { GanttHeader } from '@/components/schedule/GanttHeader';
import { GanttGrid } from '@/components/schedule/GanttGrid';
import { GanttTask } from '@/components/schedule/GanttTask';
import { GanttTimeline } from '@/components/schedule/GanttTimeline';
import { WBSSummaryBar } from '@/components/schedule/WBSSummaryBar';
import { GanttDependencyArrows } from '@/components/schedule/GanttDependencyArrows';
import { EditDependenciesDialog } from '@/components/schedule/EditDependenciesDialog';
import { CreateWBSNodeDialog } from '@/components/wbs/CreateWBSNodeDialog';
import { EditWBSNodeDialog } from '@/components/wbs/EditWBSNodeDialog';
import { wbsApi } from '@/lib/api/wbs';
import { projectApi } from '@/lib/api/project';
import type { Project } from '@/types/project';
import { ProjectStatus } from '@/types/project';
import { 
  parseDependencyString, 
  dependenciesToString, 
  validateDependencies,
  assignSequenceIds 
} from '@/lib/dependencies-parser';


type ViewMode = 'day' | 'week' | 'month';

const ROW_HEIGHT = 50;
// Column configuration
type ColumnConfig = {
  id: string;
  label: string;
  width: number;
  minWidth: number;
  maxWidth: number;
  visible: boolean;
  resizable: boolean;
};

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'id', label: 'ID', width: 60, minWidth: 50, maxWidth: 80, visible: true, resizable: true },
  { id: 'tree', label: 'WBS/Activity', width: 400, minWidth: 250, maxWidth: 700, visible: true, resizable: true },
  { id: 'duration', label: 'Duration (days)', width: 120, minWidth: 100, maxWidth: 180, visible: true, resizable: true },
  { id: 'progress', label: 'Progress', width: 120, minWidth: 100, maxWidth: 180, visible: true, resizable: true },
  { id: 'dependencies', label: 'Predecessors', width: 180, minWidth: 120, maxWidth: 300, visible: true, resizable: true },
  { id: 'dates', label: 'Dates', width: 180, minWidth: 150, maxWidth: 250, visible: true, resizable: true },
];

export function WBSPage() {
  const { currentProjectId } = useProject();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
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

  // Dependencies edit state (old dialog - keep for reference)
  const [editingDependencies, setEditingDependencies] = useState<WBSNode | null>(null);

  // Node edit state (unified for WBS and tasks)
  const [creatingNode, setCreatingNode] = useState(false);
  const [parentNodeForCreate, setParentNodeForCreate] = useState<WBSNode | null>(null);
  const [editingNode, setEditingNode] = useState<WBSNode | null>(null);

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
    if (viewMode === 'day') {
      let current = new Date(start);
      while (current <= end) {
        cols.push(new Date(current));
        current = addDays(current, 1);
      }
    } else if (viewMode === 'week') {
      let current = new Date(start);
      while (current <= end) {
        cols.push(new Date(current));
        current = addDays(current, 7);
      }
    } else if (viewMode === 'month') {
      let current = new Date(start);
      while (current <= end) {
        cols.push(new Date(current));
        current = addDays(current, 30);
      }
    }

    return {
      startDate: start,
      ganttColumns: cols,
      columnWidth: width,
    };
  }, [viewMode, wbsNodes]);

  const totalWidth = ganttColumns.length * columnWidth;

  // Calculate task position in Gantt (for Task/Milestone nodes)
  const getTaskPosition = (node: WBSNode) => {
    if (!node.plannedStartDate || !node.plannedEndDate) return null;

    const taskStart = new Date(node.plannedStartDate);
    const taskEnd = new Date(node.plannedEndDate);

    // Calculate which column (week) the task starts in
    const daysSinceStart = Math.floor((taskStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const weekIndex = Math.floor(daysSinceStart / 7);

    // Calculate task duration in days
    const taskDuration = Math.max(1, Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)));
    const weeksSpan = Math.ceil(taskDuration / 7);

    const x = weekIndex * columnWidth;
    const width = weeksSpan * columnWidth;

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

    // Calculate which column (week) the WBS starts in
    const daysSinceStart = Math.floor((dateRange.startDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const weekIndex = Math.floor(daysSinceStart / 7);

    // Calculate duration in days
    const duration = Math.max(1, Math.ceil((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const weeksSpan = Math.ceil(duration / 7);

    const x = weekIndex * columnWidth;
    const width = weeksSpan * columnWidth;

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
    const daysDelta = Math.round((deltaX / columnWidth) * 7); // Convert pixels to days

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
        // Update node in backend
        await wbsApi.updateNode(wbsId, taskId, {
          plannedStartDate: newStart.toISOString(),
          plannedEndDate: newEnd.toISOString(),
        });

        // Reload WBS data to sync with backend (in case of rollup calculations)
        await reloadWBS();
      } catch (error) {
        console.error('Failed to update node dates:', error);
        // Reload to revert optimistic update on error
        const updatedWBS = await wbsApi.getById(wbsId);
        if (updatedWBS) {
          setWbsNodes(updatedWBS.tree);
        }
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

  // Handle dependencies save (for Task/Milestone nodes)
  const handleSaveDependencies = async (nodeId: string, dependencies: WBSNodeDependency[]) => {
    if (!wbsId) return;

    console.log('💾 handleSaveDependencies called:', { nodeId, dependencies });
    console.log('💾 Dependencies to save:', JSON.stringify(dependencies, null, 2));

    try {
      // Update node with new predecessors via API
      const updatePayload = {
        predecessors: dependencies,
      };
      console.log('💾 Sending update payload:', updatePayload);
      
      const result = await wbsApi.updateNode(wbsId, nodeId, updatePayload);
      console.log('✅ Update successful, result:', result);

      // Reload WBS data
      await reloadWBS();
      console.log('✅ WBS reloaded successfully');
    } catch (error) {
      console.error('❌ Failed to save dependencies:', error);
      if (error instanceof Error) {
        console.error('❌ Error details:', error.message);
      }
    }
  };

  const renderRow = (row: RowItem) => {
    const idColumn = columns.find(c => c.id === 'id');
    const treeColumn = columns.find(c => c.id === 'tree');
    const durationColumn = columns.find(c => c.id === 'duration');
    const progressColumn = columns.find(c => c.id === 'progress');
    const dependenciesColumn = columns.find(c => c.id === 'dependencies');
    const datesColumn = columns.find(c => c.id === 'dates');

    // All rows are now WBS nodes (can be Summary, Task, or Milestone)
    const { node, depth } = row;
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div
        key={`node-${node.id}`}
        className="flex border-b hover:bg-gray-50"
        style={{ height: ROW_HEIGHT }}
      >
        {/* ID Column */}
        {idColumn?.visible && (
          <div
            className="flex items-center justify-center py-2 px-2 border-r bg-gray-50"
            style={{ width: idColumn.width }}
          >
            <span className="text-sm font-mono font-semibold text-blue-600">
              {node.sequenceId || '-'}
            </span>
          </div>
        )}

        {/* Tree Column */}
        {treeColumn?.visible && (
          <div
            className="flex items-center gap-2 py-2 px-4 border-r"
            style={{
              width: treeColumn.width,
              paddingLeft: `${depth * 24 + 16}px`,
            }}
          >
            <button
              onClick={() => toggleNode(node.id)}
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
                  setEditingNode(node);
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
                  setParentNodeForCreate(node);
                  setCreatingNode(true);
                }}
                title="Thêm WBS node con"
                className="h-7 px-2"
              >
                <Plus className="w-3 h-3 mr-1" />
                WBS
              </Button>

              {/* TODO: Add Task button - will use same dialog with type selector */}
            </div>
          </div>
        )}

        {/* Duration Column */}
        {durationColumn?.visible && (
          <div 
            className="flex items-center py-2 px-4 border-r" 
            style={{ width: durationColumn.width }}
          >
            {editingDuration === node.id ? (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min="0"
                  value={durationValue}
                  onChange={(e) => setDurationValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleDurationSave(node.id);
                    } else if (e.key === 'Escape') {
                      setEditingDuration(null);
                    }
                  }}
                  onBlur={() => handleDurationSave(node.id)}
                  className="h-7 w-20 text-sm"
                  autoFocus
                />
                <span className="text-xs text-gray-500">days</span>
              </div>
            ) : (
              <div 
                className="cursor-pointer hover:bg-gray-50 px-2 py-1 rounded text-sm"
                onClick={() => {
                  setEditingDuration(node.id);
                  setDurationValue(node.durationDays?.toString() || '0');
                }}
              >
                {node.durationDays || 0}
              </div>
            )}
          </div>
        )}

        {/* Progress Column */}
        {progressColumn?.visible && (
          <div 
            className="flex items-center gap-2 py-2 px-4 border-r" 
            style={{ width: progressColumn.width }}
          >
            {editingProgress === node.id ? (
              <div className="flex items-center gap-1 w-full">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={progressValue}
                  onChange={(e) => setProgressValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleProgressSave(node.id);
                    } else if (e.key === 'Escape') {
                      setEditingProgress(null);
                    }
                  }}
                  onBlur={() => handleProgressSave(node.id)}
                  className="h-7 w-16 text-sm"
                  autoFocus
                />
                <span className="text-xs">%</span>
              </div>
            ) : (
              (() => {
                // For Summary nodes: check if it has children tasks
                const hasChildrenTasks = node.type === 'Summary' && node.children && node.children.length > 0;
                const displayProgress = node.type === 'Summary' ? getWBSProgress(node) : (node.percentComplete || 0);
                const canEdit = !(node.type === 'Summary' && hasChildrenTasks); // Can't edit if Summary with children
                
                return (
                  <div 
                    className={`flex items-center gap-2 w-full rounded px-1 ${canEdit ? 'cursor-pointer hover:bg-gray-50' : 'cursor-not-allowed opacity-60'}`}
                    onClick={() => {
                      if (canEdit) {
                        setEditingProgress(node.id);
                        setProgressValue(node.percentComplete?.toString() || '0');
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
        )}

        {/* Dependencies Column */}
        {dependenciesColumn?.visible && (
          <div 
            className="flex items-center py-2 px-2 border-r relative group" 
            style={{ width: dependenciesColumn.width }}
          >
            {editingDependenciesInline === node.id ? (
              <div className="w-full">
                <Input
                  type="text"
                  value={dependenciesValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    setDependenciesValue(value);
                    
                    // Parse and validate in real-time
                    const allNodesFlat = flattenWBSTree(wbsNodes);
                    const { errors } = parseDependencyString(value, allNodesFlat);
                    setDependenciesErrors(errors);
                  }}
                  onBlur={async () => {
                    if (!wbsId) return;
                    
                    try {
                      const allNodesFlat = flattenWBSTree(wbsNodes);
                      const { dependencies, errors } = parseDependencyString(dependenciesValue, allNodesFlat);
                      
                      if (errors.length === 0) {
                        // Validate logic
                        const warnings = validateDependencies(node.id, dependencies, allNodesFlat);
                        if (warnings.length > 0) {
                          console.warn('Dependency warnings:', warnings);
                          // You can show warnings to user here
                        }
                        
                        // Save to API
                        await wbsApi.updateNode(wbsId, node.id, { predecessors: dependencies });
                        
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
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
                    } else if (e.key === 'Escape') {
                      setEditingDependenciesInline(null);
                      setDependenciesErrors([]);
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
                  setDependenciesValue(depsString);
                  setEditingDependenciesInline(node.id);
                  setDependenciesErrors([]);
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
        )}

        {/* Dates Column */}
        {datesColumn?.visible && (
          <div className="flex items-center gap-2 py-2 px-3 border-r" style={{ width: datesColumn.width }}>
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
        )}
      </div>
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

      {/* Dependencies Edit Dialog */}
      {editingDependencies && (
        <EditDependenciesDialog
          open={!!editingDependencies}
          onOpenChange={(open) => !open && setEditingDependencies(null)}
          node={editingDependencies}
          allNodes={wbsNodes}
          onSave={handleSaveDependencies}
        />
      )}

      {/* Project Info Banner */}
      <div className="rounded-lg border bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{projectInfo.name}</h2>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-blue-600" />
                <span className="text-gray-600">
                  Từ <strong>{format(projectInfo.startDate, 'dd/MM/yyyy', { locale: vi })}</strong> đến{' '}
                  <strong>{format(projectInfo.endDate, 'dd/MM/yyyy', { locale: vi })}</strong>
                </span>
                <span className="text-gray-400">
                  ({Math.ceil((projectInfo.endDate.getTime() - projectInfo.startDate.getTime()) / (1000 * 60 * 60 * 24))} ngày)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-gray-600">
                  Giai đoạn: <strong className="text-blue-700">{projectInfo.currentPhase}</strong>
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-3xl font-bold text-blue-600">{projectInfo.progress}%</div>
            <div className="text-xs text-gray-500">Tiến độ tổng thể</div>
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${projectInfo.progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Timeline visualization */}
        <div className="relative">
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
            <span>{format(projectInfo.startDate, 'dd/MM/yyyy', { locale: vi })}</span>
            <div className="flex-1" />
            <span className="text-blue-600 font-semibold">Hôm nay: {format(new Date(), 'dd/MM/yyyy', { locale: vi })}</span>
            <div className="flex-1" />
            <span>{format(projectInfo.endDate, 'dd/MM/yyyy', { locale: vi })}</span>
          </div>

          {/* Timeline bar */}
          <div className="relative h-8 bg-gray-200 rounded-lg overflow-hidden">
            {/* Progress fill */}
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
              style={{ width: `${projectInfo.progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>

            {/* Today marker */}
            {(() => {
              const today = new Date();
              const totalDays = Math.ceil((projectInfo.endDate.getTime() - projectInfo.startDate.getTime()) / (1000 * 60 * 60 * 24));
              const daysPassed = Math.ceil((today.getTime() - projectInfo.startDate.getTime()) / (1000 * 60 * 60 * 24));
              const todayPercent = Math.max(0, Math.min(100, (daysPassed / totalDays) * 100));

              return (
                <>
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                    style={{ left: `${todayPercent}%` }}
                  >
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg" />
                  </div>
                  <div
                    className="absolute top-1/2 -translate-y-1/2 px-2 py-0.5 bg-red-500 text-white text-xs font-semibold rounded whitespace-nowrap shadow-lg"
                    style={{
                      left: `${todayPercent}%`,
                      transform: `translate(${todayPercent > 80 ? '-100%' : todayPercent < 20 ? '0' : '-50%'}, -50%)`,
                      marginLeft: todayPercent > 80 ? '-4px' : todayPercent < 20 ? '4px' : '0'
                    }}
                  >
                    Hôm nay
                  </div>
                </>
              );
            })()}

            {/* Phase markers */}
            <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-between px-2 pointer-events-none">
              <span className="text-xs font-semibold text-white drop-shadow-lg">Bắt đầu</span>
              <span className="text-xs font-semibold text-gray-700 drop-shadow-lg">Kết thúc</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dependencies Help Card */}
      <div className="rounded-lg border bg-gradient-to-r from-amber-50 to-yellow-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold">
            i
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900 mb-2">💡 Hướng dẫn nhập Dependencies (Predecessors)</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-amber-800 mb-2"><strong>Cú pháp:</strong> <code className="bg-white px-2 py-0.5 rounded font-mono">&lt;ID&gt;&lt;Type&gt;&lt;Lag&gt;</code></p>
                <ul className="space-y-1 text-amber-700">
                  <li>• <strong>ID:</strong> Số thứ tự task (cột ID bên trái)</li>
                  <li>• <strong>Type:</strong> FS (Finish-Start), SS (Start-Start), FF (Finish-Finish), SF (hiếm dùng)</li>
                  <li>• <strong>Lag:</strong> +2d (trì hoãn 2 ngày), -1d (sớm hơn 1 ngày), không ghi = 0</li>
                </ul>
              </div>
              <div>
                <p className="text-amber-800 mb-2"><strong>Ví dụ:</strong></p>
                <ul className="space-y-1 text-amber-700 font-mono text-xs">
                  <li>• <code className="bg-white px-2 py-0.5 rounded">3FS</code> → Bắt đầu sau khi task 3 hoàn thành</li>
                  <li>• <code className="bg-white px-2 py-0.5 rounded">4FS+2d</code> → Bắt đầu 2 ngày sau khi task 4 xong</li>
                  <li>• <code className="bg-white px-2 py-0.5 rounded">5SS</code> → Bắt đầu cùng lúc với task 5</li>
                  <li>• <code className="bg-white px-2 py-0.5 rounded">3FS,5SS+1d</code> → Nhiều predecessors (phân cách bằng dấu phẩy)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

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
        {draggingTask && dragInfo && (
          <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg">
            <div className="text-xs font-semibold mb-1">
              {dragMode === 'move' ? '🔄 Di chuyển task' :
                dragMode === 'resize-start' ? '⬅️ Thay đổi ngày bắt đầu' :
                  '➡️ Thay đổi ngày kết thúc'}
            </div>
            <div className="text-sm">
              <div>📅 {dragInfo.startDate} → {dragInfo.endDate}</div>
              <div className="mt-1">⏱️ {dragInfo.days} ngày</div>
            </div>
          </div>
        )}

        {/* Header */}
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
                    onMouseDown={(e) => handleColumnResizeStart(e, col.id)}
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
              projectStartDate={projectInfo.startDate}
            />
          </div>
        </div>

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
              {visibleRows.map((row, index) => {
                const { node } = row;

                // For ALL nodes with dates: show task bar
                if (!node.plannedStartDate || !node.plannedEndDate) {
                  return null; // Skip nodes without dates
                }

                // For Summary nodes: show summary bar (regardless of expand state)
                if (node.type === 'Summary') {
                  const position = getWBSPosition(node);
                  if (!position) return null;

                  const progress = getWBSProgress(node);
                  const isHovered = hoveredTask === `wbs-${node.id}`;
                  const isDragging = draggingTask === node.id;
                  
                  // Calculate preview position when dragging
                  let displayX = position.x;
                  let displayWidth = position.width;

                  if (isDragging && dragInfo?.newStartDate && dragInfo?.newEndDate) {
                    const daysSinceStart = Math.floor(
                      (dragInfo.newStartDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
                    );
                    const duration = Math.max(1, Math.ceil(
                      (dragInfo.newEndDate.getTime() - dragInfo.newStartDate.getTime()) / (1000 * 60 * 60 * 24)
                    ));

                    displayX = Math.floor(daysSinceStart / 7) * columnWidth;
                    displayWidth = Math.max(1, Math.ceil(duration / 7)) * columnWidth;
                  }
                  
                  const tooltipContent = (
                    <div className="text-xs">
                      <div className="font-semibold mb-1">{node.name}</div>
                      <div className="text-gray-400">
                        {format(position.dateRange.startDate, 'dd/MM/yyyy', { locale: vi })} → {' '}
                        {format(position.dateRange.endDate, 'dd/MM/yyyy', { locale: vi })}
                      </div>
                      <div className="mt-1">Tiến độ: {progress}%</div>
                    </div>
                  );

                  const summaryY = index * ROW_HEIGHT + (ROW_HEIGHT - 32) / 2;

                  return (
                    <g key={`wbs-${node.id}`}>
                      <WBSSummaryBar
                        x={displayX}
                        y={summaryY}
                        width={displayWidth}
                        height={32}
                        label={`${progress}%`}
                        progress={progress}
                        tooltipContent={tooltipContent}
                        isHovered={isHovered}
                        onMouseEnter={() => setHoveredTask(`wbs-${node.id}`)}
                        onMouseLeave={() => setHoveredTask(null)}
                        onDoubleClick={() => setEditingNode(node)}
                        onStartDrag={(e) => handleTaskMouseDown(e, node.id, 'resize-start')}
                        onEndDrag={(e) => handleTaskMouseDown(e, node.id, 'resize-end')}
                        onBarDrag={(e) => handleTaskMouseDown(e, node.id, 'move')}
                      />
                      
                      {/* Dashed outline when dragging */}
                      {isDragging && (
                        <rect
                          x={displayX - 2}
                          y={summaryY - 2}
                          width={displayWidth + 4}
                          height={32 + 4}
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          strokeDasharray="4 2"
                          pointerEvents="none"
                        />
                      )}
                    </g>
                  );
                }

                // For Task/Milestone nodes: show task bar with drag handles
                if (node.type === 'Task' || node.type === 'Milestone') {
                  const position = getTaskPosition(node);
                  if (!position) return null;

                  const isDragging = draggingTask === node.id;
                  const isHovered = hoveredTask === node.id;
                  const taskY = index * ROW_HEIGHT + (ROW_HEIGHT - 32) / 2;

                  // Calculate preview position when dragging
                  let displayX = position.x;
                  let displayWidth = position.width;

                  if (isDragging && dragInfo?.newStartDate && dragInfo?.newEndDate) {
                    const daysSinceStart = Math.floor(
                      (dragInfo.newStartDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
                    );
                    const duration = Math.max(1, Math.ceil(
                      (dragInfo.newEndDate.getTime() - dragInfo.newStartDate.getTime()) / (1000 * 60 * 60 * 24)
                    ));

                    displayX = Math.floor(daysSinceStart / 7) * columnWidth;
                    displayWidth = Math.max(1, Math.ceil(duration / 7)) * columnWidth;
                  }

                  return (
                    <g key={node.id}>
                      {/* Main task bar */}
                      <GanttTask
                        node={node}
                        x={displayX}
                        y={taskY}
                        width={displayWidth}
                        height={32}
                        isHovered={isHovered}
                        onMouseEnter={() => setHoveredTask(node.id)}
                        onMouseLeave={() => setHoveredTask(null)}
                        onDoubleClick={() => setEditingNode(node)}
                      />

                      {/* Dashed outline when dragging */}
                      {isDragging && (
                        <rect
                          x={displayX - 2}
                          y={taskY - 2}
                          width={displayWidth + 4}
                          height={32 + 4}
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          strokeDasharray="4 2"
                          pointerEvents="none"
                        />
                      )}

                      {/* Left resize handle - always visible on hover */}
                      <rect
                        x={displayX - 4}
                        y={taskY + 2}
                        width={8}
                        height={32 - 4}
                        fill={(isHovered || isDragging) ? "#3b82f6" : "transparent"}
                        stroke={(isHovered || isDragging) ? "#fff" : "none"}
                        strokeWidth={1}
                        cursor="ew-resize"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleTaskMouseDown(e, node.id, 'resize-start');
                        }}
                        onMouseEnter={() => setHoveredTask(node.id)}
                      />

                      {/* Right resize handle - always visible on hover */}
                      <rect
                        x={displayX + displayWidth - 4}
                        y={taskY + 2}
                        width={8}
                        height={32 - 4}
                        fill={(isHovered || isDragging) ? "#3b82f6" : "transparent"}
                        stroke={(isHovered || isDragging) ? "#fff" : "none"}
                        strokeWidth={1}
                        cursor="ew-resize"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleTaskMouseDown(e, node.id, 'resize-end');
                        }}
                        onMouseEnter={() => setHoveredTask(node.id)}
                      />

                      {/* Center drag area for moving - higher z-index */}
                      <rect
                        x={displayX + 8}
                        y={taskY}
                        width={Math.max(0, displayWidth - 16)}
                        height={32}
                        fill="transparent"
                        cursor={isDragging ? 'grabbing' : 'grab'}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleTaskMouseDown(e, node.id, 'move');
                        }}
                        onMouseEnter={() => setHoveredTask(node.id)}
                        onMouseLeave={() => {
                          if (!isDragging) setHoveredTask(null);
                        }}
                      />
                    </g>
                  );
                }

                // For other node types (shouldn't happen), return null
                return null;
              })}

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

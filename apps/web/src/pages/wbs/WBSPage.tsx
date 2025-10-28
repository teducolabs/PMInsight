import { useState, useMemo, useRef, useEffect } from 'react';
import { useProject } from '@/lib/context/ProjectContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, ChevronRight, ChevronDown, FolderTree, ListChecks, Calendar, TrendingUp, Edit2, Link, Loader2, Pencil } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { Activity, ActivityDependency } from '@/types/activity';
import { GanttHeader } from '@/components/schedule/GanttHeader';
import { GanttGrid } from '@/components/schedule/GanttGrid';
import { GanttTask } from '@/components/schedule/GanttTask';
import { GanttTimeline } from '@/components/schedule/GanttTimeline';
import { WBSSummaryBar } from '@/components/schedule/WBSSummaryBar';
import { GanttDependencyArrows } from '@/components/schedule/GanttDependencyArrows';
import { EditDependenciesDialog } from '@/components/schedule/EditDependenciesDialog';
import { CreateActivityDialog } from '@/components/schedule/CreateActivityDialog';
import { UpdateActivityDialog } from '@/components/schedule/UpdateActivityDialog';
import { CreateWBSNodeDialog } from '@/components/wbs/CreateWBSNodeDialog';
import { EditWBSNodeDialog } from '@/components/wbs/EditWBSNodeDialog';
import { activityApi } from '@/lib/api/activity';
import { wbsApi, type WBSNode as ApiWBSNode } from '@/lib/api/wbs';
import { projectApi } from '@/lib/api/project';
import type { Project } from '@/types/project';
import { ProjectStatus } from '@/types/project';

// Using API type for WBS nodes
type WBSNode = ApiWBSNode;

type ViewMode = 'day' | 'week' | 'month';

const ROW_HEIGHT = 50;
const TASK_BAR_HEIGHT = 32;

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
  { id: 'tree', label: 'WBS/Activity', width: 350, minWidth: 200, maxWidth: 600, visible: true, resizable: true },
  { id: 'progress', label: 'Progress', width: 100, minWidth: 80, maxWidth: 150, visible: true, resizable: true },
  { id: 'dependencies', label: 'Dependencies', width: 80, minWidth: 60, maxWidth: 120, visible: true, resizable: true },
  { id: 'dates', label: 'Dates', width: 200, minWidth: 180, maxWidth: 280, visible: true, resizable: true },
];

export function WBSPage() {
  const { currentProjectId } = useProject();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [viewMode] = useState<ViewMode>('week');
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [draggingTask, setDraggingTask] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState<number>(0);
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
  
  // Dependencies edit state
  const [editingDependencies, setEditingDependencies] = useState<Activity | null>(null);
  
  // Activity edit state
  const [creatingActivity, setCreatingActivity] = useState(false);
  const [wbsNodeForActivity, setWbsNodeForActivity] = useState<WBSNode | null>(null);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  
  // WBS Node edit state
  const [creatingWBSNode, setCreatingWBSNode] = useState(false);
  const [parentNodeForCreate, setParentNodeForCreate] = useState<WBSNode | null>(null);
  const [editingWBSNode, setEditingWBSNode] = useState<WBSNode | null>(null);
  
  // Data loading state
  const [loading, setLoading] = useState(true);
  const [wbsId, setWbsId] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [wbsNodes, setWbsNodes] = useState<WBSNode[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  
  // Load data from API
  useEffect(() => {
    if (!currentProjectId) return;
    
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load project, WBS, and activities in parallel
        const [projectData, wbsData, activitiesData] = await Promise.all([
          projectApi.getById(currentProjectId),
          wbsApi.getByProjectId(currentProjectId),
          activityApi.getAll(currentProjectId),
        ]);
        
        setProject(projectData);
        setWbsId(wbsData?.id || null);
        setWbsNodes(wbsData?.tree || []);
        setActivities(activitiesData);
        
        // Auto-expand first level
        if (wbsData?.tree) {
          const firstLevelIds = wbsData.tree.map(n => n.id);
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
  
  // Calculate project info from actual activities
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
    
    if (activities.length === 0) {
      return {
        name: project.name,
        startDate: project.startDate ? new Date(project.startDate) : new Date(),
        endDate: project.endDate ? new Date(project.endDate) : new Date(),
        currentPhase: project.status || '-',
        progress: 0,
      };
    }
    
    // Calculate actual start/end dates from activities
    const dates = activities
      .filter(a => a.plannedStartDate && a.plannedEndDate)
      .flatMap(a => [new Date(a.plannedStartDate!), new Date(a.plannedEndDate!)]);
    
    const actualStartDate = dates.length > 0 
      ? new Date(Math.min(...dates.map(d => d.getTime())))
      : project.startDate ? new Date(project.startDate) : new Date();
      
    const actualEndDate = dates.length > 0
      ? new Date(Math.max(...dates.map(d => d.getTime())))
      : project.endDate ? new Date(project.endDate) : new Date();
    
    // Calculate progress from activities
    const totalProgress = activities.reduce((sum, a) => sum + a.percentComplete, 0);
    const avgProgress = activities.length > 0 ? Math.round(totalProgress / activities.length) : 0;
    
    // Determine current phase based on project status
    const currentPhase = project.status || ProjectStatus.Planning;
    
    return {
      name: project.name,
      startDate: actualStartDate,
      endDate: actualEndDate,
      currentPhase,
      progress: avgProgress,
    };
  }, [activities, project]);

  // Build flat list of visible rows (WBS nodes + activities)
  type RowItem = 
    | { type: 'wbs'; node: WBSNode; depth: number }
    | { type: 'activity'; activity: Activity; depth: number };

  const visibleRows = useMemo(() => {
    const rows: RowItem[] = [];
    
    const processNode = (node: WBSNode, depth: number) => {
      rows.push({ type: 'wbs', node, depth });
      
      const isExpanded = expandedNodes.has(node.id);
      
      if (isExpanded) {
        // Add activities belonging to this WBS node
        const nodeActivities = activities.filter(a => a.wbsNodeId === node.id);
        nodeActivities.forEach(activity => {
          rows.push({ type: 'activity', activity, depth: depth + 1 });
        });
        
        // Add child nodes recursively
        if (node.children && node.children.length > 0) {
          node.children.forEach(child => processNode(child, depth + 1));
        }
      }
    };
    
    wbsNodes.forEach(node => processNode(node, 0));
    return rows;
  }, [expandedNodes, activities, wbsNodes]);

  // Calculate WBS node date range (roll-up from all child activities)
  const getWBSNodeDateRange = (node: WBSNode): { startDate: Date; endDate: Date } | null => {
    const allActivities: Activity[] = [];
    
    const collectActivities = (n: WBSNode) => {
      // Add activities belonging to this node
      const nodeActivities = activities.filter(a => a.wbsNodeId === n.id);
      allActivities.push(...nodeActivities);
      
      // Recursively collect from children
      if (n.children && n.children.length > 0) {
        n.children.forEach(collectActivities);
      }
    };
    
    collectActivities(node);
    
    const validActivities = allActivities.filter(a => a.plannedStartDate && a.plannedEndDate);
    if (validActivities.length === 0) return null;
    
    const dates = validActivities.flatMap(a => [
      new Date(a.plannedStartDate!),
      new Date(a.plannedEndDate!)
    ]);
    
    return {
      startDate: new Date(Math.min(...dates.map(d => d.getTime()))),
      endDate: new Date(Math.max(...dates.map(d => d.getTime()))),
    };
  };

  // Calculate Gantt date range
  const { startDate, ganttColumns, columnWidth } = useMemo(() => {
    if (activities.length === 0) {
      // Default range if no activities
      const now = new Date();
      return {
        startDate: now,
        ganttColumns: [now],
        columnWidth: 60,
      };
    }
    
    const dates = activities
      .filter(a => a.plannedStartDate && a.plannedEndDate)
      .flatMap(a => [new Date(a.plannedStartDate!), new Date(a.plannedEndDate!)]);
    
    if (dates.length === 0) {
      const now = new Date();
      return {
        startDate: now,
        ganttColumns: [now],
        columnWidth: 60,
      };
    }
    
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    const start = addDays(minDate, -7);
    const end = addDays(maxDate, 14);
    
    const width = viewMode === 'day' ? 40 : viewMode === 'week' ? 60 : 120;
    
    // Generate columns
    let cols: Date[] = [];
    if (viewMode === 'week') {
      let current = start;
      while (current <= end) {
        cols.push(current);
        current = addDays(current, 7);
      }
    }
    
    return {
      startDate: start,
      ganttColumns: cols,
      columnWidth: width,
    };
  }, [viewMode, activities]);

  const totalWidth = ganttColumns.length * columnWidth;

  // Calculate task position in Gantt
  const getTaskPosition = (activity: Activity) => {
    if (!activity.plannedStartDate || !activity.plannedEndDate) return null;
    
    const taskStart = new Date(activity.plannedStartDate);
    const taskEnd = new Date(activity.plannedEndDate);
    
    const daysSinceStart = Math.floor((taskStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const taskDuration = Math.max(1, Math.floor((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)));
    
    const x = Math.floor(daysSinceStart / 7) * columnWidth;
    const width = Math.max(1, Math.ceil(taskDuration / 7)) * columnWidth;
    
    return { x, width };
  };

  // Calculate WBS summary bar position
  const getWBSPosition = (node: WBSNode) => {
    const dateRange = getWBSNodeDateRange(node);
    if (!dateRange) return null;
    
    const daysSinceStart = Math.floor((dateRange.startDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.max(1, Math.floor((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    const x = Math.floor(daysSinceStart / 7) * columnWidth;
    const width = Math.max(1, Math.ceil(duration / 7)) * columnWidth;
    
    return { x, width, dateRange };
  };

  // Calculate progress for WBS node
  const getWBSProgress = (node: WBSNode): number => {
    const allActivities: Activity[] = [];
    
    const collectActivities = (n: WBSNode) => {
      // Add activities belonging to this node
      const nodeActivities = activities.filter(a => a.wbsNodeId === n.id);
      allActivities.push(...nodeActivities);
      
      // Recursively collect from children
      if (n.children && n.children.length > 0) {
        n.children.forEach(collectActivities);
      }
    };
    
    collectActivities(node);
    
    if (allActivities.length === 0) return 0;
    
    const totalProgress = allActivities.reduce((sum, a) => sum + a.percentComplete, 0);
    return Math.round(totalProgress / allActivities.length);
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

  // Drag handlers
  const handleTaskMouseDown = (e: React.MouseEvent, activityId: string, mode: 'move' | 'resize-start' | 'resize-end') => {
    e.stopPropagation();
    e.preventDefault();
    
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;
    
    console.log(`🖱️ MouseDown: ${mode} on ${activity.name}`);
    
    setDraggingTask(activityId);
    setDragMode(mode);
    setDragStartX(e.clientX);
    
    // Set initial drag info
    setDragInfo({
      startDate: format(new Date(activity.plannedStartDate!), 'dd/MM/yyyy', { locale: vi }),
      endDate: format(new Date(activity.plannedEndDate!), 'dd/MM/yyyy', { locale: vi }),
      days: activity.durationDays,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingTask || !dragMode || !svgRef.current) return;
    
    const deltaX = e.clientX - dragStartX;
    const daysDelta = Math.round((deltaX / columnWidth) * 7); // Convert pixels to days
    
    const activity = activities.find(a => a.id === draggingTask);
    if (!activity) return;
    
    let newStartDate = new Date(activity.plannedStartDate!);
    let newEndDate = new Date(activity.plannedEndDate!);
    
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
    
    console.log(`Drag ${dragMode}: ${draggingTask}, deltaX: ${deltaX}px, days: ${daysDelta}`);
  };

  const handleMouseUp = async () => {
    if (draggingTask && dragMode && dragInfo && dragInfo.newStartDate && dragInfo.newEndDate) {
      console.log('✅ Drag completed for', draggingTask);
      
      const newDuration = Math.max(1, Math.ceil((dragInfo.newEndDate.getTime() - dragInfo.newStartDate.getTime()) / (1000 * 60 * 60 * 24)));
      
      const updatedActivities: Activity[] = [];
      
      // Update activity and cascade to successors
      setActivities(prev => {
        const updated = [...prev];
        
        // Update dragged activity
        const draggedIndex = updated.findIndex(a => a.id === draggingTask);
        if (draggedIndex === -1) return prev;
        
        updated[draggedIndex] = {
          ...updated[draggedIndex],
          plannedStartDate: dragInfo.newStartDate!.toISOString(),
          plannedEndDate: dragInfo.newEndDate!.toISOString(),
          durationDays: newDuration,
        };
        
        updatedActivities.push(updated[draggedIndex]);
        
        // Cascade update to successors
        const cascadeSuccessors = (activityId: string, visited = new Set<string>()) => {
          if (visited.has(activityId)) return; // Prevent circular dependencies
          visited.add(activityId);
          
          // Find all activities that depend on this one
          updated.forEach((successor, idx) => {
            if (!successor.predecessors) return;
            
            successor.predecessors.forEach((dep) => {
              if (dep.activityId === activityId) {
                const predecessor = updated.find(a => a.id === activityId);
                if (!predecessor) return;
                
                const predStart = new Date(predecessor.plannedStartDate!);
                const predEnd = new Date(predecessor.plannedEndDate!);
                const succStart = new Date(successor.plannedStartDate!);
                const succDuration = successor.durationDays;
                
                let newSuccStart: Date;
                
                switch (dep.type) {
                  case 'FS': // Finish-to-Start
                    newSuccStart = addDays(predEnd, dep.lagDays);
                    break;
                  case 'SS': // Start-to-Start
                    newSuccStart = addDays(predStart, dep.lagDays);
                    break;
                  case 'FF': // Finish-to-Finish
                    newSuccStart = addDays(predEnd, dep.lagDays - succDuration);
                    break;
                  case 'SF': // Start-to-Finish
                    newSuccStart = addDays(predStart, dep.lagDays - succDuration);
                    break;
                  default:
                    return;
                }
                
                // Only update if the constraint pushes the date later (don't pull back)
                if (newSuccStart > succStart) {
                  const newSuccEnd = addDays(newSuccStart, succDuration);
                  
                  updated[idx] = {
                    ...successor,
                    plannedStartDate: newSuccStart.toISOString(),
                    plannedEndDate: newSuccEnd.toISOString(),
                  };
                  
                  updatedActivities.push(updated[idx]);
                  
                  console.log(`🔗 Cascaded: ${successor.code} → ${format(newSuccStart, 'dd/MM/yyyy', { locale: vi })}`);
                  
                  // Recursively cascade
                  cascadeSuccessors(successor.id, visited);
                }
              }
            });
          });
        };
        
        cascadeSuccessors(draggingTask);
        
        return updated;
      });
      
      // Save all updated activities to backend
      try {
        if (!currentProjectId) return;
        
        await Promise.all(
          updatedActivities.map(activity =>
            activityApi.update(currentProjectId, activity.id, {
              plannedStartDate: activity.plannedStartDate,
              plannedEndDate: activity.plannedEndDate,
              durationDays: activity.durationDays,
            })
          )
        );
        console.log('✅ Saved drag changes to backend:', updatedActivities.length, 'activities');
      } catch (error) {
        console.error('❌ Failed to save drag changes:', error);
        // TODO: Show error toast and revert changes
      }
    }
    
    setDraggingTask(null);
    setDragMode(null);
    setDragInfo(null);
  };

  // Handle create WBS node
  const handleCreateWBSNode = async (nodeData: Partial<WBSNode>) => {
    if (!currentProjectId) return;
    
    try {
      // Generate unique ID for new node
      const newNode: WBSNode = {
        ...nodeData,
        id: `node-${Date.now()}`,
        children: [],
        level: nodeData.level || 1,
        name: nodeData.name || '',
        deliverables: nodeData.deliverables || [],
        assumptions: nodeData.assumptions || [],
        constraints: nodeData.constraints || [],
        isWorkPackage: nodeData.isWorkPackage || false,
      };
      
      // Update tree structure
      let updatedTree: WBSNode[];
      if (parentNodeForCreate) {
        // Add as child of parent node
        updatedTree = addNodeToTree(wbsNodes, parentNodeForCreate.id, newNode);
      } else {
        // Add as root level node
        updatedTree = [...wbsNodes, newNode];
      }
      
      setWbsNodes(updatedTree);
      
      // Save to backend
      if (wbsId) {
        await wbsApi.update(wbsId, { tree: updatedTree });
      } else {
        const newWBS = await wbsApi.create({ projectId: currentProjectId, tree: updatedTree });
        setWbsId(newWBS.id);
      }
      
      console.log('✅ Created WBS node:', newNode.code);
    } catch (error) {
      console.error('❌ Failed to create WBS node:', error);
      throw error;
    }
  };
  
  // Handle update WBS node
  const handleUpdateWBSNode = async (nodeData: Partial<WBSNode>) => {
    if (!currentProjectId || !editingWBSNode || !wbsId) return;
    
    try {
      // Update node in tree
      const updatedTree = updateNodeInTree(wbsNodes, editingWBSNode.id, nodeData);
      setWbsNodes(updatedTree);
      
      // Save to backend
      await wbsApi.update(wbsId, { tree: updatedTree });
      
      console.log('✅ Updated WBS node:', editingWBSNode.code);
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

  // Handle dependencies save
  const handleSaveDependencies = async (activityId: string, dependencies: ActivityDependency[]) => {
    if (!currentProjectId) return;
    
    try {
      const activity = activities.find(a => a.id === activityId);
      if (!activity) return;
      
      // Get current predecessors
      const currentPredecessors = activity.predecessors || [];
      
      // Find dependencies to add and remove
      const toAdd = dependencies.filter(
        newDep => !currentPredecessors.some(curr => curr.activityId === newDep.activityId)
      );
      const toRemove = currentPredecessors.filter(
        currDep => !dependencies.some(newDep => newDep.activityId === currDep.activityId)
      );
      const toUpdate = dependencies.filter(newDep => {
        const curr = currentPredecessors.find(c => c.activityId === newDep.activityId);
        return curr && (curr.type !== newDep.type || curr.lagDays !== newDep.lagDays);
      });
      
      // Update local state immediately for UI responsiveness
      setActivities(prev => prev.map(a =>
        a.id === activityId ? { ...a, predecessors: dependencies } : a
      ));
      
      // Sync with backend
      await Promise.all([
        ...toRemove.map(dep =>
          activityApi.removeDependency(currentProjectId, activityId, dep.activityId)
        ),
        ...toAdd.map(dep =>
          activityApi.addDependency(currentProjectId, activityId, {
            predecessorId: dep.activityId,
            type: dep.type,
            lagDays: dep.lagDays,
          })
        ),
        // For updates, remove and re-add
        ...toUpdate.map(async (dep) => {
          await activityApi.removeDependency(currentProjectId, activityId, dep.activityId);
          await activityApi.addDependency(currentProjectId, activityId, {
            predecessorId: dep.activityId,
            type: dep.type,
            lagDays: dep.lagDays,
          });
        }),
      ]);
      
      console.log('✅ Updated predecessors for', activityId, dependencies);
    } catch (error) {
      console.error('❌ Failed to save dependencies:', error);
      // TODO: Show error toast and revert changes
    }
  };

  const renderRow = (row: RowItem) => {
    const treeColumn = columns.find(c => c.id === 'tree');
    const progressColumn = columns.find(c => c.id === 'progress');
    const dependenciesColumn = columns.find(c => c.id === 'dependencies');
    const datesColumn = columns.find(c => c.id === 'dates');
    
    if (row.type === 'wbs') {
      const { node, depth } = row;
      const isExpanded = expandedNodes.has(node.id);
      const hasChildren = node.children && node.children.length > 0;
      const hasActivities = activities.some(a => a.wbsNodeId === node.id);

      return (
        <div
          key={`wbs-${node.id}`}
          className="flex border-b hover:bg-gray-50"
          style={{ height: ROW_HEIGHT }}
        >
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
                {hasChildren || hasActivities ? (
                  isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )
                ) : (
                  <span className="w-4" />
                )}
              </button>
              
              <FolderTree className="w-4 h-4 text-blue-600 flex-shrink-0" />
              
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
                    setEditingWBSNode(node);
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
                    setCreatingWBSNode(true);
                  }}
                  title="Thêm WBS node con"
                  className="h-7 px-2"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  WBS
                </Button>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setWbsNodeForActivity(node);
                    setCreatingActivity(true);
                  }}
                  title="Thêm Activity"
                  className="h-7 px-2"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Act
                </Button>
              </div>
            </div>
          )}
          
          {/* Progress Column */}
          {progressColumn?.visible && (
            <div className="flex items-center justify-center py-2 px-4 border-r" style={{ width: progressColumn.width }}>
              <span className="text-sm text-gray-400">-</span>
            </div>
          )}
          
          {/* Dependencies Column */}
          {dependenciesColumn?.visible && (
            <div className="flex items-center justify-center py-2 px-4 border-r" style={{ width: dependenciesColumn.width }}>
              <span className="text-sm text-gray-400">-</span>
            </div>
          )}
          
          {/* Dates Column */}
          {datesColumn?.visible && (
            <div className="flex flex-col justify-center py-2 px-2 border-r" style={{ width: datesColumn.width }}>
              {(() => {
                const dateRange = getWBSNodeDateRange(node);
                if (!dateRange) return <span className="text-xs text-gray-400">No dates</span>;
                
                return (
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <span className="text-gray-500">Start:</span>
                      <span className="font-semibold">{format(dateRange.startDate, 'dd/MM/yyyy', { locale: vi })}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <span className="text-gray-500">End:</span>
                      <span className="font-semibold">{format(dateRange.endDate, 'dd/MM/yyyy', { locale: vi })}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      );
    } else {
      const { activity, depth } = row;
      const startDate = activity.plannedStartDate ? new Date(activity.plannedStartDate) : null;
      const endDate = activity.plannedEndDate ? new Date(activity.plannedEndDate) : null;
      const isEditingThis = editingProgress === activity.id;

      return (
        <div
          key={`activity-${activity.id}`}
          className="flex border-b hover:bg-blue-50 bg-gray-50/50"
          style={{ height: ROW_HEIGHT }}
        >
          {/* Tree Column */}
          {treeColumn?.visible && (
            <div
              className="flex items-center gap-2 py-2 px-4 border-r group"
              style={{ 
                width: treeColumn.width,
                paddingLeft: `${depth * 24 + 16}px`,
              }}
            >
              <span className="w-5 flex-shrink-0" />
              <ListChecks className="w-4 h-4 text-green-600 flex-shrink-0" />
              
              <div className="flex items-baseline gap-2 flex-1 min-w-0">
                <span className="font-mono text-xs text-green-600 font-semibold flex-shrink-0 bg-green-50 px-2 py-0.5 rounded">
                  {activity.code}
                </span>
                <span className="text-sm truncate text-gray-700">{activity.name}</span>
              </div>
              
              {/* Edit button - show on hover */}
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingActivity(activity);
                }}
                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Chỉnh sửa Activity"
              >
                <Edit2 className="w-3 h-3" />
              </Button>
            </div>
          )}
          
          {/* Progress Column */}
          {progressColumn?.visible && (
            <div className="flex items-center justify-center py-2 px-2 border-r" style={{ width: progressColumn.width }}>
              {isEditingThis ? (
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={progressValue}
                    onChange={(e) => setProgressValue(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        const newProgress = Math.max(0, Math.min(100, parseInt(progressValue) || 0));
                        setActivities(prev => prev.map(a =>
                          a.id === activity.id ? { ...a, percentComplete: newProgress } : a
                        ));
                        setEditingProgress(null);
                        console.log('✅ Updated progress:', activity.id, newProgress + '%');
                        
                        if (currentProjectId) {
                          try {
                            await activityApi.update(currentProjectId, activity.id, { percentComplete: newProgress });
                          } catch (error) {
                            console.error('❌ Failed to save progress:', error);
                          }
                        }
                      } else if (e.key === 'Escape') {
                        setEditingProgress(null);
                      }
                    }}
                    className="w-12 h-7 text-xs px-1"
                    autoFocus
                  />
                  <span className="text-xs text-gray-500">%</span>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setEditingProgress(activity.id);
                    setProgressValue(activity.percentComplete.toString());
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                >
                  <span className="text-sm font-semibold text-blue-600">
                    {activity.percentComplete}%
                  </span>
                  <Edit2 className="w-3 h-3 text-gray-400" />
                </button>
              )}
            </div>
          )}
          
          {/* Dependencies Column */}
          {dependenciesColumn?.visible && (
            <div className="flex items-center justify-center py-2 px-2 border-r" style={{ width: dependenciesColumn.width }}>
              <button
                onClick={() => setEditingDependencies(activity)}
                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-indigo-100 transition-colors"
                title="Quản lý Dependencies"
              >
                <Link className="w-3 h-3 text-indigo-600" />
                <span className="text-xs text-indigo-600 font-semibold">
                  {activity.predecessors?.length || 0}
                </span>
              </button>
            </div>
          )}
          
          {/* Dates Column */}
          {datesColumn?.visible && (
            <div className="flex flex-col justify-center py-2 px-2 border-r" style={{ width: datesColumn.width }}>
              {startDate && endDate ? (
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <span className="text-gray-500">Start:</span>
                    <span className="font-semibold">{format(startDate, 'dd/MM/yyyy', { locale: vi })}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <span className="text-gray-500">End:</span>
                    <span className="font-semibold">{format(endDate, 'dd/MM/yyyy', { locale: vi })}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    ({activity.durationDays} days)
                  </div>
                </div>
              ) : (
                <span className="text-xs text-gray-400">No dates</span>
              )}
            </div>
          )}
        </div>
      );
    }
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
    <div className="w-full px-6 py-6 space-y-6">
      {/* Create WBS Node Dialog */}
      <CreateWBSNodeDialog
        open={creatingWBSNode}
        onOpenChange={(open) => {
          setCreatingWBSNode(open);
          if (!open) setParentNodeForCreate(null);
        }}
        parentNode={parentNodeForCreate}
        allNodes={wbsNodes}
        onSave={handleCreateWBSNode}
      />
      
      {/* Edit WBS Node Dialog */}
      {editingWBSNode && (
        <EditWBSNodeDialog
          open={!!editingWBSNode}
          onOpenChange={(open) => !open && setEditingWBSNode(null)}
          node={editingWBSNode}
          onSave={handleUpdateWBSNode}
        />
      )}
      
      {/* Create Activity Dialog */}
      {currentProjectId && (
        <CreateActivityDialog
          projectId={currentProjectId}
          open={creatingActivity}
          onOpenChange={(open) => {
            setCreatingActivity(open);
            if (!open) setWbsNodeForActivity(null);
          }}
          wbsNodeId={wbsNodeForActivity?.id}
          wbsNodeName={wbsNodeForActivity ? `${wbsNodeForActivity.code} - ${wbsNodeForActivity.name}` : undefined}
        />
      )}
      
      {/* Edit Activity Dialog */}
      {currentProjectId && editingActivity && (
        <UpdateActivityDialog
          projectId={currentProjectId}
          activity={editingActivity}
          open={!!editingActivity}
          onOpenChange={(open) => {
            if (!open) setEditingActivity(null);
          }}
        />
      )}
      
      {/* Dependencies Edit Dialog */}
      {editingDependencies && (
        <EditDependenciesDialog
          open={!!editingDependencies}
          onOpenChange={(open) => !open && setEditingDependencies(null)}
          activity={editingDependencies}
          allActivities={activities}
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
                <Calendar className="w-4 h-4 text-blue-600" />
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">WBS & Lịch trình</h1>
          <p className="text-muted-foreground mt-2">
            Cấu trúc phân rã công việc với Gantt chart tích hợp - {activities.length} hoạt động
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setParentNodeForCreate(null);
              setCreatingWBSNode(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm WBS Node
          </Button>
        </div>
      </div>

      {/* Split View: WBS Tree + Gantt Chart */}
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
                if (row.type === 'wbs') {
                  // Show summary bar for collapsed WBS nodes
                  const isExpanded = expandedNodes.has(row.node.id);
                  const hasChildren = row.node.children && row.node.children.length > 0;
                  const hasActivities = activities.some(a => a.wbsNodeId === row.node.id);
                  if (!isExpanded && (hasActivities || hasChildren)) {
                    const position = getWBSPosition(row.node);
                    if (!position) return null;
                    
                    const progress = getWBSProgress(row.node);
                    const tooltipContent = (
                      <div className="text-xs">
                        <div className="font-semibold mb-1">{row.node.name}</div>
                        <div className="text-gray-400">
                          {format(position.dateRange.startDate, 'dd/MM/yyyy', { locale: vi })} → {' '}
                          {format(position.dateRange.endDate, 'dd/MM/yyyy', { locale: vi })}
                        </div>
                        <div className="mt-1">Tiến độ: {progress}%</div>
                      </div>
                    );
                    
                    return (
                      <WBSSummaryBar
                        key={`wbs-${row.node.id}`}
                        x={position.x}
                        y={index * ROW_HEIGHT + (ROW_HEIGHT - TASK_BAR_HEIGHT) / 2}
                        width={position.width}
                        height={TASK_BAR_HEIGHT}
                        label={`${progress}%`}
                        progress={progress}
                        tooltipContent={tooltipContent}
                        onMouseEnter={() => setHoveredTask(`wbs-${row.node.id}`)}
                        onMouseLeave={() => setHoveredTask(null)}
                        onClick={() => toggleNode(row.node.id)}
                      />
                    );
                  }
                  return null;
                }
                
                // Activity task bar with drag handles
                const position = getTaskPosition(row.activity);
                if (!position) return null;

                const isDragging = draggingTask === row.activity.id;
                const isHovered = hoveredTask === row.activity.id;
                const taskY = index * ROW_HEIGHT + (ROW_HEIGHT - TASK_BAR_HEIGHT) / 2;
                
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
                  <g key={row.activity.id}>
                    {/* Main task bar */}
                    <GanttTask
                      activity={row.activity}
                      x={displayX}
                      y={taskY}
                      width={displayWidth}
                      height={TASK_BAR_HEIGHT}
                      isHovered={isHovered || isDragging}
                      onMouseEnter={() => setHoveredTask(row.activity.id)}
                      onMouseLeave={() => setHoveredTask(null)}
                      onClick={() => console.log('Click task', row.activity.id)}
                    />
                    
                    {/* Dashed outline when dragging */}
                    {isDragging && (
                      <rect
                        x={displayX - 2}
                        y={taskY - 2}
                        width={displayWidth + 4}
                        height={TASK_BAR_HEIGHT + 4}
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
                      height={TASK_BAR_HEIGHT - 4}
                      fill={(isHovered || isDragging) ? "#3b82f6" : "transparent"}
                      stroke={(isHovered || isDragging) ? "#fff" : "none"}
                      strokeWidth={1}
                      cursor="ew-resize"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleTaskMouseDown(e, row.activity.id, 'resize-start');
                      }}
                      onMouseEnter={() => setHoveredTask(row.activity.id)}
                    />
                    
                    {/* Right resize handle - always visible on hover */}
                    <rect
                      x={displayX + displayWidth - 4}
                      y={taskY + 2}
                      width={8}
                      height={TASK_BAR_HEIGHT - 4}
                      fill={(isHovered || isDragging) ? "#3b82f6" : "transparent"}
                      stroke={(isHovered || isDragging) ? "#fff" : "none"}
                      strokeWidth={1}
                      cursor="ew-resize"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleTaskMouseDown(e, row.activity.id, 'resize-end');
                      }}
                      onMouseEnter={() => setHoveredTask(row.activity.id)}
                    />
                    
                    {/* Center drag area for moving - higher z-index */}
                    <rect
                      x={displayX + 8}
                      y={taskY}
                      width={Math.max(0, displayWidth - 16)}
                      height={TASK_BAR_HEIGHT}
                      fill="transparent"
                      cursor={isDragging ? 'grabbing' : 'grab'}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleTaskMouseDown(e, row.activity.id, 'move');
                      }}
                      onMouseEnter={() => setHoveredTask(row.activity.id)}
                      onMouseLeave={() => {
                        if (!isDragging) setHoveredTask(null);
                      }}
                    />
                  </g>
                );
              })}
              
              {/* Dependency Arrows */}
              <GanttDependencyArrows
                activities={activities}
                getTaskPosition={(activity) => {
                  const position = getTaskPosition(activity);
                  if (!position) return null;
                  
                  const rowIndex = visibleRows.findIndex(
                    r => r.type === 'activity' && r.activity.id === activity.id
                  );
                  if (rowIndex === -1) return null;
                  
                  return {
                    ...position,
                    y: rowIndex * ROW_HEIGHT + (ROW_HEIGHT - TASK_BAR_HEIGHT) / 2,
                  };
                }}
                rowHeight={ROW_HEIGHT}
                taskBarHeight={TASK_BAR_HEIGHT}
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

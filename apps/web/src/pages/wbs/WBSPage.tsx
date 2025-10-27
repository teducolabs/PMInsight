import { useState, useMemo, useRef } from 'react';
import { useProject } from '@/lib/context/ProjectContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, ChevronRight, ChevronDown, FolderTree, ListChecks, Calendar, TrendingUp } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { Activity } from '@/types/activity';
import { GanttHeader } from '@/components/schedule/GanttHeader';
import { GanttGrid } from '@/components/schedule/GanttGrid';
import { GanttTask } from '@/components/schedule/GanttTask';
import { GanttTimeline } from '@/components/schedule/GanttTimeline';
import { WBSSummaryBar } from '@/components/schedule/WBSSummaryBar';
import { generateMockActivities } from './mockWBSData';

interface WBSNode {
  id: string;
  code: string;
  name: string;
  level: number;
  parentId?: string;
  children?: WBSNode[];
  activityIds?: string[]; // IDs of activities belonging to this node
}

type ViewMode = 'day' | 'week' | 'month';

const ROW_HEIGHT = 50;
const TASK_BAR_HEIGHT = 32;
const SIDEBAR_WIDTH = 400;

export function WBSPage() {
  const { currentProjectId } = useProject();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['1', '1.1', '1.2', '1.2.1', '1.2.2', '1.2.3', '1.3', '1.3.1', '1.3.2', '1.3.3', '1.4', '1.5']));
  const [viewMode] = useState<ViewMode>('week');
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [draggingTask, setDraggingTask] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [dragMode, setDragMode] = useState<'move' | 'resize-start' | 'resize-end' | null>(null);
  const [dragInfo, setDragInfo] = useState<{ startDate: string; endDate: string; days: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Mock Project Info
  const projectInfo = {
    name: 'Dự án Website PMInsight - Hệ thống quản lý dự án',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-03-31'),
    currentPhase: 'Phân tích & Thiết kế',
    progress: 35,
  };
  
  // Mock WBS Structure - More comprehensive data
  const wbsNodes: WBSNode[] = [
    {
      id: '1',
      code: '1.0',
      name: 'Dự án Website PMInsight',
      level: 1,
      children: [
        {
          id: '1.1',
          code: '1.1',
          name: 'Khởi động Dự án',
          level: 2,
          parentId: '1',
          activityIds: ['a1', 'a2', 'a3'],
        },
        {
          id: '1.2',
          code: '1.2',
          name: 'Phân tích & Thiết kế',
          level: 2,
          parentId: '1',
          children: [
            {
              id: '1.2.1',
              code: '1.2.1',
              name: 'Phân tích nghiệp vụ',
              level: 3,
              parentId: '1.2',
              activityIds: ['a4', 'a5', 'a6'],
            },
            {
              id: '1.2.2',
              code: '1.2.2',
              name: 'Thiết kế hệ thống',
              level: 3,
              parentId: '1.2',
              activityIds: ['a7', 'a8', 'a9'],
            },
            {
              id: '1.2.3',
              code: '1.2.3',
              name: 'Thiết kế giao diện',
              level: 3,
              parentId: '1.2',
              activityIds: ['a10', 'a11'],
            },
          ],
        },
        {
          id: '1.3',
          code: '1.3',
          name: 'Phát triển',
          level: 2,
          parentId: '1',
          children: [
            {
              id: '1.3.1',
              code: '1.3.1',
              name: 'Frontend Development',
              level: 3,
              parentId: '1.3',
              activityIds: ['a12', 'a13', 'a14', 'a15'],
            },
            {
              id: '1.3.2',
              code: '1.3.2',
              name: 'Backend Development',
              level: 3,
              parentId: '1.3',
              activityIds: ['a16', 'a17', 'a18', 'a19'],
            },
            {
              id: '1.3.3',
              code: '1.3.3',
              name: 'Database Implementation',
              level: 3,
              parentId: '1.3',
              activityIds: ['a20', 'a21'],
            },
          ],
        },
        {
          id: '1.4',
          code: '1.4',
          name: 'Testing & QA',
          level: 2,
          parentId: '1',
          activityIds: ['a22', 'a23', 'a24', 'a25'],
        },
        {
          id: '1.5',
          code: '1.5',
          name: 'Triển khai & Bàn giao',
          level: 2,
          parentId: '1',
          activityIds: ['a26', 'a27', 'a28'],
        },
      ],
    },
  ];

  // Mock Activities with dates
  const mockActivities = useMemo(() => generateMockActivities(currentProjectId!), [currentProjectId]);

  // Redirect to projects if no project selected
  if (!currentProjectId) {
    return <Navigate to="/projects" replace />;
  }

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
        // Add activities of this node
        if (node.activityIds) {
          node.activityIds.forEach(actId => {
            const activity = mockActivities.find(a => a.id === actId);
            if (activity) {
              rows.push({ type: 'activity', activity, depth: depth + 1 });
            }
          });
        }
        
        // Add child nodes
        if (node.children) {
          node.children.forEach(child => processNode(child, depth + 1));
        }
      }
    };
    
    wbsNodes.forEach(node => processNode(node, 0));
    return rows;
  }, [expandedNodes, mockActivities, wbsNodes]);

  // Calculate WBS node date range (roll-up from all child activities)
  const getWBSNodeDateRange = (node: WBSNode): { startDate: Date; endDate: Date } | null => {
    const allActivityIds: string[] = [];
    
    const collectActivityIds = (n: WBSNode) => {
      if (n.activityIds) {
        allActivityIds.push(...n.activityIds);
      }
      if (n.children) {
        n.children.forEach(collectActivityIds);
      }
    };
    
    collectActivityIds(node);
    
    if (allActivityIds.length === 0) return null;
    
    const activities = allActivityIds
      .map(id => mockActivities.find(a => a.id === id))
      .filter((a): a is Activity => a !== undefined && !!a.plannedStartDate && !!a.plannedEndDate);
    
    if (activities.length === 0) return null;
    
    const dates = activities.flatMap(a => [
      new Date(a.plannedStartDate!),
      new Date(a.plannedEndDate!)
    ]);
    
    return {
      startDate: new Date(Math.min(...dates.map(d => d.getTime()))),
      endDate: new Date(Math.max(...dates.map(d => d.getTime()))),
    };
  };

  // Calculate Gantt date range
  const { startDate, columns, columnWidth } = useMemo(() => {
    const dates = mockActivities
      .flatMap(a => [new Date(a.plannedStartDate!), new Date(a.plannedEndDate!)]);
    
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
      endDate: end,
      columns: cols,
      columnWidth: width,
    };
  }, [viewMode]);

  const totalWidth = columns.length * columnWidth;

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
    const allActivityIds: string[] = [];
    
    const collectActivityIds = (n: WBSNode) => {
      if (n.activityIds) {
        allActivityIds.push(...n.activityIds);
      }
      if (n.children) {
        n.children.forEach(collectActivityIds);
      }
    };
    
    collectActivityIds(node);
    
    if (allActivityIds.length === 0) return 0;
    
    const activities = allActivityIds
      .map(id => mockActivities.find(a => a.id === id))
      .filter((a): a is Activity => a !== undefined);
    
    if (activities.length === 0) return 0;
    
    const totalProgress = activities.reduce((sum, a) => sum + a.percentComplete, 0);
    return Math.round(totalProgress / activities.length);
  };

  // Drag handlers
  const handleTaskMouseDown = (e: React.MouseEvent, activityId: string, mode: 'move' | 'resize-start' | 'resize-end') => {
    e.stopPropagation();
    const activity = mockActivities.find(a => a.id === activityId);
    if (!activity) return;
    
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
    
    if (Math.abs(daysDelta) === 0) return;
    
    const activity = mockActivities.find(a => a.id === draggingTask);
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
    });
    
    console.log(`Drag ${dragMode}: ${draggingTask}, days: ${daysDelta}`, dragInfo);
    // TODO: Update activity dates via API
    
    setDragStartX(e.clientX);
  };

  const handleMouseUp = () => {
    if (draggingTask && dragMode) {
      console.log('Drag completed for', draggingTask, dragInfo);
      // TODO: Save changes via API
    }
    setDraggingTask(null);
    setDragMode(null);
    setDragInfo(null);
  };

  const renderRow = (row: RowItem) => {
    if (row.type === 'wbs') {
      const { node, depth } = row;
      const isExpanded = expandedNodes.has(node.id);
      const hasChildren = node.children && node.children.length > 0;
      const hasActivities = node.activityIds && node.activityIds.length > 0;

      return (
        <div
          key={`wbs-${node.id}`}
          className="flex items-center gap-2 py-2 px-4 hover:bg-gray-50 border-b"
          style={{ 
            paddingLeft: `${depth * 24 + 16}px`,
            height: ROW_HEIGHT,
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
          
          <span className="font-mono text-sm text-gray-600 min-w-[60px] flex-shrink-0">
            {node.code}
          </span>
          
          <span className="font-semibold truncate">{node.name}</span>
          
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              console.log('Add activity to', node.id);
            }}
          >
            <Plus className="w-4 h-4 mr-1" />
            Activity
          </Button>
        </div>
      );
    } else {
      const { activity, depth } = row;
      const startDate = activity.plannedStartDate ? new Date(activity.plannedStartDate) : null;
      const endDate = activity.plannedEndDate ? new Date(activity.plannedEndDate) : null;

      return (
        <div
          key={`activity-${activity.id}`}
          className="flex items-center gap-2 py-2 px-4 hover:bg-blue-50 border-b bg-gray-50/50 cursor-pointer"
          style={{ 
            paddingLeft: `${depth * 24 + 16}px`,
            height: ROW_HEIGHT,
          }}
          onClick={() => console.log('Edit activity', activity.id)}
        >
          <span className="w-5 flex-shrink-0" />
          <ListChecks className="w-4 h-4 text-green-600 flex-shrink-0" />
          <span className="font-mono text-sm text-gray-600 min-w-[60px] flex-shrink-0">
            {activity.code}
          </span>
          <span className="text-sm truncate flex-1">{activity.name}</span>
          <span className="text-xs text-gray-400 flex-shrink-0">
            {startDate && endDate && (
              <>
                {format(startDate, 'dd/MM', { locale: vi })} → {format(endDate, 'dd/MM')}
                <span className="ml-1">({activity.durationDays}d)</span>
              </>
            )}
          </span>
        </div>
      );
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Project Info Banner */}
      <div className="rounded-lg border bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
        <div className="flex items-center justify-between">
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
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">WBS & Lịch trình</h1>
          <p className="text-muted-foreground mt-2">
            Cấu trúc phân rã công việc với Gantt chart tích hợp - {mockActivities.length} hoạt động
          </p>
        </div>
        <div className="flex gap-2">
          <Button>
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
        <div className="flex border-b">
          <div className="bg-gray-100 px-4 py-3 font-semibold border-r" style={{ width: SIDEBAR_WIDTH }}>
            Cấu trúc WBS
          </div>
          <div className="flex-1 bg-gray-100">
            <GanttHeader
              columns={columns}
              columnWidth={columnWidth}
              viewMode={viewMode}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex overflow-auto" style={{ maxHeight: 600 }}>
          {/* Left: WBS Tree */}
          <div className="border-r" style={{ width: SIDEBAR_WIDTH, minWidth: SIDEBAR_WIDTH }}>
            {visibleRows.map((row) => renderRow(row))}
          </div>

          {/* Right: Gantt Chart */}
          <div 
            className="flex-1 relative" 
            style={{ minWidth: totalWidth }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Grid */}
            <GanttGrid
              columns={columns}
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
              style={{ cursor: draggingTask ? 'grabbing' : 'default' }}
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
                  if (!isExpanded && (row.node.activityIds || row.node.children)) {
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

                return (
                  <g key={row.activity.id}>
                    <GanttTask
                      activity={row.activity}
                      x={position.x}
                      y={index * ROW_HEIGHT + (ROW_HEIGHT - TASK_BAR_HEIGHT) / 2}
                      width={position.width}
                      height={TASK_BAR_HEIGHT}
                      isHovered={hoveredTask === row.activity.id || isDragging}
                      onMouseEnter={() => setHoveredTask(row.activity.id)}
                      onMouseLeave={() => setHoveredTask(null)}
                      onClick={() => console.log('Click task', row.activity.id)}
                    />
                    
                    {/* Visual indicator when dragging */}
                    {isDragging && (
                      <rect
                        x={position.x}
                        y={index * ROW_HEIGHT + (ROW_HEIGHT - TASK_BAR_HEIGHT) / 2}
                        width={position.width}
                        height={TASK_BAR_HEIGHT}
                        fill="rgba(59, 130, 246, 0.2)"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        strokeDasharray="4 2"
                        pointerEvents="none"
                      />
                    )}
                    
                    {/* Drag handle - left (resize start date) */}
                    {(hoveredTask === row.activity.id || isDragging) && (
                      <>
                        <rect
                          x={position.x - 3}
                          y={index * ROW_HEIGHT + (ROW_HEIGHT - TASK_BAR_HEIGHT) / 2 + 4}
                          width={6}
                          height={TASK_BAR_HEIGHT - 8}
                          fill="#3b82f6"
                          stroke="#fff"
                          strokeWidth={1}
                          cursor="ew-resize"
                          onMouseDown={(e) => handleTaskMouseDown(e, row.activity.id, 'resize-start')}
                        />
                        
                        <rect
                          x={position.x + position.width - 3}
                          y={index * ROW_HEIGHT + (ROW_HEIGHT - TASK_BAR_HEIGHT) / 2 + 4}
                          width={6}
                          height={TASK_BAR_HEIGHT - 8}
                          fill="#3b82f6"
                          stroke="#fff"
                          strokeWidth={1}
                          cursor="ew-resize"
                          onMouseDown={(e) => handleTaskMouseDown(e, row.activity.id, 'resize-end')}
                        />
                      </>
                    )}
                    
                    {/* Invisible drag area for moving */}
                    <rect
                      x={position.x}
                      y={index * ROW_HEIGHT + (ROW_HEIGHT - TASK_BAR_HEIGHT) / 2}
                      width={position.width}
                      height={TASK_BAR_HEIGHT}
                      fill="transparent"
                      cursor={isDragging ? 'grabbing' : 'grab'}
                      onMouseDown={(e) => handleTaskMouseDown(e, row.activity.id, 'move')}
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

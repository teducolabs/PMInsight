// ============================================================================
// WBS & Activity Unified Types (Merged from separate WBS and Activity types)
// ============================================================================

// Node Types
export enum WBSNodeType {
  Summary = 'Summary',     // Summary task (has children)
  Task = 'Task',          // Leaf task (executable work)
  Milestone = 'Milestone', // Zero-duration milestone
}

// Schedule Mode
export enum ScheduleMode {
  Auto = 'Auto',       // Dates automatically rollup from children/dependencies
  Manual = 'Manual',   // User override dates
  Fixed = 'Fixed',     // Fixed date (like milestone)
}

// Task Priority
export enum TaskPriority {
  Low = 1,
  Medium = 2,
  High = 3,
  Critical = 4,
}

// Activity Status
export enum ActivityStatus {
  NotStarted = 'NotStarted',
  InProgress = 'InProgress',
  Completed = 'Completed',
  OnHold = 'OnHold',
  Cancelled = 'Cancelled',
}

// Dependency Types (PMI Standard)
export enum DependencyType {
  FS = 'FS', // Finish-to-Start (most common)
  SS = 'SS', // Start-to-Start
  FF = 'FF', // Finish-to-Finish
  SF = 'SF', // Start-to-Finish (rare)
}

// Schedule Constraint Types (PMI)
export enum ConstraintType {
  ASAP = 'ASAP', // As Soon As Possible (most flexible)
  ALAP = 'ALAP', // As Late As Possible
  SNET = 'SNET', // Start No Earlier Than
  SNLT = 'SNLT', // Start No Later Than
  FNET = 'FNET', // Finish No Earlier Than
  FNLT = 'FNLT', // Finish No Later Than
  MSO = 'MSO',   // Must Start On (rigid)
  MFO = 'MFO',   // Must Finish On (rigid)
}

// Activity Dependency
export interface ActivityDependency {
  nodeId: string;
  nodeName?: string;
  nodeCode?: string;
  type: DependencyType;
  lagDays: number; // Positive = lag (delay), Negative = lead (overlap)
}

// Activity Constraint
export interface ActivityConstraint {
  type: ConstraintType;
  constraintDate?: string;
}

// Activity Baseline
export interface ActivityBaseline {
  startDate: string;
  endDate: string;
  durationDays: number;
  plannedCost: number;
  baselineDate: string;
  baselineVersion?: string;
}

// Unified WBS Node (Summary/Task/Milestone)
export interface WBSNode {
  id: string;
  name: string;
  code?: string;
  description?: string;

  // Node type & hierarchy
  type: WBSNodeType;
  level: number;
  sortOrder: number;
  children: WBSNode[];

  // Schedule
  scheduleMode: ScheduleMode;
  plannedStartDate?: string;
  plannedEndDate?: string;
  durationDays?: number;
  actualStartDate?: string;
  actualEndDate?: string;
  actualDurationDays?: number;
  percentComplete: number;

  // Task-specific (for Task/Milestone)
  status: ActivityStatus;
  predecessors: ActivityDependency[];
  successors: ActivityDependency[];
  assignedUserIds: string[];
  assignedUserNames?: string[];
  estimatedHours: number;
  actualHours: number;
  plannedCost?: number;
  actualCost?: number;
  currency?: string;
  constraint?: ActivityConstraint;
  priority: TaskPriority;

  // CPM (Critical Path Method)
  isCritical: boolean;
  totalFloat: number;
  freeFloat: number;
  earlyStart?: string;
  earlyFinish?: string;
  lateStart?: string;
  lateFinish?: string;
  baseline?: ActivityBaseline;

  // Summary-specific (for Summary)
  deliverables: string[];
  acceptanceCriteria?: string;
  responsibleOrganization?: string;
  responsibleUserId?: string;
  assumptions: string[];
  scopeConstraints: string[];

  // Metadata
  notes?: string;
  tags: string[];
}

// WBS Document
export interface WBS {
  id: string;
  projectId: string;
  organizationId: string;
  tree: WBSNode[];
  version: number;
  baselineRef?: string;
  lockedBy?: string;
  lockedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Request DTOs
export interface CreateWBSNodeRequest {
  name: string;
  code?: string;
  description?: string;
  type: WBSNodeType;
  parentNodeId?: string;

  // Schedule (for Task/Milestone)
  plannedStartDate?: string;
  plannedEndDate?: string;
  durationDays?: number;

  // Resources (for Task)
  assignedUserIds?: string[];
  estimatedHours?: number;
  plannedCost?: number;
}

export interface UpdateWBSNodeRequest {
  code?: string;
  name?: string;
  description?: string;
  type?: WBSNodeType;
  scheduleMode?: ScheduleMode;

  // Schedule
  plannedStartDate?: string;
  plannedEndDate?: string;
  durationDays?: number;
  actualStartDate?: string;
  actualEndDate?: string;
  percentComplete?: number;
  status?: ActivityStatus;

  // Resources
  assignedUserIds?: string[];
  estimatedHours?: number;
  actualHours?: number;
  plannedCost?: number;
  actualCost?: number;
  currency?: string;

  // Dependencies
  predecessors?: ActivityDependency[];

  // Constraint
  constraint?: ActivityConstraint;
  priority?: TaskPriority;

  // Summary-specific
  deliverables?: string[];
  acceptanceCriteria?: string;
  responsibleOrganization?: string;
  assumptions?: string[];
  scopeConstraints?: string[];

  // Notes
  notes?: string;
}

// Flattened node for table/list view
export interface FlatWBSNode extends WBSNode {
  path: string; // e.g., "1.2.3"
  depth: number;
  hasChildren: boolean;
  parentId?: string;
}

// Helper function to flatten tree
export function flattenWBSTree(nodes: WBSNode[], parentPath = '', depth = 0): FlatWBSNode[] {
  const result: FlatWBSNode[] = [];

  if (!nodes || !Array.isArray(nodes)) {
    return result;
  }

  nodes.forEach((node, index) => {
    const path = parentPath ? `${parentPath}.${index + 1}` : `${index + 1}`;
    
    result.push({
      ...node,
      path,
      depth,
      hasChildren: node.children && node.children.length > 0,
      parentId: undefined, // Can be set if needed
    });

    if (node.children && node.children.length > 0) {
      result.push(...flattenWBSTree(node.children, path, depth + 1));
    }
  });

  return result;
}

// Helper function to find node by ID
export function findNodeById(nodes: WBSNode[], id: string): WBSNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children.length > 0) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

// Helper function to calculate rollup dates for summary nodes
export function calculateRollupDates(node: WBSNode): { start?: Date; end?: Date } | null {
  if (node.type !== WBSNodeType.Summary || node.children.length === 0) {
    return null;
  }

  const dates: Date[] = [];

  function collectDates(n: WBSNode) {
    if (n.plannedStartDate) dates.push(new Date(n.plannedStartDate));
    if (n.plannedEndDate) dates.push(new Date(n.plannedEndDate));
    n.children.forEach(collectDates);
  }

  node.children.forEach(collectDates);

  if (dates.length === 0) return null;

  return {
    start: new Date(Math.min(...dates.map(d => d.getTime()))),
    end: new Date(Math.max(...dates.map(d => d.getTime()))),
  };
}

// Helper function to calculate rollup progress
export function calculateRollupProgress(node: WBSNode): number {
  if (node.type !== WBSNodeType.Summary || node.children.length === 0) {
    return node.percentComplete;
  }

  const allTasks: WBSNode[] = [];

  function collectTasks(n: WBSNode) {
    if (n.type === WBSNodeType.Task) {
      allTasks.push(n);
    }
    n.children.forEach(collectTasks);
  }

  node.children.forEach(collectTasks);

  if (allTasks.length === 0) return 0;

  // Weighted by duration
  const totalDuration = allTasks.reduce((sum, t) => sum + (t.durationDays || 0), 0);
  if (totalDuration === 0) return 0;

  const weightedProgress = allTasks.reduce(
    (sum, t) => sum + (t.percentComplete * (t.durationDays || 0)),
    0
  );

  return Math.round(weightedProgress / totalDuration);
}

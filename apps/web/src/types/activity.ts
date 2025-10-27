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
  activityId: string;
  activityName: string;
  activityCode?: string;
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

// Full Activity DTO
export interface Activity {
  id: string;
  projectId: string;
  wbsNodeId?: string;
  name: string;
  code?: string;
  description?: string;

  // Schedule
  plannedStartDate?: string;
  plannedEndDate?: string;
  durationDays: number;
  actualStartDate?: string;
  actualEndDate?: string;
  actualDurationDays?: number;

  // Progress
  percentComplete: number;
  status: ActivityStatus;

  // Dependencies
  predecessors: ActivityDependency[];
  successors: ActivityDependency[];

  // Resources
  assignedUserIds: string[];
  assignedUserNames: string[];
  estimatedHours: number;
  actualHours: number;

  // Cost
  plannedCost?: number;
  actualCost?: number;

  // CPM (Critical Path Method)
  isCritical: boolean;
  totalFloat: number;
  freeFloat: number;
  earlyStart?: string;
  earlyFinish?: string;
  lateStart?: string;
  lateFinish?: string;

  // Constraint
  constraint?: ActivityConstraint;

  // Baseline
  baseline?: ActivityBaseline;

  // Metadata
  notes?: string;
  tags: string[];

  // WBS Info
  wbsNodeName?: string;
  wbsNodeCode?: string;

  // Audit
  createdAt: string;
  updatedAt?: string;
}

// Create Activity DTO
export interface CreateActivityDto {
  name: string;
  code?: string;
  description?: string;
  wbsNodeId?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  durationDays: number;
  status?: ActivityStatus;
  percentComplete?: number;
  assignedUserIds?: string[];
  estimatedHours?: number;
  plannedCost?: number;
  constraintType?: ConstraintType;
  constraintDate?: string;
}

// Update Activity DTO
export interface UpdateActivityDto {
  name?: string;
  code?: string;
  description?: string;
  wbsNodeId?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  durationDays?: number;
  actualStartDate?: string;
  actualEndDate?: string;
  percentComplete?: number;
  status?: ActivityStatus;
  assignedUserIds?: string[];
  estimatedHours?: number;
  actualHours?: number;
  plannedCost?: number;
  actualCost?: number;
  notes?: string;
}

// Add Dependency DTO
export interface AddDependencyDto {
  predecessorId: string;
  type?: DependencyType;
  lagDays?: number;
}

// Activity Filters
export interface ActivityFilters {
  wbsNodeId?: string;
  isCritical?: boolean;
  status?: ActivityStatus;
  assignedUserId?: string;
}

// Activity Stats
export interface ActivityStats {
  total: number;
  notStarted: number;
  inProgress: number;
  completed: number;
  onHold: number;
  cancelled: number;
  criticalCount: number;
  totalPlannedCost: number;
  totalActualCost: number;
  averageProgress: number;
}

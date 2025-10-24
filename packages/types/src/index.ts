import { z } from 'zod';

// ============================================================================
// Common Types & Enums
// ============================================================================

export const ProjectStatus = z.enum([
  'draft',
  'initiating',
  'planning',
  'executing',
  'monitoring',
  'closing',
  'closed',
  'on-hold',
  'cancelled',
]);
export type ProjectStatus = z.infer<typeof ProjectStatus>;

export const UserRole = z.enum([
  'owner',
  'admin',
  'pm',
  'coordinator',
  'team-member',
  'stakeholder',
  'finance',
  'qa',
]);
export type UserRole = z.infer<typeof UserRole>;

export const RiskProbability = z.enum(['very-low', 'low', 'medium', 'high', 'very-high']);
export type RiskProbability = z.infer<typeof RiskProbability>;

export const RiskImpact = z.enum(['very-low', 'low', 'medium', 'high', 'very-high']);
export type RiskImpact = z.infer<typeof RiskImpact>;

export const RiskStrategy = z.enum(['avoid', 'transfer', 'mitigate', 'accept']);
export type RiskStrategy = z.infer<typeof RiskStrategy>;

export const RiskStatus = z.enum(['identified', 'assessed', 'mitigated', 'closed']);
export type RiskStatus = z.infer<typeof RiskStatus>;

export const IssuePriority = z.enum(['low', 'medium', 'high', 'critical']);
export type IssuePriority = z.infer<typeof IssuePriority>;

export const IssueStatus = z.enum(['open', 'in-progress', 'resolved', 'closed']);
export type IssueStatus = z.infer<typeof IssueStatus>;

export const ChangeStatus = z.enum(['submitted', 'under-review', 'approved', 'rejected', 'implemented']);
export type ChangeStatus = z.infer<typeof ChangeStatus>;

export const TimesheetStatus = z.enum(['draft', 'submitted', 'approved', 'rejected']);
export type TimesheetStatus = z.infer<typeof TimesheetStatus>;

// ============================================================================
// Auth DTOs
// ============================================================================

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(200),
  organizationName: z.string().min(1).max(200).optional(),
});
export type RegisterDto = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  twoFactorCode: z.string().length(6).optional(),
});
export type LoginDto = z.infer<typeof LoginSchema>;

export const AuthResponse = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
    roles: z.array(UserRole),
    organizationId: z.string(),
  }),
});
export type AuthResponse = z.infer<typeof AuthResponse>;

// ============================================================================
// Organization DTOs
// ============================================================================

export const OrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Organization = z.infer<typeof OrganizationSchema>;

// ============================================================================
// User DTOs
// ============================================================================

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  phone: z.string().optional(),
  roles: z.array(UserRole),
  organizationId: z.string(),
  status: z.enum(['active', 'inactive', 'suspended']),
  twoFactorEnabled: z.boolean(),
  lastLoginAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type User = z.infer<typeof UserSchema>;

export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(200),
  phone: z.string().optional(),
  roles: z.array(UserRole),
  password: z.string().min(8).max(100),
});
export type CreateUserDto = z.infer<typeof CreateUserSchema>;

// ============================================================================
// Project DTOs
// ============================================================================

export const BaselineSchema = z.object({
  scopeId: z.string().optional(),
  scheduleId: z.string().optional(),
  costId: z.string().optional(),
  version: z.number(),
  createdAt: z.string().datetime(),
  createdBy: z.string(),
});
export type Baseline = z.infer<typeof BaselineSchema>;

export const ProjectSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string().optional(),
  ownerId: z.string(),
  status: ProjectStatus,
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  portfolio: z.string().optional(),
  tags: z.array(z.string()),
  baselines: z.array(BaselineSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().optional(),
});
export type Project = z.infer<typeof ProjectSchema>;

export const CreateProjectSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  ownerId: z.string(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  portfolio: z.string().optional(),
  tags: z.array(z.string()).default([]),
});
export type CreateProjectDto = z.infer<typeof CreateProjectSchema>;

// ============================================================================
// Stakeholder DTOs
// ============================================================================

export const StakeholderSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  projectId: z.string(),
  name: z.string(),
  role: z.string(),
  influence: z.enum(['low', 'medium', 'high']),
  interest: z.enum(['low', 'medium', 'high']),
  engagementPlan: z.string().optional(),
  contacts: z.array(
    z.object({
      type: z.enum(['email', 'phone', 'other']),
      value: z.string(),
    })
  ),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Stakeholder = z.infer<typeof StakeholderSchema>;

export const CreateStakeholderSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1).max(200),
  role: z.string().min(1).max(100),
  influence: z.enum(['low', 'medium', 'high']),
  interest: z.enum(['low', 'medium', 'high']),
  engagementPlan: z.string().optional(),
  contacts: z.array(
    z.object({
      type: z.enum(['email', 'phone', 'other']),
      value: z.string(),
    })
  ).default([]),
});
export type CreateStakeholderDto = z.infer<typeof CreateStakeholderSchema>;

// ============================================================================
// WBS DTOs
// ============================================================================

export const WBSNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string(),
    code: z.string().optional(),
    description: z.string().optional(),
    deliverables: z.array(z.string()).default([]),
    acceptanceCriteria: z.string().optional(),
    children: z.array(WBSNodeSchema).default([]),
  })
);
export type WBSNode = z.infer<typeof WBSNodeSchema>;

export const WBSSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  projectId: z.string(),
  tree: z.array(WBSNodeSchema),
  version: z.number(),
  baselineRef: z.string().optional(),
  lockedBy: z.string().optional(),
  lockedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type WBS = z.infer<typeof WBSSchema>;

// ============================================================================
// Task/Schedule DTOs
// ============================================================================

export const TaskSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  projectId: z.string(),
  wbsId: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  assignees: z.array(z.string()),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  duration: z.number(), // days
  predecessors: z.array(
    z.object({
      taskId: z.string(),
      type: z.enum(['FS', 'SS', 'FF', 'SF']).default('FS'),
      lag: z.number().default(0),
    })
  ),
  progress: z.number().min(0).max(100).default(0),
  critical: z.boolean().default(false),
  baseline: z
    .object({
      startDate: z.string().datetime(),
      endDate: z.string().datetime(),
      duration: z.number(),
    })
    .optional(),
  costPlanned: z.number().optional(),
  costActual: z.number().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Task = z.infer<typeof TaskSchema>;

// ============================================================================
// Risk DTOs
// ============================================================================

export const RiskSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  projectId: z.string(),
  title: z.string(),
  cause: z.string().optional(),
  event: z.string().optional(),
  effect: z.string().optional(),
  probability: RiskProbability,
  impact: RiskImpact,
  score: z.number(),
  ownerId: z.string(),
  strategy: RiskStrategy,
  residualProbability: RiskProbability.optional(),
  residualImpact: RiskImpact.optional(),
  residualScore: z.number().optional(),
  status: RiskStatus,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Risk = z.infer<typeof RiskSchema>;

export const CreateRiskSchema = z.object({
  projectId: z.string(),
  title: z.string().min(1).max(200),
  cause: z.string().optional(),
  event: z.string().optional(),
  effect: z.string().optional(),
  probability: RiskProbability,
  impact: RiskImpact,
  ownerId: z.string(),
  strategy: RiskStrategy,
});
export type CreateRiskDto = z.infer<typeof CreateRiskSchema>;

// ============================================================================
// Issue DTOs
// ============================================================================

export const IssueSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  projectId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  priority: IssuePriority,
  ownerId: z.string(),
  dueDate: z.string().datetime().optional(),
  status: IssueStatus,
  links: z.object({
    changeId: z.string().optional(),
    taskId: z.string().optional(),
  }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Issue = z.infer<typeof IssueSchema>;

// ============================================================================
// Change Request DTOs
// ============================================================================

export const ChangeRequestSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  projectId: z.string(),
  title: z.string(),
  reason: z.string(),
  impact: z.object({
    scope: z.string().optional(),
    schedule: z.string().optional(),
    cost: z.string().optional(),
    quality: z.string().optional(),
    risk: z.string().optional(),
  }),
  decision: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  decidedBy: z.string().optional(),
  decidedAt: z.string().datetime().optional(),
  status: ChangeStatus,
  diffs: z.any().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type ChangeRequest = z.infer<typeof ChangeRequestSchema>;

// ============================================================================
// Budget DTOs
// ============================================================================

export const BudgetCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  planned: z.number(),
  actual: z.number().default(0),
});
export type BudgetCategory = z.infer<typeof BudgetCategorySchema>;

export const BudgetSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  projectId: z.string(),
  categories: z.array(BudgetCategorySchema),
  baseline: z.number(),
  cpi: z.number().optional(),
  spi: z.number().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Budget = z.infer<typeof BudgetSchema>;

// ============================================================================
// Timesheet DTOs
// ============================================================================

export const TimesheetEntrySchema = z.object({
  taskId: z.string(),
  hours: z.number().min(0).max(24),
  note: z.string().optional(),
});
export type TimesheetEntry = z.infer<typeof TimesheetEntrySchema>;

export const TimesheetSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  userId: z.string(),
  projectId: z.string(),
  weekStart: z.string().datetime(),
  entries: z.array(TimesheetEntrySchema),
  status: TimesheetStatus,
  approvedBy: z.string().optional(),
  approvedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Timesheet = z.infer<typeof TimesheetSchema>;

// ============================================================================
// Activity Log DTOs
// ============================================================================

export const ActivitySchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  actorUserId: z.string(),
  type: z.string(),
  action: z.string(),
  resource: z.string(),
  resourceId: z.string(),
  metadata: z.record(z.any()),
  ip: z.string().optional(),
  createdAt: z.string().datetime(),
});
export type Activity = z.infer<typeof ActivitySchema>;

// ============================================================================
// API Response Types
// ============================================================================

export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.any().optional(),
  traceId: z.string().optional(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({
    items: z.array(schema),
    total: z.number(),
    cursor: z.string().optional(),
    hasMore: z.boolean(),
  });

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  cursor?: string;
  hasMore: boolean;
};

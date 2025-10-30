// Resource Assignment Types
export interface ResourceAssignment {
  id: string;
  
  // NEW: Reference to ProjectResource from the resource pool
  projectResourceId?: string | null;
  
  // Optional user link - null for placeholder resources
  userId?: string | null;
  userName?: string;
  userEmail?: string;
  
  // Resource name - from ProjectResource or legacy field
  resourceName: string;
  
  // Role - from ProjectResource
  role?: string;
  
  // Hourly rate - from ProjectResource
  hourlyRate?: number;
  
  // Allocation
  allocationPercent: number; // 0-100
  assignmentStartDate?: string;
  assignmentEndDate?: string;
  
  // Effort
  estimatedHours: number;
  actualHours: number;
  
  // Cost
  plannedCost?: number;
  actualCost?: number;
  currency?: string;
  
  isPrimary: boolean;
  
  // Metadata
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

// Request DTOs
export interface AddResourceAssignmentRequest {
  // NEW: Required - reference to ProjectResource from the pool
  projectResourceId: string;
  
  allocationPercent?: number;
  estimatedHours?: number;
  plannedCost?: number;
  currency?: string;
  isPrimary?: boolean;
  assignmentStartDate?: string;
  assignmentEndDate?: string;
  notes?: string;
}

export interface UpdateResourceAssignmentRequest {
  // Optional: Change the ProjectResource reference
  projectResourceId?: string;
  
  allocationPercent?: number;
  estimatedHours?: number;
  actualHours?: number;
  plannedCost?: number;
  actualCost?: number;
  currency?: string;
  isPrimary?: boolean;
  assignmentStartDate?: string;
  assignmentEndDate?: string;
  notes?: string;
}

// ProjectResource - Resource Pool Types
export interface ProjectResource {
  id: string;
  projectId: string;
  resourceName: string;
  userId?: string | null;
  role?: string | null;
  hourlyRate?: number | null;
  monthlyCapacity?: number | null;
  isActive: boolean;
  
  // Statistics
  assignmentCount?: number;
  totalAllocatedHours?: number;
  utilizationPercent?: number;
  
  // Metadata
  organizationId: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateProjectResourceRequest {
  resourceName: string;
  userId?: string | null;
  role?: string | null;
  hourlyRate?: number | null;
  monthlyCapacity?: number | null;
}

export interface UpdateProjectResourceRequest {
  resourceName?: string;
  userId?: string | null;
  role?: string | null;
  hourlyRate?: number | null;
  monthlyCapacity?: number | null;
  isActive?: boolean;
}

// Mock user for demo
export interface User {
  id: string;
  name: string;
  email: string;
}

// Common roles - for suggestions only, users can enter custom roles
export const COMMON_ROLES = [
  'Developer',
  'Senior Developer',
  'Tech Lead',
  'Tester',
  'QA Engineer',
  'Designer',
  'UI/UX Designer',
  'Project Manager',
  'Business Analyst',
  'DevOps Engineer',
  'Architect',
  'Product Owner',
  'Scrum Master',
] as const;

export type CommonRole = typeof COMMON_ROLES[number];

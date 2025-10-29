// Resource Assignment Types
export interface ResourceAssignment {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  
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
  
  // Role
  role?: string;
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
  userId: string;
  allocationPercent?: number;
  role?: string;
  estimatedHours?: number;
  plannedCost?: number;
  currency?: string;
  isPrimary?: boolean;
  assignmentStartDate?: string;
  assignmentEndDate?: string;
  notes?: string;
}

export interface UpdateResourceAssignmentRequest {
  allocationPercent?: number;
  role?: string;
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

// Mock user for demo
export interface User {
  id: string;
  name: string;
  email: string;
}

// Predefined role options
export const ROLE_OPTIONS = [
  'Developer',
  'Senior Developer',
  'Tech Lead',
  'Tester',
  'QA',
  'Designer',
  'Project Manager',
  'Business Analyst',
  'DevOps',
  'Architect',
] as const;

export type Role = typeof ROLE_OPTIONS[number];

export enum ProjectStatus {
  Initiating = 'Initiating',
  Planning = 'Planning',
  Executing = 'Executing',
  MonitoringControlling = 'MonitoringControlling',
  Closing = 'Closing',
  OnHold = 'OnHold',
  Cancelled = 'Cancelled',
}

export enum ProjectPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical',
}

export interface Project {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate: string;
  endDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  budget?: number;
  currency?: string;
  progress: number; // 0-100
  health: 'Green' | 'Yellow' | 'Red'; // RAG status
  projectManagerId: string;
  projectManagerName?: string;
  sponsorId?: string;
  sponsorName?: string;
  templateId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectDto {
  name: string;
  code: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  startDate: string;
  endDate: string;
  budget?: number;
  currency?: string;
  projectManagerId: string;
  sponsorId?: string;
  templateId?: string;
}

export interface UpdateProjectDto extends Partial<CreateProjectDto> {
  id: string;
  progress?: number;
  health?: 'Green' | 'Yellow' | 'Red';
  actualStartDate?: string;
  actualEndDate?: string;
}

export interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  onHoldProjects: number;
  redProjects: number;
  yellowProjects: number;
  greenProjects: number;
}

export enum EngagementActionStatus {
  NotStarted = 'NotStarted',
  InProgress = 'InProgress',
  Completed = 'Completed',
  Skipped = 'Skipped',
}

export enum EngagementActionPriority {
  Critical = 1,
  High = 2,
  Medium = 3,
  Low = 4,
}

export interface EngagementAction {
  id: string;
  stakeholderId: string;
  title: string;
  description: string;
  quadrant: 'manage-closely' | 'keep-satisfied' | 'keep-informed' | 'monitor';
  priority: EngagementActionPriority;
  status: EngagementActionStatus;
  dueDate?: Date;
  completedDate?: Date;
  assignedTo?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EngagementHistory {
  id: string;
  stakeholderId: string;
  actionId?: string;
  type: 'meeting' | 'email' | 'call' | 'update' | 'feedback' | 'other';
  title: string;
  description: string;
  outcome?: string;
  feedback?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  performedBy: string;
  performedAt: Date;
  nextAction?: string;
  createdAt: Date;
}

// Request DTOs to match backend
export interface CreateEngagementHistoryRequest {
  stakeholderId: string;
  actionId?: string;
  type: string;
  title: string;
  description: string;
  outcome?: string;
  feedback?: string;
  sentiment?: string;
  performedAt: Date;
  nextAction?: string;
}

export interface CreateEngagementActionRequest {
  stakeholderId: string;
  title: string;
  description: string;
  quadrant: string;
  priority: number;
  dueDate?: Date;
  assignedTo?: string;
}

export interface UpdateEngagementActionRequest {
  status?: EngagementActionStatus;
  completedDate?: Date;
  notes?: string;
  dueDate?: Date;
  assignedTo?: string;
}

// Playbook templates theo quadrant
export const PLAYBOOK_TEMPLATES = {
  'manage-closely': [
    {
      priority: EngagementActionPriority.Critical,
      title: 'Họp 1-on-1 hàng tuần',
      description: 'Gặp trực tiếp để cập nhật tiến độ, thu thập feedback và giải quyết concerns',
    },
    {
      priority: EngagementActionPriority.Critical,
      title: 'Gửi báo cáo chi tiết hàng tuần',
      description: 'Dashboard metrics, achievements, risks và action items',
    },
    {
      priority: EngagementActionPriority.High,
      title: 'Mời tham gia các quyết định quan trọng',
      description: 'Steering committee meetings, major milestone reviews',
    },
    {
      priority: EngagementActionPriority.High,
      title: 'Thu thập feedback về chiến lược',
      description: 'Survey hoặc interview về hướng đi của dự án',
    },
  ],
  'keep-satisfied': [
    {
      priority: EngagementActionPriority.High,
      title: 'Cập nhật executive summary hàng tuần',
      description: 'Tóm tắt ngắn gọn về status, achievements, và risks',
    },
    {
      priority: EngagementActionPriority.High,
      title: 'Họp review hàng tháng',
      description: 'Presentation về progress và upcoming milestones',
    },
    {
      priority: EngagementActionPriority.Medium,
      title: 'Xin ý kiến về quyết định quan trọng',
      description: 'Email hoặc meeting khi có major changes',
    },
    {
      priority: EngagementActionPriority.Medium,
      title: 'Gửi success stories và wins',
      description: 'Highlight các achievements để maintain satisfaction',
    },
  ],
  'keep-informed': [
    {
      priority: EngagementActionPriority.Medium,
      title: 'Newsletter hàng tuần',
      description: 'Email update về progress, news, và upcoming events',
    },
    {
      priority: EngagementActionPriority.Medium,
      title: 'Town hall meetings hàng tháng',
      description: 'Presentation chung cho nhóm stakeholders',
    },
    {
      priority: EngagementActionPriority.Low,
      title: 'Q&A sessions',
      description: 'Opportunity để đặt câu hỏi và clarify concerns',
    },
    {
      priority: EngagementActionPriority.Low,
      title: 'Cập nhật portal/dashboard',
      description: 'Self-service access to project information',
    },
  ],
  'monitor': [
    {
      priority: EngagementActionPriority.Low,
      title: 'Quarterly status report',
      description: 'High-level summary gửi qua email',
    },
    {
      priority: EngagementActionPriority.Low,
      title: 'FYI emails cho major milestones',
      description: 'Thông báo khi có achievements lớn',
    },
    {
      priority: EngagementActionPriority.Low,
      title: 'Maintain trong distribution list',
      description: 'Keep in the loop but minimal active engagement',
    },
  ],
};

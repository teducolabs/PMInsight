import type { Activity, ActivityStatus, DependencyType } from '@/types/activity';
import { differenceInDays } from 'date-fns';

/**
 * Get color for activity status
 */
export const getActivityStatusColor = (status: ActivityStatus): string => {
  const colors: Record<ActivityStatus, string> = {
    NotStarted: 'text-gray-600 bg-gray-100',
    InProgress: 'text-blue-600 bg-blue-100',
    Completed: 'text-green-600 bg-green-100',
    OnHold: 'text-yellow-600 bg-yellow-100',
    Cancelled: 'text-red-600 bg-red-100',
  };
  return colors[status] || 'text-gray-600 bg-gray-100';
};

/**
 * Get Vietnamese label for activity status
 */
export const getActivityStatusLabel = (status: ActivityStatus): string => {
  const labels: Record<ActivityStatus, string> = {
    NotStarted: 'Chưa bắt đầu',
    InProgress: 'Đang thực hiện',
    Completed: 'Hoàn thành',
    OnHold: 'Tạm dừng',
    Cancelled: 'Đã hủy',
  };
  return labels[status] || status;
};

/**
 * Get Vietnamese label for dependency type
 */
export const getDependencyTypeLabel = (type: DependencyType): string => {
  const labels: Record<DependencyType, string> = {
    FS: 'Finish-to-Start (FS)',
    SS: 'Start-to-Start (SS)',
    FF: 'Finish-to-Finish (FF)',
    SF: 'Start-to-Finish (SF)',
  };
  return labels[type] || type;
};

/**
 * Get short description for dependency type
 */
export const getDependencyTypeDescription = (type: DependencyType): string => {
  const descriptions: Record<DependencyType, string> = {
    FS: 'Công việc này bắt đầu sau khi công việc trước hoàn thành',
    SS: 'Công việc này bắt đầu cùng lúc với công việc trước',
    FF: 'Công việc này kết thúc cùng lúc với công việc trước',
    SF: 'Công việc này kết thúc khi công việc trước bắt đầu',
  };
  return descriptions[type] || '';
};

/**
 * Check if activity is overdue
 */
export const isActivityOverdue = (activity: Activity): boolean => {
  if (activity.status === 'Completed' || activity.status === 'Cancelled') {
    return false;
  }
  
  if (!activity.plannedEndDate) {
    return false;
  }

  const endDate = new Date(activity.plannedEndDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return endDate < today;
};

/**
 * Get days until activity due date
 */
export const getDaysUntilDue = (activity: Activity): number | null => {
  if (!activity.plannedEndDate) {
    return null;
  }

  const endDate = new Date(activity.plannedEndDate);
  const today = new Date();
  return differenceInDays(endDate, today);
};

/**
 * Calculate activity duration from dates
 */
export const calculateDuration = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.max(1, differenceInDays(end, start));
};

/**
 * Calculate cost variance (CV = Actual Cost - Planned Cost)
 */
export const calculateCostVariance = (activity: Activity): number | null => {
  if (activity.actualCost === undefined || activity.plannedCost === undefined) {
    return null;
  }
  return activity.actualCost - activity.plannedCost;
};

/**
 * Calculate schedule variance in days (SV = Actual Progress - Planned Progress)
 */
export const calculateScheduleVariance = (activity: Activity): number | null => {
  if (!activity.plannedStartDate || !activity.plannedEndDate) {
    return null;
  }

  const totalDuration = calculateDuration(activity.plannedStartDate, activity.plannedEndDate);
  const today = new Date();
  const startDate = new Date(activity.plannedStartDate);
  const daysSinceStart = differenceInDays(today, startDate);

  if (daysSinceStart < 0) {
    return 0; // Not started yet
  }

  const plannedProgress = Math.min(100, (daysSinceStart / totalDuration) * 100);
  const actualProgress = activity.percentComplete;

  return actualProgress - plannedProgress;
};

/**
 * Check if activity is on critical path
 */
export const isOnCriticalPath = (activity: Activity): boolean => {
  return activity.isCritical;
};

/**
 * Get activity health status based on progress and schedule
 */
export const getActivityHealth = (activity: Activity): 'green' | 'yellow' | 'red' => {
  if (activity.status === 'Completed') {
    return 'green';
  }

  if (activity.status === 'Cancelled' || activity.status === 'OnHold') {
    return 'red';
  }

  // Check if overdue
  if (isActivityOverdue(activity)) {
    return 'red';
  }

  // Check schedule variance
  const sv = calculateScheduleVariance(activity);
  if (sv !== null) {
    if (sv < -10) return 'red';  // More than 10% behind
    if (sv < -5) return 'yellow'; // 5-10% behind
  }

  // Check cost variance
  const cv = calculateCostVariance(activity);
  if (cv !== null && activity.plannedCost) {
    const cvPercent = (cv / activity.plannedCost) * 100;
    if (cvPercent > 10) return 'red';    // Over budget by 10%
    if (cvPercent > 5) return 'yellow';  // Over budget by 5%
  }

  return 'green';
};

/**
 * Format float days to readable string
 */
export const formatFloat = (days: number): string => {
  if (days === 0) return '0 ngày (Critical)';
  if (days < 0) return `${Math.abs(days)} ngày (Âm)`;
  return `${days} ngày`;
};

/**
 * Format lag/lead days
 */
export const formatLag = (days: number): string => {
  if (days === 0) return 'Không có';
  if (days > 0) return `+${days} ngày (Lag - Trễ)`;
  return `${days} ngày (Lead - Sớm)`;
};

/**
 * Sort activities by early start (for critical path display)
 */
export const sortByEarlyStart = (activities: Activity[]): Activity[] => {
  return [...activities].sort((a, b) => {
    if (!a.earlyStart) return 1;
    if (!b.earlyStart) return -1;
    return new Date(a.earlyStart).getTime() - new Date(b.earlyStart).getTime();
  });
};

/**
 * Group activities by WBS node
 */
export const groupByWbsNode = (activities: Activity[]): Record<string, Activity[]> => {
  return activities.reduce((acc, activity) => {
    const key = activity.wbsNodeId || 'unassigned';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(activity);
    return acc;
  }, {} as Record<string, Activity[]>);
};

/**
 * Filter activities by status
 */
export const filterByStatus = (
  activities: Activity[],
  status: ActivityStatus
): Activity[] => {
  return activities.filter(a => a.status === status);
};

/**
 * Get critical activities only
 */
export const getCriticalActivities = (activities: Activity[]): Activity[] => {
  return activities.filter(a => a.isCritical);
};

/**
 * Calculate completion percentage for a group of activities
 */
export const calculateGroupProgress = (activities: Activity[]): number => {
  if (activities.length === 0) return 0;
  const totalProgress = activities.reduce((sum, a) => sum + a.percentComplete, 0);
  return Math.round(totalProgress / activities.length);
};

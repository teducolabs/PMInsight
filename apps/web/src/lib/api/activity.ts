import apiClient from './client';
import type {
  Activity,
  CreateActivityDto,
  UpdateActivityDto,
  AddDependencyDto,
  ActivityFilters,
} from '@/types/activity';

const BASE_PATH = '/projects';

export const activityApi = {
  /**
   * Get all activities for a project with optional filters
   */
  getAll: async (projectId: string, filters?: ActivityFilters): Promise<Activity[]> => {
    const params = new URLSearchParams();
    if (filters?.wbsNodeId) params.append('wbsNodeId', filters.wbsNodeId);
    if (filters?.isCritical !== undefined) params.append('isCritical', String(filters.isCritical));
    if (filters?.status) params.append('status', filters.status);
    if (filters?.assignedUserId) params.append('assignedUserId', filters.assignedUserId);

    const queryString = params.toString();
    const url = `${BASE_PATH}/${projectId}/activities${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiClient.get<Activity[]>(url);
    return response.data;
  },

  /**
   * Get activity by ID
   */
  getById: async (projectId: string, activityId: string): Promise<Activity> => {
    const response = await apiClient.get<Activity>(
      `${BASE_PATH}/${projectId}/activities/${activityId}`
    );
    return response.data;
  },

  /**
   * Get critical path for project
   */
  getCriticalPath: async (projectId: string): Promise<Activity[]> => {
    const response = await apiClient.get<Activity[]>(
      `${BASE_PATH}/${projectId}/activities/critical-path`
    );
    return response.data;
  },

  /**
   * Create new activity
   */
  create: async (projectId: string, data: CreateActivityDto): Promise<Activity> => {
    // Map camelCase to PascalCase for backend
    const backendData = {
      name: data.name,
      code: data.code,
      description: data.description,
      wbsNodeId: data.wbsNodeId,
      plannedStartDate: data.plannedStartDate,
      plannedEndDate: data.plannedEndDate,
      durationDays: data.durationDays,
      status: data.status, // Backend expects ActivityStatus enum value
      percentComplete: data.percentComplete,
      assignedUserIds: data.assignedUserIds || [],
      estimatedHours: data.estimatedHours || 0,
      plannedCost: data.plannedCost,
      constraintType: data.constraintType,
      constraintDate: data.constraintDate,
    };

    const response = await apiClient.post<Activity>(
      `${BASE_PATH}/${projectId}/activities`,
      backendData
    );
    return response.data;
  },

  /**
   * Update activity
   */
  update: async (
    projectId: string,
    activityId: string,
    data: UpdateActivityDto
  ): Promise<Activity> => {
    // Map camelCase to PascalCase for backend (only non-null fields)
    const backendData: any = {};
    
    if (data.name !== undefined) backendData.name = data.name;
    if (data.code !== undefined) backendData.code = data.code;
    if (data.description !== undefined) backendData.description = data.description;
    if (data.wbsNodeId !== undefined) backendData.wbsNodeId = data.wbsNodeId;
    if (data.plannedStartDate !== undefined) backendData.plannedStartDate = data.plannedStartDate;
    if (data.plannedEndDate !== undefined) backendData.plannedEndDate = data.plannedEndDate;
    if (data.durationDays !== undefined) backendData.durationDays = data.durationDays;
    if (data.actualStartDate !== undefined) backendData.actualStartDate = data.actualStartDate;
    if (data.actualEndDate !== undefined) backendData.actualEndDate = data.actualEndDate;
    if (data.percentComplete !== undefined) backendData.percentComplete = data.percentComplete;
    if (data.status !== undefined) backendData.status = data.status;
    if (data.assignedUserIds !== undefined) backendData.assignedUserIds = data.assignedUserIds;
    if (data.estimatedHours !== undefined) backendData.estimatedHours = data.estimatedHours;
    if (data.actualHours !== undefined) backendData.actualHours = data.actualHours;
    if (data.plannedCost !== undefined) backendData.plannedCost = data.plannedCost;
    if (data.actualCost !== undefined) backendData.actualCost = data.actualCost;
    if (data.notes !== undefined) backendData.notes = data.notes;

    console.log('📤 Activity API - Update request:', {
      projectId,
      activityId,
      data,
      backendData
    });

    const response = await apiClient.put<Activity>(
      `${BASE_PATH}/${projectId}/activities/${activityId}`,
      backendData
    );
    return response.data;
  },

  /**
   * Delete activity
   */
  delete: async (projectId: string, activityId: string): Promise<void> => {
    await apiClient.delete(`${BASE_PATH}/${projectId}/activities/${activityId}`);
  },

  /**
   * Add dependency between activities
   */
  addDependency: async (
    projectId: string,
    successorId: string,
    data: AddDependencyDto
  ): Promise<void> => {
    await apiClient.post(
      `${BASE_PATH}/${projectId}/activities/${successorId}/dependencies`,
      data
    );
  },

  /**
   * Remove dependency
   */
  removeDependency: async (
    projectId: string,
    successorId: string,
    predecessorId: string
  ): Promise<void> => {
    await apiClient.delete(
      `${BASE_PATH}/${projectId}/activities/${successorId}/dependencies/${predecessorId}`
    );
  },

  /**
   * Calculate critical path for project
   * This triggers the CPM algorithm on the backend
   */
  calculateCriticalPath: async (projectId: string): Promise<void> => {
    await apiClient.post(
      `${BASE_PATH}/${projectId}/activities/calculate-critical-path`
    );
  },

  /**
   * Update activity progress
   */
  updateProgress: async (
    projectId: string,
    activityId: string,
    percentComplete: number
  ): Promise<Activity> => {
    return activityApi.update(projectId, activityId, { percentComplete });
  },

  /**
   * Set activity baseline
   */
  setBaseline: async (projectId: string, activityId: string): Promise<Activity> => {
    const activity = await activityApi.getById(projectId, activityId);
    
    // TODO: Backend should have a dedicated endpoint for setting baseline
    // For now, this is a placeholder that returns the current activity
    // In a full implementation, this would:
    // 1. Create a baseline snapshot from current planned values
    // 2. Store it via POST /activities/{id}/baseline
    
    console.warn('Baseline setting not yet implemented on backend');
    return activity;
  },

  /**
   * Get activities by WBS node
   */
  getByWbsNode: async (projectId: string, wbsNodeId: string): Promise<Activity[]> => {
    return activityApi.getAll(projectId, { wbsNodeId });
  },

  /**
   * Get critical activities only
   */
  getCriticalActivities: async (projectId: string): Promise<Activity[]> => {
    return activityApi.getAll(projectId, { isCritical: true });
  },

  /**
   * Get activities assigned to user
   */
  getByAssignee: async (projectId: string, userId: string): Promise<Activity[]> => {
    return activityApi.getAll(projectId, { assignedUserId: userId });
  },

  /**
   * Batch update activities
   */
  batchUpdate: async (
    projectId: string,
    updates: Array<{ activityId: string; data: UpdateActivityDto }>
  ): Promise<Activity[]> => {
    const promises = updates.map(({ activityId, data }) =>
      activityApi.update(projectId, activityId, data)
    );
    return Promise.all(promises);
  },

  /**
   * Calculate activity statistics
   */
  getStats: async (projectId: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    criticalCount: number;
    averageProgress: number;
    totalPlannedCost: number;
    totalActualCost: number;
  }> => {
    const activities = await activityApi.getAll(projectId);
    
    const stats = {
      total: activities.length,
      byStatus: activities.reduce((acc, a) => {
        acc[a.status] = (acc[a.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      criticalCount: activities.filter(a => a.isCritical).length,
      averageProgress: activities.length > 0
        ? activities.reduce((sum, a) => sum + a.percentComplete, 0) / activities.length
        : 0,
      totalPlannedCost: activities.reduce((sum, a) => sum + (a.plannedCost || 0), 0),
      totalActualCost: activities.reduce((sum, a) => sum + (a.actualCost || 0), 0),
    };

    return stats;
  },

  /**
   * Export activities to format suitable for Gantt chart
   */
  toGanttFormat: (activities: Activity[]) => {
    return activities.map(activity => ({
      id: activity.id,
      name: activity.name,
      start: activity.plannedStartDate ? new Date(activity.plannedStartDate) : new Date(),
      end: activity.plannedEndDate ? new Date(activity.plannedEndDate) : new Date(),
      progress: activity.percentComplete,
      dependencies: activity.predecessors.map(p => ({
        target: p.activityId,
        type: p.type,
        lag: p.lagDays,
      })),
      styles: {
        backgroundColor: activity.isCritical ? '#ef4444' : '#3b82f6',
        progressColor: activity.isCritical ? '#dc2626' : '#2563eb',
      },
      isDisabled: activity.status === 'Completed' || activity.status === 'Cancelled',
    }));
  },
};

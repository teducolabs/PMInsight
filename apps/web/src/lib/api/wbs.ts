import apiClient from './client';
import type {
  WBS,
  WBSNode,
  CreateWBSNodeRequest,
  UpdateWBSNodeRequest,
} from '@/types/wbs';

// Legacy DTO for full tree updates (kept for compatibility)
export interface CreateWBSDto {
  projectId: string;
  tree: WBSNode[];
}

export interface UpdateWBSDto {
  tree: WBSNode[];
}

export const wbsApi = {
  // Get WBS by ID
  getById: async (id: string): Promise<WBS | null> => {
    try {
      const response = await apiClient.get(`/wbs/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Get WBS for a project
  getByProjectId: async (projectId: string): Promise<WBS | null> => {
    try {
      const response = await apiClient.get(`/wbs/project/${projectId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Create WBS
  create: async (data: CreateWBSDto): Promise<WBS> => {
    const response = await apiClient.post('/wbs', data);
    return response.data;
  },

  // Update WBS tree structure
  update: async (id: string, data: UpdateWBSDto): Promise<WBS> => {
    const response = await apiClient.put(`/wbs/${id}`, data);
    return response.data;
  },

  // Delete WBS
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/wbs/${id}`);
  },

  // Lock WBS for editing (prevents concurrent modifications)
  lock: async (id: string): Promise<void> => {
    await apiClient.post(`/wbs/${id}/lock`);
  },

  // Unlock WBS
  unlock: async (id: string): Promise<void> => {
    await apiClient.post(`/wbs/${id}/unlock`);
  },

  // ============================================================================
  // Node Management (New unified WBS/Activity API)
  // ============================================================================

  /**
   * Create a new WBS node (Summary/Task/Milestone)
   */
  createNode: async (wbsId: string, data: CreateWBSNodeRequest): Promise<WBS> => {
    const response = await apiClient.post(`/wbs/${wbsId}/nodes`, data);
    return response.data;
  },

  /**
   * Update an existing WBS node
   */
  updateNode: async (
    wbsId: string,
    nodeId: string,
    data: UpdateWBSNodeRequest
  ): Promise<WBS> => {
    const response = await apiClient.put(`/wbs/${wbsId}/nodes/${nodeId}`, data);
    return response.data;
  },

  /**
   * Delete a WBS node (and all its children)
   */
  deleteNode: async (wbsId: string, nodeId: string): Promise<WBS> => {
    const response = await apiClient.delete(`/wbs/${wbsId}/nodes/${nodeId}`);
    return response.data;
  },

  /**
   * Quick update node progress
   */
  updateNodeProgress: async (
    wbsId: string,
    nodeId: string,
    percentComplete: number
  ): Promise<WBS> => {
    return wbsApi.updateNode(wbsId, nodeId, { percentComplete });
  },

  /**
   * Update node status
   */
  updateNodeStatus: async (
    wbsId: string,
    nodeId: string,
    status: string
  ): Promise<WBS> => {
    return wbsApi.updateNode(wbsId, nodeId, { status: status as any });
  },

  // ============================================================================
  // Dependency Management
  // ============================================================================

  /**
   * Add a dependency between two nodes
   */
  addDependency: async (
    wbsId: string,
    nodeId: string,
    predecessorNodeId: string,
    type: string = 'FS',
    lagDays: number = 0
  ): Promise<WBS> => {
    const response = await apiClient.post(
      `/wbs/${wbsId}/nodes/${nodeId}/dependencies`,
      { predecessorNodeId, type, lagDays }
    );
    return response.data;
  },

  /**
   * Remove a dependency from a node
   */
  removeDependency: async (
    wbsId: string,
    nodeId: string,
    predecessorNodeId: string
  ): Promise<WBS> => {
    const response = await apiClient.delete(
      `/wbs/${wbsId}/nodes/${nodeId}/dependencies/${predecessorNodeId}`
    );
    return response.data;
  },

  /**
   * Update node dependencies (replace all)
   */
  updateDependencies: async (
    wbsId: string,
    nodeId: string,
    predecessors: Array<{
      nodeId: string;
      type: string;
      lagDays: number;
    }>
  ): Promise<WBS> => {
    return wbsApi.updateNode(wbsId, nodeId, { predecessors: predecessors as any });
  },

  // ============================================================================
  // Critical Path & Scheduling
  // ============================================================================

  /**
   * Calculate critical path for the WBS schedule
   */
  calculateCriticalPath: async (wbsId: string): Promise<WBS> => {
    const response = await apiClient.post(`/wbs/${wbsId}/calculate-critical-path`);
    return response.data;
  },

  /**
   * Quick update node progress
   */
  updateProgress: async (
    wbsId: string,
    nodeId: string,
    data: {
      percentComplete: number;
      actualStartDate?: string;
      actualEndDate?: string;
      actualHours?: number;
      actualCost?: number;
    }
  ): Promise<WBS> => {
    const response = await apiClient.patch(
      `/wbs/${wbsId}/nodes/${nodeId}/progress`,
      data
    );
    return response.data;
  },
};

import apiClient from './client';

export interface WBSNode {
  id: string;
  name: string;
  code?: string;
  description?: string;
  deliverables: string[];
  acceptanceCriteria?: string;
  estimatedCost?: number;
  currency?: string;
  responsibleOrganization?: string;
  responsibleUserId?: string;
  assumptions: string[];
  constraints: string[];
  children: WBSNode[];
  isWorkPackage: boolean;
  level: number;
}

export interface WBS {
  id: string;
  projectId: string;
  tree: WBSNode[];
  version: number;
  baselineRef?: string;
  lockedBy?: string;
  lockedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWBSDto {
  projectId: string;
  tree: WBSNode[];
}

export interface UpdateWBSDto {
  tree: WBSNode[];
}

export const wbsApi = {
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

  // Update WBS
  update: async (id: string, data: UpdateWBSDto): Promise<WBS> => {
    const response = await apiClient.put(`/wbs/${id}`, data);
    return response.data;
  },

  // Delete WBS
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/wbs/${id}`);
  },

  // Lock/Unlock WBS for editing
  lock: async (id: string): Promise<void> => {
    await apiClient.post(`/wbs/${id}/lock`);
  },

  unlock: async (id: string): Promise<void> => {
    await apiClient.post(`/wbs/${id}/unlock`);
  },

  // Create baseline
  createBaseline: async (id: string): Promise<void> => {
    await apiClient.post(`/wbs/${id}/baseline`);
  },
};

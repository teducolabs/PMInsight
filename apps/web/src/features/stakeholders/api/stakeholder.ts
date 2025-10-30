import apiClient from '@/lib/api/client';
import type { Stakeholder, CreateStakeholderDto, UpdateStakeholderDto } from '../types/stakeholder';
import type { 
  EngagementAction, 
  EngagementHistory,
  CreateEngagementHistoryRequest,
  CreateEngagementActionRequest,
  UpdateEngagementActionRequest
} from '../types/stakeholder-engagement';

interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export const stakeholderApi = {
  // Get all stakeholders for a project with pagination
  getByProject: async (projectId: string, params?: {
    minInfluence?: number;
    minInterest?: number;
    searchText?: string;
    pageSize?: number;
    pageNumber?: number;
  }): Promise<PaginatedResponse<Stakeholder>> => {
    const queryParams = new URLSearchParams({
      projectId,
      ...(params?.minInfluence && { minInfluence: params.minInfluence.toString() }),
      ...(params?.minInterest && { minInterest: params.minInterest.toString() }),
      ...(params?.searchText && { searchText: params.searchText }),
      pageSize: (params?.pageSize || 100).toString(),
      pageNumber: (params?.pageNumber || 1).toString(),
    });
    
    const response = await apiClient.get(`/stakeholders?${queryParams}`);
    return response.data;
  },

  // Get a single stakeholder
  getById: async (id: string): Promise<Stakeholder> => {
    const response = await apiClient.get(`/stakeholders/${id}`);
    return response.data;
  },

  // Create a new stakeholder
  create: async (data: CreateStakeholderDto): Promise<Stakeholder> => {
    const response = await apiClient.post('/stakeholders', data);
    return response.data;
  },

  // Update a stakeholder
  update: async (id: string, data: UpdateStakeholderDto): Promise<Stakeholder> => {
    const response = await apiClient.put(`/stakeholders/${id}`, { ...data, id });
    return response.data;
  },

  // Delete a stakeholder
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/stakeholders/${id}`);
  },
  
  // Get stakeholder matrix
  getMatrix: async (projectId: string): Promise<any> => {
    const response = await apiClient.get(`/stakeholders/matrix/${projectId}`);
    return response.data;
  },
};

// Stakeholder Engagement API
export const stakeholderEngagementApi = {
  // History endpoints
  getHistory: async (stakeholderId: string): Promise<EngagementHistory[]> => {
    const response = await apiClient.get(`/stakeholder-engagement/history/${stakeholderId}`);
    return response.data;
  },

  createHistory: async (data: CreateEngagementHistoryRequest): Promise<EngagementHistory> => {
    const response = await apiClient.post('/stakeholder-engagement/history', data);
    return response.data;
  },

  // Action endpoints
  getActions: async (stakeholderId: string): Promise<EngagementAction[]> => {
    const response = await apiClient.get(`/stakeholder-engagement/actions/${stakeholderId}`);
    return response.data;
  },

  createAction: async (data: CreateEngagementActionRequest): Promise<EngagementAction> => {
    const response = await apiClient.post('/stakeholder-engagement/actions', data);
    return response.data;
  },

  updateAction: async (id: string, data: UpdateEngagementActionRequest): Promise<EngagementAction> => {
    const response = await apiClient.put(`/stakeholder-engagement/actions/${id}`, data);
    return response.data;
  },
};

import apiClient from './client';
import type { Stakeholder, CreateStakeholderDto, UpdateStakeholderDto } from '@/types/stakeholder';

export const stakeholderApi = {
  // Get all stakeholders for a project
  getByProject: async (projectId: string): Promise<Stakeholder[]> => {
    const response = await apiClient.get(`/stakeholders/project/${projectId}`);
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
    const response = await apiClient.put(`/stakeholders/${id}`, data);
    return response.data;
  },

  // Delete a stakeholder
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/stakeholders/${id}`);
  },
};

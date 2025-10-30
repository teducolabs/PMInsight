import apiClient from '@/lib/api/client';
import type { Project, CreateProjectDto, UpdateProjectDto, ProjectStats } from '../types/project';

export const projectApi = {
  // Get all projects
  getAll: async (): Promise<Project[]> => {
    const response = await apiClient.get('/projects');
    // Backend returns { items: [], nextCursor: null, total: 0 }
    return response.data.items || [];
  },

  // Get project by ID
  getById: async (id: string): Promise<Project> => {
    const response = await apiClient.get(`/projects/${id}`);
    return response.data;
  },

  // Get project statistics
  getStats: async (): Promise<ProjectStats> => {
    const response = await apiClient.get('/projects/stats');
    return response.data;
  },

  // Create a new project
  create: async (data: CreateProjectDto): Promise<Project> => {
    const response = await apiClient.post('/projects', data);
    return response.data;
  },

  // Update a project
  update: async (id: string, data: UpdateProjectDto): Promise<Project> => {
    const response = await apiClient.put(`/projects/${id}`, data);
    return response.data;
  },

  // Delete a project
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/projects/${id}`);
  },

  // Set baseline
  setBaseline: async (id: string): Promise<void> => {
    await apiClient.post(`/projects/${id}/baseline`);
  },
};

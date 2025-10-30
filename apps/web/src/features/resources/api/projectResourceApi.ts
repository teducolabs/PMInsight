import apiClient from '@/lib/api/client';
import type {
  ProjectResource,
  CreateProjectResourceRequest,
  UpdateProjectResourceRequest,
} from '../types';

/**
 * Project Resource API Service
 * Handles CRUD operations for the project resource pool
 */
export const projectResourceApi = {
  /**
   * Get all resources for a project (with utilization stats)
   */
  getAll: async (projectId: string): Promise<ProjectResource[]> => {
    const response = await apiClient.get(`/projects/${projectId}/resources`);
    return response.data;
  },

  /**
   * Create a new resource in the project pool
   */
  create: async (
    projectId: string,
    data: CreateProjectResourceRequest
  ): Promise<ProjectResource> => {
    const response = await apiClient.post(
      `/projects/${projectId}/resources`,
      data
    );
    return response.data;
  },

  /**
   * Update an existing resource in the pool
   */
  update: async (
    projectId: string,
    resourceId: string,
    data: UpdateProjectResourceRequest
  ): Promise<ProjectResource> => {
    const response = await apiClient.put(
      `/projects/${projectId}/resources/${resourceId}`,
      data
    );
    return response.data;
  },

  /**
   * Delete (soft delete) a resource from the pool
   * Will fail if resource has active assignments
   */
  delete: async (projectId: string, resourceId: string): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}/resources/${resourceId}`);
  },
};

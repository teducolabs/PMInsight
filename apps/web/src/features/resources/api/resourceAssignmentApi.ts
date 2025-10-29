import apiClient from '@/lib/api/client';
import type {
  ResourceAssignment,
  AddResourceAssignmentRequest,
  UpdateResourceAssignmentRequest,
} from '../types';

/**
 * Resource Assignment API Service
 * Handles CRUD operations for resource assignments on WBS nodes
 */
export const resourceAssignmentApi = {
  /**
   * Add a resource assignment to a WBS node
   */
  addAssignment: async (
    wbsId: string,
    nodeId: string,
    data: AddResourceAssignmentRequest
  ): Promise<ResourceAssignment> => {
    const response = await apiClient.post(
      `/wbs/${wbsId}/nodes/${nodeId}/resources`,
      data
    );
    return response.data;
  },

  /**
   * Update a resource assignment
   */
  updateAssignment: async (
    wbsId: string,
    nodeId: string,
    assignmentId: string,
    data: UpdateResourceAssignmentRequest
  ): Promise<ResourceAssignment> => {
    const response = await apiClient.put(
      `/wbs/${wbsId}/nodes/${nodeId}/resources/${assignmentId}`,
      data
    );
    return response.data;
  },

  /**
   * Remove a resource assignment
   */
  removeAssignment: async (
    wbsId: string,
    nodeId: string,
    assignmentId: string
  ): Promise<void> => {
    await apiClient.delete(
      `/wbs/${wbsId}/nodes/${nodeId}/resources/${assignmentId}`
    );
  },

  /**
   * Quick update actual hours for a resource assignment
   */
  updateActualHours: async (
    wbsId: string,
    nodeId: string,
    assignmentId: string,
    actualHours: number
  ): Promise<ResourceAssignment> => {
    const response = await apiClient.patch(
      `/wbs/${wbsId}/nodes/${nodeId}/resources/${assignmentId}/actual-hours`,
      actualHours,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  },
};

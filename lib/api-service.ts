import { apiClient } from './api-client';

/**
 * Creates a resource service with standard CRUD operations
 * for a specific API resource
 */
export function createResourceService<T>(baseUrl: string) {
  return {
    /**
     * Get all resources (with optional pagination)
     */
    getAll: async (params?: { page?: number; limit?: number; [key: string]: any }): Promise<{ data: T[]; pagination: any }> => {
      return apiClient.get(baseUrl, { params });
    },
    
    /**
     * Get a single resource by ID
     */
    getById: async (id: string | number): Promise<T> => {
      return apiClient.get(`${baseUrl}/${id}`);
    },
    
    /**
     * Create a new resource
     */
    create: async (data: Partial<T>): Promise<T> => {
      return apiClient.post(baseUrl, data);
    },
    
    /**
     * Update an existing resource
     */
    update: async (id: string | number, data: Partial<T>): Promise<T> => {
      return apiClient.put(`${baseUrl}/${id}`, data);
    },
    
    /**
     * Delete a resource
     */
    delete: async (id: string | number): Promise<{ success: boolean }> => {
      return apiClient.delete(`${baseUrl}/${id}`);
    },
    
    /**
     * Custom action on resource
     */
    performAction: async (id: string | number, action: string, data?: any): Promise<any> => {
      return apiClient.post(`${baseUrl}/${id}/${action}`, data);
    }
  };
}

/**
 * Type-safe API service for generic data operations
 */
export const apiService = {
  /**
   * Generic GET request
   */
  get: async <T>(endpoint: string, params?: Record<string, any>): Promise<T> => {
    return apiClient.get<T>(endpoint, { params });
  },
  
  /**
   * Generic POST request
   */
  post: async <T>(endpoint: string, data?: any): Promise<T> => {
    return apiClient.post<T>(endpoint, data);
  },
  
  /**
   * Generic PUT request
   */
  put: async <T>(endpoint: string, data?: any): Promise<T> => {
    return apiClient.put<T>(endpoint, data);
  },
  
  /**
   * Generic DELETE request
   */
  delete: async <T>(endpoint: string): Promise<T> => {
    return apiClient.delete<T>(endpoint);
  },
  
  /**
   * Create a type-safe service for a specific resource
   */
  createResourceService: createResourceService
};

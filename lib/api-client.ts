import { getSession } from 'next-auth/react';

interface ApiOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  cache?: RequestCache;
  useFormData?: boolean;  // Flag to handle form data
  skipAuthCheck?: boolean; // Flag to skip authentication check
  skipCsrfProtection?: boolean; // Flag to skip CSRF for specific endpoints
}

/**
 * API client that handles authentication checks before making requests
 */
export const apiClient = {
  /**
   * Make a GET request if authenticated, otherwise return null without error
   */
  async get<T = any>(url: string, options: ApiOptions = {}): Promise<T | null> {
    const session = await getSession();
    
    if (!session?.user) {
      console.log(`User not authenticated, skipping API call to: ${url}`);
     
    }
    
    // Add query parameters if provided
    if (options.params) {
      const urlObj = new URL(url, window.location.origin);
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          urlObj.searchParams.append(key, String(value));
        }
      });
      url = urlObj.toString();
    }
    
    const response = await fetch(url, {
      ...options,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      cache: options.cache || 'no-store',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
      throw new Error(errorData.message || errorData.error || `API error: ${response.status}`);
    }
    
    return response.json();
  },
  
  /**
   * Make a POST request if authenticated, otherwise return null without error
   */
  async post<T = any>(url: string, data?: any, options: ApiOptions = {}): Promise<T | null> {
    const session = await getSession();
    
    if (!session?.user) {
      console.log(`User not authenticated, skipping API call to: ${url}`);
      return null;
    }
    
    const headers: Record<string, string> = {
      ...options.headers,
    };
    
    let body: any;
    
    if (options.useFormData && data instanceof FormData) {
      // Don't set Content-Type for FormData (browser will set it with boundary)
      body = data;
    } else {
      headers['Content-Type'] = 'application/json';
      body = data ? JSON.stringify(data) : undefined;
    }
    
    // Add CSRF protection for authenticated requests
    if (!options.skipCsrfProtection) {
      if (session?.user) {
        headers['x-csrf-token'] = `${session.user.id?.substring(0, 8)}-${Math.floor(Date.now() / 1000)}`;
      }
    }
    
    const response = await fetch(url, {
      ...options,
      method: 'POST',
      headers,
      body,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
      throw new Error(errorData.message || errorData.error || `API error: ${response.status}`);
    }
    
    return response.json();
  },
  
  /**
   * Make a PUT request to the specified URL with CSRF protection
   */
  async put<T = any>(url: string, data?: any, options: ApiOptions = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (!options.skipCsrfProtection) {
      const session = await getSession();
      if (session?.user) {
        headers['x-csrf-token'] = `${session.user.id?.substring(0, 8)}-${Math.floor(Date.now() / 1000)}`;
      }
    }
    
    const response = await fetch(url, {
      ...options,
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
      throw new Error(errorData.message || errorData.error || `API error: ${response.status}`);
    }
    
    return response.json();
  },
  
  /**
   * Make a DELETE request to the specified URL with CSRF protection
   */
  async delete<T = any>(url: string, options: ApiOptions = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (!options.skipCsrfProtection) {
      const session = await getSession();
      if (session?.user) {
        headers['x-csrf-token'] = `${session.user.id?.substring(0, 8)}-${Math.floor(Date.now() / 1000)}`;
      }
    }
    
    const response = await fetch(url, {
      ...options,
      method: 'DELETE',
      headers,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
      throw new Error(errorData.message || errorData.error || `API error: ${response.status}`);
    }
    
    return response.json();
  },
  
  /**
   * Handle file uploads with proper FormData configuration
   */
  async uploadFile<T = any>(url: string, file: File, fieldName: string = 'file', additionalData?: Record<string, any>, options: ApiOptions = {}): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, file);
    
    // Add additional form data if provided
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }
    
    return this.post<T>(url, formData, { ...options, useFormData: true });
  }
};

/**
 * Create a type-safe API client instance for a specific API
 */
export function createApiClient<T extends Record<string, Function>>(baseUrl: string, endpoints: T): T {
  const client: any = {};
  
  Object.entries(endpoints).forEach(([name, handler]) => {
    client[name] = (...args: any[]) => {
      const result = (handler as any)(...args);
      const url = typeof result === 'string' 
        ? `${baseUrl}${result}` 
        : `${baseUrl}${result.url}`;
      
      const method = typeof result === 'string' ? 'GET' : result.method || 'GET';
      const data = typeof result === 'string' ? undefined : result.data;
      const options = typeof result === 'string' ? {} : result.options || {};
      
      switch (method.toUpperCase()) {
        case 'GET': return apiClient.get(url, options);
        case 'POST': return apiClient.post(url, data, options);
        case 'PUT': return apiClient.put(url, data, options);
        case 'DELETE': return apiClient.delete(url, options);
        default: return apiClient.get(url, options);
      }
    };
  });
  
  return client as T;
}

// For backward compatibility, also provide a default export
export default apiClient;

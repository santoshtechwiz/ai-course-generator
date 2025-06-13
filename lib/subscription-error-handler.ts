import { apiClient } from './api-client';

/**
 * This utility handles subscription-related API errors gracefully
 * by preventing unauthorized requests when the user isn't logged in
 */
export const subscriptionErrorHandler = {
  initialize: () => {
    // Save the original apiClient get method
    const originalGet = apiClient.get;
    
    // Override the get method with one that handles subscription errors gracefully
    apiClient.get = async (url: string, options: any = {}) => {
      // Check if this is a subscription-related request
      const isSubscriptionRequest = url.includes('/subscription') || 
                                    url.includes('/billing') || 
                                    url.includes('/plans');
      
      if (isSubscriptionRequest && options?.skipAuthCheck !== true) {
        // Check authentication status
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        // If no auth token and this is a subscription request, return a default response
        // rather than making the API call that will clearly fail
        if (!token) {
          console.log(`Skipping subscription request to ${url} - user not authenticated`);
          
          // Return mock data for subscription requests when not authenticated
          return {
            isSubscribed: false,
            plan: 'free',
            features: {
              basic: true,
              advanced: false,
              premium: false
            },
            status: 'unauthenticated',
            error: null
          };
        }
      }
      
      // Proceed with original request if not a subscription request or user is authenticated
      try {
        return await originalGet.call(apiClient, url, options);
      } catch (error: any) {
        // Handle 401 errors from subscription endpoints gracefully
        if (error?.status === 401 && isSubscriptionRequest) {
          console.log(`Handling 401 error for subscription request to ${url}`);
          
          // For subscription endpoints, return default free plan data instead of throwing
          return {
            isSubscribed: false,
            plan: 'free',
            features: {
              basic: true,
              advanced: false,
              premium: false
            },
            status: 'unauthorized',
            error: null
          };
        }
        
        // Re-throw other errors
        throw error;
      }
    };
  }
};

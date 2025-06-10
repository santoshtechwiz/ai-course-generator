/**
 * This file exists for backward compatibility and re-exports the main api-client
 * The preferred import is from '@/lib/api-client'
 */
import { apiClient } from '@/lib/api-client';

// Re-export for backward compatibility
export default apiClient;
export { apiClient };

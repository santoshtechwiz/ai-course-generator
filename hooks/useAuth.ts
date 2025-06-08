// This is a compatibility file for code still importing from the old path
// The main implementation has been moved to use-auth.ts

import { useAuth as actualUseAuth } from './use-auth';

/**
 * @deprecated Import from '@/hooks/use-auth' instead
 */
export const useAuth = actualUseAuth;
export default useAuth;

"use client";

// Re-export useAuth from the auth context to maintain compatibility
import { useAuth as useAuthFromContext } from "@/context/auth-context";

// Export a client-side only component
export const useAuth = useAuthFromContext;

export default useAuth;

import { User } from "next-auth";

// Extend the next-auth User type to include our custom fields
declare module "next-auth" {
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    isAdmin?: boolean;
    credits?: number;
    role?: string;
    permissions?: string[];
    userType?: string;
  }

  interface Session {
    user: User;
  }
}

// Define the Redux auth state type
export interface AuthUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  isAdmin?: boolean;
  credits?: number;
  role?: string;
  permissions?: string[];
  userType?: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

import { getServerSession } from "next-auth/next"
import { authOptions } from "./auth"

/**
 * Get the server-side session with proper typing
 * 
 * @returns The current session or null if not authenticated
 */
export async function getServerAuthSession() {
  return await getServerSession(authOptions)
}

/**
 * Check if the current user is authenticated server-side
 * 
 * @returns Boolean indicating if user is authenticated
 */
export async function isAuthenticated() {
  const session = await getServerAuthSession()
  return !!session?.user
}

/**
 * Check if the current user is an admin server-side
 * 
 * @returns Boolean indicating if user is an admin
 */
export async function isAdmin() {
  const session = await getServerAuthSession()
  return !!session?.user?.isAdmin
}

/**
 * Get the current user's ID server-side
 * 
 * @returns The user ID or undefined if not authenticated
 */
export async function getUserId() {
  const session = await getServerAuthSession()
  return session?.user?.id
}

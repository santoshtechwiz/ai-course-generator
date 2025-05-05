import { v4 as uuidv4 } from "uuid"

import { store } from "@/store/store"
import { createNonAuthenticatedUser } from "@/store/slices/authSlice"
import { NonAuthenticatedUser } from "@/app/types/auth-types"

/**
 * Creates a new non-authenticated user session
 */
export const createNonAuthenticatedUserSession = (): NonAuthenticatedUser => {
  const nonAuthenticatedUser: NonAuthenticatedUser = {
    id: uuidv4(),
    sessionId: uuidv4(),
    createdAt: new Date().toISOString(),
  }

  // Dispatch to Redux store
  store.dispatch(createNonAuthenticatedUser(nonAuthenticatedUser))

  return nonAuthenticatedUser
}

/**
 * Checks if the current session has a non-authenticated user
 */
export const hasNonAuthenticatedUser = (): boolean => {
  const state = store.getState()
  return !!state.auth.nonAuthenticatedUser
}

/**
 * Gets the current non-authenticated user or creates one if it doesn't exist
 */
export const getNonAuthenticatedUserOrCreate = (): NonAuthenticatedUser => {
  const state = store.getState()
  if (state.auth.nonAuthenticatedUser) {
    return state.auth.nonAuthenticatedUser
  }

  return createNonAuthenticatedUserSession()
}

/**
 * Converts a non-authenticated user's data to a registered user account
 */
export const convertNonAuthenticatedUserToRegistered = (userId: string) => {
  // This would typically involve an API call to merge data
  // For now, we'll just return the user ID
  return userId
}

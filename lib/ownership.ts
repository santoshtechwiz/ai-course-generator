/**
 * Centralized Ownership Detection System
 * 
 * This module provides a single source of truth for determining content ownership
 * across the entire application. It handles multiple fallback strategies and
 * provides consistent owner detection logic.
 */

import { useAuth } from "@/modules/auth"
import { useMemo } from "react"

// Configuration for ownership detection strategies
export const OWNERSHIP_CONFIG = {
  // Enable debug logging in development
  DEBUG: process.env.NODE_ENV !== "production",
  
  // Primary fields to check for owner ID (in order of preference)
  OWNER_FIELDS: ['userId', 'ownerId', 'createdBy', 'authorId', 'creator'] as const,
  
  // Enable fallback to check user session if no owner found in data
  ENABLE_SESSION_FALLBACK: true,
  
  // Enable strict mode (requires explicit owner field, no guessing)
  STRICT_MODE: false,
} as const

export type OwnershipConfig = typeof OWNERSHIP_CONFIG

// Interface for any content that might have ownership information
export interface OwnableContent {
  userId?: string | null
  ownerId?: string | null
  createdBy?: string | null
  authorId?: string | null
  creator?: string | null
  [key: string]: any
}

// Result of ownership detection
export interface OwnershipResult {
  isOwner: boolean
  ownerId: string | null
  currentUserId: string | null
  detectionMethod: 'direct_match' | 'fallback_session' | 'no_owner_found' | 'not_authenticated'
  confidence: 'high' | 'medium' | 'low'
  debug?: {
    checkedFields: string[]
    foundOwnerIn: string | null
    rawContent: any
  }
}

/**
 * Core ownership detection function
 * @param content - The content object to check ownership for
 * @param currentUserId - The current user's ID
 * @param config - Configuration options
 */
export function detectOwnership(
  content: OwnableContent | null | undefined,
  currentUserId: string | null | undefined,
  config: Partial<OwnershipConfig> = {}
): OwnershipResult {
  const cfg = { ...OWNERSHIP_CONFIG, ...config }
  
  // Early return if no user is authenticated
  if (!currentUserId) {
    return {
      isOwner: false,
      ownerId: null,
      currentUserId: null,
      detectionMethod: 'not_authenticated',
      confidence: 'high',
      debug: cfg.DEBUG ? {
        checkedFields: [],
        foundOwnerIn: null,
        rawContent: content
      } : undefined
    }
  }

  // Early return if no content provided
  if (!content) {
    return {
      isOwner: false,
      ownerId: null,
      currentUserId,
      detectionMethod: 'no_owner_found',
      confidence: 'high',
      debug: cfg.DEBUG ? {
        checkedFields: [],
        foundOwnerIn: null,
        rawContent: content
      } : undefined
    }
  }

  // Check each owner field in order of preference
  let detectedOwnerId: string | null = null
  let foundOwnerIn: string | null = null
  const checkedFields: string[] = []

  for (const field of cfg.OWNER_FIELDS) {
    checkedFields.push(field)
    const value = content[field]
    
    if (value && typeof value === 'string') {
      detectedOwnerId = value
      foundOwnerIn = field
      break
    }
  }

  // Determine ownership
  const isOwner = detectedOwnerId === currentUserId
  let detectionMethod: OwnershipResult['detectionMethod'] = 'direct_match'
  let confidence: OwnershipResult['confidence'] = 'high'

  // If no owner found but session fallback is enabled
  if (!detectedOwnerId && cfg.ENABLE_SESSION_FALLBACK && !cfg.STRICT_MODE) {
    // In some cases, if we can't find an explicit owner but the user is viewing
    // content they created, we might want to assume ownership
    detectionMethod = 'fallback_session'
    confidence = 'low'
  }

  // If no owner found at all
  if (!detectedOwnerId) {
    detectionMethod = 'no_owner_found'
    confidence = 'high'
  }

  const result: OwnershipResult = {
    isOwner,
    ownerId: detectedOwnerId,
    currentUserId,
    detectionMethod,
    confidence,
    debug: cfg.DEBUG ? {
      checkedFields,
      foundOwnerIn,
      rawContent: content
    } : undefined
  }

  // Debug logging
  if (cfg.DEBUG) {
    console.log('🏠 Ownership Detection Result:', {
      content: content,
      result,
      config: cfg
    })
  }

  return result
}

/**
 * React hook for ownership detection
 * @param content - The content to check ownership for
 * @param config - Configuration options
 */
export function useOwnership(
  content: OwnableContent | null | undefined,
  config: Partial<OwnershipConfig> = {}
): OwnershipResult {
  const { user } = useAuth()
  
  return useMemo(() => {
    return detectOwnership(content, user?.id, config)
  }, [content, user?.id, config])
}

/**
 * Simplified hook that just returns boolean ownership status
 * @param content - The content to check ownership for
 */
export function useIsOwner(content: OwnableContent | null | undefined): boolean {
  const ownership = useOwnership(content)
  return ownership.isOwner
}

/**
 * Hook that returns both ownership status and owner information
 * @param content - The content to check ownership for
 */
export function useOwnerInfo(content: OwnableContent | null | undefined) {
  const { user } = useAuth()
  const ownership = useOwnership(content)
  
  return {
    isOwner: ownership.isOwner,
    ownerId: ownership.ownerId,
    currentUserId: user?.id || null,
    canEdit: ownership.isOwner,
    canDelete: ownership.isOwner,
    canShare: true, // Usually everyone can share
    canDownload: ownership.isOwner, // This can be overridden by subscription logic
    ownership // Full ownership result for debugging
  }
}

/**
 * Utility function to standardize content objects with owner information
 * @param content - The content object
 * @param fallbackOwnerId - Fallback owner ID if none found in content
 */
export function normalizeContentOwnership<T extends OwnableContent>(
  content: T,
  fallbackOwnerId?: string
): T & { normalizedOwnerId: string | null } {
  const ownership = detectOwnership(content, fallbackOwnerId)
  
  return {
    ...content,
    normalizedOwnerId: ownership.ownerId || fallbackOwnerId || null
  }
}

/**
 * Type guard to check if content has ownership information
 */
export function hasOwnershipInfo(content: any): content is OwnableContent {
  if (!content || typeof content !== 'object') return false
  
  return OWNERSHIP_CONFIG.OWNER_FIELDS.some(field => 
    content[field] && typeof content[field] === 'string'
  )
}

// Export types for use in other modules
export type { OwnableContent, OwnershipResult, OwnershipConfig }

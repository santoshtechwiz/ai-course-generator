"use client"

// Legacy shim: re-export consolidated hooks from subscriptions module to keep import paths working
export { useSubscription, useSubscriptionPermissions, useSubscriptionTracking } from '@/modules/subscriptions/client'

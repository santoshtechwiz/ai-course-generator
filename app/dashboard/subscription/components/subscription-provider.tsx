"use client"

/**
 * @deprecated Use providers/SubscriptionProvider.tsx instead
 * This component simply forwards to the main SubscriptionProvider for backward compatibility
 */

import { SubscriptionProvider as MainProvider } from "@/providers/SubscriptionProvider"

export const SubscriptionProvider = MainProvider
export default SubscriptionProvider

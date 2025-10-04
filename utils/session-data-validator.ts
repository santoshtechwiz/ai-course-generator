/**
 * Session Data Validator
 * Ensures session data integrity and provides fallbacks for missing data
 */

import type { Session } from 'next-auth';
import type { SubscriptionPlanType } from '@/types/subscription';

export interface ValidatedSessionData {
  credits: number;
  plan: SubscriptionPlanType;
  isValid: boolean;
  warnings: string[];
}

export class SessionDataValidator {
  /**
   * Validate and normalize session subscription data
   */
  static validateSessionData(session: Session | null | undefined): ValidatedSessionData {
    const warnings: string[] = [];
    
    if (!session?.user) {
      return {
        credits: 3,
        plan: 'FREE',
        isValid: false,
        warnings: ['No session or user data available']
      };
    }

    // Validate and normalize credits
    let credits = 3; // Default free credits
    const rawCredits = session.user.credits;
    
    if (typeof rawCredits === 'number' && !isNaN(rawCredits)) {
      credits = Math.max(0, Math.floor(rawCredits));
    } else if (rawCredits !== undefined) {
      warnings.push(`Invalid credits value: ${rawCredits}, using default: ${credits}`);
    }

    // Validate and normalize plan
    let plan: SubscriptionPlanType = 'FREE';
    const possiblePlanSources = [
      (session.user as any)?.plan,
      (session.user as any)?.subscriptionPlan,
      (session.user as any)?.userType
    ];

    for (const planSource of possiblePlanSources) {
      if (planSource && typeof planSource === 'string') {
        const normalizedPlan = planSource.toUpperCase() as SubscriptionPlanType;
        if (['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE'].includes(normalizedPlan)) {
          plan = normalizedPlan;
          break;
        }
      }
    }

    // Cross-validate credits and plan
    if (plan === 'FREE' && credits > 25) {
      warnings.push(`Unusual: FREE plan with ${credits} credits (expected ≤25)`);
    }
    
    if (plan === 'BASIC' && (credits < 20 || credits > 100)) {
      warnings.push(`Unusual: BASIC plan with ${credits} credits (expected 20-100)`);
    }

    if (plan === 'PREMIUM' && (credits < 100 || credits > 500)) {
      warnings.push(`Unusual: PREMIUM plan with ${credits} credits (expected 100-500)`);
    }

    return {
      credits,
      plan,
      isValid: warnings.length === 0,
      warnings
    };
  }

  /**
   * Get safe subscription data from session with validation
   */
  static getSafeSubscriptionData(session: Session | null | undefined) {
    const validated = this.validateSessionData(session);
    
    if (process.env.NODE_ENV === 'development' && validated.warnings.length > 0) {
      console.warn('[SessionDataValidator] Data validation warnings:', validated.warnings);
    }

    return {
      credits: validated.credits,
      plan: validated.plan,
      userId: session?.user?.id || '',
      isAuthenticated: !!session?.user?.id,
      isValidData: validated.isValid,
      warnings: validated.warnings
    };
  }

  /**
   * Check if session data has changed significantly
   */
  static hasSignificantChange(
    current: ValidatedSessionData | null,
    previous: ValidatedSessionData | null
  ): boolean {
    if (!current || !previous) return true;
    
    return (
      Math.abs(current.credits - previous.credits) > 0 ||
      current.plan !== previous.plan
    );
  }
}
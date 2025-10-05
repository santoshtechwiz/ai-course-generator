/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FeatureGate } from '@/components/shared/FeatureGate'
import * as useFeatureAccessHook from '@/hooks/useFeatureAccess'

// Mock dependencies
vi.mock('@/hooks/useFeatureAccess')
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))
vi.mock('@/components/shared/SubscriptionUpgrade', () => ({
  SubscriptionUpgrade: ({ plan }: any) => <div data-testid="subscription-upgrade">Upgrade to {plan}</div>,
}))

describe('FeatureGate', () => {
  const mockUseFeatureAccess = vi.spyOn(useFeatureAccessHook, 'useFeatureAccess')

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('when user has access', () => {
    beforeEach(() => {
      mockUseFeatureAccess.mockReturnValue({
        canAccess: true,
        reason: null,
        requiredPlan: null,
        isAuthenticated: true,
        isSubscribed: true,
        hasCredits: true,
      })
    })

    it('should render children without blur or lock overlay', () => {
      render(
        <FeatureGate feature="quiz-access">
          <div data-testid="protected-content">Protected Content</div>
        </FeatureGate>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      expect(screen.queryByTestId('subscription-upgrade')).not.toBeInTheDocument()
    })

    it('should not apply blur effects when user has access', () => {
      const { container } = render(
        <FeatureGate feature="quiz-access" blurIntensity={8}>
          <div data-testid="protected-content">Protected Content</div>
        </FeatureGate>
      )

      const blurredElement = container.querySelector('[class*="blur"]')
      expect(blurredElement).not.toBeInTheDocument()
    })
  })

  describe('when user does not have access', () => {
    beforeEach(() => {
      mockUseFeatureAccess.mockReturnValue({
        canAccess: false,
        reason: 'subscription',
        requiredPlan: 'PREMIUM',
        isAuthenticated: true,
        isSubscribed: false,
        hasCredits: true,
      })
    })

    it('should show upgrade prompt when access denied', () => {
      render(
        <FeatureGate feature="quiz-access">
          <div data-testid="protected-content">Full Content</div>
        </FeatureGate>
      )

      expect(screen.getByTestId('subscription-upgrade')).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('should render lock overlay when showPartialContent is true', () => {
      render(
        <FeatureGate 
          feature="quiz-access"
          showPartialContent={true}
          partialContent={<div data-testid="partial-content">Preview Content</div>}
        >
          <div data-testid="protected-content">Full Content</div>
        </FeatureGate>
      )

      expect(screen.getByTestId('partial-content')).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('should pass required plan to SubscriptionUpgrade component', () => {
      mockUseFeatureAccess.mockReturnValue({
        canAccess: false,
        reason: 'subscription',
        requiredPlan: 'ENTERPRISE',
        isAuthenticated: true,
        isSubscribed: false,
        hasCredits: true,
      })

      render(
        <FeatureGate feature="quiz-access">
          <div>Full Content</div>
        </FeatureGate>
      )

      expect(screen.getByText(/Upgrade to ENTERPRISE/i)).toBeInTheDocument()
    })
  })

  describe('unauthenticated user', () => {
    beforeEach(() => {
      mockUseFeatureAccess.mockReturnValue({
        canAccess: false,
        reason: 'authentication',
        requiredPlan: null,
        isAuthenticated: false,
        isSubscribed: false,
        hasCredits: false,
      })
    })

    it('should handle unauthenticated users', () => {
      render(
        <FeatureGate feature="quiz-access">
          <div data-testid="protected-content">Full Content</div>
        </FeatureGate>
      )

      // Should not show subscription upgrade for unauthenticated users
      expect(screen.queryByTestId('subscription-upgrade')).not.toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })
  })
})

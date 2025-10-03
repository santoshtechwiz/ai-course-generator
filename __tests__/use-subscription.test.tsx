import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as AuthModule from '@/modules/auth'
import React from 'react'
import { SWRConfig } from 'swr'
import { createRoot } from 'react-dom/client'
import { useSubscription } from '../modules/subscriptions/hooks/use-subscription'
import { DEFAULT_FREE_SUBSCRIPTION } from '@/types/subscription'

// Simple hook runner without @testing-library
function runHook<T>(hook: () => T) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  let value: T
  function Test() {
    value = hook()
    return null
  }
  const root = createRoot(container)
  root.render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <Test />
    </SWRConfig>
  )
  return {
    get current() { return value! },
    unmount: () => root.unmount()
  }
}

const originalFetch = global.fetch
const mockFetch = vi.fn()

function mockFetchOnce(data: any, ok = true) {
  mockFetch.mockResolvedValueOnce({
    ok,
    status: ok ? 200 : 500,
    json: async () => data
  })
  vi.stubGlobal('fetch', mockFetch)
}

describe('useSubscription hook (minimal)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockFetch.mockReset()
  })

  it('returns free defaults when no user', async () => {
    vi.spyOn(AuthModule, 'useAuth').mockReturnValue({
      user: null,
      subscription: null,
      isAuthenticated: false,
      isLoading: false,
      refreshUserData: vi.fn(),
      logout: vi.fn()
    } as any)
    const hook = runHook(() => useSubscription())
    await new Promise(r => setTimeout(r,0))
    expect(hook.current.subscription.subscriptionPlan).toBe('FREE')
    expect(hook.current.subscription.status).toBe(DEFAULT_FREE_SUBSCRIPTION.status)
    hook.unmount()
  })

  it('fetches and normalizes subscription data for user', async () => {
    vi.spyOn(AuthModule, 'useAuth').mockReturnValue({
      user: { id: 'user-1' },
      subscription: null,
      isAuthenticated: true,
      isLoading: false,
      refreshUserData: vi.fn(),
      logout: vi.fn()
    } as any)
    mockFetchOnce({ subscriptionPlan: 'BASIC', status: 'ACTIVE', credits: 50, tokensUsed: 10, isSubscribed: true })
    const hook = runHook(() => useSubscription())
    await new Promise(r => setTimeout(r, 0))
    expect(hook.current.subscription.subscriptionPlan).toBe('BASIC')
    expect(hook.current.subscription.status).toBe('ACTIVE')
    expect(hook.current.remainingCredits).toBe(40)
    hook.unmount()
  })

  it('caps tokensUsed when inactive free plan', async () => {
    vi.spyOn(AuthModule, 'useAuth').mockReturnValue({
      user: { id: 'user-2' },
      subscription: null,
      isAuthenticated: true,
      isLoading: false,
      refreshUserData: vi.fn(),
      logout: vi.fn()
    } as any)
    mockFetchOnce({ subscriptionPlan: 'FREE', status: 'INACTIVE', credits: 5, tokensUsed: 12, isSubscribed: false })
    const hook = runHook(() => useSubscription())
    await new Promise(r => setTimeout(r, 0))
    expect(hook.current.subscription.tokensUsed).toBe(5)
    expect(hook.current.remainingCredits).toBe(0)
    hook.unmount()
  })
})
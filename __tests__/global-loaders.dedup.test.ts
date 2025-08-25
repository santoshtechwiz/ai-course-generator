import { act } from 'react'

// Mock next/navigation to avoid requiring Next.js runtime in tests
jest.mock('next/navigation', () => ({
  useRouter: () => ({}),
  usePathname: () => '/',
  useSearchParams: () => ({ toString: () => '' }),
}))

import { useGlobalLoaderStore, ROUTE_LOADER_ID } from '@/components/loaders/global-loaders'

describe('Global Loader Route De-duplication', () => {
  beforeEach(() => {
    // Clear store state between tests
    const { clearAll } = useGlobalLoaderStore.getState() as any
    act(() => {
      clearAll()
    })
  })

  test('creates a single route loader and reuses it', () => {
    const store = useGlobalLoaderStore.getState()
    const id1 = store.startLoading(undefined, { type: 'route', message: 'Navigating A' })
    const id2 = store.startLoading(undefined, { type: 'route', message: 'Navigating B' })

    expect(id1).toBe(ROUTE_LOADER_ID)
    expect(id2).toBe(id1)

    const instances = Array.from(useGlobalLoaderStore.getState().instances.values())
    const routeInstances = instances.filter(i => i.options.type === 'route')
    expect(routeInstances).toHaveLength(1)
    expect(routeInstances[0].options.message).toBe('Navigating B') // updated message
  })

  test('data loaders remain independent while route loader is reused', () => {
    const store = useGlobalLoaderStore.getState()
    const routeId = store.startLoading(undefined, { type: 'route', message: 'First nav' })
    const dataId1 = store.startLoading(undefined, { type: 'data', message: 'Fetch 1' })
    const dataId2 = store.startLoading(undefined, { type: 'data', message: 'Fetch 2' })

    expect(routeId).toBe(ROUTE_LOADER_ID)
    expect(dataId1).not.toBe(dataId2)
    expect(dataId1).not.toBe(routeId)
    expect(dataId2).not.toBe(routeId)

    const instances = Array.from(useGlobalLoaderStore.getState().instances.values())
    const dataInstances = instances.filter(i => i.options.type === 'data')
    expect(dataInstances).toHaveLength(2)
  })

  test('route loader message updates without creating new instance', () => {
    const store = useGlobalLoaderStore.getState()
    store.startLoading(undefined, { type: 'route', message: 'Opening course...' })
    const beforeSize = useGlobalLoaderStore.getState().instances.size
    store.startLoading(undefined, { type: 'route', message: 'Preparing content' })
    const afterSize = useGlobalLoaderStore.getState().instances.size
    expect(afterSize).toBe(beforeSize)
    const routeInst = Array.from(useGlobalLoaderStore.getState().instances.values()).find(i => i.options.type === 'route')!
    expect(routeInst.options.message).toBe('Preparing content')
  })

  test('non-route loader merges into active route loader when combineWithRoute true', () => {
    const store = useGlobalLoaderStore.getState()
    // Start a route loader (navigation in progress)
    const routeId = store.startLoading(undefined, { type: 'route', message: 'Navigating to dashboard' })
    expect(routeId).toBe(ROUTE_LOADER_ID)

    const before = Array.from(useGlobalLoaderStore.getState().instances.values()).find(i => i.id === routeId)!
    expect(before.options.metadata?.mergedTypes).toBeUndefined()

    // Start a data loader that should merge
    const mergedId = store.startLoading(undefined, { type: 'data', message: 'Fetching dashboard stats', combineWithRoute: true, showProgress: true, priority: 'high' })
    expect(mergedId).toBe(routeId)

    const afterInstance = Array.from(useGlobalLoaderStore.getState().instances.values()).find(i => i.id === routeId)!
    // Message should be updated to the data loader's message (since it's more specific)
    expect(afterInstance.options.message).toBe('Fetching dashboard stats')
    // Merged types should record data
    expect(afterInstance.options.metadata?.mergedTypes).toContain('data')
    // Priority should be at least high
    expect(afterInstance.options.priority === 'high' || afterInstance.options.priority === 'critical').toBe(true)
    // showProgress should be true because merged loader requested it
    expect(afterInstance.options.showProgress).toBe(true)
  })
})

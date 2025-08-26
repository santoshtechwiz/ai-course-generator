// Minimal no-op stub for deprecated global loader system.
// This prevents runtime errors from lingering imports while all usages are cleaned up.
export const ROUTE_LOADER_ID = 'route-change'

type StartOptions = any // legacy shape ignored

interface LoaderAPI {
	startLoading: (options?: StartOptions) => string
	stopLoading: (id?: string) => void
	withLoading: <T>(fn: () => Promise<T> | T) => Promise<T>
	setError: (msg: string) => void
	setSuccess: (msg: string) => void
}

const api: LoaderAPI = {
	startLoading: () => 'noop',
	stopLoading: () => {},
	withLoading: async <T>(fn: () => Promise<T> | T) => Promise.resolve(fn()),
	setError: () => {},
	setSuccess: () => {},
}

export function useGlobalLoader(): LoaderAPI { return api }
export function useGlobalLoaderStore(): LoaderAPI { return api }
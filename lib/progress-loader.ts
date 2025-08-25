// Minimal loader stub after migration to pure NProgress
// Provides backward compatible functions that no-op or wrap a promise.
export function withProgress<T>(p: Promise<T>): Promise<T> { return p }
export function startLoading(): void {}
export function stopLoading(): void {}

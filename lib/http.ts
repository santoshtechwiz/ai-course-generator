export const fetchWithTimeout = async (
  input: RequestInfo,
  init: RequestInit = {},
  timeoutMs = 10000
): Promise<Response | undefined> => {
  const controller = new AbortController()
  const id = setTimeout(() => {
    if (!controller.signal.aborted) {
      controller.abort()
    }
  }, timeoutMs)
  try {
    const response = await fetch(input, { ...init, signal: controller.signal })
    return response
  } catch (err: any) {
    // Gracefully ignore AbortError
    if (err?.name === 'AbortError') {
      return undefined
    }
    throw err
  } finally {
    clearTimeout(id)
  }
}

export const fetchJsonWithTimeout = async <T>(
  input: RequestInfo,
  init: RequestInit = {},
  timeoutMs = 10000
): Promise<T> => {
  const res = await fetchWithTimeout(input, init, timeoutMs)
  if (!res) {
    // Request was aborted due to timeout; throw friendly error
    throw new Error('Request timed out. Please try again.')
  }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}
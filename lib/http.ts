export const fetchWithTimeout = async (
  input: RequestInfo,
  init: RequestInit = {},
  timeoutMs = 10000
): Promise<Response> => {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(input, { ...init, signal: controller.signal })
    return response
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
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}
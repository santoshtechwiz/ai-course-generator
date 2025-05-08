/**
 * Utility function to fetch with authentication
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // Get the token from localStorage or wherever it's stored
  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null

  // Set up headers with authentication
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  // Return the fetch promise
  return fetch(url, {
    ...options,
    headers,
  })
}

import useSWR from 'swr'


export interface Category {
  id: string
  name: string
  courseCount?: number
}

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error('Failed to load categories')
  return r.json()
})

/**
 * useCategories - shared SWR hook that dedupes category fetches across components.
 * Caches for 60s and avoids refetch on window focus for stability.
 */
export function useCategories() {
  // loader system removed; placeholder no-ops retained for future extension
  const startLoading = () => {}
  const stopLoading = () => {}
  const swr = useSWR<Category[]>(
    '/api/categories',
    async (url: string) => {
      startLoading()
      try {
        return await fetcher(url)
      } finally {
        stopLoading()
      }
    },
    {
      dedupingInterval: 60_000,
      revalidateOnFocus: false,
      revalidateIfStale: true,
      revalidateOnReconnect: true,
    }
  )
  return swr
}

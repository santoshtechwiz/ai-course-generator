import { useGlobalLoader } from '@/components/loaders/global-loaders'
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
  // useGlobalLoader no longer exposes beginTask/endTask; use startLoading/stopLoading
  const { startLoading, stopLoading } = useGlobalLoader()
  const swr = useSWR<Category[]>(
    '/api/categories',
    async (url: string) => {
      // startLoading returns a loader id we must use to stop it later
      const loaderId = startLoading({ message: 'Loading categories...', type: 'data', minVisibleMs: 150 })
      try {
        return await fetcher(url)
      } finally {
        try {
          stopLoading(loaderId)
        } catch {}
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

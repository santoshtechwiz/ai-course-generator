import useSWR from 'swr'
import { useGlobalLoader } from '@/store/loaders/global-loader'

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
  const { beginTask, endTask } = useGlobalLoader()
  const swr = useSWR<Category[]>(
    '/api/categories',
    async (url: string) => {
      beginTask('categories', 1)
      try {
        return await fetcher(url)
      } finally {
        endTask('categories')
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

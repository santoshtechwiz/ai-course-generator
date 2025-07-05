import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface LoadingState {
  id: string
  message?: string
  subMessage?: string
  progress?: number
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  theme?: 'primary' | 'secondary' | 'accent' | 'neutral'
  isBlocking?: boolean // Whether this loading state should block user interaction
  priority?: number // Higher priority loaders take precedence
}

interface GlobalLoadingStore {
  loadingStates: LoadingState[]
  isLoading: boolean
  currentLoader: LoadingState | null
  
  // Actions
  showLoading: (state: Omit<LoadingState, 'id'> & { id?: string }) => string
  hideLoading: (id: string) => void
  hideAllLoading: () => void
  updateLoading: (id: string, updates: Partial<LoadingState>) => void
  
  // Computed getters
  getActiveLoader: () => LoadingState | null
  hasBlockingLoader: () => boolean
}

export const useGlobalLoadingStore = create<GlobalLoadingStore>()(
  devtools(
    (set, get) => ({
      loadingStates: [],
      isLoading: false,
      currentLoader: null,

      showLoading: (state) => {
        const id = state.id || `loader_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const newState: LoadingState = {
          ...state,
          id,
          priority: state.priority ?? 0,
          isBlocking: state.isBlocking ?? false,
          variant: state.variant ?? 'spinner',
          size: state.size ?? 'md',
          theme: state.theme ?? 'primary',
        }

        set((store) => {
          const newLoadingStates = [...store.loadingStates, newState]
          const activeLoader = getActiveLoaderFromStates(newLoadingStates)
          
          return {
            loadingStates: newLoadingStates,
            isLoading: newLoadingStates.length > 0,
            currentLoader: activeLoader,
          }
        })

        return id
      },

      hideLoading: (id) => {
        set((store) => {
          const newLoadingStates = store.loadingStates.filter(state => state.id !== id)
          const activeLoader = getActiveLoaderFromStates(newLoadingStates)
          
          return {
            loadingStates: newLoadingStates,
            isLoading: newLoadingStates.length > 0,
            currentLoader: activeLoader,
          }
        })
      },

      hideAllLoading: () => {
        set({
          loadingStates: [],
          isLoading: false,
          currentLoader: null,
        })
      },

      updateLoading: (id, updates) => {
        set((store) => {
          const newLoadingStates = store.loadingStates.map(state =>
            state.id === id ? { ...state, ...updates } : state
          )
          const activeLoader = getActiveLoaderFromStates(newLoadingStates)
          
          return {
            loadingStates: newLoadingStates,
            currentLoader: activeLoader,
          }
        })
      },

      getActiveLoader: () => get().currentLoader,
      hasBlockingLoader: () => get().loadingStates.some(state => state.isBlocking),
    }),
    {
      name: 'global-loading-store',
    }
  )
)

// Helper function to determine which loader should be active
function getActiveLoaderFromStates(states: LoadingState[]): LoadingState | null {
  if (states.length === 0) return null
  
  // Sort by priority (highest first), then by creation time (most recent first)
  const sortedStates = [...states].sort((a, b) => {
    if (a.priority !== b.priority) {
      return (b.priority ?? 0) - (a.priority ?? 0)
    }
    // Use the timestamp from the ID to determine creation order
    const aTime = parseInt(a.id.split('_')[1]) || 0
    const bTime = parseInt(b.id.split('_')[1]) || 0
    return bTime - aTime
  })
  
  return sortedStates[0]
}

// Convenience hooks
export const useGlobalLoading = () => {
  const store = useGlobalLoadingStore()
  
  return {
    isLoading: store.isLoading,
    currentLoader: store.currentLoader,
    showLoading: store.showLoading,
    hideLoading: store.hideLoading,
    hideAllLoading: store.hideAllLoading,
    updateLoading: store.updateLoading,
    hasBlockingLoader: store.hasBlockingLoader,
  }
}

export default useGlobalLoadingStore

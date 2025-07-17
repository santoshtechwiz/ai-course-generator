// Deprecated - types moved to store/global-loader.ts
// Re-export for backward compatibility
export type { LoaderOptions, LoaderTheme, LoaderSize, LoaderVariant } from "../../store/global-loader"
export type { LoaderState as GlobalLoaderState } from "../../store/global-loader"

// Legacy types for backward compatibility
export type LoaderType = "default" | "card" | "course" | "section"

export interface LegacyLoaderState {
  open: boolean
  message?: string
  type?: LoaderType
}

// For backward compatibility, export as LoaderState
export type LoaderState = LegacyLoaderState

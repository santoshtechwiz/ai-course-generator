export type LoaderState = "idle" | "loading" | "success" | "error"

export type LoaderType = "default" | "card" | "course" | "section" | "inline" | "fullscreen"

export interface LoaderOptions {
  message?: string
  subMessage?: string
  progress?: number
  isBlocking?: boolean
  minVisibleMs?: number
  autoDismissMs?: number
  type?: LoaderType
}

export interface LoaderState {
  open: boolean
  message?: string
  type?: LoaderType
}

export interface ProgressOptions {
  current: number
  total: number
  message?: string
  subMessage?: string
}

export type LoaderType = "default" | "card" | "course" | "section"

export interface LoaderState {
  open: boolean
  message?: string
  type?: LoaderType
}

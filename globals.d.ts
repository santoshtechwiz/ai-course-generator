declare module '@/store' {
  const _a: any
  export type RootState = any
  export default _a
}

declare module '@/app/types/quiz-types' {
  export type QuizType = any
  export * from '@/app/types/quiz-types'
}

declare module '@/constants/global' {
  export const STORAGE_KEYS: any
  export const API_PATHS: any
}

declare module '@/utils/storage-manager' {
  export const storageManager: any
  export type QuizProgress = any
}

declare module '@/components/ui/chart' { const _: any; export default _ }

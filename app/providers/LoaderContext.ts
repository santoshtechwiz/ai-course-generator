// "use client"

// /** @jsxImportSource react */

// import type React from "react"
// import { createContext, useState, useContext, useCallback, type ReactNode } from "react"

// type LoaderContextType = {
//   isLoading: boolean
//   setIsLoading: (loading: boolean) => void
// }

// const LoaderContext = createContext<LoaderContextType | undefined>(undefined)

// interface LoaderProviderProps {
//   children: ReactNode
// }

// export const LoaderProvider: React.FC<LoaderProviderProps> = ({ children }) => {
//   const [isLoading, setIsLoadingState] = useState(false)
//   const [timer, setTimer] = useState<NodeJS.Timeout | null>(null)

//   const setIsLoading = useCallback(
//     (loading: boolean) => {
//       if (loading) {
//         setIsLoadingState(true)
//       } else {
//         if (timer) clearTimeout(timer)
//         const newTimer = setTimeout(() => setIsLoadingState(false), 300)
//         setTimer(newTimer)
//       }
//     },
//     [timer],
//   )

//   return <LoaderContext.Provider value={{ isLoading, setIsLoading }}>{children}</LoaderContext.Provider>
// }

// export const useLoaderContext = (): LoaderContextType => {
//   const context = useContext(LoaderContext)
//   if (context === undefined) {
//     throw new Error("useLoaderContext must be used within a LoaderProvider")
//   }
//   return context
// }


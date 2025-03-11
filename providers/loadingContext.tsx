// import { createContext, useContext, useState } from "react"

// interface LoaderContext {
//   startNavigation: () => void
//   completeNavigation: () => void
// }

// const LoaderContext = createContext<LoaderContext | null>(null)

// export const LoaderProvider = ({ children }: { children: React.ReactNode }) => {
//   const [isLoading, setIsLoading] = useState(false)

//   const startNavigation = () => {
//     setIsLoading(true)
//   }

//   const completeNavigation = () => {
//     setIsLoading(false)
//   }

//   return <LoaderContext.Provider value={{ startNavigation, completeNavigation }}>{children}</LoaderContext.Provider>
// }

// export const useLoaderContext = () => {
//   const context = useContext(LoaderContext)
//   if (context === null) {
//     throw new Error("useLoaderContext must be used within a LoaderProvider")
//   }
//   return context
// }


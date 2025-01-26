
import { Suspense } from "react"
import { SuccessContent } from "./components/SuccessContent"


export default function SuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <Suspense
        fallback={
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        }
      >
        <SuccessContent />
      </Suspense>
    </div>
  )
}


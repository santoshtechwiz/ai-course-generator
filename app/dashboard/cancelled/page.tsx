import { CancelledContent } from "./components/CancelledContent"

export default function CancelledPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      {/* Call the CancelledContent function */}
      <CancelledContent />
    </div>
  )
}


import { AlertTriangle } from "lucide-react"

// Redesigned DevModeBanner component
export default function DevModeBanner() {
  return (
    <div
      className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-400 p-4 mb-8 rounded-xl shadow-sm"
      role="alert"
    >
      <div className="flex items-center">
        <AlertTriangle className="h-5 w-5 mr-2" />
        <p className="font-bold">Development Mode</p>
      </div>
      <p>You are currently in development mode. Stripe payments are in test mode.</p>
    </div>
  )
}

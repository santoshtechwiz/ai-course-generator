import { Sparkles } from "lucide-react"
import type { PlanConfig } from "@/types/subscription-plans"
import { calculateSavings } from "@/types/subscription/utils"

// Redesigned SavingsHighlight component
export default function SavingsHighlight({
  plan,
  duration,
}: { plan: PlanConfig; duration: 1 | 6 }) {
  const monthlyPrice = plan.options.find((o: any) => o.duration === 1)?.price || 0
  const biAnnualPrice = plan.options.find((o: any) => o.duration === 6)?.price || 0
  const savings = calculateSavings(monthlyPrice, biAnnualPrice, 12)

  if (duration === 1 || plan.name === "FREE" || savings <= 0) return null

  return (
    <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-md border-4 border-green-100 dark:border-green-800 shadow-[4px_4px_0px_0px_hsl(var(--border))]">
      <div className="text-sm text-green-700 dark:text-green-400 font-semibold flex items-center">
        <Sparkles className="h-4 w-4 mr-1 text-green-500" />
        Save {savings}% with bi-annual plan!
      </div>
      <div className="text-xs text-green-600 dark:text-green-500">
        That's ${(monthlyPrice * 6 - biAnnualPrice).toFixed(2)} in savings!
      </div>
    </div>
  )
}

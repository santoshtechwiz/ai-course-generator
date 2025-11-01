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
    <div className="mt-2 p-2 bg-success/10 dark:bg-success/5 rounded-none border-4 border-success/20 shadow-neo">
      <div className="text-sm text-success font-semibold flex items-center">
        <Sparkles className="h-4 w-4 mr-1 text-success" />
        Save {savings}% with bi-annual plan!
      </div>
      <div className="text-xs text-success/80">
        That's ${(monthlyPrice * 6 - biAnnualPrice).toFixed(2)} in savings!
      </div>
    </div>
  )
}

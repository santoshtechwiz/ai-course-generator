
import { calculateSavings } from "@/lib/subscription-formatter";
import { Sparkles } from "lucide-react";
import { SUBSCRIPTION_PLANS } from "../subscription-plans";


// Redesigned SavingsHighlight component
export default function SavingsHighlight({ plan, duration }: { plan: (typeof SUBSCRIPTION_PLANS)[0]; duration: 1 | 6 }) {
    const monthlyPrice = plan.options.find((o) => o.duration === 1)?.price || 0
    const biAnnualPrice = plan.options.find((o) => o.duration === 6)?.price || 0
    const savings = calculateSavings(monthlyPrice, biAnnualPrice, 12)
  
    if (duration === 1 || plan.name === "FREE" || savings <= 0) return null
  
    return (
      <div className="mt-2 p-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-md border border-green-100 dark:border-green-800">
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

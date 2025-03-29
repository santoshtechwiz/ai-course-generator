import { Package, Zap, BarChart, MessageSquare } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ADD_ON_PACKAGES } from "@/app/dashboard/subscription/components/subscription.config"
import { Badge } from "@/components/ui/badge"

export function AddOnPackages() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
          Add-On Packages
        </h2>
        <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
          Enhance your experience with these additional packages that can be added to any subscription plan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {ADD_ON_PACKAGES.map((pkg) => (
          <Card
            key={pkg.id}
            className="flex flex-col h-full border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all duration-300"
          >
            <CardHeader>
              <div className="p-3 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 w-fit mb-4">
                {pkg.id === "token-booster" && <Zap className="h-6 w-6 text-blue-500" />}
                {pkg.id === "analytics-pro" && <BarChart className="h-6 w-6 text-purple-500" />}
                {pkg.id === "api-package" && <Package className="h-6 w-6 text-amber-500" />}
                {pkg.id === "support-plus" && <MessageSquare className="h-6 w-6 text-green-500" />}
              </div>
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl">{pkg.name}</CardTitle>
                <Badge
                  variant="outline"
                  className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                >
                  One-time
                </Badge>
              </div>
              <CardDescription className="mt-2">{pkg.description}</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">${pkg.price}</span>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-3 text-sm">
                {pkg.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Zap className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300"
              >
                Add to Cart
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}


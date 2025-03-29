import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ProfitStrategy() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tight">Profit Optimization Strategy</h2>
        <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
          A comprehensive approach to maximize revenue while managing API costs
        </p>
      </div>

      <Tabs defaultValue="pricing">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pricing">Pricing Strategy</TabsTrigger>
          <TabsTrigger value="api">API Cost Management</TabsTrigger>
          <TabsTrigger value="upsell">Upselling Opportunities</TabsTrigger>
        </TabsList>

        <TabsContent value="pricing" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tiered Pricing Model</CardTitle>
                <CardDescription>Strategic pricing to maximize conversions and revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Free Plan</h4>
                    <p className="text-sm text-muted-foreground">
                      Serves as an acquisition tool with limited features to encourage upgrades. Increased token count
                      from 10 to 15 to improve initial experience.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Basic Plan</h4>
                    <p className="text-sm text-muted-foreground">
                      Price increased from $9.99 to $12.99 to better reflect value and cover API costs. Token count
                      increased from 50 to 60 to justify the price increase.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Pro Plan</h4>
                    <p className="text-sm text-muted-foreground">
                      Price increased from $19.99 to $24.99 with AI Accuracy feature now included. Token count increased
                      from 200 to 250 and positioned as the "most popular" option.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Ultimate Plan</h4>
                    <p className="text-sm text-muted-foreground">
                      Price increased from $39.99 to $49.99 to create appropriate price anchoring. Token count increased
                      from 500 to 600 to justify premium pricing.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Annual Billing Incentives</CardTitle>
                <CardDescription>Encouraging longer commitments for better cash flow</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">6-Month Billing</h4>
                    <p className="text-sm text-muted-foreground">
                      10% discount compared to monthly billing to encourage longer commitment. Improves cash flow
                      predictability and reduces payment processing costs.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Annual Billing</h4>
                    <p className="text-sm text-muted-foreground">
                      17% discount compared to monthly billing to maximize upfront revenue. Set as the default option to
                      anchor users toward annual commitment.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Visual Savings Indicators</h4>
                    <p className="text-sm text-muted-foreground">
                      Clear badges showing percentage savings to highlight the value of longer commitments. Creates
                      psychological incentive to choose annual plans.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="api" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>API Usage Limits</CardTitle>
                <CardDescription>Controlling costs through strategic usage caps</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Daily API Call Limits</h4>
                    <p className="text-sm text-muted-foreground">
                      Each tier has specific API call limits per day to prevent abuse and control costs:
                      <ul className="list-disc pl-5 mt-2">
                        <li>Free: 10 calls/day</li>
                        <li>Basic: 50 calls/day</li>
                        <li>Pro: 200 calls/day</li>
                        <li>Ultimate: 500 calls/day</li>
                      </ul>
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Token-Based System</h4>
                    <p className="text-sm text-muted-foreground">
                      Tokens act as a secondary limit on API usage, creating a dual-constraint system that prevents
                      excessive usage while providing flexibility to users.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Optimization Techniques</CardTitle>
                <CardDescription>Strategies to reduce API expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Caching Responses</h4>
                    <p className="text-sm text-muted-foreground">
                      Implement aggressive caching for similar queries to reduce redundant API calls. Store and reuse
                      common quiz patterns and questions.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Model Selection</h4>
                    <p className="text-sm text-muted-foreground">
                      Use different AI models based on the subscription tier:
                      <ul className="list-disc pl-5 mt-2">
                        <li>Free/Basic: Use smaller, more cost-effective models</li>
                        <li>Pro/Ultimate: Use advanced models with better accuracy</li>
                      </ul>
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Prompt Engineering</h4>
                    <p className="text-sm text-muted-foreground">
                      Optimize prompts to reduce token usage and improve response quality. Implement system-level
                      prompts that are more efficient.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="upsell" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Add-On Packages</CardTitle>
                <CardDescription>Additional revenue streams beyond subscriptions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Token Boosters</h4>
                    <p className="text-sm text-muted-foreground">
                      One-time purchases that add tokens to any subscription plan. High-margin product with perceived
                      value that exceeds API costs.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Analytics Add-Ons</h4>
                    <p className="text-sm text-muted-foreground">
                      Premium analytics features that provide insights into quiz effectiveness. Low API cost with high
                      perceived value for educational institutions.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">API Packages</h4>
                    <p className="text-sm text-muted-foreground">
                      Additional API calls for power users who need more than their plan allows. Priced with sufficient
                      margin to cover costs and generate profit.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversion Optimization</CardTitle>
                <CardDescription>Strategies to move users up the subscription ladder</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Feature Gating</h4>
                    <p className="text-sm text-muted-foreground">
                      Strategic distribution of features across tiers to encourage upgrades. Most valuable features (AI
                      Accuracy, Priority Support) reserved for higher tiers.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Usage-Based Prompts</h4>
                    <p className="text-sm text-muted-foreground">
                      Trigger upgrade prompts when users approach their limits. Show preview of advanced features with
                      one-click upgrade options.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Limited-Time Promotions</h4>
                    <p className="text-sm text-muted-foreground">
                      Occasional discounts on annual plans to convert monthly subscribers. Special offers for
                      educational institutions during key enrollment periods.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}


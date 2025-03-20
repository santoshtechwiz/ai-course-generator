"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { CoinsIcon as Tokens, CreditCard, Check } from "lucide-react"

interface TokenPurchaseProps {
  currentTokens?: number
  onPurchase?: (amount: number) => void
}

export function TokenPurchase({ currentTokens = 0, onPurchase }: TokenPurchaseProps) {
  const [tokenAmount, setTokenAmount] = useState(50)
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [isProcessing, setIsProcessing] = useState(false)

  // Calculate price based on token amount (with volume discount)
  const calculatePrice = (amount: number) => {
    let price = amount * 0.1 // Base price: $0.10 per token

    // Apply volume discounts
    if (amount >= 200) {
      price = amount * 0.07 // 30% discount for 200+ tokens
    } else if (amount >= 100) {
      price = amount * 0.08 // 20% discount for 100+ tokens
    } else if (amount >= 50) {
      price = amount * 0.09 // 10% discount for 50+ tokens
    }

    return price.toFixed(2)
  }

  const handlePurchase = async () => {
    setIsProcessing(true)

    try {
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "purchase_tokens",
          tokenAmount,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || "Failed to process token purchase")
      }

      if (data.sessionId) {
        const stripe = await getStripe()
        if (stripe) {
          await stripe.redirectToCheckout({ sessionId: data.sessionId })
        }
      } else if (onPurchase) {
        onPurchase(tokenAmount)
      }
    } catch (error) {
      console.error("Token purchase error:", error)
      // Handle error
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Purchase Additional Tokens</CardTitle>
          <CardDescription>Tokens can be used for generating quizzes and other premium features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Current Balance</h3>
              <div className="flex items-center mt-1">
                <Tokens className="h-4 w-4 mr-1 text-primary" />
                <span>{currentTokens} tokens</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Select Token Amount</Label>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">10 tokens</span>
              <span className="text-sm text-muted-foreground">500 tokens</span>
            </div>
            <Slider
              value={[tokenAmount]}
              min={10}
              max={500}
              step={10}
              onValueChange={(value) => setTokenAmount(value[0])}
              className="my-2"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Tokens className="h-4 w-4 mr-1 text-primary" />
                <Input
                  type="number"
                  value={tokenAmount}
                  onChange={(e) => {
                    const value = Number.parseInt(e.target.value)
                    if (value >= 10 && value <= 500) {
                      setTokenAmount(value)
                    }
                  }}
                  className="w-20"
                />
                <span className="ml-2">tokens</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">${calculatePrice(tokenAmount)}</div>
                {tokenAmount >= 50 && (
                  <span className="text-xs text-green-600 flex items-center">
                    <Check className="h-3 w-3 mr-1" />
                    Volume discount applied
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Label className="mb-3 block">Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
              <div className="flex items-center space-x-2 border rounded-md p-3">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex items-center cursor-pointer">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Credit / Debit Card
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-md p-3">
                <RadioGroupItem value="paypal" id="paypal" />
                <Label htmlFor="paypal" className="cursor-pointer">
                  PayPal
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg mt-4">
            <h3 className="font-medium mb-2">Purchase Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{tokenAmount} Tokens</span>
                <span>${calculatePrice(tokenAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between font-medium pt-2 border-t">
                <span>Total</span>
                <span>${calculatePrice(tokenAmount)}</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handlePurchase} disabled={isProcessing}>
            {isProcessing ? "Processing..." : `Purchase ${tokenAmount} Tokens`}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

async function getStripe() {
  const { loadStripe } = await import("@stripe/stripe-js")
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
}


import { NextRequest, NextResponse } from "next/server"
import { PaymentConfigValidator } from "@/app/dashboard/subscription/services/payment-config-manager"
import { PaymentProvider } from "@/app/dashboard/subscription/services/payment-gateway-interface"

/**
 * Development endpoint to check payment gateway environment setup
 * Only available in development mode
 */
export async function GET(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Environment check not available in production" },
      { status: 404 }
    )
  }

  try {
    const setupInfo = PaymentConfigValidator.checkEnvironmentSetup()
    const stripeEnvErrors = PaymentConfigValidator.validateEnvironment(PaymentProvider.STRIPE)

    const response = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      setup: setupInfo,
      stripeValidation: {
        isValid: stripeEnvErrors.length === 0,
        errors: stripeEnvErrors,
      },
      currentConfig: {
        hasStripeSecret: !!(process.env.STRIPE_SECRET_KEY ),
        hasStripeWebhook: !!process.env.STRIPE_WEBHOOK_SECRET,
        nodeEnv: process.env.NODE_ENV,
        keyType: process.env.STRIPE_SECRET_KEY 
          ? process.env.STRIPE_SECRET_KEY.substring(0, 7) + "..."
          : process.env.STRIPE_SECRET_KEY 
            ? process.env.STRIPE_SECRET_KEY.substring(0, 8) + "..."
            : "none",
      },
      recommendations: [
        ...(setupInfo.suggestions || []),
        "Restart your development server after changing environment variables",
        "Make sure .env.local is in your project root and not committed to git",
      ],
    }

    return NextResponse.json(response, { 
      status: setupInfo.isValid ? 200 : 400,
      headers: {
        'Content-Type': 'application/json',
      }
    })
  } catch (error) {
    return NextResponse.json(
      { 
        error: "Failed to check environment setup",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

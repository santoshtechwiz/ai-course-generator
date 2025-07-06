import { type NextRequest, NextResponse } from "next/server"

/**
 * Debugging webhook handler to identify import issues
 */
export async function POST(req: NextRequest) {
  try {
    console.log("Webhook POST received")
    
    // Test imports one by one to identify the problematic one
    try {
      const { PaymentProvider } = await import("@/app/dashboard/subscription/services/payment-gateway-interface")
      console.log("✅ PaymentProvider imported successfully")
    } catch (error) {
      console.error("❌ PaymentProvider import failed:", error)
      throw error
    }
    
    try {
      const { PaymentWebhookHandler } = await import("@/app/dashboard/subscription/services/payment-webhook-handler")
      console.log("✅ PaymentWebhookHandler imported successfully")
    } catch (error) {
      console.error("❌ PaymentWebhookHandler import failed:", error)
      throw error
    }
    
    try {
      const { TokenService } = await import("@/app/dashboard/subscription/services/token-service")
      console.log("✅ TokenService imported successfully")
    } catch (error) {
      console.error("❌ TokenService import failed:", error)
      throw error
    }
    
    try {
      const services = await import("@/app/dashboard/subscription/services")
      console.log("✅ Services index imported successfully")
    } catch (error) {
      console.error("❌ Services index import failed:", error)
      throw error
    }
    
    return NextResponse.json({ 
      status: "success",
      message: "All imports successful",
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error("Webhook POST error:", error)
    return NextResponse.json(
      { 
        status: "error",
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5).join('\n') // First 5 lines of stack trace
      }, 
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    console.log("Webhook GET received")
    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      message: "Debugging webhook handler is operational"
    })
  } catch (error: any) {
    console.error("Webhook GET error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: error.message
      },
      { status: 500 }
    )
  }
}

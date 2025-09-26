import { type NextRequest, NextResponse } from "next/server"

// This endpoint has been moved to /api/subscriptions/create
// Keeping this for backward compatibility and to provide a helpful redirect

export async function POST(req: NextRequest) {
  // Log the deprecated endpoint usage for monitoring
  console.warn("DEPRECATED: POST /api/subscription/subscribe called. Use POST /api/subscriptions/create instead.")

  // Redirect to the correct endpoint
  const url = new URL(req.url)
  url.pathname = '/api/subscriptions/create'

  return NextResponse.redirect(url, 308) // 308 Permanent Redirect
}

export async function GET() {
  return NextResponse.json(
    {
      error: "Endpoint moved",
      message: "This endpoint has been moved to /api/subscriptions/create",
      correctEndpoint: "/api/subscriptions/create"
    },
    { status: 410 } // 410 Gone
  )
}
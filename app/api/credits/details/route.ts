import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { creditService } from "@/services/credit-service"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const details = await creditService.getCreditDetails(session.user.id)
    
    return NextResponse.json({
      success: true,
      data: {
        hasCredits: details.hasCredits,
        remainingCredits: details.currentBalance,
        totalCredits: details.details.totalCredits,
        usedCredits: details.details.used,
        details: details.details
      }
    })
  } catch (error) {
    console.error('[Credit API] Error:', error)
    return NextResponse.json(
      { 
        error: "Failed to fetch credit details",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
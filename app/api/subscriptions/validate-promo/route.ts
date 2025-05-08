/**
 * API Route: /api/subscriptions/validate-promo
 *
 * Validates promo codes for subscription discounts
 */

import { type NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"

// Define valid promo codes and their discounts
const VALID_PROMO_CODES: Record<string, { discount: number; expiresAt?: Date }> = {
  AILAUNCH20: { discount: 20 }, // No expiration
  WELCOME10: { discount: 10, expiresAt: new Date("2025-12-31") },
  SUMMER25: { discount: 25, expiresAt: new Date("2025-08-31") },
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication (optional - can be used for user-specific promos)
    const session = await getAuthSession()

    // Parse request body
    const body = await req.json()
    const { promoCode } = body

    if (!promoCode || typeof promoCode !== "string") {
      return NextResponse.json({ valid: false, message: "Invalid promo code format" }, { status: 400 })
    }

    // Normalize promo code (uppercase)
    const normalizedCode = promoCode.toUpperCase().trim()

    // Check if promo code exists
    const promoDetails = VALID_PROMO_CODES[normalizedCode]

    if (!promoDetails) {
      return NextResponse.json({ valid: false, message: "Invalid promo code" }, { status: 200 })
    }

    // Check if promo code has expired
    if (promoDetails.expiresAt && new Date() > promoDetails.expiresAt) {
      return NextResponse.json({ valid: false, message: "Promo code has expired" }, { status: 200 })
    }

    // Return valid promo code details
    return NextResponse.json({
      valid: true,
      discountPercentage: promoDetails.discount,
      message: `${promoDetails.discount}% discount applied`,
    })
  } catch (error) {
    console.error("Error validating promo code:", error)
    return NextResponse.json({ valid: false, message: "Failed to validate promo code" }, { status: 500 })
  }
}

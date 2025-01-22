import { NextResponse } from "next/server"
import { trackServerSideInteraction, updateUserEngagement } from "@/lib/tracking"

export async function POST(req: Request) {
  const { userId, interactionType, entityId, entityType, metadata } = await req.json()

  if (!userId || !interactionType || !entityId || !entityType) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  await trackServerSideInteraction(userId, interactionType, entityId, entityType, metadata)
  await updateUserEngagement(userId)

  return NextResponse.json({ success: true })
}


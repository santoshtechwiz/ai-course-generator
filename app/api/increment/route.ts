import { viewCountQueue } from "@/lib/viewCountQueue"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { slug } = await req.json()

  if (!slug) {
    return NextResponse.json({ status: 400 })
  }

  try {
    // Fire-and-forget increment - don't wait for the result
    viewCountQueue.increment(slug)

    // Return immediately without getting view count (not needed by middleware)
    return NextResponse.json({ status: 200 })
  } catch (error) {
    console.error("Error incrementing view count:", error)
    return NextResponse.json({ status: 400 })
  }
}

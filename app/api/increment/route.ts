import { viewCountQueue } from "@/lib/viewCountQueue"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { slug } = await req.json()

  if (!slug) {
    return NextResponse.json({ status: 400 })
  }

  try {
    viewCountQueue.increment(slug)
    const currentViewCount = await viewCountQueue.getViewCount(slug)

    return NextResponse.json({ status: 200 })
  } catch (error) {
    console.error("Error incrementing view count:", error)
    return NextResponse.json({ status: 400 })
  }
}

import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")
  const testId = searchParams.get("testId")

  // In a real app, this would fetch data from a database

  if (userId) {
    // Return email stats for a specific user
    return NextResponse.json({
      stats: {
        totalEmails: 24,
        opens: 18,
        clicks: 12,
        openRate: 0.75,
        clickRate: 0.5,
      },
    })
  }

  if (testId) {
    // Return A/B test stats
    return NextResponse.json({
      stats: [
        {
          variant: "A",
          sends: 1000,
          opens: 350,
          clicks: 120,
          openRate: 0.35,
          clickRate: 0.12,
        },
        {
          variant: "B",
          sends: 1000,
          opens: 420,
          clicks: 180,
          openRate: 0.42,
          clickRate: 0.18,
        },
      ],
    })
  }

  // Return general email stats
  return NextResponse.json({
    stats: {
      totalEmails: 12500,
      opens: 7500,
      clicks: 3200,
      openRate: 0.6,
      clickRate: 0.256,
    },
  })
}

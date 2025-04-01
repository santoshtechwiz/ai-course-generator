import { NextResponse } from "next/server"
import { getCampaigns } from "@/lib/email/campaign-service"

export async function GET(request: Request) {
  try {
    const campaigns = await getCampaigns()
    return NextResponse.json({ campaigns })
  } catch (error) {
    console.error("Error fetching campaigns:", error)
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const campaignData = await request.json()

    // Validate required fields
    if (!campaignData.name || !campaignData.subject || !campaignData.templateId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // In a real app, this would create a campaign in the database
    // For now, just return a mock response
    return NextResponse.json({
      success: true,
      campaign: {
        id: Math.random().toString(36).substring(2, 15),
        ...campaignData,
        status: "DRAFT",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
  } catch (error) {
    console.error("Error creating campaign:", error)
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 })
  }
}


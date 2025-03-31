import { type NextRequest, NextResponse } from "next/server"
import { createContactSubmission } from "@/app/actions/actions"
import { sendEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Validate required fields
    if (!data.name || !data.email || !data.message) {
      return NextResponse.json({ error: "Name, email, and message are required" }, { status: 400 })
    }

    // Create contact submission in database
    const result = await createContactSubmission({
      name: data.name,
      email: data.email,
      message: data.message,
    })

    if (!result.success) {
      throw new Error(result.error || "Failed to save contact submission")
    }

    // Send notification email to admin
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM
    if (adminEmail) {
      await sendEmail(adminEmail, data.name)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing contact form:", error)
    return NextResponse.json({ error: "Failed to process contact form submission" }, { status: 500 })
  }
}


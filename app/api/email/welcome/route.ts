import { NextResponse } from "next/server"

import { render } from "@react-email/render"
import { sendEmail } from "@/lib/email"
import WelcomeEmail from "@/app/dashboard/admin/components/templates/welcome-email"

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Render the welcome email
    const html = render(WelcomeEmail({ name: name || "there" }))

    const info = await sendEmail(email, name || "there", await html)

    return NextResponse.json({ success: true, messageId: info.messageId })
  } catch (error) {
    console.error("Error sending welcome email:", error)
    return NextResponse.json({ error: "Failed to send welcome email" }, { status: 500 })
  }
}

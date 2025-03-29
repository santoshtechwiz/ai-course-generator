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
      await sendEmail({
        to: adminEmail,
        subject: "New Contact Form Submission",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">New Contact Form Submission</h2>
            <p><strong>From:</strong> ${data.name} (${data.email})</p>
            <p><strong>Message:</strong></p>
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
              ${data.message}
            </div>
            <p>Please respond to this inquiry through the admin dashboard.</p>
          </div>
        `,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing contact form:", error)
    return NextResponse.json({ error: "Failed to process contact form submission" }, { status: 500 })
  }
}


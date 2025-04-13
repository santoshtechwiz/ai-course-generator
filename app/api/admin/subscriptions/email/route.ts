import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { sendEmail } from "@/lib/email"

export async function POST(request: Request) {
  try {
    // Check authentication and admin status
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { name, emails, scheduledDate } = body

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required and must be a string" }, { status: 400 })
    }

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: "Emails are required and must be a non-empty array" }, { status: 400 })
    }

    if (scheduledDate && isNaN(Date.parse(scheduledDate))) {
      return NextResponse.json({ error: "Invalid scheduled date" }, { status: 400 })
    }

    // Simulate sending emails
    console.log(`Sending emails to ${emails.length} recipients`)
    console.log(`Name: ${name}`)
    if (scheduledDate) {
      console.log(`Scheduled Date: ${scheduledDate}`)
    }

    for (const email of emails) {
      if (
        typeof email === "object" &&
        typeof email.to === "string" &&
        typeof email.subject === "string" &&
        typeof email.html === "string" &&
        typeof email.recipientName === "string"
      ) {
        const personalizedHtml = email.html;
        await sendEmail(email.to, email.subject, personalizedHtml);
      } else {
        console.error(`Invalid email object: ${JSON.stringify(email)}`);
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: `Emails sent to ${emails.length} recipients`,
      recipients: emails,
    })
  } catch (error) {
    console.error("Error sending emails:", error)
    return NextResponse.json({ error: "Failed to send emails" }, { status: 500 })
  }
}

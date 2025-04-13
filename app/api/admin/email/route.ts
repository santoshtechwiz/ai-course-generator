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
    const { name, emails, scheduledDate, type } = body

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required and must be a string" }, { status: 400 })
    }

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: "Emails are required and must be a non-empty array" }, { status: 400 })
    }

    if (scheduledDate && isNaN(Date.parse(scheduledDate))) {
      return NextResponse.json({ error: "Invalid scheduled date" }, { status: 400 })
    }

    // Track successful and failed emails
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    }

    // Process emails in batches to prevent timeout
    const batchSize = 10
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize)

      await Promise.all(
        batch.map(async (email) => {
          try {
            if (
              typeof email === "object" &&
              typeof email.to === "string" &&
              typeof email.subject === "string" &&
              typeof email.html === "string" &&
              typeof email.recipientName === "string"
            ) {
              await sendEmail(email.to, email.subject, email.html)
              results.success++
            } else {
              throw new Error(`Invalid email object format`)
            }
          } catch (error) {
            results.failed++
            results.errors.push(
              `Failed to send to ${email?.to || "unknown"}: ${error instanceof Error ? error.message : "Unknown error"}`,
            )
          }
        }),
      )
    }

    // Return detailed response
    return NextResponse.json({
      success: results.failed === 0,
      message: `Emails processed: ${results.success} successful, ${results.failed} failed`,
      details: {
        campaignName: name,
        campaignType: type || "unknown",
        scheduledDate: scheduledDate || "immediate",
        totalEmails: emails.length,
        successCount: results.success,
        failedCount: results.failed,
        errors: results.errors.length > 0 ? results.errors : undefined,
      },
    })
  } catch (error) {
    console.error("Error sending emails:", error)
    return NextResponse.json(
      {
        error: "Failed to send emails",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}

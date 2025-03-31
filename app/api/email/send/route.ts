import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import { sendEmail, sendContactResponse, sendAdminNotification } from "@/lib/email"

export async function POST(request: Request) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user.isAdmin !== true) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const { type, email, name, subject, originalMessage, responseMessage } = data

    if (!email || !type) {
      return NextResponse.json({ error: "Missing required fields: email or type" }, { status: 400 })
    }

    // Handle different email types
    if (type === "welcome") {
      await sendEmail(email, name)
    } else if (type === "contact-response") {
      if (!subject || !responseMessage) {
        return NextResponse.json(
          { error: "Missing required fields: subject or responseMessage" },
          { status: 400 }
        )
      }
      await sendContactResponse(email, name, subject, responseMessage)
    } else if (type === "admin-notification") {
      if (!subject || !originalMessage) {
        return NextResponse.json(
          { error: "Missing required fields: subject or originalMessage" },
          { status: 400 }
        )
      }
      await sendAdminNotification(subject, name, email, originalMessage)
    } else {
      return NextResponse.json({ error: "Invalid email type" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
    })
  } catch (error) {
    console.error("Error sending email:", error)
    return NextResponse.json(
      {
        error: "Failed to send email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}


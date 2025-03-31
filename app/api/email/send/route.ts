import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"



export async function POST(request: Request) {
  try {
    // Check if user is authenticated and is an admin
    const session = await getServerSession(authOptions)

    if (!session || !session.user || session.user.isAdmin!== true) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const { type, email, name, subject, originalMessage, responseMessage } = data

    if (!email) {
      return NextResponse.json({ error: "Missing required fields: email" }, { status: 400 })
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
      { status: 500 },
    )
  }
}


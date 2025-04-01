import { NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { render } from "@react-email/render"
import WelcomeEmail from "@/components/templates/welcome-email"

// Create a test account for development
const createTestAccount = async () => {
  const testAccount = await nodemailer.createTestAccount()
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  })
}

// Create a production transport
const createProductionTransport = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT),
    secure: process.env.EMAIL_SERVER_SECURE === "true",
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  })
}

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Create transport based on environment
    const transport = process.env.NODE_ENV === "production" ? createProductionTransport() : await createTestAccount()

    // Render the welcome email
    const html = render(WelcomeEmail({ name: name || "there" }))

    // Send the email
    const info = await transport.sendMail({
      from: `"CourseAI" <${process.env.EMAIL_FROM || "noreply@courseai.io"}>`,
      to: email,
      subject: "Welcome to CourseAI!",
      html,
    })

    // For development, log the preview URL
    if (process.env.NODE_ENV !== "production") {
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info))
    }

    return NextResponse.json({ success: true, messageId: info.messageId })
  } catch (error) {
    console.error("Error sending welcome email:", error)
    return NextResponse.json({ error: "Failed to send welcome email" }, { status: 500 })
  }
}


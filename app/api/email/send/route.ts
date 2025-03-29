import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/authOptions"
import nodemailer from "nodemailer"

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  const host = process.env.SMTP_HOST
  const port = Number.parseInt(process.env.SMTP_PORT || "587")
  const secure = process.env.SMTP_SECURE === "true"
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASSWORD

  // Log configuration for debugging
  console.log("Email configuration:", {
    host,
    port,
    secure,
    auth: {
      user,
      pass: pass ? "********" : undefined, // Hide password in logs
    },
  })

  if (!host || !user || !pass) {
    throw new Error("Missing email configuration. Please check your environment variables.")
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  })
}

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

    // Always use courseai@noreply.com as the sender
    const senderEmail = "courseai@noreply.com"
    const senderName = "CourseAI Support"

    const mailOptions = {
      from: `"${senderName}" <${senderEmail}>`, // Set the sender email explicitly
      to: email,
      subject: subject || "Message from Our Team",
      text: "",
      html: "",
      headers: {
        // Set custom headers to ensure the correct sender
        "X-Sender": senderEmail,
        "Reply-To": senderEmail,
      },
    }

    // Handle different email types
    switch (type) {
      case "welcome":
        mailOptions.subject = "Welcome to Our Platform!"
        mailOptions.html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome, ${name || "there"}!</h2>
            <p>Thank you for joining our platform. We're excited to have you on board!</p>
            <p>Here's what you can do now:</p>
            <ul>
              <li>Explore our courses and quizzes</li>
              <li>Track your progress</li>
              <li>Connect with other learners</li>
            </ul>
            <p>If you have any questions, feel free to contact our support team.</p>
            <p>Best regards,<br>The CourseAI Team</p>
          </div>
        `
        mailOptions.text = `Welcome, ${name || "there"}!\n\nThank you for joining our platform. We're excited to have you on board!\n\nHere's what you can do now:\n- Explore our courses and quizzes\n- Track your progress\n- Connect with other learners\n\nIf you have any questions, feel free to contact our support team.\n\nBest regards,\nThe CourseAI Team`
        break

      case "contact-response":
        if (!responseMessage) {
          return NextResponse.json({ error: "Missing required field: responseMessage" }, { status: 400 })
        }

        mailOptions.subject = subject || "Re: Your inquiry"
        mailOptions.html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">Hello ${name || "there"}!</h2>
            <p>Thank you for contacting us. Here's our response to your inquiry:</p>
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
              ${responseMessage}
            </div>
            ${
              originalMessage
                ? `
              <p style="margin-top: 20px;">For reference, your original message was:</p>
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; font-style: italic;">
                ${originalMessage}
              </div>
            `
                : ""
            }
            <p>If you have any further questions, please don't hesitate to reach out.</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea;">
              <p style="color: #666; font-size: 14px;">Best regards,<br>The CourseAI Support Team</p>
            </div>
          </div>
        `
        mailOptions.text = `Hello ${name || "there"}!\n\nThank you for contacting us. Here's our response to your inquiry:\n\n${responseMessage}\n\n${originalMessage ? `For reference, your original message was:\n\n${originalMessage}\n\n` : ""}If you have any further questions, please don't hesitate to reach out.\n\nBest regards,\nThe CourseAI Support Team`
        break

      default:
        return NextResponse.json({ error: "Invalid email type" }, { status: 400 })
    }

    // For debugging purposes
    console.log("Sending email with the following information:")
    console.log("From:", mailOptions.from)
    console.log("To:", email)
    console.log("Subject:", mailOptions.subject)
    console.log("Type:", type)

    // Create transporter and send email
    const transporter = createTransporter()
    const info = await transporter.sendMail(mailOptions)

    console.log("Email sent successfully:", info.messageId)

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
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


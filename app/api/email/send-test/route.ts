import { NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { render } from "@react-email/render"
import WelcomeEmail from "@/components/templates/welcome-email"
import QuizPromoEmail from "@/components/templates/quiz-promo-email"
import CoursePromoEmail from "@/components/templates/course-promo-email"
import ReengagementEmail from "@/components/templates/reengagement-email"

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

export async function POST(request: Request) {
  try {
    const { templateId, email, subject } = await request.json()

    // Create transport
    const transport = await createTestAccount()

    let html = ""
    let emailSubject = subject || "Test Email from CourseAI"

    // Render the appropriate email template
    switch (templateId) {
      case "welcome":
        html = render(WelcomeEmail({ name: "Test User" }))
        if (!subject) emailSubject = "Welcome to CourseAI!"
        break
      case "quiz-promo":
        html = render(
          QuizPromoEmail({
            name: "Test User",
            preferences: {
              interests: ["programming", "data science"],
              difficulty: "intermediate",
            },
          }),
        )
        if (!subject) emailSubject = "Test Your Knowledge with Our Latest Quizzes!"
        break
      case "course-promo":
        html = render(
          CoursePromoEmail({
            name: "Test User",
            recommendedCourses: [
              {
                id: "course-1",
                title: "JavaScript Fundamentals",
                description: "Learn the basics of JavaScript programming",
                imageUrl: "/placeholder.svg?height=150&width=300",
              },
              {
                id: "course-2",
                title: "Advanced React Patterns",
                description: "Master advanced React concepts and patterns",
                imageUrl: "/placeholder.svg?height=150&width=300",
              },
            ],
          }),
        )
        if (!subject) emailSubject = "Courses Tailored Just for You!"
        break
      case "reengagement":
        html = render(
          ReengagementEmail({
            name: "Test User",
          }),
        )
        if (!subject) emailSubject = "We Miss You! Come Back and Explore"
        break
      default:
        throw new Error("Invalid template ID")
    }

    // Send the email
    const info = await transport.sendMail({
      from: `"CourseAI Test" <test@courseai.io>`,
      to: email,
      subject: emailSubject,
      html,
    })

    // Log the preview URL
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info))

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info),
    })
  } catch (error) {
    console.error("Error sending test email:", error)
    return NextResponse.json({ error: "Failed to send test email" }, { status: 500 })
  }
}


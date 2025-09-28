import { NextResponse } from "next/server"

import { render } from "@react-email/render"
import CoursePromoEmail from "@/app/dashboard/admin/components/templates/course-promo-email"
import QuizPromoEmail from "@/app/dashboard/admin/components/templates/quiz-promo-email"
import ReengagementEmail from "@/app/dashboard/admin/components/templates/reengagement-email"
import WelcomeEmail from "@/app/dashboard/admin/components/templates/welcome-email"
import { sendEmail } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const { templateId, email, subject } = await request.json()

    let html = ""
    let emailSubject = subject || "Test Email from CourseAI"

    // Render the appropriate email template
    switch (templateId) {
      case "welcome":
        html = await render(WelcomeEmail({ name: "Test User" }))
        if (!subject) emailSubject = "Welcome to CourseAI!"
        break
      case "quiz-promo":
        html = await render(
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
        html = await render(
          CoursePromoEmail({
            name: "Test User",
            recommendedCourses: [
              {
                id: "course-1",
                title: "JavaScript Fundamentals",
                description: "Learn the basics of JavaScript programming",
                imageUrl: "/api/placeholder?height=150&width=300",
              },
              {
                id: "course-2",
                title: "Advanced React Patterns",
                description: "Master advanced React concepts and patterns",
                imageUrl: "/api/placeholder?height=150&width=300",
              },
            ],
          }),
        )
        if (!subject) emailSubject = "Courses Tailored Just for You!"
        break
      case "reengagement":
        html = await render(
          ReengagementEmail({
            name: "Test User",
          }),
        )
        if (!subject) emailSubject = "We Miss You! Come Back and Explore"
        break
      default:
        throw new Error("Invalid template ID")
    }

    // Send the email using your custom sendEmail function
    const info = await sendEmail(email, emailSubject, html)

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
    })
  } catch (error) {
    console.error("Error sending test email:", error)
    return NextResponse.json({ error: "Failed to send test email" }, { status: 500 })
  }
}

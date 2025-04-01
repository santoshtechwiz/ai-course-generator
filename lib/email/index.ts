import { EmailClient } from "./client"

export async function startEmailWorkflow(userId: string, email: string, name: string) {
  try {
    // Call the workflow API to start the email sequence
    const response = await fetch("/api/email-workflow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        email,
        name,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to start email workflow")
    }

    return { success: true }
  } catch (error) {
    console.error("Error starting email workflow:", error)
    throw error
  }
}

export async function sendWelcomeEmail(email: string, name: string) {
  const emailClient = new EmailClient()

  try {
    const result = await emailClient.sendEmail({
      to: email,
      subject: "Welcome to Our Platform!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome, ${name}!</h2>
          <p>Thank you for joining our platform. We're excited to have you on board!</p>
          <p>Explore our courses, track your progress, and connect with other learners.</p>
          <p>Best regards,<br>The Team</p>
        </div>
      `,
      userId: email, // Using email as userId if actual userId is not available
      templateId: "welcome-simple",
      trackingId: `welcome-simple-${email}`,
    })

    return result
  } catch (error) {
    console.error("Error sending welcome email:", error)
    throw error
  }
}

export { sendEmail, sendContactResponse, sendAdminNotification } from "@/lib/email"


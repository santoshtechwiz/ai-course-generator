"use server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY || "")

// Send welcome email and start the email workflow
export async function sendEmail(email: string, name: string, html?: string) {
  try {
    // Send immediate welcome email
    const response = await resend.emails.send({
      from: process.env.EMAIL_FROM || "no-reply@courseai.io",
      to: email,
      subject: "Welcome to Our Platform!",
      html:
        html ||
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #333; margin-bottom: 10px;">Welcome, ${name}!</h1>
            <p style="color: #666; font-size: 16px;">Thank you for joining our platform. We're excited to have you on board!</p>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h2 style="color: #007bff; margin-top: 0;">Get Started with Our Courses</h2>
            <p>Explore our courses, track your progress, and connect with other learners.</p>
          </div>
          
          <div style="margin-bottom: 25px;">
            <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 8px;">Your Course Quizzes</h2>
            <ul style="padding-left: 20px;">
              <li style="margin-bottom: 10px;">
                <a href="https://courseai.io/quizzes/introduction" style="color: #007bff; text-decoration: none; font-weight: bold;">Introduction Quiz</a>
                <p style="margin: 5px 0 0; color: #666;">Test your knowledge of the fundamentals</p>
              </li>
              <li style="margin-bottom: 10px;">
                <a href="https://courseai.io/quizzes/intermediate" style="color: #007bff; text-decoration: none; font-weight: bold;">Intermediate Concepts Quiz</a>
                <p style="margin: 5px 0 0; color: #666;">Challenge yourself with more advanced topics</p>
              </li>
              <li style="margin-bottom: 10px;">
                <a href="https://courseai.io/quizzes/advanced" style="color: #007bff; text-decoration: none; font-weight: bold;">Advanced Applications Quiz</a>
                <p style="margin: 5px 0 0; color: #666;">Put your expertise to the test</p>
              </li>
            </ul>
          </div>
          
          <div style="background-color: #007bff; color: white; padding: 15px; border-radius: 5px; text-align: center; margin-bottom: 20px;">
            <a href="https://courseai.io/dashboard" style="color: white; text-decoration: none; font-weight: bold;">Visit Your Dashboard</a>
          </div>
          
          <div style="color: #666; font-size: 14px; border-top: 1px solid #eaeaea; padding-top: 15px; text-align: center;">
            <p>Best regards,<br>The CourseAI Team</p>
            <p style="font-size: 12px; color: #999; margin-top: 15px;">
              If you have any questions, please contact our <a href="mailto:support@courseai.io" style="color: #007bff; text-decoration: none;">support team</a>.
            </p>
          </div>
        </div>
      `,
    })

    console.log("Welcome email sent:", response.data)

    return { success: true, messageId: response.data }
  } catch (error) {
    console.error("Error sending welcome email:", error)
    throw error
  }
}

// Send contact form response
export async function sendContactResponse(email: string, name: string, subject: string, message: string) {
  try {
    const response = await resend.emails.send({
      from: process.env.EMAIL_FROM || "support@courseai.io",
      to: email,
      subject: `Re: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 8px;">Hello ${name},</h2>
          <p style="color: #666; font-size: 16px;">Thank you for reaching out. Here's our response to your inquiry:</p>
          <div style="padding: 15px; background-color: #f5f5f5; border-left: 4px solid #007bff; margin: 15px 0;">
            ${message}
          </div>
          <p style="color: #666;">If you have any more questions, feel free to reply.</p>
          <div style="color: #666; font-size: 14px; border-top: 1px solid #eaeaea; padding-top: 15px; margin-top: 20px;">
            <p>Best regards,<br>The Support Team</p>
          </div>
        </div>
      `,
    })

    console.log("Contact response email sent:", response.data)
    return { success: true, messageId: response.data }
  } catch (error) {
    console.error("Error sending contact response email:", error)
    throw error
  }
}

// Send notification to admin about new contact submission
export async function sendAdminNotification(subject: string, name: string, email: string, message: string) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM

    const response = await resend.emails.send({
      from: process.env.EMAIL_FROM || "admin@courseai.io",
      to: adminEmail || "fallback@courseai.io",
      subject: `New Contact Form Submission: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
          <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 8px;">New Contact Form Submission</h2>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>From:</strong> ${name} (${email})</p>
            <p style="margin: 5px 0;"><strong>Subject:</strong> ${subject}</p>
          </div>
          <p style="margin: 15px 0 5px;"><strong>Message:</strong></p>
          <div style="padding: 15px; background-color: #f5f5f5; border-left: 4px solid #007bff; margin-bottom: 15px;">
            ${message}
          </div>
          <p style="color: #666;">Please respond to this inquiry through the admin dashboard.</p>
        </div>
      `,
    })

    console.log("Admin notification email sent:", response.data)
    return { success: true, messageId: response.data }
  } catch (error) {
    console.error("Error sending admin notification email:", error)
    throw error
  }
}


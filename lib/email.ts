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
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome, ${name}!</h2>
          <p>Thank you for joining our platform. We're excited to have you on board!</p>
          <p>Explore our courses, track your progress, and connect with other learners.</p>
          <p>Best regards,<br>The Team</p>
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
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${name},</h2>
          <p>Thank you for reaching out. Here's our response to your inquiry:</p>
          <div style="padding: 15px; background-color: #f5f5f5; border-left: 4px solid #007bff;">
            ${message}
          </div>
          <p>If you have any more questions, feel free to reply.</p>
          <p>Best regards,<br>The Support Team</p>
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
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Contact Form Submission</h2>
          <p><strong>From:</strong> ${name} (${email})</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <div style="padding: 15px; background-color: #f5f5f5; border-left: 4px solid #007bff;">
            ${message}
          </div>
          <p>Please respond to this inquiry through the admin dashboard.</p>
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


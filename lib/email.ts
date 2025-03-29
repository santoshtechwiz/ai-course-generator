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

// Send welcome email to new users
export async function sendWelcomeEmail(email: string, name: string) {
  try {
    const transporter = createTransporter()

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Welcome to Our Platform!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome, ${name}!</h2>
          <p>Thank you for joining our platform. We're excited to have you on board!</p>
          <p>Here's what you can do now:</p>
          <ul>
            <li>Explore our courses and quizzes</li>
            <li>Track your progress</li>
            <li>Connect with other learners</li>
          </ul>
          <p>If you have any questions, feel free to contact our support team.</p>
          <p>Best regards,<br>The Team</p>
        </div>
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("Welcome email sent:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error sending welcome email:", error)
    throw error
  }
}

// Send contact form response
export async function sendContactResponse(email: string, name: string, subject: string, message: string) {
  try {
    const transporter = createTransporter()

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Re: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${name},</h2>
          <p>Thank you for contacting us. Here is our response to your inquiry:</p>
          <div style="padding: 15px; background-color: #f5f5f5; border-left: 4px solid #007bff; margin: 20px 0;">
            ${message}
          </div>
          <p>If you have any further questions, please don't hesitate to reach out.</p>
          <p>Best regards,<br>The Support Team</p>
        </div>
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("Contact response email sent:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error sending contact response email:", error)
    throw error
  }
}

// Send notification to admin about new contact submission
export async function sendAdminNotification(subject: string, name: string, email: string, message: string) {
  try {
    const transporter = createTransporter()
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: adminEmail,
      subject: `New Contact Form Submission: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Contact Form Submission</h2>
          <p><strong>From:</strong> ${name} (${email})</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <div style="padding: 15px; background-color: #f5f5f5; border-left: 4px solid #007bff; margin: 20px 0;">
            ${message}
          </div>
          <p>Please respond to this inquiry through the admin dashboard.</p>
        </div>
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("Admin notification email sent:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error sending admin notification email:", error)
    throw error
  }
}


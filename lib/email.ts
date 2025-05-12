'use server'
import type React from "react"


import { Resend } from "resend"
import WelcomeEmail from "@/app/dashboard/admin/components/templates/welcome-email"
import ContactResponseEmail from "@/app/dashboard/admin/components/templates/contact-response-email"
import { render } from "@react-email/render"

const resend = new Resend(process.env.RESEND_API_KEY || "")

type EmailResponse = {
  success: boolean
  messageId?: string
  error?: string
}

export async function sendEmail(email: string, name: string, html?: string): Promise<EmailResponse> {
  try {
    const emailHtml = html || (await render(WelcomeEmail({ name })))

    const response = await resend.emails.send({
      from: process.env.EMAIL_FROM || "no-reply@courseai.io",
      to: email,
      subject: "Welcome to Our Platform!",
      html: emailHtml,
    })

    if (!response.data) {
      throw new Error("No data received from Resend")
    }

    console.log("Welcome email sent:", response.data)
    return { success: true, messageId: response.data.id }
  } catch (error) {
    console.error("Error sending welcome email:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Send contact form response
export async function sendContactResponse(email: string, name: string, subject: string, message: string) {
  try {
    // Use the ContactResponseEmail template
    const emailHtml = await render(ContactResponseEmail({ name, subject, message }) as React.ReactElement)

    const response = await resend.emails.send({
      from: process.env.EMAIL_FROM || "support@courseai.io",
      to: email,
      subject: `Re: ${subject}`,
      html: emailHtml,
    })

    console.log("Contact response email sent:", response.data)
    return { success: true, messageId: response.data }
  } catch (error) {
    console.error("Error sending contact response email:", error)
    throw error
  }
}

export async function sendAdminNotification(subject: string, name: string, email: string, originalMessage: string) {}

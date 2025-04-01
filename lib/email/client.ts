import { Resend } from "resend"
import { saveEmailEvent, getEmailStats } from "./tracking"

export class EmailClient {
  private resend: Resend

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY || "")
  }

  async sendEmail({
    to,
    subject,
    html,
    userId,
    templateId,
    trackingId,
    abTestId,
    abTestVariant,
  }: {
    to: string
    subject: string
    html: string
    userId: string
    templateId: string
    trackingId: string
    abTestId?: string
    abTestVariant?: string
  }) {
    try {
      // Add tracking pixels and link tracking
      const trackingPixel = `<img src="${process.env.NEXT_PUBLIC_APP_URL}/api/email/track?id=${trackingId}&event=open" width="1" height="1" />`
      const enhancedHtml = this.addLinkTracking(html, trackingId) + trackingPixel

      const response = await this.resend.emails.send({
        from: process.env.EMAIL_FROM || "no-reply@courseai.io",
        to,
        subject,
        html: enhancedHtml,
        headers: {
          "X-Entity-Ref-ID": trackingId,
        },
      })

      // Save email send event
      await saveEmailEvent({
        userId,
        emailId: response.id || "",
        templateId,
        trackingId,
        event: "send",
        abTestId,
        abTestVariant,
      })

      return { success: true, messageId: response.id }
    } catch (error) {
      console.error("Error sending email:", error)
      throw error
    }
  }

  private addLinkTracking(html: string, trackingId: string): string {
    // Replace all links with tracking links
    return html.replace(/<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/gi, (match, quote, url) => {
      const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/email/track?id=${trackingId}&event=click&url=${encodeURIComponent(url)}`
      return `<a href=${quote}${trackingUrl}${quote}`
    })
  }

  async getUserPreferences(userId: string) {
    // Fetch user preferences from database
    // This is a placeholder - implement actual database query
    return {
      interests: ["programming", "data science"],
      difficulty: "intermediate",
    }
  }

  async getUserActivity(userId: string) {
    // Fetch user activity from database
    // This is a placeholder - implement actual database query
    return {
      lastLogin: new Date(),
      completedQuizzes: ["quiz1", "quiz2"],
      viewedCourses: ["course1"],
    }
  }

  async getRecommendedCourses(userId: string, userActivity: any) {
    // Get recommended courses based on user activity
    // This is a placeholder - implement actual recommendation logic
    return [
      {
        id: "course2",
        title: "Advanced JavaScript",
        description: "Master advanced JavaScript concepts",
        imageUrl: "/placeholder.svg?height=200&width=300",
      },
      {
        id: "course3",
        title: "React Fundamentals",
        description: "Learn the basics of React",
        imageUrl: "/placeholder.svg?height=200&width=300",
      },
    ]
  }

  async getABTestVariant(userId: string, testId: string, variants: string[]) {
    // Determine which variant to show to this user
    // This is a simplified implementation - in production, use a more sophisticated approach
    const variantIndex = Math.abs(this.hashString(`${userId}-${testId}`) % variants.length)
    return variants[variantIndex]
  }

  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return hash
  }

  async checkUserEngagement(userId: string): Promise<"high" | "medium" | "low"> {
    // Check user engagement based on email opens, clicks, and site activity
    // This is a placeholder - implement actual engagement scoring
    const stats = await getEmailStats(userId)

    if (stats.openRate > 0.5 && stats.clickRate > 0.2) {
      return "high"
    } else if (stats.openRate > 0.2) {
      return "medium"
    } else {
      return "low"
    }
  }
}


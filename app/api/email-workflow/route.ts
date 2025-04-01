import { serve } from "@upstash/workflow/nextjs"
import { getEmailTemplate } from "@/lib/email/templates"
import { EmailClient } from "@/lib/email/client"


type EmailWorkflowPayload = {
  userId: string
  email: string
  name: string
  campaignId?: string
  segmentId?: string
}

export const { POST } = serve<EmailWorkflowPayload>(async (context) => {
  const { userId, email, name, campaignId, segmentId } = context.requestPayload
  const emailClient = new EmailClient()

  // Send welcome email immediately
  await context.run("send-welcome-email", async () => {
    const template = await getEmailTemplate("welcome", { name })
    const result = await emailClient.sendEmail({
      to: email,
      subject: "Welcome to Our Platform!",
      html: template.html,
      userId,
      templateId: "welcome",
      trackingId: `welcome-${userId}`,
    })

    return result
  })

  // Wait 3 days before sending the first promotional email
  await context.sleep("wait-for-first-promo", 60 * 60 * 24 * 3)

  // Send first promotional email about quizzes
  await context.run("send-quiz-promo", async () => {
    const userPreferences = await emailClient.getUserPreferences(userId)

    // A/B testing for subject lines
    const subjectVariants = ["Discover Our Latest Quizzes", "Test Your Knowledge with These New Quizzes"]

    const selectedVariant = await emailClient.getABTestVariant(userId, "quiz-promo-subject", subjectVariants)

    const template = await getEmailTemplate("quiz-promo", {
      name,
      preferences: userPreferences,
    })

    const result = await emailClient.sendEmail({
      to: email,
      subject: selectedVariant,
      html: template.html,
      userId,
      templateId: "quiz-promo",
      trackingId: `quiz-promo-${userId}`,
      abTestId: "quiz-promo-subject",
      abTestVariant: selectedVariant,
    })

    return result
  })

  // Wait 7 days before sending course promotional email
  await context.sleep("wait-for-course-promo", 60 * 60 * 24 * 7)

  // Send course promotional email
  await context.run("send-course-promo", async () => {
    const userActivity = await emailClient.getUserActivity(userId)
    const recommendedCourses = await emailClient.getRecommendedCourses(userId, userActivity)

    const template = await getEmailTemplate("course-promo", {
      name,
      recommendedCourses,
    })

    const result = await emailClient.sendEmail({
      to: email,
      subject: "Courses Tailored Just for You",
      html: template.html,
      userId,
      templateId: "course-promo",
      trackingId: `course-promo-${userId}`,
    })

    return result
  })

  // Check engagement and send re-engagement email if needed
  await context.sleep("wait-for-engagement-check", 60 * 60 * 24 * 14)

  const engagement = await context.run("check-engagement", async () => {
    return await emailClient.checkUserEngagement(userId)
  })

  if (engagement === "low") {
    await context.run("send-reengagement", async () => {
      const template = await getEmailTemplate("reengagement", { name })

      const result = await emailClient.sendEmail({
        to: email,
        subject: "We Miss You! Come Back and Explore",
        html: template.html,
        userId,
        templateId: "reengagement",
        trackingId: `reengagement-${userId}`,
      })

      return result
    })
  }
})


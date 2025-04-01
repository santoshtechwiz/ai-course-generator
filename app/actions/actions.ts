"use server"
import prisma from "@/lib/db"
import { sendEmail } from "@/lib/email"
import { revalidatePath } from "next/cache"


interface SubmitQuizDataParams {
  slug: string
  quizId: number
  answers: { answer: string; timeSpent: number; hintsUsed: boolean }[]
  elapsedTime: number
  score: number
  type: string
}

export async function submitQuizData(
  { slug, quizId, answers, elapsedTime, score, type }: SubmitQuizDataParams,
  setLoading?: (state: boolean) => void,
): Promise<void> {
  try {
    if (setLoading) setLoading(true) // Show
    const response = await fetch(`/api/quiz/${slug}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quizId,
        answers,
        totalTime: elapsedTime,
        score,
        type,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to update score")
    }
  } catch (error) {
    console.error("Error submitting quiz data:", error)
    throw error
  } finally {
    if (setLoading) setLoading(false) // Hide loader
  }
}

export async function createUser(formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const credits = Number.parseInt(formData.get("credits") as string)
  const isAdmin = formData.get("isAdmin") === "true"
  const userType = formData.get("userType") as string

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        credits,
        isAdmin,
        userType,
      },
    })

    // Send welcome email to new user
    if (email) {
      await sendEmail(email, name)
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error creating user:", error)
    return { error: "Failed to create user" }
  }
}

export async function updateUser(userId: string, data: any) {
  try {
    const previousUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    })

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        email: data.email,
        credits: data.credits,
        isAdmin: data.isAdmin,
        userType: data.userType,
        updatedAt: new Date(),
      },
    })

    // If credits were changed, create a transaction record
    if (previousUser && previousUser.credits !== data.credits) {
      const amount = data.credits - previousUser.credits
      await prisma.tokenTransaction.create({
        data: {
          userId,
          amount,
          type: amount > 0 ? "ADMIN_CREDIT" : "ADMIN_DEBIT",
          description: data.creditNote || `Admin adjusted credits by ${amount}`,
        },
      })
    }

    revalidatePath("/")
    return { success: true, user: updatedUser }
  } catch (error) {
    console.error("Error updating user:", error)
    return { error: "Failed to update user" }
  }
}

export async function deleteUser(userId: string) {
  try {
    // First, delete all related records that reference this user

    // Reset user subscriptions
    await prisma.userSubscription.deleteMany({
      where: { userId },
    })

    // Delete token transactions
    await prisma.tokenTransaction.deleteMany({
      where: { userId },
    })

    // Delete user quiz attempts
    await prisma.userQuizAttempt.deleteMany({
      where: { userId },
    })

    // Delete user quizzes
    const userQuizzes = await prisma.userQuiz.findMany({
      where: { userId },
      select: { id: true },
    })

    // Delete questions for each user quiz
    for (const quiz of userQuizzes) {
      await prisma.userQuizQuestion.deleteMany({
        where: { userQuizId: quiz.id },
      })
    }

    // Now delete the user quizzes
    await prisma.userQuiz.deleteMany({
      where: { userId },
    })

    // Delete course progress
    await prisma.courseProgress.deleteMany({
      where: { userId },
    })

    // Delete course ratings
    await prisma.courseRating.deleteMany({
      where: { userId },
    })

    // Delete favorites
    await prisma.favorite.deleteMany({
      where: { userId },
    })

    // Delete referrals
    await prisma.userReferralUse.deleteMany({
      where: {
        OR: [{ referrerId: userId }, { referredId: userId }],
      },
    })

    await prisma.userReferral.deleteMany({
      where: { userId },
    })

    // Finally, delete the user
    await prisma.user.delete({
      where: { id: userId },
    })

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error deleting user:", error)
    return { error: "Failed to delete user. " + (error instanceof Error ? error.message : String(error)) }
  }
}

export async function getUserStats() {
  try {
    // Get total users count
    const totalUsers = await prisma.user.count()

    // Get active users (active in the last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const activeUsers = await prisma.user.count({
      where: {
        lastActiveAt: {
          gte: sevenDaysAgo,
        },
      },
    })

    // Get premium users count
    const premiumUsers = await prisma.user.count({
      where: {
        userType: {
          not: "Free",
        },
      },
    })

    return {
      totalUsers,
      activeUsers,
      premiumUsers,
    }
  } catch (error) {
    console.error("Error fetching user stats:", error)
    return { error: "Failed to fetch user stats" }
  }
}

export async function getCreditHistory(userId: string) {
  try {
    const transactions = await prisma.tokenTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    })

    return { transactions }
  } catch (error) {
    console.error("Error fetching credit history:", error)
    return { error: "Failed to fetch credit history" }
  }
}

export async function createContactSubmission(data: {
  name: string
  email: string
  message: string
  status?: string
}) {
  try {
    const submission = await prisma.contactSubmission.create({
      data: {
        name: data.name,
        email: data.email,
        message: data.message,
        status: data.status || "NEW",
      },
    })

    return { success: true, submission }
  } catch (error) {
    console.error("Error creating contact submission:", error)
    return { error: "Failed to save contact submission" }
  }
}

export async function getContactSubmissions(page = 1, limit = 10, status?: string) {
  try {
    const skip = (page - 1) * limit

    const where = status ? { status } : {}

    const [submissions, total] = await Promise.all([
      prisma.contactSubmission.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.contactSubmission.count({ where }),
    ])

    return {
      submissions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  } catch (error) {
    console.error("Error fetching contact submissions:", error)
    return { error: "Failed to fetch contact submissions" }
  }
}

export async function updateContactSubmission(
  id: number,
  data: {
    status?: string
    adminNotes?: string
    responseMessage?: string
  },
) {
  try {
    const submission = await prisma.contactSubmission.update({
      where: { id },
      data,
    })

    return { success: true, submission }
  } catch (error) {
    console.error("Error updating contact submission:", error)
    return { error: "Failed to update contact submission" }
  }
}

export async function deleteContactSubmission(id: number) {
  try {
    await prisma.contactSubmission.delete({
      where: { id },
    })

    return { success: true }
  } catch (error) {
    console.error("Error deleting contact submission:", error)
    return { error: "Failed to delete contact submission" }
  }
}


"use server"
import prisma from "@/lib/db"
import { sendEmail } from "@/lib/email"
import { revalidatePath } from "next/cache"

// Helper function for error handling
function formatError(error: unknown, context: string): string {
  return `Failed to ${context}. ${
    error instanceof Error ? `Original error: ${error.message}` : "Unknown error occurred."
  }`
}

// Helper function to handle database operations with error handling
async function executeDbOperation<T>(
  operation: () => Promise<T>,
  errorContext: string,
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const result = await operation()
    return { success: true, data: result }
  } catch (error) {
    console.error(`Error ${errorContext}:`, error)
    return {
      success: false,
      error: formatError(error, errorContext),
    }
  }
}

async function createUser(formData: FormData) {
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
    throw new Error(formatError(error, "create user"))
  }
}

async function updateUser(userId: string, data: any) {
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
      const credits = data.credits // Ensure 'credits' is defined
      await prisma.tokenTransaction.create({
        data: {
          userId,
          amount, // Include the required 'amount' property
          credits,
          type: amount > 0 ? "ADMIN_CREDIT" : "ADMIN_DEBIT",
          description: data.creditNote || `Admin adjusted credits by ${amount}`,
        },
      })
    }

    revalidatePath("/")
    return { success: true, user: updatedUser }
  } catch (error) {
    console.error("Error updating user:", error)
    throw new Error(formatError(error, `update user with ID "${userId}"`))
  }
}

// Optimize the deleteUser function to use transactions more efficiently
async function deleteUser(userId: string) {
  try {
    // Use a transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async (tx) => {
      // Delete related records in a specific order to respect foreign key constraints

      // 1. Delete user subscriptions
      await tx.userSubscription.deleteMany({ where: { userId } })

      // 2. Delete token transactions
      await tx.tokenTransaction.deleteMany({ where: { userId } })

      // 3. Delete user quiz attempts and related data
      const userQuizAttempts = await tx.userQuizAttempt.findMany({
        where: { userId },
        select: { id: true },
      })

      for (const attempt of userQuizAttempts) {
        await tx.userQuizAttemptQuestion.deleteMany({ where: { attemptId: attempt.id } })
      }

      await tx.userQuizAttempt.deleteMany({ where: { userId } })

      // 4. Delete user quizzes and related questions
      const userQuizzes = await tx.userQuiz.findMany({
        where: { userId },
        select: { id: true },
      })

      for (const quiz of userQuizzes) {
        await tx.userQuizQuestion.deleteMany({ where: { userQuizId: quiz.id } })
        await tx.flashCard.deleteMany({ where: { userQuizId: quiz.id } })
      }

      await tx.userQuiz.deleteMany({ where: { userId } })

      // 5. Delete course-related data
      await tx.courseProgress.deleteMany({ where: { userId } })
      await tx.courseRating.deleteMany({ where: { userId } })
      await tx.favorite.deleteMany({ where: { userId } })

      // 6. Delete referrals
      await tx.userReferralUse.deleteMany({
        where: { OR: [{ referrerId: userId }, { referredId: userId }] },
      })

      await tx.userReferral.deleteMany({ where: { userId } })

      // 7. Finally, delete the user
      await tx.user.delete({ where: { id: userId } })
    })

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error deleting user:", error)
    throw new Error(formatError(error, `delete user with ID "${userId}"`))
  }
}

async function getCreditHistory(userId: string) {
  return executeDbOperation(async () => {
    const transactions = await prisma.tokenTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    })
    return { transactions }
  }, `fetch credit history for user with ID "${userId}"`)
}

export async function createContactSubmission(data: {
  name: string
  email: string
  message: string
  status?: string
}) {
  return executeDbOperation(async () => {
    const submission = await prisma.contactSubmission.create({
      data: {
        name: data.name,
        email: data.email,
        message: data.message,
        status: data.status || "NEW",
      },
    })
    return { submission }
  }, "save contact submission")
}

export async function getContactSubmissions(page = 1, limit = 10, status?: string) {
  return executeDbOperation(async () => {
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
  }, "fetch contact submissions")
}

export async function updateContactSubmission(
  id: number,
  data: {
    status?: string
    adminNotes?: string
    responseMessage?: string
  },
) {
  return executeDbOperation(async () => {
    const submission = await prisma.contactSubmission.update({
      where: { id },
      data,
    })
    return { submission }
  }, `update contact submission with ID "${id}"`)
}

export async function deleteContactSubmission(id: number) {
  return executeDbOperation(async () => {
    await prisma.contactSubmission.delete({
      where: { id },
    })
    return {}
  }, `delete contact submission with ID "${id}"`)
}

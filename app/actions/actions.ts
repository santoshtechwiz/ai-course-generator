'use server'
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

interface SubmitQuizDataParams {
  slug: string
  quizId: number
  answers: { answer: string; timeSpent: number; hintsUsed: boolean }[]
  elapsedTime: number
  score: number
  type: string
}

export async function submitQuizData({
  slug,
  quizId,
  answers,
  elapsedTime,
  score,
  type,
}: SubmitQuizDataParams, setLoading?: (state: boolean) => void): Promise<void> {
  try {
    if (setLoading) setLoading(true); // Show 
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
  }
  finally {
    if (setLoading) setLoading(false); // Hide loader
  }
}


export async function createUser(formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const credits = Number.parseInt(formData.get("credits") as string)
  const isAdmin = formData.get("isAdmin") === "true"
  const userType = formData.get("userType") as string

  try {
    await prisma.user.create({
      data: {
        name,
        email,
        credits,
        isAdmin,
        userType,
      },
    })

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
    await prisma.userSubscription.updateMany({
      where: { userId },
      data: {
        status: "FREE",
        updatedAt: new Date(),
      },
    })

    // Delete token transactions
    await prisma.tokenTransaction.deleteMany({
      where: { userId },
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

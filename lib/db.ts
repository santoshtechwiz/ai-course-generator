import type { OpenEndedQuestion, QuizType } from "@/app/types/quiz-types"
import { type Prisma, PrismaClient } from "@prisma/client"

// Create a global object to store the Prisma client instance (for Next.js Fast Refresh)
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

// Use Neon serverless driver instead of the default Node.js driver
const databaseUrl = process.env.DATABASE_URL_PROD!

export const prisma =
  globalForPrisma.prisma ??
new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    // Connection pooling configuration for better performance
    // Adjust these values based on your database capacity and load
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

// Avoid creating multiple Prisma instances in development
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

export default prisma

// Create a new course
export const createCourse = async (data: Prisma.CourseCreateInput) => {
  try {
    return await prisma.course.create({
      data,
    })
  } catch (error) {
    console.error("Error creating course:", error)
    throw error
  }
}

// Get a single course by slug
export const getCourseBySlug = async (slug: string) => {
  try {
    return await prisma.course.findUnique({
      where: { slug },
    })
  } catch (error) {
    console.error("Error fetching course by slug:", error)
    throw error
  }
}

// Update a course by ID
export const updateCourse = async (id: number, data: Prisma.CourseUpdateInput) => {
  try {
    return await prisma.course.update({
      where: { id },
      data,
    })
  } catch (error) {
    console.error("Error updating course:", error)
    throw error
  }
}

// Delete a course by ID
export const deleteCourse = async (id: number) => {
  try {
    return await prisma.course.delete({
      where: { id },
    })
  } catch (error) {
    console.error("Error deleting course:", error)
    throw error
  }
}

// Check if a course exists by slug
export const courseExistsBySlug = async (slug: string) => {
  try {
    const course = await prisma.course.findUnique({
      where: { slug },
    })
    return course ? true : false
  } catch (error) {
    console.error("Error checking if course exists by slug:", error)
    throw error
  }
}

// Create a new user
export const createUser = async (data: Prisma.UserCreateInput) => {
  try {
    return await prisma.user.create({
      data,
    })
  } catch (error) {
    console.error("Error creating user:", error)
    throw error
  }
}

// Get all users
export const getUsers = async () => {
  try {
    return await prisma.user.findMany()
  } catch (error) {
    console.error("Error fetching users:", error)
    throw error
  }
}

// Get a single user by ID
export const getUserById = async (id: string) => {
  try {
    return await prisma.user.findUnique({
      where: { id },
    })
  } catch (error) {
    console.error("Error fetching user by ID:", error)
    throw error
  }
}

// Update a user by ID
export const updateUser = async (id: string, data: Prisma.UserUpdateInput) => {
  try {
    return await prisma.user.update({
      where: { id },
      data,
    })
  } catch (error) {
    console.error("Error updating user:", error)
    throw error
  }
}

// Delete a user by ID
export const deleteUser = async (id: string) => {
  try {
    return await prisma.user.delete({
      where: { id },
    })
  } catch (error) {
    console.error("Error deleting user:", error)
    throw error
  }
}

export async function slugToId(slug: string): Promise<number | null> {
  try {
    const course = await prisma.course.findUnique({
      where: { slug },
      select: { id: true },
    })
    return course?.id || null
  } catch (error) {
    console.error(`Error fetching ID for slug ${slug}:`, error)
    return null
  }
}
export async function fetchSlug(type: "course" | "mcq" | "openended" | "code", id: string): Promise<string | null> {
  try {
    if (type === "course") {
      const course = await prisma.course.findUnique({
        where: { id: Number.parseInt(id, 10) },
        select: { slug: true },
      })
      return course?.slug || null
    }
    if (type === "mcq" || type === "openended" || type === "code") {
      const quiz = await prisma.userQuiz.findUnique({
        where: { id: Number.parseInt(id, 10) },
        select: { slug: true },
      })
      return quiz?.slug || null
    }

    return null
  } catch (error) {
    console.error(`Error fetching slug for ${type} with ID ${id}:`, error)
    return null
  }
}
export async function getUserWithCourses(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        courses: {
          include: {
            courseUnits: true,
          },
        },
        subscription: true,
      },
    })

    if (!user) {
      throw new Error("User not found")
    }

    const coursesWithProgress = user.courses.map((course) => {
      const totalUnits = course.courseUnits.length
      const completedUnits = course.courseUnits.filter((unit) => unit.isCompleted).length
      const progress = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0

      return {
        id: course.id,
        name: course.title,
        progress,
      }
    })

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      credits: user.credits,
      courses: coursesWithProgress,
      subscription: user.subscription
        ? {
            userType: user.subscription.userId,
            stripeCurrentPeriodEnd: user.subscription.currentPeriodEnd,
          }
        : null,
    }
  } catch (error) {
    console.error("Error fetching user data:", error)
    throw error
  }
}

export async function getRandomQuestions(count = 5) {
  const randomQuestions = await prisma.userQuiz.findMany({
    where: {
      quizType: "openended",
    },
    select: {
      id: true,
      slug: true,
      title: true,
      _count: {
        select: {
          questions: true,
        },
      },
      questions: {
        select: {
          question: true,
        },
      },
    },
    orderBy: {
      id: "asc",
    },
    take: count,
  })

  return randomQuestions.map((q) => ({
    question: q.questions.map((question) => question.question).join(", "),
    slug: q.slug,
    title: q.title,
    count: q._count.questions,
  }))
}

export async function clearExpiredSessions() {
  const now = new Date()
  await prisma.session.deleteMany({
    where: {
      OR: [{ expires: { lt: now } }],
    },
  })
}

export async function fetchRandomQuizzes(count = 3) {
  try {
    const quizzes = await prisma.userQuiz.findMany({
      where: {
        isPublic: true,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        quizType: true,
        difficulty: true,
        bestScore: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    })

    // Shuffle the quizzes and take the requested count
    const shuffled = quizzes.sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count) || []
  } catch (error) {
    return []
  }
}

export async function createUserQuiz(userId: string, title: string, type: string, slug: string) {
  let uniqueSlug = slug
  let counter = 1

  while (true) {
    try {
      return await prisma.userQuiz.create({
        data: {
          quizType: type,
          timeStarted: new Date(),
          userId,
          isPublic: false,
          title,
          slug: uniqueSlug,
        },
      })
    } catch (error: any) {
      if (error.code === "P2002" && error.meta?.target?.includes("slug")) {
        uniqueSlug = `${slug}-${counter}`
        counter++
      } else {
        throw error
      }
    }
  }
}




export async function updateUserCredits(userId: string, type: QuizType): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  })

  if (!user) {
    throw new Error(`User with id ${userId} not found`)
  }

  if (user.credits <= 0) {
    throw new Error("User does not have enough credits")
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      credits: { decrement: 1 },
      creditsUsed: { increment: 1 },
    },
  })
}

// Add this function to synchronize user credits with token transactions
export async function syncUserCredits(userId: string): Promise<void> {
  try {
    // Get all token transactions for this user
    const tokenTransactions = await prisma.tokenTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    })

    // Calculate the correct balance based on all transactions
    let calculatedBalance = 0

    for (const tx of tokenTransactions) {
      if (tx.type === "SUBSCRIPTION" || tx.type === "PURCHASE") {
        calculatedBalance += tx.credits ?? 0
      } else if (tx.type === "USAGE") {
        calculatedBalance -= Math.abs(tx.amount)
      }
    }

    // Ensure balance is never negative
    calculatedBalance = Math.max(0, calculatedBalance)

    // Update the user's credits to match the calculated balance
    await prisma.user.update({
      where: { id: userId },
      data: { credits: calculatedBalance },
    })

    console.log(`Credits synchronized for user ${userId}. New balance: ${calculatedBalance}`)
  } catch (error) {
    console.warn(`Error synchronizing credits for user ${userId}:`, error)
    throw error
  }
}

// Add this function to record token usage
export async function recordTokenUsage(userId: string, amount: number, description: string): Promise<void> {
  try {
    // Start a transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Get current user credits
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { credits: true },
      })

      if (!user) {
        throw new Error(`User with ID ${userId} not found`)
      }

      // Calculate new balance (ensure it doesn't go below 0)
      const newBalance = Math.max(0, user.credits - amount)

      // Update user credits
      await tx.user.update({
        where: { id: userId },
        data: { credits: newBalance },
      })

      // Record the transaction
      await tx.tokenTransaction.create({
        data: {
          userId,
          amount: amount, // Store as positive number for consistency
          type: "USAGE",
          description: description || `Used ${amount} tokens`,
        },
      })
    })
  } catch (error) {
    console.error(`Error recording token usage for user ${userId}:`, error)
    throw error
  }
}

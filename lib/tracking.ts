import { prisma } from "@/lib/db"

export async function trackServerSideInteraction(
  userId: string,
  interactionType: string,
  entityId: string,
  entityType = "page",
  metadata?: any,
) {
  try {
    await prisma.userInteraction.create({
      data: {
        userId,
        interactionType,
        entityId,
        entityType,
        metadata,
      },
    })
  } catch (error) {
    console.error("Error tracking server-side interaction:", error)
  }
}

export async function trackClientSideInteraction(
  userId: string,
  interactionType: string,
  entityId: string,
  entityType: string,
  metadata?: any,
) {
  try {
    const response = await fetch("/api/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        interactionType,
        entityId,
        entityType,
        metadata,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to track interaction")
    }
  } catch (error) {
  
  }
}

export async function updateUserEngagement(userId: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastActiveAt: new Date(),
        engagementScore: {
          increment: 1,
        },
      },
    })
  } catch (error) {
    console.error("Error updating user engagement:", error)
  }
}


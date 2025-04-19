import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import NodeCache from "node-cache"

// Create a cache for categories with 1 hour TTL
const categoriesCache = new NodeCache({
  stdTTL: 3600, // 1 hour
  checkperiod: 300, // Check for expired keys every 5 minutes
})

export async function GET() {
  try {
    // Check if we have cached categories
    const cachedCategories = categoriesCache.get("all_categories")
    if (cachedCategories) {
      return NextResponse.json(cachedCategories)
    }

    // Fetch categories from the database
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            courses: true,
          },
        },
      },
      orderBy: {
        courses: {
          _count: "desc",
        },
      },
    })

    // Transform the data to include course count
    const formattedCategories = categories.map((category) => ({
      id: category.id.toString(),
      name: category.name,
      courseCount: category._count.courses,
    }))

    // Cache the response
    categoriesCache.set("all_categories", formattedCategories)

    return NextResponse.json(formattedCategories)
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}

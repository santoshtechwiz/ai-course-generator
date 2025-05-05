import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"


export async function GET(req: NextRequest) {
  try {
    // Authenticate admin user
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.isAdmin !== true) {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 })
    }

    // Get query parameters for pagination and filtering
    const searchParams = req.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const search = searchParams.get("search") || ""
    const userTypes = searchParams.getAll("userTypes")
    const sortField = searchParams.get("sortField") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json({ error: "Invalid pagination parameters" }, { status: 400 })
    }

    // Build filter conditions
    const where: any = {}

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ]
    }

    // User type filter
    if (userTypes.length > 0) {
      where.userType = { in: userTypes }
    }

    // Calculate total count with filters
    const totalCount = await prisma.user.count({ where })

    // Build sort conditions
    const orderBy: any = {}
    orderBy[
      sortField === "credits"
        ? "credits"
        : sortField === "name"
          ? "name"
          : sortField === "userType"
            ? "userType"
            : "createdAt"
    ] = sortOrder?.toLowerCase()

    // Fetch users with pagination, filtering, and sorting
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        credits: true,
        isAdmin: true,
        userType: true,
        createdAt: true,
        lastActiveAt: true,
        subscription: {
          select: {
            id: true,
            status: true,
            planId: true,
            currentPeriodEnd: true,
          },
        },
        TokenTransaction: {
          take: 10,
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            credits: true,
            amount: true,
            type: true,
            description: true,
            createdAt: true,
          },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    })

    // Determine if there are more results
    const hasMore = totalCount > page * limit

    // Make sure we're returning the users array in the expected format
    return NextResponse.json({
      users,
      totalCount,
      hasMore,
      page,
      limit,
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch users",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate admin user
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.isAdmin !== true) {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 })
    }

    // Parse request body
    const { name, email, credits, isAdmin, userType, sendWelcomeEmail } = await req.json()

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    // Check if user with email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 })
    }

    // Create new user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        credits: credits || 3,
        isAdmin: isAdmin || false,
        userType: userType || "FREE",
        emailVerified: new Date(), // Auto-verify for admin created users
      },
    })

    
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      credits: user.credits,
      isAdmin: user.isAdmin,
      userType: user.userType,
    })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      {
        error: "Failed to create user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}


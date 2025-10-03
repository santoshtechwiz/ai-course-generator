import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { withAdminAuth } from "@/middlewares/auth-middleware"
import { ApiResponseHandler } from "@/services/api-response-handler"
import type { CreateUserRequest, CreateUserResponse, UsersListResponse } from "./types"

export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
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
      return ApiResponseHandler.validationError("Invalid pagination parameters: page must be >= 1, limit must be 1-100")
    }

    // Build filter conditions
    const where: {
      OR?: Array<{ name?: { contains: string; mode: 'insensitive' } } | { email?: { contains: string; mode: 'insensitive' } }>
      userType?: { in: string[] }
    } = {}

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
    const orderBy: Record<string, 'asc' | 'desc'> = {}
    const validSortField = ['credits', 'name', 'userType', 'createdAt'].includes(sortField) ? sortField : 'createdAt'
    const validSortOrder = sortOrder?.toLowerCase() === 'asc' ? 'asc' : 'desc'
    orderBy[validSortField] = validSortOrder

    // Fetch users with pagination, filtering, and sorting
    // Note: Removed TokenTransaction to improve performance - can be fetched separately if needed
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
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    })

    // Transform users data to match component interface
    const transformedUsers: UsersListResponse['users'] = users.map(user => ({
      id: user.id,
      name: user.name || '',
      email: user.email || '',
      userType: user.userType,
      credits: user.credits || 0,
      lastActive: user.lastActiveAt?.toISOString() || user.createdAt.toISOString(),
      avatarUrl: user.image,
    }))

    // Calculate hasMore for pagination
    const hasMore = page * limit < totalCount

    const response: UsersListResponse = {
      users: transformedUsers,
      totalCount,
      hasMore,
      page,
      limit,
    }

    return ApiResponseHandler.success(response)
  } catch (error) {
    console.error('[UsersAPI] Error fetching users:', error)
    return ApiResponseHandler.error(error || "Failed to fetch users")
  }
})

export const POST = withAdminAuth(async (req: NextRequest) => {
  try {
    // Parse request body
    const body: CreateUserRequest = await req.json()
    const { name, email, credits, isAdmin, userType } = body

    // Validate required fields
    if (!name || !email) {
      return ApiResponseHandler.validationError("Name and email are required")
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return ApiResponseHandler.validationError("Invalid email format")
    }

    // Validate credits if provided
    if (credits !== undefined && (credits < 0 || credits > 1000)) {
      return ApiResponseHandler.validationError("Credits must be between 0 and 1000")
    }

    // Validate userType if provided
    const validUserTypes = ['FREE', 'PREMIUM', 'ADMIN']
    if (userType && !validUserTypes.includes(userType)) {
      return ApiResponseHandler.validationError(`Invalid user type. Must be one of: ${validUserTypes.join(', ')}`)
    }

    // Check if user with email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return ApiResponseHandler.error({
        code: "USER_EXISTS",
        message: "A user with this email already exists",
        status: 409
      })
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

    const response: CreateUserResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      credits: user.credits,
      isAdmin: user.isAdmin,
      userType: user.userType,
    }

    return ApiResponseHandler.success(response)
  } catch (error) {
    console.error('[UsersAPI] Error creating user:', error)
    return ApiResponseHandler.error(error || "Failed to create user")
  }
})

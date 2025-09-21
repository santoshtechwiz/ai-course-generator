import { NextRequest, NextResponse } from "next/server"
import { AuthService } from "./auth-service"
import { SecurityService } from "./security-service"
import { ApiResponseHandler } from "./api-response-handler"
import { z } from "zod"
import { logger } from "@/lib/logger"

/**
 * Base API Route Handler
 * Provides standardized error handling, validation, and response formatting
 */
export abstract class BaseApiRoute {
  protected abstract schema: z.ZodType<any>

  /**
   * Handle the API request
   * @param req Next.js request object
   * @param params Optional route parameters
   */
  protected abstract handle(req: NextRequest, validatedData: any, params?: any): Promise<NextResponse>

  /**
   * Process the request with standardized error handling and validation
   */
  public async process(req: NextRequest, params?: any): Promise<NextResponse> {
    try {
      // Parse and validate request body
      const body = await this.parseBody(req)
      const validatedData = await this.validateData(body)

      // Process the request
      return await this.handle(req, validatedData, params)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Parse request body
   */
  private async parseBody(req: NextRequest): Promise<any> {
    try {
      const contentType = req.headers.get("content-type")
      
      if (contentType?.includes("application/json")) {
        return await req.json()
      }
      
      return {}
    } catch (error) {
      logger.warn("Failed to parse request body:", SecurityService.sanitizeError(error))
      throw ApiResponseHandler.validationError("Invalid request body")
    }
  }

  /**
   * Validate request data against schema
   */
  private async validateData(data: any): Promise<any> {
    try {
      return this.schema.parse(data)
    } catch (error) {
      logger.warn("Validation failed:", SecurityService.sanitizeError(error))
      throw ApiResponseHandler.validationError("Invalid request data", error)
    }
  }

  /**
   * Handle errors consistently
   */
  protected handleError(error: any): NextResponse {
    if (error instanceof z.ZodError) {
      return ApiResponseHandler.validationError("Validation failed", error.errors)
    }

    // Pass through pre-formatted API responses
    if (error instanceof NextResponse) {
      return error
    }

    logger.error("API error:", SecurityService.sanitizeError(error))
    return ApiResponseHandler.error(error)
  }

  /**
   * Create success response
   */
  protected success<T>(data: T, metadata?: Record<string, any>): NextResponse {
    return ApiResponseHandler.success(data, metadata)
  }
}

/**
 * Base Authenticated API Route Handler
 * Adds authentication requirement to base route
 */
export abstract class AuthenticatedApiRoute extends BaseApiRoute {
  public async process(req: NextRequest, params?: any): Promise<NextResponse> {
    try {
      const session = await AuthService.verifySession()
      return super.process(req, { ...params, session })
    } catch (error) {
      return ApiResponseHandler.unauthorized()
    }
  }
}

/**
 * Base Admin API Route Handler
 * Adds admin privilege requirement
 */
export abstract class AdminApiRoute extends AuthenticatedApiRoute {
  public async process(req: NextRequest, params?: any): Promise<NextResponse> {
    try {
      const session = await AuthService.verifySession()
      
      if (!AuthService.isAdmin(session)) {
        return ApiResponseHandler.forbidden("Admin privileges required")
      }
      
      return super.process(req, { ...params, session })
    } catch (error) {
      return this.handleError(error)
    }
  }
}
import { z } from 'zod'
import { createApiResponse } from './error-handler'

export function validateRequest<T>(
  schema: z.Schema<T>,
  data: unknown
): z.infer<T> | Response {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiResponse({
        error: error.flatten().fieldErrors,
        status: 400,
        message: 'Invalid request data'
      })
    }
    throw error
  }
}

export function validateSearchParams(
  schema: z.ZodSchema,
  searchParams: URLSearchParams
) {
  const params: Record<string, unknown> = {}
  for (const [key, value] of searchParams.entries()) {
    // Convert number strings to numbers
    if (!isNaN(Number(value))) {
      params[key] = Number(value)
    } else if (value === 'true' || value === 'false') {
      params[key] = value === 'true'
    } else {
      params[key] = value
    }
  }
  return validateRequest(schema, params)
}
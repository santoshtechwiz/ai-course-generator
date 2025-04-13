// Helper functions for API routes

/**
 * Formats an API response
 */
export function formatApiResponse<T>(data: T, status = 200) {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }
  
  /**
   * Formats an API error response
   */
  export function formatApiError(message: string, status = 400) {
    return new Response(
      JSON.stringify({
        error: message,
      }),
      {
        status,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
  
  /**
   * Validates that required fields are present in the request body
   */
  export function validateRequiredFields(body: any, fields: string[]) {
    const missingFields = fields.filter((field) => !body[field])
  
    if (missingFields.length > 0) {
      return {
        valid: false,
        error: `Missing required fields: ${missingFields.join(", ")}`,
      }
    }
  
    return { valid: true }
  }
  
  /**
   * Parses and validates the request body
   */
  export async function parseRequestBody(request: Request) {
    try {
      return await request.json()
    } catch (error) {
      return null
    }
  }
  
import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'

// Mock the ai module at the top level
vi.mock('ai', () => ({
  generateObject: vi.fn()
}))

describe('Document API route', () => {
  it('returns 401 when no session', async () => {
    // Mock getAuthSession to return null before importing the route module
    const authModule = await import('@/lib/auth')
    const getAuthSpy = vi.spyOn(authModule, 'getAuthSession').mockResolvedValue(null)

    const DocumentRoute = await import('@/app/api/document/route')
    const req = { formData: async () => new FormData() } as unknown as NextRequest
    const res = await DocumentRoute.POST(req)
    expect(res.status).toBe(401)

    getAuthSpy.mockRestore()
  })

  it('returns 403 for inactive users before deduction', async () => {
    const authModule = await import('@/lib/auth')
    const getAuthSpy = vi.spyOn(authModule, 'getAuthSession').mockResolvedValue({ user: { id: 'u1', isActive: false } })

    const DocumentRoute = await import('@/app/api/document/route')
    const req = { formData: async () => new FormData() } as unknown as NextRequest
    const res = await DocumentRoute.POST(req)
    expect(res.status).toBe(403)

    getAuthSpy.mockRestore()
  })

  it('attempts refund when AI generation throws', async () => {
    const authModule = await import('@/lib/auth')
    const getAuthSpy = vi.spyOn(authModule, 'getAuthSession').mockResolvedValue({ user: { id: 'u2', isActive: true } })

    // Mock creditService.executeCreditsOperation to succeed
    const creditModule = await import('@/services/credit-service')
    const execSpy = vi.spyOn(creditModule.creditService, 'executeCreditsOperation').mockResolvedValue({ success: true, newBalance: 10, transactionId: 'tx123' } as any)

    // Mock the AI function to throw
    const aiModule = await import('ai')
    ;(aiModule.generateObject as any).mockRejectedValue(new Error('AI failed'))

    // Now import route after mocks
    const DocumentRoute = await import('@/app/api/document/route')

    // Mock request with minimal file object compatible with Web File API used by NextRequest.formData
    const fileLike = {
      name: 'file.txt',
      size: 5,
      text: async () => 'hello'
    }

    const fd = new Map()
    fd.set('file', fileLike as any)
    fd.set('numberOfQuestions', '3')
    fd.set('difficulty', '50')

    const req = { formData: async () => ({ get: (k: string) => fd.get(k) }) } as unknown as NextRequest
    const res = await DocumentRoute.POST(req)

    expect(execSpy).toHaveBeenCalled()
    expect(aiModule.generateObject).toHaveBeenCalled()
    expect(res.status).toBe(500)

    getAuthSpy.mockRestore()
    execSpy.mockRestore()
  })
})
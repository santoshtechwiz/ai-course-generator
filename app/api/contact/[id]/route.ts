import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { updateContactSubmission, deleteContactSubmission } from "@/app/actions/actions"
import { sendContactResponse } from "@/lib/email"
import { withAdminAuth } from "@/middlewares/auth-middleware"

export const GET = withAdminAuth(async (request: NextRequest) => {
  try {
    const pathParts = request.nextUrl.pathname.split('/')
    const submissionId = Number.parseInt(pathParts[pathParts.length - 1])
    if (isNaN(submissionId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const submission = await prisma.contactSubmission.findUnique({
      where: { id: submissionId },
    })

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    return NextResponse.json(submission)
  } catch (error) {
    console.error("Error fetching contact submission:", error)
    return NextResponse.json({ error: "Failed to fetch contact submission" }, { status: 500 })
  }
})

export const PATCH = withAdminAuth(async function(request: NextRequest) {
  try {
    const pathParts = request.nextUrl.pathname.split('/')
    const submissionId = Number.parseInt(pathParts[pathParts.length - 1])
    if (isNaN(submissionId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const data = await request.json()

    // Update submission
    const result = await updateContactSubmission(submissionId, {
      status: data.status,
      adminNotes: data.adminNotes,
      responseMessage: data.responseMessage,
    })

    if (!result.success) {
      throw new Error(result.error || "Failed to update submission")
    }

    // If status is changed to RESPONDED, send an email response
    if (data.status === "RESPONDED" && data.responseMessage) {
      const submission = await prisma.contactSubmission.findUnique({
        where: { id: submissionId },
      })

      if (submission) {
        await sendContactResponse(submission.email, submission.name, submission.message, data.responseMessage)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating contact submission:", error)
    return NextResponse.json({ error: "Failed to update contact submission" }, { status: 500 })
  }
})

export const DELETE = withAdminAuth(async (request: NextRequest) => {
  try {
    const pathParts = request.nextUrl.pathname.split('/')
    const submissionId = Number.parseInt(pathParts[pathParts.length - 1])
    if (isNaN(submissionId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const result = await deleteContactSubmission(submissionId)

    if (!result.success) {
      throw new Error(result.error || "Failed to delete submission")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting contact submission:", error)
    return NextResponse.json({ error: "Failed to delete contact submission" }, { status: 500 })
  }
})

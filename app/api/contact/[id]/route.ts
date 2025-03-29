import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { updateContactSubmission, deleteContactSubmission } from "@/app/actions/actions"
import { sendContactResponse } from "@/lib/email"
import { isAdmin } from "@/lib/authOptions"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user is admin
    const admin = await isAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const submission = await prisma.contactSubmission.findUnique({
      where: { id },
    })

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    return NextResponse.json(submission)
  } catch (error) {
    console.error("Error fetching contact submission:", error)
    return NextResponse.json({ error: "Failed to fetch contact submission" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user is admin
    const admin = await isAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const data = await request.json()

    // Update submission
    const result = await updateContactSubmission(id, {
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
        where: { id },
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
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user is admin
    const admin = await isAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = Number.parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const result = await deleteContactSubmission(id)

    if (!result.success) {
      throw new Error(result.error || "Failed to delete submission")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting contact submission:", error)
    return NextResponse.json({ error: "Failed to delete contact submission" }, { status: 500 })
  }
}


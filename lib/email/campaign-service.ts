import { v4 as uuidv4 } from "uuid"

export interface Campaign {
  id: string
  name: string
  subject: string
  templateId: string
  segmentId: string
  description?: string
  status: "DRAFT" | "SCHEDULED" | "SENDING" | "SENT" | "FAILED"
  scheduledFor?: Date
  sentAt?: Date
  recipientCount: number
  opens: number
  clicks: number
  openRate: number
  clickRate: number
  createdAt: Date
  updatedAt: Date
}

interface CreateCampaignParams {
  name: string
  subject: string
  templateId: string
  segmentId: string
  description?: string
  isScheduled: boolean
  scheduledFor?: Date
  status: "DRAFT" | "SCHEDULED" | "SENDING" | "SENT" | "FAILED"
}

// Mock function to create a campaign
export async function createCampaign(params: CreateCampaignParams): Promise<Campaign> {
  // In a real app, this would be an API call
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const now = new Date()

  const campaign: Campaign = {
    id: uuidv4(),
    name: params.name,
    subject: params.subject,
    templateId: params.templateId,
    segmentId: params.segmentId,
    description: params.description,
    status: params.status,
    scheduledFor: params.isScheduled ? params.scheduledFor : undefined,
    recipientCount: 0, // Would be calculated based on segment
    opens: 0,
    clicks: 0,
    openRate: 0,
    clickRate: 0,
    createdAt: now,
    updatedAt: now,
  }

  return campaign
}

// Mock function to get campaigns
export async function getCampaigns(): Promise<Campaign[]> {
  // In a real app, this would be an API call
  await new Promise((resolve) => setTimeout(resolve, 500))

  return [
    {
      id: "1",
      name: "Welcome Series",
      subject: "Welcome to CourseAI!",
      templateId: "welcome",
      segmentId: "new",
      description: "Onboarding email for new users",
      status: "SENT",
      sentAt: new Date("2023-10-15T14:30:00Z"),
      recipientCount: 1245,
      opens: 876,
      clicks: 432,
      openRate: 70.4,
      clickRate: 49.3,
      createdAt: new Date("2023-10-14T10:00:00Z"),
      updatedAt: new Date("2023-10-15T14:30:00Z"),
    },
    {
      id: "2",
      name: "Course Promotion - April",
      subject: "Courses Tailored Just for You!",
      templateId: "course-promo",
      segmentId: "all",
      description: "Promoting new spring courses",
      status: "SENT",
      sentAt: new Date("2023-10-05T09:15:00Z"),
      recipientCount: 5678,
      opens: 3456,
      clicks: 1234,
      openRate: 60.9,
      clickRate: 35.7,
      createdAt: new Date("2023-10-03T11:00:00Z"),
      updatedAt: new Date("2023-10-05T09:15:00Z"),
    },
    {
      id: "3",
      name: "Quiz Challenge",
      subject: "Test Your Knowledge with Our Latest Quizzes!",
      templateId: "quiz-promo",
      segmentId: "engaged",
      description: "Promoting new quizzes to engaged users",
      status: "DRAFT",
      recipientCount: 0,
      opens: 0,
      clicks: 0,
      openRate: 0,
      clickRate: 0,
      createdAt: new Date("2023-10-18T15:30:00Z"),
      updatedAt: new Date("2023-10-18T15:30:00Z"),
    },
    {
      id: "4",
      name: "Re-engagement Campaign",
      subject: "We Miss You! Come Back and Explore",
      templateId: "reengagement",
      segmentId: "inactive",
      description: "Bringing back inactive users",
      status: "SCHEDULED",
      scheduledFor: new Date("2023-11-01T09:00:00Z"),
      recipientCount: 3245,
      opens: 0,
      clicks: 0,
      openRate: 0,
      clickRate: 0,
      createdAt: new Date("2023-10-20T14:00:00Z"),
      updatedAt: new Date("2023-10-20T14:00:00Z"),
    },
  ]
}

// Mock function to delete a campaign
export async function deleteCampaign(id: string): Promise<void> {
  // In a real app, this would be an API call
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Return nothing, just simulate success
  return
}

// Mock function to duplicate a campaign
export async function duplicateCampaign(id: string): Promise<Campaign> {
  // In a real app, this would be an API call
  await new Promise((resolve) => setTimeout(resolve, 500))

  // For demo purposes, just return a new campaign with "(Copy)" in the name
  const campaigns = await getCampaigns()
  const originalCampaign = campaigns.find((c) => c.id === id)

  if (!originalCampaign) {
    throw new Error("Campaign not found")
  }

  const now = new Date()

  const duplicatedCampaign: Campaign = {
    ...originalCampaign,
    id: uuidv4(),
    name: `${originalCampaign.name} (Copy)`,
    status: "DRAFT",
    scheduledFor: undefined,
    sentAt: undefined,
    recipientCount: 0,
    opens: 0,
    clicks: 0,
    openRate: 0,
    clickRate: 0,
    createdAt: now,
    updatedAt: now,
  }

  return duplicatedCampaign
}

// Mock function to send a campaign
export async function sendCampaign(id: string): Promise<void> {
  // In a real app, this would be an API call
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Return nothing, just simulate success
  return
}


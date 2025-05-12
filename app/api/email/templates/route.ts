import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    // In a real app, this would fetch templates from a database
    const templates = [
      {
        id: "welcome",
        name: "Welcome Email",
        description: "Sent to new users after sign-up",
        subject: "Welcome to CourseAI!",
        lastUpdated: "2023-10-15T14:30:00Z",
        variables: ["name", "loginUrl"],
        isDefault: true,
      },
      {
        id: "quiz-promo",
        name: "Quiz Promotion",
        description: "Promotes new quizzes based on user interests",
        subject: "Test Your Knowledge with Our Latest Quizzes!",
        lastUpdated: "2023-10-10T09:15:00Z",
        variables: ["name", "quizUrl", "interests"],
        isDefault: true,
      },
      {
        id: "course-promo",
        name: "Course Promotion",
        description: "Promotes courses based on user interests",
        subject: "Courses Tailored Just for You!",
        lastUpdated: "2023-10-05T11:45:00Z",
        variables: ["name", "courseUrl", "courseName", "discount"],
        isDefault: true,
      },
      {
        id: "reengagement",
        name: "Re-engagement",
        description: "Sent to inactive users to bring them back",
        subject: "We Miss You! Come Back and Explore",
        lastUpdated: "2023-09-28T16:20:00Z",
        variables: ["name", "lastLoginDate", "promoCode"],
        isDefault: true,
      },
    ]

    return NextResponse.json({ templates })
  } catch (error) {
    console.error("Error fetching templates:", error)
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const templateData = await request.json()

    // Validate required fields
    if (!templateData.name || !templateData.subject || !templateData.htmlContent) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // In a real app, this would create a template in the database
    // For now, just return a mock response
    return NextResponse.json({
      success: true,
      template: {
        id: Math.random().toString(36).substring(2, 15),
        ...templateData,
        lastUpdated: new Date().toISOString(),
        isDefault: false,
      },
    })
  } catch (error) {
    console.error("Error creating template:", error)
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 })
  }
}

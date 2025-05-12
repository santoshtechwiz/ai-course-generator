import type { Course, CourseUnit } from "@prisma/client"
import slugify from "slugify"
interface SubmitQuizDataParams {
  slug: string
  quizId: number
  answers: { answer: string; timeSpent: number; hintsUsed: boolean }[]
  elapsedTime: number
  score: number
  type: string
}

const titleToSlug = (title: string) => {
  const uriSlug = slugify(title, {
    replacement: "-",
    lower: true,
    trim: true,
  })

  return encodeURI(uriSlug)
}
const URL = process.env.NEXT_PUBLIC_URL || "http://localhost:3000"

const titleSubTopicToSlug = (title: string, subTopic: string): string => {
  const slugOptions = { replacement: "-", lower: true, trim: true }

  const titleSlug = slugify(title, slugOptions)
  const subTopicSlug = slugify(subTopic, slugOptions)

  const randomString = Math.random().toString(36).substring(2, 8) // Generates a random string

  return [titleSlug, subTopicSlug, randomString].filter(Boolean).join("-") // Ensures no extra dashes
}

const getCourseSlug = (course: Course) => {
  return `${titleToSlug(course.title)}-${course.id}`
}

const getUnitSlug = (unit: CourseUnit) => {
  return `${titleToSlug(unit.name)}-${unit.id}`
}

export { titleToSlug, getCourseSlug, getUnitSlug, titleSubTopicToSlug }

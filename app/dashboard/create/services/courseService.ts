import { apiRequest } from "@/lib/api-helper"

export interface UpdateChaptersData {
  courseId: number
  slug: string
  units: Array<{
    id: number
    chapters: Array<{
      id: number | null
      title: string
      videoId: string | null
      unitId: number
      position: number
      isCustom?: boolean
      youtubeSearchQuery?: string
    }>
  }>
}

export const courseService = {
  async updateCourseChapters(data: UpdateChaptersData) {
    try {
      return await apiRequest("/api/course/update-chapters", { method: 'POST', body: JSON.stringify(data) })
    } catch (error) {
      console.error("Error updating course chapters:", error)
      throw error
    }
  },
}

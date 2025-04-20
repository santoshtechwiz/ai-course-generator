import axios from "axios"

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
      const response = await axios.post("/api/course/update-chapters", data)
      return response.data
    } catch (error) {
      console.error("Error updating course chapters:", error)
      throw error
    }
  },
}

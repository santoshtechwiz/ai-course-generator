import { api } from "@/lib/api-helper";
import { createApiClient } from "@/lib/api-client";

// Define strongly-typed interfaces
export interface UpdateChaptersData {
  courseId: number;
  slug: string;
  units: Array<{
    id: number;
    chapters: Array<{
      id: number | null;
      title: string;
      videoId: string | null;
      unitId: number;
      position: number;
      isCustom?: boolean;
      youtubeSearchQuery?: string;
    }>;
  }>;
}

// Define course API endpoints with strong typing
const courseEndpoints = {
  getCourse: (slug: string) => `/api/course/${slug}`,
  getCourses: (params: { category?: string, search?: string, page?: number, limit?: number }) => ({
    url: '/api/course',
    method: 'GET',
    options: { params }
  }),
  createCourse: (data: any) => ({
    url: '/api/course',
    method: 'POST',
    data
  }),
  updateCourse: (slug: string, data: any) => ({
    url: `/api/course/${slug}`,
    method: 'PATCH',
    data
  }),
  deleteCourse: (slug: string) => ({
    url: `/api/course/${slug}`,
    method: 'DELETE'
  }),
  updateChapters: (data: UpdateChaptersData) => ({
    url: '/api/course/update-chapters',
    method: 'POST',
    data
  }),
  getProgress: (courseId: string) => `/api/progress/${courseId}`,
  updateProgress: (courseId: string, data: any) => ({
    url: `/api/progress/${courseId}`,
    method: 'POST',
    data
  }),
  rateCourse: (data: { type: 'course', id: string, rating: number }) => ({
    url: '/api/rating',
    method: 'POST',
    data
  }),
  getCourseRating: (courseId: string) => ({
    url: '/api/rating',
    method: 'GET',
    options: { params: { type: 'course', id: courseId } }
  }),
};

// Create and export a pre-configured API client for courses
export const courseApiClient = createApiClient('', courseEndpoints);

// Additional direct methods for compatibility with existing code
export const courseService = {
  async updateCourseChapters(data: UpdateChaptersData) {
    try {
      return await api.post("/api/course/update-chapters", data);
    } catch (error) {
      console.error("Error updating course chapters:", error);
      throw error;
    }
  },
  
  // Add more direct methods as needed for compatibility
};

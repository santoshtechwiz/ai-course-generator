import { createApiClient } from "@/lib/api-client";

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
  updateChapters: (data: any) => ({
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

import { getCourse } from './sitemapquery'

export function isValidCourse(courseId: string): boolean {
  const course = getCourse(courseId)
  return !!course
}

export function excludeFromSitemap(courseId: string): void {
  // This function would be called when a course is deleted or becomes invalid
  // It could update a separate list of excluded URLs, or mark the course as inactive in the database
  console.log(`Excluding course ${courseId} from sitemap`)
}


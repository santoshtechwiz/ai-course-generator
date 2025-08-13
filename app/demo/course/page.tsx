import { redirect } from 'next/navigation'

export default function DemoCoursePage() {
  // Redirect to the course page with a demo course ID
  redirect('/course/ai-fundamentals')
}
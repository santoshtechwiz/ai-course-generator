import { Metadata } from 'next'
import CourseVideoPage from '@/components/course/CourseVideoPage'

interface CoursePageProps {
  params: {
    courseId: string
  }
}

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  return {
    title: 'AI Fundamentals Course | Learn AI',
    description: 'Master the fundamentals of artificial intelligence with our comprehensive video course. Start with free lessons and unlock the full course.',
    openGraph: {
      title: 'AI Fundamentals Course | Learn AI',
      description: 'Master the fundamentals of artificial intelligence with our comprehensive video course.',
      type: 'website',
    },
  }
}

export default function CoursePage({ params }: CoursePageProps) {
  return <CourseVideoPage courseId={params.courseId} />
}
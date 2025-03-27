import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CourseAI',
    short_name: 'CourseAI',
    description: 'Revolutionize your learning experience with our AI-powered course creation and personalized education platform.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fff',
    theme_color: '#fff',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
    categories: ['education', 'technology'],
    related_applications: [
      {
        platform: 'web',
        url: 'https://courseai.io',
        id: 'course-ai',
      },
    ],
    screenshots: [
      {
        src: '/default-thumbnail.png',
        sizes: '1280x720',
        type: 'image/png',
      },
      {
        src: '/default-thumbnail.png',
        sizes: '1280x720',
        type: 'image/png',
      },
    ],
  }
}

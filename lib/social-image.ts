import { Metadata } from 'next';

interface SocialImageProps {
  title?: string;
  description?: string;
  imagePath?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile' | 'book';
}

/**
 * Generates consistent social media metadata for pages
 * 
 * @param props Properties for social media metadata
 * @returns Metadata object for Next.js metadata
 */
export function generateSocialImage({
  title = 'CourseAI - Interactive Programming Quizzes and Learning',
  description = 'Enhance your programming skills with interactive quizzes, coding challenges, and learning resources designed for developers of all levels.',
  imagePath = '/images/og/courseai-og.png',
  url = '',
  type = 'website'
}: SocialImageProps): Partial<Metadata> {
  // Use the default OG image or a specified one
  const imageUrl = imagePath || '/images/og/courseai-og.png';
  
  return {
    openGraph: {
      title,
      description,
      url: url || 'https://courseai.io',
      siteName: 'CourseAI',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title
        }
      ],
      type
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    }
  };
}

import { useState, useEffect } from 'react'

export interface Video {
  id: string
  title: string
  description: string
  duration: string
  thumbnail: string
  videoUrl: string
  transcript: string
  tags: string[]
}

export interface Quiz {
  id: string
  title: string
  questions: QuizQuestion[]
  timeLimit: number
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

export interface Course {
  id: string
  title: string
  description: string
  instructor: string
  category: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  rating: number
  totalRatings: number
  duration: string
  videos: Video[]
  quizzes: Quiz[]
  thumbnail: string
  tags: string[]
}

export function useCourseData(courseId: string) {
  const [course, setCourse] = useState<Course | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Simulate API call
    const fetchCourse = async () => {
      setIsLoading(true)
      try {
        // Mock data - in real app this would be an API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const mockCourse: Course = {
          id: courseId,
          title: "AI Fundamentals: From Theory to Practice",
          description: "Master the fundamentals of artificial intelligence with this comprehensive course covering machine learning, neural networks, and practical applications.",
          instructor: "Dr. Sarah Chen",
          category: "Artificial Intelligence",
          level: "Beginner",
          rating: 4.8,
          totalRatings: 1247,
          duration: "12 hours",
          thumbnail: "/api/placeholder/400/225",
          tags: ["AI", "Machine Learning", "Neural Networks", "Python"],
          videos: [
            {
              id: "1",
              title: "Introduction to Artificial Intelligence",
              description: "Learn what AI is, its history, and current applications in the real world. We'll explore the different types of AI and how they're transforming industries.",
              duration: "15:30",
              thumbnail: "/api/placeholder/320/180",
              videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
              transcript: "Welcome to our comprehensive course on Artificial Intelligence...",
              tags: ["Introduction", "AI Basics", "History"]
            },
            {
              id: "2",
              title: "Machine Learning Fundamentals",
              description: "Dive into the core concepts of machine learning, including supervised and unsupervised learning, algorithms, and data preprocessing techniques.",
              duration: "22:15",
              thumbnail: "/api/placeholder/320/180",
              videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
              transcript: "Machine learning is a subset of artificial intelligence...",
              tags: ["Machine Learning", "Algorithms", "Data"]
            },
            {
              id: "3",
              title: "Neural Networks Deep Dive",
              description: "Explore the architecture of neural networks, activation functions, backpropagation, and how to build your first neural network from scratch.",
              duration: "28:45",
              thumbnail: "/api/placeholder/320/180",
              videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
              transcript: "Neural networks are inspired by the human brain...",
              tags: ["Neural Networks", "Deep Learning", "Backpropagation"]
            },
            {
              id: "4",
              title: "Natural Language Processing",
              description: "Learn how AI processes and understands human language, including text analysis, sentiment analysis, and language generation.",
              duration: "25:20",
              thumbnail: "/api/placeholder/320/180",
              videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
              transcript: "Natural Language Processing, or NLP, is a branch of AI...",
              tags: ["NLP", "Text Analysis", "Language Models"]
            },
            {
              id: "5",
              title: "Computer Vision Applications",
              description: "Discover how AI sees and interprets visual information, from image classification to object detection and facial recognition.",
              duration: "31:10",
              thumbnail: "/api/placeholder/320/180",
              videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
              transcript: "Computer vision is the field of AI that enables machines...",
              tags: ["Computer Vision", "Image Processing", "Object Detection"]
            },
            {
              id: "6",
              title: "AI Ethics and Responsible Development",
              description: "Explore the ethical considerations in AI development, including bias, privacy, transparency, and the future of responsible AI.",
              duration: "19:35",
              thumbnail: "/api/placeholder/320/180",
              videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
              transcript: "As AI becomes more prevalent in our lives...",
              tags: ["AI Ethics", "Responsible AI", "Bias"]
            }
          ],
          quizzes: [
            {
              id: "quiz-1",
              title: "AI Fundamentals Quiz",
              timeLimit: 600,
              questions: [
                {
                  id: "q1",
                  question: "What is the primary goal of artificial intelligence?",
                  options: [
                    "To replace human workers",
                    "To create machines that can perform tasks requiring human intelligence",
                    "To make computers faster",
                    "To reduce electricity consumption"
                  ],
                  correctAnswer: 1,
                  explanation: "AI aims to create machines that can perform tasks that typically require human intelligence, such as learning, reasoning, and problem-solving."
                },
                {
                  id: "q2",
                  question: "Which of the following is NOT a type of machine learning?",
                  options: [
                    "Supervised Learning",
                    "Unsupervised Learning",
                    "Reinforcement Learning",
                    "Manual Learning"
                  ],
                  correctAnswer: 3,
                  explanation: "Manual Learning is not a recognized type of machine learning. The three main types are supervised, unsupervised, and reinforcement learning."
                }
              ]
            },
            {
              id: "quiz-2",
              title: "Machine Learning Quiz",
              timeLimit: 900,
              questions: [
                {
                  id: "q1",
                  question: "What is overfitting in machine learning?",
                  options: [
                    "When a model performs too well on training data",
                    "When a model is too simple",
                    "When data is missing",
                    "When the algorithm is too fast"
                  ],
                  correctAnswer: 0,
                  explanation: "Overfitting occurs when a model learns the training data too well, including noise and irrelevant patterns, leading to poor generalization on new data."
                }
              ]
            }
          ]
        }
        
        setCourse(mockCourse)
      } catch (err) {
        setError('Failed to load course data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCourse()
  }, [courseId])

  return { course, isLoading, error }
}
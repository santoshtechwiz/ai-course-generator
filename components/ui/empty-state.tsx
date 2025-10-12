/**
 * Empty State Component
 * 
 * Engaging empty state with illustrations, clear actions, and helpful messaging
 * Usage: <EmptyState variant="courses" title="No courses yet" description="..." action={{ label: "Create Course", onClick: handleCreate }} />
 */

import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  BookOpen,
  FileQuestion,
  Layers,
  Sparkles,
  Search,
  FolderOpen,
  GraduationCap,
  Lightbulb,
  Target,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type EmptyStateVariant =
  | 'courses'
  | 'quizzes'
  | 'flashcards'
  | 'search'
  | 'favorites'
  | 'progress'
  | 'general'

interface EmptyStateAction {
  label: string
  onClick: () => void
  variant?: 'default' | 'outline' | 'ghost'
  icon?: React.ReactNode
}

interface EmptyStateProps {
  variant?: EmptyStateVariant
  title?: string
  description?: string
  icon?: React.ReactNode
  action?: EmptyStateAction
  secondaryAction?: EmptyStateAction
  illustration?: 'default' | 'minimal' | 'detailed'
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const iconMap: Record<EmptyStateVariant, React.ReactNode> = {
  courses: <BookOpen className="w-full h-full" />,
  quizzes: <FileQuestion className="w-full h-full" />,
  flashcards: <Layers className="w-full h-full" />,
  search: <Search className="w-full h-full" />,
  favorites: <Sparkles className="w-full h-full" />,
  progress: <Target className="w-full h-full" />,
  general: <FolderOpen className="w-full h-full" />,
}

const defaultContent: Record<
  EmptyStateVariant,
  { title: string; description: string }
> = {
  courses: {
    title: 'No courses yet',
    description:
      'Start your learning journey by creating your first course or exploring our course catalog.',
  },
  quizzes: {
    title: 'No quizzes found',
    description:
      'Create engaging quizzes to test your knowledge or explore existing quizzes.',
  },
  flashcards: {
    title: 'No flashcards yet',
    description:
      'Create flashcard decks to improve retention and master new concepts.',
  },
  search: {
    title: 'No results found',
    description:
      'Try adjusting your search terms or filters to find what you\'re looking for.',
  },
  favorites: {
    title: 'No favorites yet',
    description:
      'Mark courses and quizzes as favorites to quickly access them later.',
  },
  progress: {
    title: 'No progress tracked',
    description:
      'Start learning to see your progress and track your achievements.',
  },
  general: {
    title: 'Nothing here yet',
    description: 'This section is empty. Check back later for updates.',
  },
}

const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'general',
  title,
  description,
  icon,
  action,
  secondaryAction,
  illustration = 'default',
  className,
  size = 'md',
}) => {
  const content = defaultContent[variant]
  const displayTitle = title || content.title
  const displayDescription = description || content.description
  const displayIcon = icon || iconMap[variant]

  const sizeClasses = {
    sm: {
      container: 'py-8',
      icon: 'w-16 h-16',
      title: 'text-lg',
      description: 'text-sm',
    },
    md: {
      container: 'py-12',
      icon: 'w-24 h-24',
      title: 'text-xl',
      description: 'text-base',
    },
    lg: {
      container: 'py-16',
      icon: 'w-32 h-32',
      title: 'text-2xl',
      description: 'text-lg',
    },
  }

  const sizes = sizeClasses[size]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn('w-full flex items-center justify-center', sizes.container, className)}
    >
      <Card className="max-w-md w-full p-8 text-center border-dashed">
        <div className="flex flex-col items-center gap-6">
          {/* Icon with animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15,
              delay: 0.1,
            }}
            className={cn(
              'relative flex items-center justify-center text-muted-foreground/40',
              sizes.icon
            )}
          >
            {/* Pulsing background circle */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.1, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute inset-0 rounded-full bg-primary/10"
            />
            
            {/* Icon */}
            <div className="relative z-10">{displayIcon}</div>

            {/* Decorative sparkle */}
            {illustration !== 'minimal' && (
              <motion.div
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                className="absolute -top-2 -right-2 text-primary"
              >
                <Sparkles className="w-6 h-6" />
              </motion.div>
            )}
          </motion.div>

          {/* Content */}
          <div className="space-y-2">
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={cn('font-semibold text-foreground', sizes.title)}
            >
              {displayTitle}
            </motion.h3>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={cn('text-muted-foreground max-w-sm', sizes.description)}
            >
              {displayDescription}
            </motion.p>
          </div>

          {/* Actions */}
          {(action || secondaryAction) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto"
            >
              {action && (
                <Button
                  onClick={action.onClick}
                  variant={action.variant || 'default'}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  {action.icon}
                  {action.label}
                </Button>
              )}
              
              {secondaryAction && (
                <Button
                  onClick={secondaryAction.onClick}
                  variant={secondaryAction.variant || 'outline'}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  {secondaryAction.icon}
                  {secondaryAction.label}
                </Button>
              )}
            </motion.div>
          )}

          {/* Subtle decorative elements */}
          {illustration === 'detailed' && (
            <>
              <motion.div
                animate={{
                  y: [0, -10, 0],
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute top-4 left-4 text-primary/20"
              >
                <GraduationCap className="w-8 h-8" />
              </motion.div>
              
              <motion.div
                animate={{
                  y: [0, 10, 0],
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.5,
                }}
                className="absolute bottom-4 right-4 text-primary/20"
              >
                <Lightbulb className="w-8 h-8" />
              </motion.div>
              
              <motion.div
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                className="absolute top-1/2 right-8 text-primary/10"
              >
                <Zap className="w-6 h-6" />
              </motion.div>
            </>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

export default EmptyState

/**
 * Shared Quiz Components Library
 * Enterprise Neobrutalism design system components
 * Used across all quiz types: MCQ, Code, Blanks, OpenEnded, Flashcard
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, Target, Award, Eye, Heart, TrendingUp } from 'lucide-react';
import { cn, getColorClasses } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

// ========================================
// TYPE DEFINITIONS
// ========================================

export type QuizType = 'mcq' | 'code' | 'blanks' | 'openended' | 'flashcard';
export type QuizDifficulty = 'easy' | 'medium' | 'hard';

export interface QuizHeaderProps {
  title: string;
  type: QuizType;
  difficulty: QuizDifficulty;
  currentQuestion: number;
  totalQuestions: number;
  timeElapsed?: number;
  onExit?: () => void;
  breadcrumbs?: Array<{ label: string; href: string }>;
}

export interface QuizSidebarProps {
  position: 'left' | 'right';
  children: React.ReactNode;
  className?: string;
  collapsible?: boolean;
}

export interface QuizCardProps {
  variant?: 'primary' | 'secondary' | 'tertiary';
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
}

export interface QuizNavigationProps {
  onPrevious?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  previousDisabled?: boolean;
  nextDisabled?: boolean;
  showSubmit?: boolean;
  loading?: boolean;
}

export interface QuizStatsProps {
  rating?: number;
  views?: number;
  likes?: number;
  completions?: number;
  avgScore?: number;
}

export interface QuizProgressProps {
  current: number;
  total: number;
  percentage?: number;
  showNumbers?: boolean;
}

export interface RelatedQuizProps {
  id: string;
  title: string;
  type: QuizType;
  difficulty: QuizDifficulty;
  rating: number;
  views: number;
  onClick?: () => void;
}

// ========================================
// QUIZ HEADER COMPONENT
// ========================================

export const QuizHeader: React.FC<QuizHeaderProps> = ({
  title,
  type,
  difficulty,
  currentQuestion,
  totalQuestions,
  timeElapsed,
  onExit,
  breadcrumbs,
}) => {
  const styles = getColorClasses(type, difficulty);

  // Format time elapsed (seconds to mm:ss)
  const formatTime = (seconds?: number): string => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className={cn(styles.cardPrimary, 'p-6 space-y-4')}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              <Link
                href={crumb.href}
                className={cn(
                  'font-medium hover:underline transition-all duration-100',
                  index === breadcrumbs.length - 1 ? 'text-black' : 'text-gray-600'
                )}
              >
                {crumb.label}
              </Link>
              {index < breadcrumbs.length - 1 && (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Title and Badges */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3 flex-1">
          <h1 className="text-2xl font-black uppercase tracking-tight">{title}</h1>
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Type Badge */}
            <span className={styles.badgeType}>
              {type.toUpperCase()}
            </span>

            {/* Difficulty Badge */}
            <span
              className={styles.badgeStatus}
              style={{ backgroundColor: styles.difficultyColor }}
            >
              {difficulty.toUpperCase()}
            </span>

            {/* Progress Badge */}
            <span className={cn(styles.badgeStatus, 'bg-white')}>
              <Target className="w-3 h-3" />
              Question {currentQuestion} / {totalQuestions}
            </span>

            {/* Time Badge (if provided) */}
            {timeElapsed !== undefined && (
              <span className={cn(styles.badgeStatus, 'bg-white')}>
                <Clock className="w-3 h-3" />
                {formatTime(timeElapsed)}
              </span>
            )}
          </div>
        </div>

        {/* Exit Button */}
        {onExit && (
          <Button
            onClick={onExit}
            className={styles.buttonSecondary}
            size="sm"
          >
            Exit Quiz
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      <QuizProgress
        current={currentQuestion}
        total={totalQuestions}
        showNumbers={false}
      />
    </header>
  );
};

// ========================================
// QUIZ PROGRESS BAR
// ========================================

export const QuizProgress: React.FC<QuizProgressProps> = ({
  current,
  total,
  percentage,
  showNumbers = true,
}) => {
  const progress = percentage ?? (current / total) * 100;

  return (
    <div className="space-y-2">
      {showNumbers && (
        <div className="flex items-center justify-between text-sm font-bold">
          <span className="text-gray-600">Progress</span>
          <span className="text-black">{Math.round(progress)}%</span>
        </div>
      )}
      
      <div className="relative w-full h-4 bg-gray-200 border-2 border-black rounded-md overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-black"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

// ========================================
// QUIZ SIDEBAR
// ========================================

export const QuizSidebar: React.FC<QuizSidebarProps> = ({
  position,
  children,
  className,
  collapsible = false,
}) => {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <aside
      className={cn(
        'space-y-4',
        collapsed && 'hidden lg:block',
        className
      )}
    >
      {collapsible && (
        <Button
          onClick={() => setCollapsed(!collapsed)}
          className="lg:hidden w-full"
          size="sm"
        >
          {collapsed ? 'Show' : 'Hide'} {position === 'left' ? 'Context' : 'Related'}
        </Button>
      )}
      
      {!collapsed && children}
    </aside>
  );
};

// ========================================
// QUIZ CARD
// ========================================

export const QuizCard: React.FC<QuizCardProps> = ({
  variant = 'primary',
  children,
  className,
  animate = true,
}) => {
  const styles = getColorClasses();
  
  const variantStyles = {
    primary: styles.cardPrimary,
    secondary: styles.cardSecondary,
    tertiary: styles.cardTertiary,
  };

  const Component = animate ? motion.div : 'div';

  return (
    <Component
      className={cn(variantStyles[variant], 'p-6', className)}
      {...(animate && {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.2 },
      })}
    >
      {children}
    </Component>
  );
};

// ========================================
// QUIZ NAVIGATION
// ========================================

export const QuizNavigation: React.FC<QuizNavigationProps> = ({
  onPrevious,
  onNext,
  onSubmit,
  previousDisabled = false,
  nextDisabled = false,
  showSubmit = false,
  loading = false,
}) => {
  const styles = getColorClasses();

  return (
    <nav className="flex items-center justify-between gap-4 pt-6 border-t-2 border-black">
      {/* Previous Button */}
      <Button
        onClick={onPrevious}
        disabled={previousDisabled || !onPrevious}
        className={cn(styles.buttonSecondary, 'flex items-center gap-2')}
      >
        <ChevronLeft className="w-4 h-4" />
        Previous
      </Button>

      {/* Submit or Next Button */}
      {showSubmit ? (
        <Button
          onClick={onSubmit}
          disabled={loading}
          className={cn(styles.buttonPrimary, 'flex items-center gap-2')}
        >
          {loading ? 'Submitting...' : 'Submit Quiz'}
          {!loading && <Award className="w-4 h-4" />}
        </Button>
      ) : (
        <Button
          onClick={onNext}
          disabled={nextDisabled || !onNext || loading}
          className={cn(styles.buttonPrimary, 'flex items-center gap-2')}
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}
    </nav>
  );
};

// ========================================
// QUIZ STATS
// ========================================

export const QuizStats: React.FC<QuizStatsProps> = ({
  rating,
  views,
  likes,
  completions,
  avgScore,
}) => {
  const styles = getColorClasses();

  const stats = [
    { icon: Award, label: 'Rating', value: rating?.toFixed(1), color: styles.statsColors.rating },
    { icon: Eye, label: 'Views', value: views, color: styles.statsColors.views },
    { icon: Heart, label: 'Likes', value: likes, color: styles.statsColors.likes },
    { icon: TrendingUp, label: 'Completions', value: completions, color: styles.colors.green },
    { icon: Target, label: 'Avg Score', value: avgScore ? `${avgScore}%` : undefined, color: styles.colors.purple },
  ];

  return (
    <div className={cn(styles.cardTertiary, 'p-4')}>
      <h3 className="font-black uppercase text-sm mb-3">Quiz Stats</h3>
      
      <div className="space-y-2">
        {stats.map((stat, index) => {
          if (stat.value === undefined) return null;
          
          return (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                <span className="font-medium text-gray-700">{stat.label}</span>
              </div>
              <span className="font-bold text-black">{stat.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ========================================
// RELATED QUIZ CARD
// ========================================

export const RelatedQuizCard: React.FC<RelatedQuizProps> = ({
  id,
  title,
  type,
  difficulty,
  rating,
  views,
  onClick,
}) => {
  const styles = getColorClasses(type, difficulty);

  return (
    <motion.div
      className={cn(styles.cardSecondary, 'p-4 cursor-pointer')}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.1 }}
    >
      <div className="space-y-3">
        {/* Title */}
        <h4 className="font-bold text-sm line-clamp-2">{title}</h4>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(styles.badgeStatus, 'text-[10px]')}
            style={{ backgroundColor: styles.bgColor }}
          >
            {type.toUpperCase()}
          </span>
          <span
            className={cn(styles.badgeStatus, 'text-[10px]')}
            style={{ backgroundColor: styles.difficultyColor }}
          >
            {difficulty.toUpperCase()}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <Award className="w-3 h-3" style={{ color: styles.statsColors.rating }} />
            <span className="font-bold">{rating.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3" style={{ color: styles.statsColors.views }} />
            <span className="font-medium text-gray-600">{views}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ========================================
// EXPORTS
// ========================================

export default {
  QuizHeader,
  QuizProgress,
  QuizSidebar,
  QuizCard,
  QuizNavigation,
  QuizStats,
  RelatedQuizCard,
};

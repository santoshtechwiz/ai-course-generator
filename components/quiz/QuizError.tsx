"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  MessageSquare,
  Home,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type QuizErrorType =
  | 'NOT_FOUND'
  | 'PRIVATE_QUIZ'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'CANCELLED'
  | 'UNKNOWN_ERROR'
  | 'INVALID_QUIZ_TYPE'
  | 'MISSING_PARAMS';

interface QuizErrorProps {
  errorType?: QuizErrorType;
  message?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  onReportIssue?: () => void;
  onGoHome?: () => void;
  quizType?: string;
  quizSlug?: string;
  className?: string;
}

const ERROR_CONFIG = {
  NOT_FOUND: {
    title: "QUIZ NOT FOUND",
    description: "This quiz doesn't exist or has been removed. Check the URL or try searching for similar quizzes.",
    icon: Search,
    actions: ['retry', 'search', 'home']
  },
  PRIVATE_QUIZ: {
    title: "PRIVATE QUIZ",
    description: "This quiz is private and requires special access. Contact the quiz creator for permission.",
    icon: AlertTriangle,
    actions: ['back', 'home', 'report']
  },
  SERVER_ERROR: {
    title: "SERVER ERROR",
    description: "Our servers are having trouble right now. Please try again in a few minutes.",
    icon: AlertTriangle,
    actions: ['retry', 'home', 'report']
  },
  NETWORK_ERROR: {
    title: "CONNECTION ISSUE",
    description: "Unable to connect to our servers. Check your internet connection and try again.",
    icon: AlertTriangle,
    actions: ['retry', 'home']
  },
  CANCELLED: {
    title: "REQUEST CANCELLED",
    description: "The request was cancelled. This usually happens when navigating away quickly.",
    icon: AlertTriangle,
    actions: ['retry', 'back']
  },
  INVALID_QUIZ_TYPE: {
    title: "INVALID QUIZ TYPE",
    description: "This quiz type is not supported. Try a different quiz or contact support.",
    icon: AlertTriangle,
    actions: ['back', 'home', 'report']
  },
  MISSING_PARAMS: {
    title: "MISSING INFORMATION",
    description: "Required quiz information is missing. This might be a technical issue.",
    icon: AlertTriangle,
    actions: ['retry', 'report']
  },
  UNKNOWN_ERROR: {
    title: "SOMETHING WENT WRONG",
    description: "An unexpected error occurred while loading this quiz. Our team has been notified.",
    icon: AlertTriangle,
    actions: ['retry', 'home', 'report']
  }
};

export function QuizError({
  errorType = 'UNKNOWN_ERROR',
  message,
  onRetry,
  onGoBack,
  onReportIssue,
  onGoHome,
  quizType,
  quizSlug,
  className
}: QuizErrorProps) {
  const [isHovered, setIsHovered] = useState(false);

  const config = ERROR_CONFIG[errorType] || ERROR_CONFIG.UNKNOWN_ERROR;
  const IconComponent = config.icon;

  const handleRetry = () => {
    onRetry?.();
  };

  const handleGoBack = () => {
    onGoBack?.();
  };

  const handleReportIssue = () => {
    onReportIssue?.();
  };

  const handleGoHome = () => {
    onGoHome?.();
  };

  return (
    <motion.div
      className={cn(
        "w-full max-w-2xl mx-auto",
        "bg-yellow-300 border-8 border-black",
        "shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]",
        "p-6 sm:p-8",
        className
      )}
      initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{
        duration: 0.6,
        type: "spring",
        bounce: 0.4
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Header with Icon */}
      <div className="text-center mb-6">
        <motion.div
          className="inline-flex items-center justify-center w-20 h-20 bg-black text-yellow-300 border-4 border-black rounded-none mb-4"
          animate={{
            rotate: isHovered ? [0, -5, 5, -5, 0] : 0,
            scale: isHovered ? 1.1 : 1
          }}
          transition={{ duration: 0.5 }}
        >
          <IconComponent className="w-10 h-10" />
        </motion.div>

        <motion.h1
          className="text-2xl sm:text-3xl font-black text-black uppercase tracking-wider mb-2"
          animate={{
            scale: isHovered ? 1.05 : 1
          }}
          transition={{ duration: 0.3 }}
        >
          {config.title}
        </motion.h1>

        <div className="w-16 h-1 bg-black mx-auto mb-4"></div>
      </div>

      {/* Description */}
      <motion.p
        className="text-black text-center text-lg font-medium mb-8 leading-relaxed"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        {message || config.description}
      </motion.p>

      {/* Action Buttons */}
      <motion.div
        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        {config.actions.includes('retry') && onRetry && (
          <Button
            onClick={handleRetry}
            className="bg-black text-yellow-300 border-4 border-black hover:bg-yellow-300 hover:text-black font-bold px-6 py-3 text-lg uppercase tracking-wide shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            TRY AGAIN
          </Button>
        )}

        {config.actions.includes('back') && onGoBack && (
          <Button
            onClick={handleGoBack}
            variant="outline"
            className="bg-white text-black border-4 border-black hover:bg-black hover:text-white font-bold px-6 py-3 text-lg uppercase tracking-wide shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            GO BACK
          </Button>
        )}

        {config.actions.includes('home') && onGoHome && (
          <Button
            onClick={handleGoHome}
            variant="outline"
            className="bg-white text-black border-4 border-black hover:bg-black hover:text-white font-bold px-6 py-3 text-lg uppercase tracking-wide shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
          >
            <Home className="w-5 h-5 mr-2" />
            HOME
          </Button>
        )}

        {config.actions.includes('report') && onReportIssue && (
          <Button
            onClick={handleReportIssue}
            variant="outline"
            className="bg-white text-black border-4 border-black hover:bg-red-500 hover:text-white font-bold px-6 py-3 text-lg uppercase tracking-wide shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            REPORT ISSUE
          </Button>
        )}
      </motion.div>

      {/* Additional Context */}
      {(quizType || quizSlug) && (
        <motion.div
          className="mt-8 pt-4 border-t-4 border-black text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <p className="text-black/70 text-sm">
            {quizType && `Quiz Type: ${quizType.toUpperCase()}`}
            {quizType && quizSlug && ' • '}
            {quizSlug && `ID: ${quizSlug}`}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
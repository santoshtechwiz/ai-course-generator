/**
 * Quiz Message Catalog
 * 
 * COMMIT: Centralized messages for consistent tone across all quiz types
 */

export const QUIZ_MESSAGES = {
  // Success messages
  CORRECT_ANSWER: {
    casual: "Perfect! 🎉",
    formal: "Correct Answer",
    encouraging: "Great job! Keep it up! 🌟"
  },
  
  QUIZ_COMPLETED: {
    casual: "Amazing work! 🎊",
    formal: "Quiz Completed",
    encouraging: "You did it! Excellent effort! 🏆"
  },
  
  STREAK_UPDATED: {
    casual: "Streak updated! You're on fire! 🔥",
    formal: "Daily Streak Maintained",
    encouraging: "Another day of learning! Keep going! 💪"
  },
  
  BADGE_UNLOCKED: {
    casual: "New badge! You're crushing it! 🏅",
    formal: "Achievement Unlocked",
    encouraging: "Amazing progress! Badge earned! ⭐"
  },
  
  // Error messages
  INCORRECT_ANSWER: {
    casual: "Not quite! Try again 💪",
    formal: "Incorrect Answer",
    encouraging: "Almost there! Review the hint and try again 🔄"
  },
  
  SUBMISSION_FAILED: {
    casual: "Oops! Something went wrong 😅",
    formal: "Submission Failed",
    encouraging: "Don't worry! Try submitting again 🔄"
  },
  
  QUIZ_LOAD_FAILED: {
    casual: "Hmm, couldn't load that quiz 🤔",
    formal: "Quiz Loading Failed",
    encouraging: "Let's try loading that quiz again 🔄"
  },
  
  // Upgrade messages
  UPGRADE_FOR_HINTS: {
    casual: "Unlock unlimited hints! Upgrade now 🚀",
    formal: "Premium Feature: Unlimited Hints",
    encouraging: "Get personalized hints to accelerate learning! 📚"
  },
  
  DAILY_LIMIT_REACHED: {
    casual: "You've used all your free attempts today! 🎯",
    formal: "Daily Limit Reached",
    encouraging: "Great practice session! Upgrade for unlimited attempts 🌟"
  },
  
  UPGRADE_FOR_ANSWERS: {
    casual: "Want to see the answers? Upgrade now! 👀",
    formal: "Premium Feature: View Correct Answers",
    encouraging: "Review correct answers to learn faster! 🎓"
  },
  
  // Loading messages
  LOADING_QUIZ: {
    casual: "Getting your quiz ready... ⏳",
    formal: "Loading Quiz",
    encouraging: "Preparing your learning experience... 📖"
  },
  
  SAVING_PROGRESS: {
    casual: "Saving your awesome progress... 💾",
    formal: "Saving Progress",
    encouraging: "Recording your achievement... ✨"
  },
  
  // Info messages
  HINT_AVAILABLE: {
    casual: "Need a hint? We've got you! 💡",
    formal: "Hint Available",
    encouraging: "Stuck? Use a hint to keep learning! 🔍"
  },
  
  LAST_FREE_HINT: {
    casual: "This is your last free hint! 🎁",
    formal: "Final Free Hint",
    encouraging: "One more hint available on free plan! 💎"
  },
  
  TIME_BONUS: {
    casual: "Speed demon! Time bonus earned! ⚡",
    formal: "Time Bonus Awarded",
    encouraging: "Quick thinking! Bonus points earned! 🎯"
  }
} as const

export type MessageKey = keyof typeof QUIZ_MESSAGES
export type MessageTone = 'casual' | 'formal' | 'encouraging'

/**
 * Get quiz message with specified tone
 * 
 * COMMIT: Tone can be configured per user preference or subscription level
 */
export const getQuizMessage = (
  messageKey: MessageKey,
  tone: MessageTone = 'encouraging'
): string => {
  return QUIZ_MESSAGES[messageKey][tone]
}

/**
 * Get quiz message with dynamic values
 * 
 * Example: getQuizMessageWithValues('STREAK_UPDATED', { streak: 5 }, 'casual')
 * Returns: "5 day streak! You're on fire! 🔥"
 */
export const getQuizMessageWithValues = (
  messageKey: MessageKey,
  values: Record<string, string | number>,
  tone: MessageTone = 'encouraging'
): string => {
  let message = getQuizMessage(messageKey, tone)
  
  // Replace placeholders like {streak} with actual values
  Object.entries(values).forEach(([key, value]) => {
    message = message.replace(`{${key}}`, String(value))
  })
  
  return message
}

/**
 * Get user's preferred message tone from their settings or subscription
 */
export const getUserMessageTone = (user: {
  subscriptionPlan?: string | null
  preferences?: any
}): MessageTone => {
  // Premium users might prefer more casual tone
  if (user.subscriptionPlan === 'PREMIUM' || user.subscriptionPlan === 'ENTERPRISE') {
    return user.preferences?.messageTone || 'casual'
  }
  
  // Free users get encouraging tone by default
  return user.preferences?.messageTone || 'encouraging'
}

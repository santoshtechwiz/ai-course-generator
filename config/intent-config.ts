/**
 * Intent Configuration
 * Centralized configuration for all intents used by NlpIntentClassifier
 */

export interface IntentConfig {
  [intentName: string]: {
    utterances: string[];
    responses: string[];
  };
}

export const DEFAULT_INTENTS: IntentConfig = {
  greeting: {
    utterances: [
      'hello',
      'hi',
      'hey',
      'greetings',
      'good morning',
      'good afternoon',
      'good evening',
      'howdy',
      'hi there',
      'hello there',
      'hey there'
    ],
    responses: [
      'Hello! How can I help you with your learning today?',
      'Hi there! What would you like to learn?',
      'Greetings! How may I assist you?',
      'Hey! Ready to start learning?'
    ]
  },

  'course.search': {
    utterances: [
      'I want to learn JavaScript',
      'show me Python courses',
      'find tutorials on React',
      'I need to learn Node.js',
      'courses about machine learning',
      'teach me about databases',
      'looking for web development courses',
      'find me a course on TypeScript',
      'help me learn programming',
      'show me available courses',
      'what courses do you have',
      'find courses on {topic}',
      'learn {topic} courses'
    ],
    responses: [
      'I can help you find courses on that topic!',
      'Let me show you some relevant courses.',
      'Great choice! Here are some courses that might interest you.',
      'Perfect! I\'ll find the best courses for you.'
    ]
  },

  'quiz.start': {
    utterances: [
      'I want to take a quiz',
      'start a quiz',
      'test my knowledge',
      'give me a quiz',
      'practice questions',
      'assessment test',
      'begin quiz',
      'take assessment',
      'quiz me',
      'let\'s do a quiz',
      'practice test'
    ],
    responses: [
      'Perfect! Let\'s start a quiz for you.',
      'Great! I\'ll prepare some questions.',
      'Let\'s test your knowledge!',
      'Ready for a challenge? Starting your quiz now.'
    ]
  },

  'course.create': {
    utterances: [
      'create a course',
      'make a new course',
      'build a course',
      'design a course',
      'I want to create a course',
      'help me make a course',
      'new course creation'
    ],
    responses: [
      'I\'d be happy to help you create a course!',
      'Let\'s build an amazing course together.',
      'Course creation is exciting! Let\'s get started.'
    ]
  },

  'help.general': {
    utterances: [
      'help',
      'what can you do',
      'how does this work',
      'show me around',
      'I need help',
      'assist me',
      'guide me',
      'what are your features'
    ],
    responses: [
      'I can help you learn, take quizzes, and create courses!',
      'I\'m here to assist with your learning journey.',
      'Let me show you what I can do to help you learn.'
    ]
  }
};
import { openai } from "./gpt";

interface QuizQuestion {
  question: string;
  correct_answer: string;
  hints: string[];
  difficulty: string;
  tags: string[];
}

interface Quiz {
  quiz_title: string;
  questions: QuizQuestion[];
}

export const generateOpenEndedQuiz = async (
  topic: string,
  amount: number = 5,
  difficulty: string = 'medium'
): Promise<Quiz> => {
  const functions = [
    {
      name: 'createOpenEndedQuiz',
      description: 'Create an open-ended quiz based on a given topic',
      parameters: {
        type: 'object',
        properties: {
          quiz_title: { type: 'string' },
          questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                question: { type: 'string' },
                correct_answer: { type: 'string' },
                hints: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Two hints for the question'
                },
                difficulty: { 
                  type: 'string',
                  enum: ['Easy', 'Medium', 'Hard']
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Two relevant tags for the question'
                }
              },
              required: ['question', 'correct_answer', 'hints', 'difficulty', 'tags'],
            },
          },
        },
        required: ['quiz_title', 'questions'],
      },
    },
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { 
        role: 'system', 
        content: 'You are an AI that generates insightful open-ended quizzes based on a given topic. Focus on creating questions that encourage critical thinking and test knowledge.' 
      },
      {
        role: 'user',
        content: `Generate an open-ended quiz about ${topic} with ${amount} questions. The quiz should have a title, and each question should have a correct answer, two hints, a difficulty level (Easy, Medium, or Hard), and two relevant tags. Ensure a mix of difficulties across the questions.`,
      },
    ],
    functions,
    function_call: { name: 'createOpenEndedQuiz' },
  });

  const result = JSON.parse(response.choices[0].message?.function_call?.arguments || '{}');
  
  if (!result.quiz_title || !result.questions || !Array.isArray(result.questions)) {
    throw new Error('Invalid response format: quiz_title or questions array is missing.');
  }

  return result as Quiz;
};


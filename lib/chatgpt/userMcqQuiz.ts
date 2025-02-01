import { openai } from "./gpt";

interface QuizQuestion {
  type: 'multiple-choice' | 'short-answer';
  question: string;
  answer: string;
  options?: string[];
}



export const generateMcqForUserInput = async (topic: string, amount: number, difficulty: string = 'hard', userType) => {
  const model = userType === "FREE" || userType === "BASIC" ? "gpt-3.5-turbo-1106" : "GPT-4o mini ";
  const functions = [
    {
      name: 'createMCQ',
      description: 'Create multiple MCQ questions',
      parameters: {
        type: 'object',
        properties: {
          questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                question: { type: 'string' },
                answer: { type: 'string', description: 'Correct answer, max 15 words' },
                option1: { type: 'string', description: 'Incorrect option, max 15 words' },
                option2: { type: 'string', description: 'Incorrect option, max 15 words' },
                option3: { type: 'string', description: 'Incorrect option, max 15 words' },
              },
              required: ['question', 'answer', 'option1', 'option2', 'option3'],
            },
          },
        },
        required: ['questions'],
      },
    },
  ];

  const response = await openai.chat.completions.create({
    model: model,
    messages: [
      { role: 'system', content: 'You are an AI that generates multiple-choice questions.' },
      {
        role: 'user',
        content: `Generate ${amount} ${difficulty} multiple-choice questions about ${topic}. Each question should have one correct answer and three incorrect options.`,
      },
    ],
    functions,
    function_call: { name: 'createMCQ' },
  });

  const result = JSON.parse(response.choices[0].message?.function_call?.arguments || '{}');

  if (!result.questions || !Array.isArray(result.questions)) {
    throw new Error('Invalid response format: questions array is missing.');
  }

  return result.questions;
};
export const generateOpenEndedQuestions = async (
  topic: string,
  amount: number = 5,
  difficulty: string = 'medium',
  userType: string = 'FREE'
): Promise<QuizQuestion[]> => {
  const model = userType === "FREE" || userType === "BASIC" ? "gpt-3.5-turbo-1106" : "GPT-4o mini o-mini";
  const functions = [
    {
      name: 'createOpenEndedQuiz',
      description: 'Create openended questions based on a given topic',
      parameters: {
        type: 'object',
        properties: {
          questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['short-answer'] },
                question: { type: 'string' },
                answer: { type: 'string', description: 'Sample answer or key points to cover' },
              },
              required: ['type', 'question', 'answer'],
            },
          },
        },
        required: ['questions'],
      },
    },
  ];

  const response = await openai.chat.completions.create({
    model: model,
    messages: [
      {
        role: 'system',
        content: 'You are an AI that generates insightful openended questions based on a given topic. Focus on creating questions that encourage critical thinking and in-depth responses.'
      },
      {
        role: 'user',
        content: `Generate ${amount} ${difficulty} openended questions about ${topic}. Provide a sample answer or key points to cover for each question.`,
      },
    ],
    functions,
    function_call: { name: 'createOpenEndedQuiz' },
  });

  const result = JSON.parse(response.choices[0].message?.function_call?.arguments || '{}');

  if (!result.questions || !Array.isArray(result.questions)) {
    throw new Error('Invalid response format: questions array is missing.');
  }

  return result.questions;
};

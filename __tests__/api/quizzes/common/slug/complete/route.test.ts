import { NextRequest } from 'next/server';
import { POST } from '@/app/api/quizzes/common/[slug]/complete/route';
import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Mock Next.js Request class properly for Jest environment
// We need to mock this before any imports that might use it
global.Request = jest.fn().mockImplementation((input, init) => ({
  url: input.toString(),
  method: init?.method || 'GET',
  headers: new Map(Object.entries(init?.headers || {})),
  json: jest.fn().mockImplementation(() => Promise.resolve(JSON.parse(init?.body || '{}')))
})) as any;

// Mock the NextRequest which extends the standard Request
jest.mock('next/server', () => {
  // Create a storage for request bodies
  const requests = new Map();
  
  const NextResponseMock = {
    json: jest.fn((data, init = {}) => {
      const resp = {
        status: init.status || 200,
        statusText: init.statusText || '',
        headers: new Headers(init.headers),
        json: async () => data,
        text: async () => JSON.stringify(data),
      };
      return resp;
    })
  };
  
  return {
    NextRequest: jest.fn().mockImplementation((url, init = {}) => {
      const reqId = Math.random().toString();
      
      // Store the body for this request
      if (init.body) {
        requests.set(reqId, init.body);
      }
      
      return {
        id: reqId,
        url,
        method: init.method || 'GET',
        // Implement json method that returns the parsed body
        json: jest.fn().mockImplementation(async () => {
          const body = requests.get(reqId);
          if (body) {
            return JSON.parse(body);
          }
          return {};
        }),
        // Implement text method that returns the raw body
        text: jest.fn().mockImplementation(async () => {
          return requests.get(reqId) || '';
        }),
        // Required by Next.js route handlers
        nextUrl: { 
          pathname: '/api/quizzes/common/test-slug/complete',
          searchParams: new URLSearchParams()
        },
        // Add params property to simulate route parameters
        params: { slug: 'test-slug' },
        headers: new Headers(init.headers || {}),
        cookies: { getAll: () => [] }
      };
    }),
    NextResponse: NextResponseMock
  };
});

// Mock auth and Prisma
jest.mock('@/lib/auth', () => ({
  getAuthSession: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  prisma: {
    userQuiz: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
    userQuizAttempt: {
      upsert: jest.fn(),
    },
    userQuizAttemptQuestion: {
      upsert: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(prisma)),
  },
}));

// Helper function to log additional debugging if test fails
const expectWithDebug = async (response, statusCode) => {
  if (response.status !== statusCode) {
    console.log('Response status:', response.status);
    console.log('Response body:', await response.text?.());
    console.log('Response JSON:', await response.json?.());
  }
  expect(response.status).toBe(statusCode);
};

describe('Quiz Complete API Route', () => {
  // Reset mocks between tests
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock auth session
    (getAuthSession as jest.Mock).mockResolvedValue({
      user: { id: 'test-user-id' }
    });
    
    // Mock successful Prisma responses
    (prisma.userQuiz.findUnique as jest.Mock).mockResolvedValue({
      id: 42,
      bestScore: 0,
      questions: [
        { id: 222 },
        { id: 223 },
        { id: 224 }
      ]
    });
    
    (prisma.userQuiz.update as jest.Mock).mockResolvedValue({
      id: 42,
      timeEnded: new Date(),
      lastAttempted: new Date(),
      bestScore: 80
    });
    
    (prisma.user.update as jest.Mock).mockResolvedValue({
      id: 'test-user-id',
      totalQuizzesAttempted: 5,
      totalTimeSpent: 1200
    });
    
    (prisma.userQuizAttempt.upsert as jest.Mock).mockResolvedValue({
      id: 101,
      userId: 'test-user-id',
      userQuizId: 42,
      score: 80,
      timeSpent: 600,
      accuracy: 80
    });
    
    (prisma.userQuizAttemptQuestion.upsert as jest.Mock).mockResolvedValue({
      id: 1001,
      attemptId: 101,
      questionId: 222,
      userAnswer: 'Test answer',
      isCorrect: true,
      timeSpent: 60
    });
    
    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      return await callback(prisma);
    });
  });
  
  it('should handle MCQ quiz completion correctly', async () => {
    // Arrange - Create valid request with MCQ quiz data including isCorrect properties
    const validMCQRequest = new NextRequest('http://localhost:3000/api/quizzes/common/test-slug/complete', {
      method: 'POST',
      body: JSON.stringify({
        quizId: "42",
        type: "mcq",
        answers: [
          { questionId: 222, answer: "Option A", isCorrect: true, timeSpent: 46 },
          { questionId: 223, answer: "Option B", isCorrect: false, timeSpent: 46 },
          { questionId: 224, answer: "Option C", isCorrect: true, timeSpent: 46 },
        ],
        score: 2,
        totalTime: 600,
        totalQuestions: 3,
        correctAnswers: 2
      })
    });
    
    // Act
    const response = await POST(validMCQRequest);
    const responseData = await response.json();
    
    // Assert with better debugging
    await expectWithDebug(response, 200);
    expect(responseData).toHaveProperty('success', true);
    
    // Verify Prisma calls
    expect(prisma.userQuiz.findUnique).toHaveBeenCalledWith({
      where: { id: 42 },
      include: { questions: true }
    });
    
    expect(prisma.userQuiz.update).toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalled();
    expect(prisma.userQuizAttempt.upsert).toHaveBeenCalled();
    
    // Verify answers processing - should handle isCorrect properly
    expect(prisma.userQuizAttemptQuestion.upsert).toHaveBeenCalledTimes(3);
    const upsertCall = (prisma.userQuizAttemptQuestion.upsert as jest.Mock).mock.calls[0];
    expect(upsertCall[0]).toHaveProperty('create.isCorrect');
    expect(upsertCall[0]).toHaveProperty('update.isCorrect');
  });

  it('should handle CODE quiz completion correctly', async () => {
    // Arrange - Create valid request with CODE quiz data
    const validCodeRequest = new NextRequest('http://localhost:3000/api/quizzes/common/test-slug/complete', {
      method: 'POST',
      body: JSON.stringify({
        quizId: "42",
        type: "code",
        answers: [
          { questionId: 222, answer: "console.log('test');", timeSpent: 60 },
          { questionId: 223, answer: "const x = 10;", timeSpent: 90 },
          { questionId: 224, answer: "return true;", timeSpent: 120 },
        ],
        score: 1,
        totalTime: 600,
        totalQuestions: 3,
        correctAnswers: 1
      })
    });
    
    // Act
    const response = await POST(validCodeRequest);
    const responseData = await response.json();
    
    // Assert with better debugging
    await expectWithDebug(response, 200);
    expect(responseData).toHaveProperty('success', true);
    
    // Similar Prisma verification as above
    expect(prisma.userQuiz.findUnique).toHaveBeenCalled();
    expect(prisma.userQuiz.update).toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalled();
    expect(prisma.userQuizAttempt.upsert).toHaveBeenCalled();
    expect(prisma.userQuizAttemptQuestion.upsert).toHaveBeenCalledTimes(3);
  });
  
  it('should validate required fields', async () => {
    // Arrange - Create invalid request missing required fields
    const invalidRequest = new NextRequest('http://localhost:3000/api/quizzes/common/test-slug/complete', {
      method: 'POST',
      body: JSON.stringify({
        quizId: "42",
        // Missing type
        answers: [
          { questionId: 222, answer: "Option A", timeSpent: 46 }
        ],
        // Missing score
        // Missing totalTime
      })
    });
    
    // Act
    const response = await POST(invalidRequest);
    const responseData = await response.json();
    
    // Assert
    expect(response.status).toBe(400);
    expect(responseData).toHaveProperty('success', false);
    expect(responseData).toHaveProperty('error');
    expect(responseData.error).toContain('Missing required fields');
  });
  
  it('should validate answer format', async () => {
    // Arrange - Create request with invalid answer format (missing timeSpent)
    const invalidFormatRequest = new NextRequest('http://localhost:3000/api/quizzes/common/test-slug/complete', {
      method: 'POST',
      body: JSON.stringify({
        quizId: "42",
        type: "mcq",
        answers: [
          { questionId: 222, answer: "Option A" } // Missing timeSpent
        ],
        score: 0,
        totalTime: 600
      })
    });
    
    // Act
    const response = await POST(invalidFormatRequest);
    const responseData = await response.json();
    
    // Assert
    expect(response.status).toBe(400);
    expect(responseData).toHaveProperty('success', false);
    expect(responseData.details).toBeDefined();
  });

  it('should handle case where quiz is not found', async () => {
    // Mock quiz not found
    (prisma.userQuiz.findUnique as jest.Mock).mockResolvedValue(null);
    
    // Arrange
    const validRequest = new NextRequest('http://localhost:3000/api/quizzes/common/test-slug/complete', {
      method: 'POST',
      body: JSON.stringify({
        quizId: "42",
        type: "mcq",
        answers: [
          { questionId: 222, answer: "Option A", isCorrect: true, timeSpent: 46 }
        ],
        score: 1,
        totalTime: 60
      })
    });
    
    // Act
    const response = await POST(validRequest);
    const responseData = await response.json();
    
    // Assert
    await expectWithDebug(response, 404);
    expect(responseData).toHaveProperty('success', false);
    expect(responseData).toHaveProperty('error', 'Quiz not found');
  });
  
  it('should require authentication', async () => {
    // Mock unauthenticated session
    (getAuthSession as jest.Mock).mockResolvedValue(null);
    
    // Arrange
    const validRequest = new NextRequest('http://localhost:3000/api/quizzes/common/test-slug/complete', {
      method: 'POST',
      body: JSON.stringify({
        quizId: "42",
        type: "mcq",
        answers: [
          { questionId: 222, answer: "Option A", isCorrect: true, timeSpent: 46 }
        ],
        score: 1,
        totalTime: 60
      })
    });
    
    // Act
    const response = await POST(validRequest);
    const responseData = await response.json();
    
    // Assert
    expect(response.status).toBe(401);
    expect(responseData).toHaveProperty('success', false);
    expect(responseData).toHaveProperty('error', 'User not authenticated');
  });
});

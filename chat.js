const { OpenAI } = require('openai');  // Import OpenAI package
const https = require('https');  // Import the HTTPS module to create an agent

// Create an HTTPS agent that allows self-signed certificates (if needed)
const agent = new https.Agent({
  rejectUnauthorized: false,  // Disable SSL verification (use only for testing)
});

const openai = new OpenAI({
    apiKey: 'sk-proj-VgBZPsc1UZ2dgx6N05jMT3BlbkFJkDQ0y5Kax07E2OyNq4XK', 
  httpAgent: agent,              // Provide custom agent
  dangerouslyAllowBrowser: true,  // Allow use of the browser in Node.js (not recommended for production)
});
async function generateMCQs(courseTitle, transcript, numQuestions = 5) {
    if (!courseTitle || !transcript) {
      throw new Error('Course title and transcript are required');
    }
  
    const functions = [
      {
        name: 'formatMCQs',
        description: 'Formats multiple-choice questions with answers and options for a course.',
        parameters: {
          type: 'object',
          properties: {
            mcqs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  question: { type: 'string' },
                  answer: { type: 'string' },
                  options: { 
                    type: 'array',
                    items: { type: 'string' }
                  }
                },
                required: ['question', 'answer', 'options']
              }
            }
          },
          required: ['mcqs']
        }
      }
    ];
  
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are an expert in creating multiple-choice questions.' },
          { role: 'user', content: `Generate ${numQuestions} multiple-choice questions for the course titled "${courseTitle}" based on the following transcript: ${transcript}. Each question should have one correct answer and three incorrect options.` }
        ],
        functions: functions,
        function_call: { name: 'formatMCQs' }
      });
  
      const result = response.choices[0].message.function_call.arguments;
      return JSON.parse(result).mcqs;
    } catch (error) {
      console.error('Error generating MCQs:', error);
      throw new Error('Failed to generate MCQs');
    }
  }
  
  // Example usage
  const courseTitle = 'Advanced Node.js';
  const transcript = 'In this lesson, we cover asynchronous programming, event loops, and promises in Node.js. Asynchronous programming allows for non-blocking operations, which is crucial for building scalable applications. The event loop is at the core of Node.js, managing the execution of callbacks and I/O operations. Promises provide a way to handle asynchronous operations in a more manageable and readable manner.';
  const numQuestions = 10;
  
  generateMCQs(courseTitle, transcript, numQuestions)
    .then(mcqs => {
      console.log(JSON.stringify(mcqs, null, 2));
    })
    .catch(error => {
      console.error('Error:', error.message);
    });

    generateMCQs(courseTitle, transcript, numQuestions)
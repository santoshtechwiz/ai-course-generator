const OpenAI = require("openai");
const fs = require('fs');
const path = require('path');

const https= require('https');

const agent = new https.Agent({  
    rejectUnauthorized: false,
    requestCert: false,

  });
const openai = new OpenAI({
    apiKey: "***REMOVED***AVGABwcFAt3ZIDAuja_Y5qgN5ntKa1jlB2S-0bmVbLoWwZQpNJY-x6w9gzF7xMAA",
    httpsAgent: agent

});

// async function requestOpenAi(messages, tools, tool_choice) {
//     const response = await openai.chat.completions.create({
//         model: "gpt-3.5-turbo",
//         messages: messages,
//         tools: tools,
//         tool_choice: tool_choice,
        
//     });
//     console.log('OpenAI Chat response:', response.choices[0]);
//     return extractResponse(response);
// }

// function extractResponse(response) {
//     const toolCalls = response.choices[0].message.tool_calls;
//     if (toolCalls && toolCalls.length > 0) {
//         const arguments = JSON.parse(toolCalls[0].function.arguments);
//         return arguments;
//     } else {
//         throw new Error('No tool calls returned in the response');
//     }
// }

// function saveOpenAiResults(content) {
//     const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
//     const fileName = `results-${timestamp}.json`;
//     const filePath = path.join(__dirname, fileName);

//     fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
//     return filePath;
// }

// async function run(messages, tools, tool_choice) {
//     try {
//         const completion = await requestOpenAi(messages, tools, tool_choice);
//         const filePath = saveOpenAiResults(completion);
//         console.log(`Result saved to ${filePath}`);
//     } catch (error) {
//         console.error('Error:', error);
//     }
// }

// /**
// * RUN EXAMPLE
// **/

// const tool_choice = { "type": "function", "function": { "name": "analyze_log" } };
// const tools = [
//     {
//         "type": "function",
//         "function": {
//             "name": "analyze_log",
//             "description": "Analyzes log and returns response object",
//             "parameters": {
//                 "type": "object",
//                 "properties": {
//                     "summary": {
//                         "type": "string",
//                         "description": "Summary of log"
//                     },
//                     "category": {
//                         "type": "string",
//                         "description": "Category of log",
//                         "enum": [
//                             "error",
//                             "warning",
//                             "info",
//                             "feedback"
//                         ]
//                     },
//                     "keywords": {
//                         "type": "array",
//                         "description": "List of keywords",
//                         "items": {
//                             "type": "string",
//                             "description": "Keyword"
//                         }
//                     },
//                     "customer": {
//                         "type": "string",
//                         "description": "Name of customer"
//                     },
//                     "severity": {
//                         "type": "string",
//                         "description": "Severity of issue based on customer impact",
//                         "enum": [
//                             "low",
//                             "medium",
//                             "high",
//                             "critical"
//                         ]
//                     },
//                     "location": {
//                         "type": "string",
//                         "description": "City, country, or other location"
//                     },
//                     "product": {
//                         "type": "string",
//                         "description": "Name of affected product"
//                     }
//                 },
//                 "required": [
//                     "summary",
//                     "category",
//                     "keywords",
//                     "customer",
//                     "severity",
//                     "location",
//                     "product"
//                 ]
//             }
//         }
//     }
// ];

// const userPrompt = "My name is John Smith, and I am writing to report a significant issue with my recently purchased XYZ Model Laptop, serial number ABC123456789, which I bought on April 10, 2024, under order number 987654321. I live at 123 Elm Street, Apt 4B, Springfield, IL, 62701, USA. Approximately two weeks ago, on May 12, 2024, I started experiencing intermittent flickering and blackouts on the display, rendering the laptop unusable for extended periods. Despite updating all drivers and ensuring the system software is current, the problem persists. As a freelance graphic designer, I rely heavily on this laptop for my work, and this issue has caused significant disruptions, delaying project deadlines and affecting client satisfaction. I urgently need a functioning laptop and request either a prompt repair or a replacement unit with the same or higher specifications. I am willing to bring the laptop to the nearest service center if necessary and would appreciate instructions on how to proceed. Please contact me at john.smith@example.com or +1 (555) 123–4567 at your earliest convenience. Thank you for your prompt attention to this matter, and I look forward to your swift response.";

// const systemPrompt = `You are a log processing machine. Analyze the user prompt and derive a response object. Response object contains the following properties: summary, category, keywords, customer, severity, location and product.`;

// const messages = [
//     { role: "system", content: systemPrompt },
//     { role: "user", content: userPrompt }
// ];

// run(messages, tools, tool_choice);




const generateOpenEndedQuestions = async (
    topic,
    amount = 5,
    difficulty = 'medium'
  ) => {
    const functions = [
      {
        name: 'createOpenEndedQuiz',
        description: 'Create open-ended questions based on a given topic',
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
      model: 'gpt-4',
      messages: [
        { 
          role: 'system', 
          content: 'You are an AI that generates insightful open-ended questions based on a given topic. Focus on creating questions that encourage critical thinking and in-depth responses.' 
        },
        {
          role: 'user',
          content: `Generate ${amount} ${difficulty} open-ended questions about ${topic}. Provide a sample answer or key points to cover for each question.`,
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

  async function run(){
    var x=await generateOpenEndedQuestions('Artificial Intelligence', 5, 'medium');
    console.log(x);
  }

  run();
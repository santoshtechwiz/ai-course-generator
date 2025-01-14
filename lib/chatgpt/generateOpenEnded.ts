import { openai } from "./gpt";

interface OpenEndedQuestion {
  question: string;
  answer: string;
}

export const generateOpenEnded = async (
  topic: string,
  amount: number
): Promise<OpenEndedQuestion[]> => {
  const functions = [
    {
      name: "createOpenEnded",
      description: "Create an open-ended question",
      parameters: {
        type: "object",
        properties: {
          question: { type: "string" },
          answer: { type: "string", description: "Answer, max 15 words" },
        },
        required: ["question", "answer"],
      },
    },
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini", 
    messages: [
      { role: "system", content: "You are an AI that generates open-ended questions." },
      { role: "user", content: `Generate ${amount} hard open-ended questions about ${topic}.` },
    ],
    functions,
    function_call: { name: "createOpenEnded" },
  });

  const result = response.choices[0]?.message?.function_call?.arguments;

  if (!result) {
    throw new Error("Failed to generate open-ended questions");
  }

  return JSON.parse(result) as OpenEndedQuestion[];
};

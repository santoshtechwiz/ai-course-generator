import { openai } from "./gpt";

interface OpenEndedQuestion {
  question: string;
  answer: string;
}

export const generateOpenEnded = async (
  topic: string,
  amount: number,
  model: string="gpt-3.5-turbo"
): Promise<OpenEndedQuestion[]> => {
  const functions = [
    {
      name: "createOpenEnded",
      description: "Create an openended question",
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
    model: model, 
    messages: [
      { role: "system", content: "You are an AI that generates openended questions." },
      { role: "user", content: `Generate ${amount} hard openended questions about ${topic}.` },
    ],
    functions,
    function_call: { name: "createOpenEnded" },
  });

  const result = response.choices[0]?.message?.function_call?.arguments;

  if (!result) {
    throw new Error("Failed to generate openended questions");
  }

  return JSON.parse(result) as OpenEndedQuestion[];
};

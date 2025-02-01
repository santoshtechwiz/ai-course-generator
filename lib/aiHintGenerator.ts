import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateHint(question: string, answer: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that provides hints for fill-in-the-blank questions without giving away the answer directly.",
        },
        {
          role: "user",
          content: `Generate a hint for the following fill-in-the-blank question without revealing the answer directly:
          Question: ${question}
          Answer: ${answer}`,
        },
      ],
      max_tokens: 50,
    })

    return response.choices[0].message.content || "Sorry, I couldn't generate a hint at this time."
  } catch (error) {
    console.error("Error generating hint:", error)
    return "Sorry, I couldn't generate a hint at this time."
  }
}


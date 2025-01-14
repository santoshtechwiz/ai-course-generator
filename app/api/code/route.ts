import { OpenAI } from "openai";
import https from "https";

const agent = new https.Agent({
  rejectUnauthorized: false,
});

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    httpAgent: agent,
  });

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: `Generate code for: ${prompt}` }],
      max_tokens: 100, 
      temperature: 0.5,
      stream: true,  // Enable streaming
    });

    // Return a ReadableStream to the client
    return new Response(new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          controller.enqueue(new TextEncoder().encode(content));
        }
        controller.close();
      },
    }), {
      headers: {
        "Content-Type": "text/plain",
      },
    });
  } catch (error) {
    console.error(error);
    return new Response("Failed to generate code.", { status: 500 });
  }
}

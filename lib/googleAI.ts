import { chatGptRequest } from "./chatgpt/chatGptRequest";
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API);

// Function to generate content using Google Gemini model
const generateSummaryGoogle = async (transcript: string) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
      generation_config: {
        "max_output_tokens": 2048,  // Allow for longer responses if needed
        "temperature": 0.5,         // Lower creativity to ensure accuracy
        "top_p": 0.9,               // Encourage more balanced responses
        "top_k": 40                 // Limit to a reasonable token selection
      },
      safetyRatings: [
        { "category": "Hate Speech", "severity": "NEGLIGIBLE", "severityScore": 0.0, "probabilityScore": 0.1 },
        { "category": "Dangerous Content", "severity": "LOW", "severityScore": 0.3, "probabilityScore": 0.1 },
        { "category": "Harassment", "severity": "MEDIUM", "severityScore": 0.6, "probabilityScore": 0.1 },
        { "category": "Sexually Explicit", "severity": "HIGH", "severityScore": 0.9, "probabilityScore": 0.1 }
      ]
    });

    if (transcript) {
      const result = await model.generateContent(`
        You are an AI assistant that can summarize video transcripts accurately and concisely. Read the following transcript and generate a summary that highlights the main points, key ideas, and relevant information discussed in the video. Keep the summary under 250 words and avoid introducing irrelevant details such as sponsors or tangential topics.

        Transcript:
        ${transcript}
      `);

      const response = await result.response;
      const text = await response.text();
      return text;  // Return the generated summary
    }
    return "";  // Return empty string if no transcript is provided
  } catch (error) {
    console.error("Error generating summary:", error);
    return null;  // Return null in case of error
  }
};


// Function to generate a summary from a YouTube transcript
async function generateSummaryGPT(transcript: string) {
  try {
    return await chatGptRequest(
      "You are an AI capable of summarizing content clearly and concisely.",
      `Summarize the following transcript in 250 words or less. Avoid discussing unrelated topics, such as sponsors or tangential details. Do not introduce what the summary is about or over-explain the content. Focus solely on the main topic and highlight the key points.

      Transcript:
      ${transcript}`,
      { summary: "summary of the transcript" }
    );
  } catch (error: any) {
    console.error("Error generating summary:", error);
    throw new Error(error.message);  // Re-throw the error with a message
  }
}

export { generateSummaryGoogle, generateSummaryGPT };

import { openai } from "./gpt";

interface Chapter {
  chapter_title: string;
  youtube_search_query: string;
}

interface UnitContent {
  title: string;
  chapters: Chapter[];
}

export async function generateCourseContent(
  title: string,
  units: string[]
): Promise<UnitContent[]> {
  const functions = [
    {
      name: "createCourseContent",
      description: "Create course content with chapters and YouTube search queries",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Title of the unit" },
          chapters: {
            type: "array",
            items: {
              type: "object",
              properties: {
                chapter_title: { type: "string" },
                youtube_search_query: { type: "string" },
              },
              required: ["chapter_title", "youtube_search_query"],
            },
          },
        },
        required: ["title", "chapters"],
      },
    },
  ];

  const unitContent: UnitContent[] = [];

  for (const unit of units) {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106",
      messages: [
        {
          role: "system",
          content:
            "You are an AI capable of curating course content, coming up with relevant chapter titles, and finding relevant YouTube videos for each chapter.",
        },
        {
          role: "user",
          content: `It is your job to create a course about ${title}. The user has requested to create chapters for the unit: ${unit}. Create up to **5 chapters** for the unit.For each chapter, provide a detailed YouTube search query that can be used to find an informative educational video for each chapter. Each query should give an educational informative course in YouTube.`,
        },
      ],
      functions,
      function_call: { name: "createCourseContent" },
    });

    const result: UnitContent = JSON.parse(
      response.choices[0].message?.function_call?.arguments || "{}"
    );
    unitContent.push(result);
  }

  return unitContent;
}

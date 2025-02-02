

import { CodeChallenge, QuizType } from "@/app/types/types"
import { getAuthSession } from "@/lib/authOptions";
import prisma, { createQuestions, createUserQuiz, updateTopicCount, updateUserCredits } from "@/lib/db"
import { titleSubTopicToSlug } from "@/lib/slug";
import { NextResponse } from "next/server";
import { generateCodingMCQs } from "./quizGenerator";



const dummyQuizzes: Record<string, CodeChallenge[]> = {
  JavaScript: [
    {
      question: "What will be the output of the following code?",
      codeSnippet: `
console.log(typeof typeof 1);
      `,
      options: ["number", "string", "undefined", "NaN"],
      correctAnswer: "string",
      language: "javascript",
    },
    {
      question: "Which method is used to add one or more elements to the end of an array?",
      options: ["push()", "append()", "addToEnd()", "insert()"],
      correctAnswer: "push()",
      language: "javascript",
    },
    {
      question: "What is the purpose of the 'use strict' directive in JavaScript?",
      options: [
        "To enable strict type checking",
        "To enforce stricter parsing and error handling",
        "To allow the use of deprecated features",
        "To improve performance",
      ],
      correctAnswer: "To enforce stricter parsing and error handling",
      language: "javascript",
    },
  ],
  Python: [
    {
      question: "What is the output of the following code?",
      codeSnippet: `
print(list(filter(lambda x: x % 2 == 0, range(10))))
      `,
      options: ["[0, 2, 4, 6, 8]", "[1, 3, 5, 7, 9]", "[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]", "[]"],
      correctAnswer: "[0, 2, 4, 6, 8]",
      language: "python",
    },
    {
      question: "Which of the following is not a valid way to create an empty set in Python?",
      options: ["set()", "{}", "set([])", "frozenset()"],
      correctAnswer: "{}",
      language: "python",
    },
    {
      question: "What does the 'yield' keyword do in Python?",
      options: [
        "It defines a generator function",
        "It raises an exception",
        "It terminates the program",
        "It imports a module",
      ],
      correctAnswer: "It defines a generator function",
      language: "python",
    },
  ],
}

export async function POST(req: Request) {
  let { language, subtopic, difficulty, questionCount } = await req.json();
  questionCount = questionCount === 0 ? 2 : questionCount;
  const session = await getAuthSession();
  if (!session?.user) {
    return NextResponse.json(
      { error: "You must be logged in to create a quiz." },
      { status: 401 }
    );
  }
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  try {
    const slug = titleSubTopicToSlug(language, subtopic);
    const userQuiz = await createUserQuiz(session.user.id, language, 'code', slug);
   
    try {
    

      let quizzes = await generateCodingMCQs(language, subtopic, difficulty, questionCount);  //dummyQuizzes[language] || dummyQuizzes["JavaScript"]
      if(quizzes.length === 0){
        return NextResponse.json({
          error: "No quizzes available for the selected topic"
        }, { status: 404 });
      }
      
      quizzes = quizzes.sort(() => 0.5 - Math.random()).slice(0, 5)
      console.log(quizzes);
      // Add difficulty to each quiz (in a real scenario, you'd have different quizzes for each difficulty)
      quizzes = quizzes.map((quiz) => ({ ...quiz, difficulty }))

      await createQuestions(quizzes, userQuiz.id, QuizType.Code);

      // 4. Update topic count
      await updateTopicCount(language);

      // 5. Only deduct credits if everything else succeeded
      await updateUserCredits(session.user.id, QuizType.Code);

      return NextResponse.json({
        userQuizId: userQuiz.id,
        slug: userQuiz.slug
      }, { status: 200 });
    } catch (error) {
      // If anything fails after quiz creation, try to delete the quiz
      await prisma.userQuiz.delete({
        where: { id: userQuiz.id }
      }).catch(() => {
        // Ignore deletion errors
        console.error('Failed to cleanup quiz after error:', userQuiz.id);
      });
      throw error;
    }
    //  return Response.json(quizzes)
  } catch (error) {
    console.error(error)
    return Response.json({ error: "Failed to generate quizzes" }, { status: 500 })
  }
}




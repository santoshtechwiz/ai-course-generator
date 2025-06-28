
import { getAuthSession } from "@/lib/auth";
import prisma, { createUserQuiz, updateTopicCount, updateUserCredits } from "@/lib/db"
import { titleSubTopicToSlug } from "@/lib/slug";
import { NextResponse } from "next/server";
import { generateCodingMCQs } from "./quizGenerator";
import createQuestions from "@/lib/create-questions";


export async function POST(req: Request) {
  let { language, title, difficulty,  amount } = await req.json();
  const session = await getAuthSession();
  if (!session?.user) {
    return NextResponse.json(
      { error: "You must be logged in to create a quiz." },
      { status: 401 }
    );
  }


  try {
    const slug = titleSubTopicToSlug(language, title);
    const userQuiz = await createUserQuiz(session.user.id, `${language} ${title}`, 'code', slug);
   
    try {
    

      let quizzes = await generateCodingMCQs(language, title, difficulty, amount);  //dummyQuizzes[language] || dummyQuizzes["JavaScript"]
      if(quizzes.length === 0){
        return NextResponse.json({
          error: "No quizzes available for the selected topic"
        }, { status: 404 });
      }
      
      quizzes = quizzes.sort(() => 0.5 - Math.random());
  
      // Add difficulty to each quiz (in a real scenario, you'd have different quizzes for each difficulty)
      quizzes = quizzes.map((quiz) => ({ ...quiz, difficulty }))

      await createQuestions(quizzes, userQuiz.id,"code");

      // 4. Update topic count
      await updateTopicCount(language);

      // 5. Only deduct credits if everything else succeeded
      await updateUserCredits(session.user.id,"code");

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




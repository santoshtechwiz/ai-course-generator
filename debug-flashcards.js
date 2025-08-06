const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkFlashcards() {
  try {
    console.log('Checking flashcards for microservice-architecture-6339...');
    
    const quiz = await prisma.userQuiz.findUnique({
      where: { slug: 'microservice-architecture-6339' },
      include: {
        flashCards: true,
      },
    });
    
    if (!quiz) {
      console.log('Quiz not found');
      return;
    }
    
    console.log('Quiz found:', {
      id: quiz.id,
      title: quiz.title,
      quizType: quiz.quizType,
      flashCardsCount: quiz.flashCards?.length || 0,
    });
    
    if (quiz.flashCards && quiz.flashCards.length > 0) {
      console.log('First few flashcards:');
      quiz.flashCards.slice(0, 3).forEach((card, index) => {
        console.log(`${index + 1}. ${card.question} -> ${card.answer}`);
      });
    } else {
      console.log('No flashcards found for this quiz');
      
      // Check if there are any flashcards in the database at all
      const totalFlashcards = await prisma.flashCard.count();
      console.log(`Total flashcards in database: ${totalFlashcards}`);
      
      // Check if there are flashcards for this user
      const userFlashcards = await prisma.flashCard.findMany({
        where: { userId: quiz.userId },
        take: 5,
      });
      console.log(`Flashcards for user ${quiz.userId}:`, userFlashcards.length);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFlashcards();

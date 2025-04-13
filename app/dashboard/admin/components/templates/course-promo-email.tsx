import { BookIcon, StarIcon } from 'lucide-react';

interface Quiz {
  slug: string;
  title: string;
  description: string;
}

interface QuizPromoProps {
  name: string;
  quizzes: Quiz[];
}

export default function QuizPromo({ name, quizzes }: QuizPromoProps) {
  return (
    <div className="quiz-promo-container">
      <div className="quiz-promo-header">
        <StarIcon className="quiz-promo-icon" />
        <h1 className="quiz-promo-title">
          Hi {name}, Your next quiz collection is ready!
        </h1>
      </div>
      <p className="quiz-promo-description">
        Based on your learning path on QuizAI, we’ve picked a new collection of quizzes that’s perfect for your next step.
      </p>

      {quizzes.map((quiz) => (
        <div key={quiz.slug} className="quiz-card">
          <div className="quiz-card-header">
            <BookIcon className="quiz-card-icon" />
            <h3 className="quiz-card-title">{quiz.title}</h3>
          </div>
          <p className="quiz-card-description">{quiz.description}</p>
          <a href={`https://quizai.io/quiz/${quiz.slug}`} className="quiz-card-link">
            Take Quiz
          </a>
        </div>
      ))}

      <a href="https://quizai.io/quizzes" className="browse-quizzes-link">
        Browse All Quizzes
      </a>

      <p className="unsubscribe-text">
        You're receiving this because you're part of QuizAI.
        <a href="#" className="unsubscribe-link">Unsubscribe</a>
      </p>
    </div>
  );
}

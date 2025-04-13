import type { QuizType } from "@/app/types/types"
import { buildQuizUrl } from "@/lib/utils"
import type * as React from "react"

const styles = {
  container: {
    fontFamily: "Arial, sans-serif",
    maxWidth: "600px",
    margin: "0 auto",
    padding: "20px",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  },
  header: {
    textAlign: "center",
    marginBottom: "30px",
  },
  headerTitle: {
    color: "#333",
    fontSize: "24px",
    marginBottom: "10px",
  },
  headerDivider: {
    height: "4px",
    width: "80px",
    backgroundColor: "#4f46e5",
    margin: "0 auto",
  },
  introText: {
    color: "#555",
    fontSize: "16px",
    lineHeight: "1.6",
    marginBottom: "20px",
  },
  quizCard: {
    backgroundColor: "#f9fafb",
    padding: "20px",
    borderRadius: "6px",
    marginBottom: "20px",
    borderLeft: "4px solid #4f46e5",
  },
  quizTitle: {
    color: "#333",
    fontSize: "18px",
    marginBottom: "8px",
  },
  quizDescription: {
    color: "#666",
    fontSize: "14px",
    margin: 0,
  },
  quizTags: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
  } as React.CSSProperties,
  quizTag: {
    backgroundColor: "#e0e7ff",
    color: "#4f46e5",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "bold",
    marginRight: "8px",
    marginBottom: "8px",
  },
  quizMeta: {
    color: "#666",
    fontSize: "12px",
    marginBottom: "8px",
  },
  quizLink: {
    backgroundColor: "#4f46e5",
    color: "#fff",
    padding: "8px 16px",
    borderRadius: "4px",
    textDecoration: "none",
    fontWeight: "bold",
    display: "inline-block",
    fontSize: "14px",
    marginTop: "12px",
  },
  exploreLinkContainer: {
    textAlign: "center" as const,
    marginTop: "30px",
    marginBottom: "25px",
  },
  exploreLink: {
    backgroundColor: "#f9fafb",
    color: "#4f46e5",
    padding: "12px 24px",
    borderRadius: "4px",
    textDecoration: "none",
    fontWeight: "bold",
    display: "inline-block",
    border: "1px solid #4f46e5",
  },
  footer: {
    borderTop: "1px solid #eee",
    paddingTop: "20px",
    color: "#888",
    fontSize: "14px",
    textAlign: "center",
  },
  footerText: {
    fontSize: "12px",
    marginTop: "20px",
  },
  unsubscribeLink: {
    color: "#4f46e5",
    marginLeft: "5px",
  },
}

interface Quiz {
  id?: string
  slug: string
  title: string
  difficulty?: string
  questionCount?: number
  quizType?: QuizType
}

interface QuizPromoEmailProps {
  name: string
  quizzes?: Quiz[]
}

export default function QuizPromoEmail({ name, quizzes = [] }: QuizPromoEmailProps) {
  // Ensure we have valid quizzes with required properties
  const safeQuizzes = quizzes.map((quiz) => ({
    ...quiz,
    difficulty: quiz.difficulty || "Beginner",
    questionCount: quiz.questionCount || 10,
    quizType: quiz.quizType || "MULTIPLE_CHOICE",
  }))

  return (
    <div style={styles.container}>
      <div style={styles.header as React.CSSProperties}>
        <h1 style={styles.headerTitle}>Test Your Knowledge, {name}!</h1>
        <div style={styles.headerDivider} />
      </div>

      <p style={styles.introText as React.CSSProperties}>
        We've curated some exciting quizzes based on your interests. Challenge yourself and see how much you know!
      </p>

      {safeQuizzes.length > 0 ? (
        safeQuizzes.map((quiz) => (
          <div key={quiz.slug} style={styles.quizCard as React.CSSProperties}>
            <div style={{ marginBottom: "15px" }}>
              <h2 style={styles.quizTitle}>{quiz.title}</h2>
              <p style={styles.quizDescription}>Test your knowledge of {quiz.title.toLowerCase()}</p>
            </div>

            <div style={styles.quizTags}>
              <span style={styles.quizTag}>{quiz.difficulty}</span>
              <span style={styles.quizMeta}>{quiz.questionCount} questions</span>
            </div>

            <a href={`https://courseai.io${buildQuizUrl(quiz.slug, quiz.quizType)}`} style={styles.quizLink}>
              Take Quiz
            </a>
          </div>
        ))
      ) : (
        <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
          <p>No quizzes available at the moment. Check back soon!</p>
        </div>
      )}

      <div style={styles.exploreLinkContainer}>
        <a href="https://courseai.io/quizzes" style={styles.exploreLink}>
          Explore All Quizzes
        </a>
      </div>

      <div style={styles.footer as React.CSSProperties}>
        <p>
          Happy learning!
          <br />
          The CourseAI Team
        </p>
        <p style={styles.footerText}>
          You're receiving this email because you signed up for CourseAI.
          <a href="https://courseai.io/unsubscribe" style={styles.unsubscribeLink}>
            Unsubscribe
          </a>
        </p>
      </div>
    </div>
  )
}

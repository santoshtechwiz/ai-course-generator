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
  iconContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "20px",
  },
  quizCardHeader: {
    display: "flex",
    alignItems: "center",
    marginBottom: "15px",
  },
  quizCardIcon: {
    marginRight: "10px",
    flexShrink: 0,
  },
  quizStats: {
    display: "flex",
    gap: "15px",
    marginTop: "10px",
    marginBottom: "15px",
    color: "#666",
    fontSize: "13px",
  },
  statItem: {
    display: "flex",
    alignItems: "center",
  },
  statIcon: {
    marginRight: "5px",
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
        {/* Header SVG Icon */}
        <div style={styles.iconContainer}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="12" fill="#e0e7ff" />
            <path
              d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15849 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13"
              stroke="#4f46e5"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M12 17H12.01" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 style={styles.headerTitle}>Test Your Knowledge, {name}!</h1>
        <div style={styles.headerDivider} />
      </div>

      <p style={styles.introText as React.CSSProperties}>
        We've curated some exciting quizzes based on your interests. Challenge yourself and see how much you know!
      </p>

      {safeQuizzes.length > 0 ? (
        safeQuizzes.map((quiz) => (
          <div key={quiz.slug} style={styles.quizCard as React.CSSProperties}>
            <div style={styles.quizCardHeader}>
              {/* Quiz Card Icon */}
              <div style={styles.quizCardIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="24" height="24" rx="6" fill="#e0e7ff" />
                  <path
                    d="M8.5 14.5L5 18L3 16"
                    stroke="#4f46e5"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8.5 8.5L5 12L3 10"
                    stroke="#4f46e5"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M12 6H21" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 12H21" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 18H21" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 style={styles.quizTitle}>{quiz.title}</h2>
            </div>

            <p style={styles.quizDescription}>Test your knowledge of {quiz.title.toLowerCase()}</p>

            <div style={styles.quizStats}>
              <div style={styles.statItem}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={styles.statIcon}
                >
                  <path d="M12 6V12L16 14" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="10" stroke="#666" strokeWidth="2" />
                </svg>
                <span>~{Math.round(quiz.questionCount * 1.5)} mins</span>
              </div>
              <div style={styles.statItem}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={styles.statIcon}
                >
                  <path
                    d="M8.5 14.5L5 18L3 16"
                    stroke="#666"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8.5 8.5L5 12L3 10"
                    stroke="#666"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M12 6H21" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 12H21" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 18H21" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{quiz.questionCount} questions</span>
              </div>
            </div>

            <div style={styles.quizTags}>
              <span style={styles.quizTag}>{quiz.difficulty}</span>
              <span style={styles.quizTag}>{quiz.quizType.replace(/_/g, " ").toLowerCase()}</span>
            </div>

            <a href={`https://courseai.io${buildQuizUrl(quiz.slug, quiz.quizType)}`} style={styles.quizLink}>
              Take Quiz
            </a>
          </div>
        ))
      ) : (
        <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ margin: "0 auto 15px" }}
          >
            <path
              d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
              stroke="#666"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M12 8V12" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 16H12.01" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
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
          <a href="https://courseai.io/unsubscribed" style={styles.unsubscribeLink}>
            Unsubscribe
          </a>
        </p>
      </div>
    </div>
  )
}

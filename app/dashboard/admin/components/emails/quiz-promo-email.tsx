interface QuizPromoEmailProps {
    name: string
    preferences: {
      interests: string[]
      difficulty: string
    }
  }
  
  export default function QuizPromoEmail({ name, preferences }: QuizPromoEmailProps) {
    // Sample quizzes based on user preferences
    const quizzes = [
      {
        id: "quiz1",
        title: "JavaScript Fundamentals",
        description: "Test your knowledge of JavaScript basics",
        difficulty: "beginner",
        category: "programming",
        imageUrl: "/placeholder.svg?height=150&width=300",
        questions: 10,
        estimatedTime: "15 min",
      },
      {
        id: "quiz2",
        title: "Data Science Essentials",
        description: "Challenge yourself with data science concepts",
        difficulty: "intermediate",
        category: "data science",
        imageUrl: "/placeholder.svg?height=150&width=300",
        questions: 15,
        estimatedTime: "20 min",
      },
      {
        id: "quiz3",
        title: "Advanced Python Techniques",
        description: "Master advanced Python programming concepts",
        difficulty: "advanced",
        category: "programming",
        imageUrl: "/placeholder.svg?height=150&width=300",
        questions: 12,
        estimatedTime: "25 min",
      },
    ]
  
    // Filter quizzes based on user preferences
    const filteredQuizzes = quizzes
      .filter((quiz) => preferences.interests.includes(quiz.category) || quiz.difficulty === preferences.difficulty)
      .slice(0, 2)
  
    return (
      <div
        style={{
          fontFamily: "Arial, sans-serif",
          maxWidth: "600px",
          margin: "0 auto",
          padding: "20px",
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: "30px",
          }}
        >
          <h1
            style={{
              color: "#333333",
              fontSize: "24px",
              marginBottom: "10px",
            }}
          >
            Test Your Knowledge, {name}!
          </h1>
          <div
            style={{
              height: "4px",
              width: "80px",
              backgroundColor: "#4f46e5",
              margin: "0 auto",
            }}
          ></div>
        </div>
  
        <p
          style={{
            color: "#555555",
            fontSize: "16px",
            lineHeight: "1.6",
            marginBottom: "20px",
          }}
        >
          We've curated some exciting quizzes based on your interests. Challenge yourself and see how much you know!
        </p>
  
        {filteredQuizzes.map((quiz, index) => (
          <div
            key={quiz.id}
            style={{
              backgroundColor: "#f9fafb",
              padding: "20px",
              borderRadius: "6px",
              marginBottom: "20px",
              borderLeft: "4px solid #4f46e5",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  marginBottom: "15px",
                }}
              >
                <h2
                  style={{
                    color: "#333333",
                    fontSize: "18px",
                    marginBottom: "8px",
                  }}
                >
                  {quiz.title}
                </h2>
                <p
                  style={{
                    color: "#666666",
                    fontSize: "14px",
                    margin: "0",
                  }}
                >
                  {quiz.description}
                </p>
              </div>
  
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <span
                      style={{
                        backgroundColor: "#e0e7ff",
                        color: "#4f46e5",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        marginRight: "8px",
                      }}
                    >
                      {quiz.difficulty}
                    </span>
                    <span
                      style={{
                        color: "#666666",
                        fontSize: "12px",
                      }}
                    >
                      {quiz.questions} questions • {quiz.estimatedTime}
                    </span>
                  </div>
  
                  <a
                    href="#"
                    style={{
                      backgroundColor: "#4f46e5",
                      color: "#ffffff",
                      padding: "8px 16px",
                      borderRadius: "4px",
                      textDecoration: "none",
                      fontWeight: "bold",
                      display: "inline-block",
                      fontSize: "14px",
                    }}
                  >
                    Take Quiz
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
  
        <div
          style={{
            textAlign: "center",
            marginTop: "30px",
            marginBottom: "25px",
          }}
        >
          <a
            href="#"
            style={{
              backgroundColor: "#f9fafb",
              color: "#4f46e5",
              padding: "12px 24px",
              borderRadius: "4px",
              textDecoration: "none",
              fontWeight: "bold",
              display: "inline-block",
              border: "1px solid #4f46e5",
            }}
          >
            Explore All Quizzes
          </a>
        </div>
  
        <div
          style={{
            borderTop: "1px solid #eeeeee",
            paddingTop: "20px",
            color: "#888888",
            fontSize: "14px",
            textAlign: "center",
          }}
        >
          <p>
            Happy learning!
            <br />
            The Team
          </p>
          <p
            style={{
              fontSize: "12px",
              marginTop: "20px",
            }}
          >
            You're receiving this email because you signed up for our platform.
            <a href="#" style={{ color: "#4f46e5", marginLeft: "5px" }}>
              Unsubscribe
            </a>
          </p>
        </div>
      </div>
    )
  }
  
  
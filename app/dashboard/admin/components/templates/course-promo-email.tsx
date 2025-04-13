import type * as React from "react"

interface Course {
  id: string
  title: string
  description: string
  slug: string
  image?: string
}

interface CoursePromoEmailProps {
  name: string
  course?: Course[] // Original prop name
  recommendedCourses?: Course[] // New prop name
}

// Consistent styling with QuizPromoEmail
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
  courseCard: {
    backgroundColor: "#f9fafb",
    padding: "20px",
    borderRadius: "6px",
    marginBottom: "20px",
    borderLeft: "4px solid #4f46e5",
  },
  courseTitle: {
    color: "#333",
    fontSize: "18px",
    marginBottom: "8px",
  },
  courseDescription: {
    color: "#666",
    fontSize: "14px",
    margin: "0 0 15px 0",
    lineHeight: "1.5",
  },
  courseTags: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
  } as React.CSSProperties,
  courseTag: {
    backgroundColor: "#e0e7ff",
    color: "#4f46e5",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "bold",
    marginRight: "8px",
    marginBottom: "8px",
  },
  courseLink: {
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
  courseImage: {
    width: "100%",
    height: "140px",
    objectFit: "cover",
    borderRadius: "4px",
    marginBottom: "15px",
  },
}

export default function CoursePromoEmail({ name, course, recommendedCourses }: CoursePromoEmailProps) {
  // Use either course or recommendedCourses, whichever is provided
  const courses = recommendedCourses || course || []

  return (
    <div style={styles.container}>
      <div style={styles.header as React.CSSProperties}>
        <h1 style={styles.headerTitle}>New Courses Just for You, {name}!</h1>
        <div style={styles.headerDivider} />
      </div>

      <p style={styles.introText as React.CSSProperties}>
        We've curated some exciting courses based on your interests and learning goals. Expand your knowledge with these
        hand-picked selections!
      </p>

      {courses.length > 0 ? (
        courses.map((course) => (
          <div key={course.id || course.slug} style={styles.courseCard as React.CSSProperties}>
            {course.image && (
              <img
                src={course.image || "/placeholder.svg"}
                alt={course.title}
                style={styles.courseImage as React.CSSProperties}
                onError={(e) => {
                  // Fallback if image fails to load
                  e.currentTarget.style.display = "none"
                }}
              />
            )}
            <div style={{ marginBottom: "15px" }}>
              <h2 style={styles.courseTitle}>{course.title}</h2>
              <p style={styles.courseDescription}>{course.description}</p>
            </div>

            <div style={styles.courseTags}>
              <span style={styles.courseTag}>Featured</span>
              <span style={styles.courseTag}>New</span>
            </div>

            <a href={`https://courseai.io/course/${course.slug}`} style={styles.courseLink}>
              View Course
            </a>
          </div>
        ))
      ) : (
        <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
          <p>No courses available at the moment. Check back soon!</p>
        </div>
      )}

      <div style={styles.exploreLinkContainer}>
        <a href="https://courseai.io/courses" style={styles.exploreLink}>
          Explore All Courses
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

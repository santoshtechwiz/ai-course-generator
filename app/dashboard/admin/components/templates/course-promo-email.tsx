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
  iconContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "20px",
  },
  courseCardHeader: {
    display: "flex",
    alignItems: "center",
    marginBottom: "15px",
  },
  courseCardIcon: {
    marginRight: "10px",
    flexShrink: 0,
  },
  courseStats: {
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

export default function CoursePromoEmail({ name, course, recommendedCourses }: CoursePromoEmailProps) {
  // Use either course or recommendedCourses, whichever is provided
  const courses = recommendedCourses || course || []

  return (
    <div style={styles.container}>
      <div style={styles.header as React.CSSProperties}>
        {/* Header SVG Icon */}
        <div style={styles.iconContainer}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="12" fill="#e0e7ff" />
            <path
              d="M12 4L3 8.2V8.3C3 15.6 6.5 20.8 12 22C17.5 20.8 21 15.6 21 8.3V8.2L12 4ZM19 8.3C19 14.4 16.4 18.7 12 19.9C7.6 18.7 5 14.4 5 8.3L12 5L19 8.3Z"
              fill="#4f46e5"
            />
            <path
              d="M12 18C12.8284 18 13.5 17.3284 13.5 16.5C13.5 15.6716 12.8284 15 12 15C11.1716 15 10.5 15.6716 10.5 16.5C10.5 17.3284 11.1716 18 12 18Z"
              fill="#4f46e5"
            />
            <path d="M12 7V13" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
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
            <div style={styles.courseCardHeader}>
              {/* Course Card Icon */}
              <div style={styles.courseCardIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="24" height="24" rx="6" fill="#e0e7ff" />
                  <path
                    d="M19 5V19H5V5H19ZM19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3Z"
                    fill="#4f46e5"
                  />
                  <path d="M14 17H7V15H14V17ZM17 13H7V11H17V13ZM17 9H7V7H17V9Z" fill="#4f46e5" />
                </svg>
              </div>
              <h2 style={styles.courseTitle}>{course.title}</h2>
            </div>

            <p style={styles.courseDescription}>{course.description}</p>

            <div style={styles.courseStats}>
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
                <span>4 hours</span>
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
                    d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                    stroke="#666"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>4.8/5 rating</span>
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
                    d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"
                    stroke="#666"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z"
                    stroke="#666"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13"
                    stroke="#666"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88"
                    stroke="#666"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>1,240 students</span>
              </div>
            </div>

            <div style={styles.courseTags}>
              <span style={styles.courseTag}>Featured</span>
              <span style={styles.courseTag}>New</span>
            </div>

            <a href={`https://courseai.io/dashboard/course/${course.slug}`} style={styles.courseLink}>
              View Course
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
          <a href="https://courseai.io/unsubscribed" style={styles.unsubscribeLink}>
            Unsubscribe
          </a>
        </p>
      </div>
    </div>
  )
}

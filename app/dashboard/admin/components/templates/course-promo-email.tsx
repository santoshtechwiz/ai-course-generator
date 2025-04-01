interface CoursePromoEmailProps {
    name: string
    recommendedCourses: Array<{
      id: string
      title: string
      description: string
      imageUrl: string
    }>
  }
  
  export default function CoursePromoEmail({ name, recommendedCourses }: CoursePromoEmailProps) {
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
            Courses Tailored Just for You, {name}!
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
            marginBottom: "30px",
          }}
        >
          Based on your interests and activity, we've selected these courses that we think you'll love. Expand your
          knowledge and skills with these carefully curated learning paths.
        </p>
  
        {recommendedCourses.map((course) => (
          <div
            key={course.id}
            style={{
              backgroundColor: "#f9fafb",
              padding: "20px",
              borderRadius: "6px",
              marginBottom: "25px",
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
                {course.title}
              </h2>
              <p
                style={{
                  color: "#666666",
                  fontSize: "14px",
                  margin: "0",
                  marginBottom: "15px",
                }}
              >
                {course.description}
              </p>
  
              <div
                style={{
                  textAlign: "left",
                  marginTop: "10px",
                }}
              >
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
                  Enroll Now
                </a>
                <a
                  href="#"
                  style={{
                    color: "#4f46e5",
                    padding: "8px 16px",
                    textDecoration: "none",
                    fontWeight: "bold",
                    display: "inline-block",
                    fontSize: "14px",
                    marginLeft: "10px",
                  }}
                >
                  Learn More
                </a>
              </div>
            </div>
          </div>
        ))}
  
        <div
          style={{
            textAlign: "center",
            marginTop: "10px",
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
            Browse All Courses
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
  
  
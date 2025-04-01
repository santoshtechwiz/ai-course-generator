interface WelcomeEmailProps {
    name: string
  }
  
  export default function WelcomeEmail({ name }: WelcomeEmailProps) {
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
            Welcome to Our Platform, {name}!
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
          We're thrilled to have you join our community of learners! Here's what you can do to get started:
        </p>
  
        <div
          style={{
            backgroundColor: "#f9fafb",
            padding: "20px",
            borderRadius: "6px",
            marginBottom: "25px",
          }}
        >
          <h2
            style={{
              color: "#4f46e5",
              fontSize: "18px",
              marginBottom: "15px",
            }}
          >
            Getting Started
          </h2>
  
          <ul
            style={{
              paddingLeft: "20px",
              margin: "0",
            }}
          >
            <li
              style={{
                color: "#555555",
                marginBottom: "10px",
              }}
            >
              <strong>Complete your profile</strong> - Add a photo and tell us about yourself
            </li>
            <li
              style={{
                color: "#555555",
                marginBottom: "10px",
              }}
            >
              <strong>Explore our courses</strong> - Browse our catalog of courses and quizzes
            </li>
            <li
              style={{
                color: "#555555",
                marginBottom: "10px",
              }}
            >
              <strong>Join the community</strong> - Connect with other learners in our forums
            </li>
            <li
              style={{
                color: "#555555",
              }}
            >
              <strong>Set learning goals</strong> - Define what you want to achieve
            </li>
          </ul>
        </div>
  
        <div
          style={{
            textAlign: "center",
            marginBottom: "25px",
          }}
        >
          <a
            href="#"
            style={{
              backgroundColor: "#4f46e5",
              color: "#ffffff",
              padding: "12px 24px",
              borderRadius: "4px",
              textDecoration: "none",
              fontWeight: "bold",
              display: "inline-block",
            }}
          >
            Explore the Platform
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
          <p>If you have any questions, simply reply to this email. We're here to help!</p>
          <p>
            Best regards,
            <br />
            The Team
          </p>
          <p
            style={{
              fontSize: "12px",
              marginTop: "20px",
            }}
          >
            If you didn't create this account, please{" "}
            <a href="#" style={{ color: "#4f46e5" }}>
              click here
            </a>
            .
          </p>
        </div>
      </div>
    )
  }
  
  
interface ReengagementEmailProps {
  name: string
}

export default function ReengagementEmail({ name }: ReengagementEmailProps) {
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
          We Miss You, {name}!
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
        It's been a while since we've seen you on our platform. We've added lots of new content that we think you'll
        love!
      </p>

      <div
        style={{
          backgroundColor: "#f9fafb",
          padding: "20px",
          borderRadius: "6px",
          marginBottom: "25px",
          borderLeft: "4px solid #4f46e5",
        }}
      >
        <h2
          style={{
            color: "#4f46e5",
            fontSize: "18px",
            marginBottom: "15px",
          }}
        >
          What's New
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
            <strong>New courses</strong> - We've added 15+ new courses in popular topics
          </li>
          <li
            style={{
              color: "#555555",
              marginBottom: "10px",
            }}
          >
            <strong>Enhanced quizzes</strong> - Test your knowledge with our improved quiz system
          </li>
          <li
            style={{
              color: "#555555",
            }}
          >
            <strong>Community forums</strong> - Connect with fellow learners in our new discussion areas
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
          Come Back & Explore
        </a>
      </div>

      <div
        style={{
          backgroundColor: "#f9fafb",
          padding: "15px",
          borderRadius: "6px",
          marginBottom: "25px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            color: "#4f46e5",
            fontSize: "16px",
            fontWeight: "bold",
            margin: "0 0 10px 0",
          }}
        >
          Special Offer Just For You
        </p>
        <p
          style={{
            color: "#555555",
            fontSize: "14px",
            margin: "0",
          }}
        >
          Use code <strong>WELCOME20</strong> for 20% off your next premium course!
        </p>
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
          We hope to see you soon!
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

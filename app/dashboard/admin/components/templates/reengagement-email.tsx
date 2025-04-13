import type * as React from "react"

interface ReengagementEmailProps {
  name: string
}

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
    color: "#333333",
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
    color: "#555555",
    fontSize: "16px",
    lineHeight: "1.6",
    marginBottom: "20px",
  },
  card: {
    backgroundColor: "#f9fafb",
    padding: "20px",
    borderRadius: "6px",
    marginBottom: "25px",
    borderLeft: "4px solid #4f46e5",
  },
  cardTitle: {
    color: "#4f46e5",
    fontSize: "18px",
    marginBottom: "15px",
    display: "flex",
    alignItems: "center",
  },
  cardTitleIcon: {
    marginRight: "10px",
  },
  list: {
    paddingLeft: "20px",
    margin: "0",
  },
  listItem: {
    color: "#555555",
    marginBottom: "10px",
  },
  listItemTitle: {
    fontWeight: "bold",
  },
  ctaContainer: {
    textAlign: "center",
    marginBottom: "25px",
  },
  ctaButton: {
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    padding: "12px 24px",
    borderRadius: "4px",
    textDecoration: "none",
    fontWeight: "bold",
    display: "inline-block",
  },
  offerCard: {
    backgroundColor: "#f9fafb",
    padding: "15px",
    borderRadius: "6px",
    marginBottom: "25px",
    textAlign: "center",
  },
  offerTitle: {
    color: "#4f46e5",
    fontSize: "16px",
    fontWeight: "bold",
    margin: "0 0 10px 0",
  },
  offerText: {
    color: "#555555",
    fontSize: "14px",
    margin: "0",
  },
  offerCode: {
    fontWeight: "bold",
  },
  footer: {
    borderTop: "1px solid #eeeeee",
    paddingTop: "20px",
    color: "#888888",
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
}

export default function ReengagementEmail({ name }: ReengagementEmailProps) {
  return (
    <div style={styles.container}>
      <div style={styles.header as React.CSSProperties}>
        {/* Header SVG Icon */}
        <div style={styles.iconContainer}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="12" fill="#e0e7ff" />
            <path d="M12 8V12L15 15" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path
              d="M3.05078 11.0002C3.27441 8.18983 4.51578 5.55733 6.53204 3.67879C8.5483 1.80025 11.1876 0.815765 13.9051 0.919C16.6226 1.02223 19.1674 2.20481 21.0217 4.20177C22.876 6.19873 23.8856 8.85974 23.8517 11.5815C23.8178 14.3033 22.7428 16.9361 20.8387 18.8862C18.9346 20.8364 16.3582 21.9661 13.6364 21.9977C10.9146 22.0293 8.31379 20.9604 6.36462 19.0502C4.41545 17.14 3.27441 14.5339 3.05078 11.7252"
              stroke="#4f46e5"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 style={styles.headerTitle}>We Miss You, {name}!</h1>
        <div style={styles.headerDivider} />
      </div>

      <p style={styles.introText as React.CSSProperties}>
        It's been a while since we've seen you on our platform. We've added lots of new content that we think you'll
        love!
      </p>

      <div style={styles.card as React.CSSProperties}>
        <h2 style={styles.cardTitle}>
          <span style={styles.cardTitleIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                stroke="#4f46e5"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          What's New
        </h2>

        <ul style={styles.list as React.CSSProperties}>
          <li style={styles.listItem}>
            <span style={styles.listItemTitle}>New courses</span> - We've added 15+ new courses in popular topics
          </li>
          <li style={styles.listItem}>
            <span style={styles.listItemTitle}>Enhanced quizzes</span> - Test your knowledge with our improved quiz
            system
          </li>
          <li style={styles.listItem}>
            <span style={styles.listItemTitle}>Community forums</span> - Connect with fellow learners in our new
            discussion areas
          </li>
        </ul>
      </div>

      <div style={styles.ctaContainer as React.CSSProperties}>
        <a href="https://courseai.io/dashboard" style={styles.ctaButton}>
          Come Back & Explore
        </a>
      </div>

      <div style={styles.offerCard as React.CSSProperties}>
        <p style={styles.offerTitle}>Special Offer Just For You</p>
        <p style={styles.offerText}>
          Use code <span style={styles.offerCode}>WELCOME20</span> for 20% off your next premium course!
        </p>
      </div>

      <div style={styles.footer as React.CSSProperties}>
        <p>
          We hope to see you soon!
          <br />
          The CourseAI Team
        </p>
        <p style={styles.footerText as React.CSSProperties}>
          You're receiving this email because you signed up for our platform.
          <a href="https://courseai.io/unsubscribe" style={styles.unsubscribeLink}>
            Unsubscribe
          </a>
        </p>
      </div>
    </div>
  )
}

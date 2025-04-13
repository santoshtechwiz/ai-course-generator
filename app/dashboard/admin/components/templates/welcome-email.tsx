"use client"
import type * as React from "react"

interface WelcomeEmailProps {
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
  footerLink: {
    color: "#4f46e5",
  },
  iconContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "20px",
  },
}

export default function WelcomeEmail({ name }: WelcomeEmailProps) {
  return (
    <div style={styles.container}>
      <div style={styles.header as React.CSSProperties}>
        {/* Header SVG Icon */}
        <div style={styles.iconContainer}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="12" fill="#e0e7ff" />
            <path
              d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
              stroke="#4f46e5"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14"
              stroke="#4f46e5"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M9 9H9.01" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 9H15.01" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 style={styles.headerTitle}>Welcome to Our Platform, {name}!</h1>
        <div style={styles.headerDivider} />
      </div>

      <p style={styles.introText as React.CSSProperties}>
        We're thrilled to have you join our community of learners! Here's what you can do to get started:
      </p>

      <div style={styles.card as React.CSSProperties}>
        <h2 style={styles.cardTitle}>
          <span style={styles.cardTitleIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M16 4H8C7.44772 4 7 4.44772 7 5V19C7 19.5523 7.44772 20 8 20H16C16.5523 20 17 19.5523 17 19V5C17 4.44772 16.5523 4 16 4Z"
                stroke="#4f46e5"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M11 8H13" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 16H12.01" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          Getting Started
        </h2>

        <ul style={styles.list as React.CSSProperties}>
          <li style={styles.listItem}>
            <span style={styles.listItemTitle}>Complete your profile</span> - Add a photo and tell us about yourself
          </li>
          <li style={styles.listItem}>
            <span style={styles.listItemTitle}>Explore our courses</span> - Browse our catalog of courses and quizzes
          </li>
          <li style={styles.listItem}>
            <span style={styles.listItemTitle}>Join the community</span> - Connect with other learners in our forums
          </li>
          <li style={styles.listItem}>
            <span style={styles.listItemTitle}>Set learning goals</span> - Define what you want to achieve
          </li>
        </ul>
      </div>

      <div style={styles.ctaContainer as React.CSSProperties}>
        <a href="https://courseai.io/dashboard" style={styles.ctaButton}>
          Explore the Platform
        </a>
      </div>

      <div style={styles.footer as React.CSSProperties}>
        <p>If you have any questions, simply reply to this email. We're here to help!</p>
        <p>
          Best regards,
          <br />
          The CourseAI Team
        </p>
        <p style={styles.footerText as React.CSSProperties}>
          If you didn't create this account, please{" "}
          <a href="https://courseai.io/help/account-security" style={styles.footerLink}>
            click here
          </a>
          .
        </p>
      </div>
    </div>
  )
}

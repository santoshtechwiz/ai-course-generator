import React from "react"

interface ContactResponseEmailProps {
  name: string
  subject: string
  message: string
}

const ContactResponseEmail: React.FC<ContactResponseEmailProps> = ({ name, subject, message }) => {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "0 auto", padding: "20px", border: "1px solid #eaeaea", borderRadius: "5px" }}>
      <h2 style={{ color: "#333", borderBottom: "2px solid #007bff", paddingBottom: "8px" }}>Hello {name},</h2>
      <p style={{ color: "#666", fontSize: "16px" }}>Thank you for reaching out. Here's our response to your inquiry:</p>
      <div style={{ padding: "15px", backgroundColor: "#f5f5f5", borderLeft: "4px solid #007bff", margin: "15px 0" }}>
        {message}
      </div>
      <p style={{ color: "#666" }}>If you have any more questions, feel free to reply.</p>
      <div style={{ color: "#666", fontSize: "14px", borderTop: "1px solid #eaeaea", paddingTop: "15px", marginTop: "20px" }}>
        <p>Best regards,<br />The Support Team</p>
      </div>
    </div>
  )
}

export default ContactResponseEmail

"use server"

import mailchimp from "@mailchimp/mailchimp_marketing"

// Initialize the Mailchimp client
mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: process.env.MAILCHIMP_SERVER_PREFIX, // This is the server prefix (e.g., "us1")
})

export async function subscribeToNewsletter(email: string) {
  if (!email || !email.includes("@")) {
    return { success: false, message: "Please provide a valid email address" }
  }

  try {
    // Add member to list
    await mailchimp.lists.addListMember(process.env.MAILCHIMP_LIST_ID as string, {
      email_address: email,
      status: "subscribed",
    })

    return {
      success: true,
      message: "You've been successfully subscribed to our newsletter!",
    }
  } catch (error: any) {
    // Handle existing subscribers
    if (error.response && error.response.body && error.response.body.title === "Member Exists") {
      return {
        success: true,
        message: "You're already subscribed to our newsletter!",
      }
    }

    console.error("Mailchimp subscription error:", error)
    return {
      success: false,
      message: "Something went wrong. Please try again later.",
    }
  }
}


import { kv } from "@vercel/kv"

type EmailEvent = {
  userId: string
  emailId: string
  templateId: string
  trackingId: string
  event: "send" | "open" | "click" | "conversion"
  url?: string
  abTestId?: string
  abTestVariant?: string
  timestamp?: number
}

export async function saveEmailEvent(event: EmailEvent) {
  const timestamp = Date.now()

  // Add timestamp if not provided
  const eventWithTimestamp = {
    ...event,
    timestamp: event.timestamp || timestamp,
  }

  // Save to event log
  await kv.lpush(`email:events:${event.userId}`, JSON.stringify(eventWithTimestamp))

  // Update counters
  await kv.hincrby(`email:stats:${event.templateId}`, event.event, 1)

  // Update A/B test stats if applicable
  if (event.abTestId && event.abTestVariant) {
    await updateABTestStats(event.abTestId, event.abTestVariant, event.event)
  }

  return true
}

export async function trackEmailOpen(trackingId: string) {
  // Extract user ID and email ID from tracking ID
  const [templateId, userId] = trackingId.split("-")

  if (!userId || !templateId) {
    throw new Error("Invalid tracking ID")
  }

  // Get email details from tracking ID
  const emailDetails = await kv.hgetall(`email:tracking:${trackingId}`)

  if (!emailDetails) {
    throw new Error("Email not found")
  }

  // Save open event
  await saveEmailEvent({
    userId,
    emailId: emailDetails.emailId as string,
    templateId,
    trackingId,
    event: "open",
  })

  // Return a 1x1 transparent pixel
  return new Uint8Array([
    0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00,
    0x21, 0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02,
    0x02, 0x44, 0x01, 0x00, 0x3b,
  ])
}

export async function trackEmailClick(trackingId: string, url: string) {
  // Extract user ID and email ID from tracking ID
  const [templateId, userId] = trackingId.split("-")

  if (!userId || !templateId) {
    throw new Error("Invalid tracking ID")
  }

  // Get email details from tracking ID
  const emailDetails = await kv.hgetall(`email:tracking:${trackingId}`)

  if (!emailDetails) {
    throw new Error("Email not found")
  }

  // Save click event
  await saveEmailEvent({
    userId,
    emailId: emailDetails.emailId as string,
    templateId,
    trackingId,
    event: "click",
    url,
  })

  // Redirect to the original URL
  return url
}

export async function getEmailStats(userId: string) {
  // Get all email events for this user
  const events = await kv.lrange(`email:events:${userId}`, 0, -1)

  // Parse events
  const parsedEvents = events.map((event) => JSON.parse(event))

  // Calculate stats
  const totalEmails = parsedEvents.filter((e) => e.event === "send").length
  const opens = parsedEvents.filter((e) => e.event === "open").length
  const clicks = parsedEvents.filter((e) => e.event === "click").length

  return {
    totalEmails,
    opens,
    clicks,
    openRate: totalEmails > 0 ? opens / totalEmails : 0,
    clickRate: opens > 0 ? clicks / opens : 0,
  }
}

export async function updateABTestStats(testId: string, variant: string, event: string) {
  // Update A/B test stats
  await kv.hincrby(`abtest:${testId}:${variant}`, event, 1)

  return true
}

export async function getABTestStats(testId: string) {
  // Get all variants for this test
  const variants = await kv.smembers(`abtest:${testId}:variants`)

  // Get stats for each variant
  const stats = await Promise.all(
    variants.map(async (variant) => {
      const variantStats = await kv.hgetall(`abtest:${testId}:${variant}`)
      return {
        variant,
        sends: Number.parseInt(variantStats.send || "0"),
        opens: Number.parseInt(variantStats.open || "0"),
        clicks: Number.parseInt(variantStats.click || "0"),
        openRate:
          Number.parseInt(variantStats.send || "0") > 0
            ? Number.parseInt(variantStats.open || "0") / Number.parseInt(variantStats.send || "0")
            : 0,
        clickRate:
          Number.parseInt(variantStats.open || "0") > 0
            ? Number.parseInt(variantStats.click || "0") / Number.parseInt(variantStats.open || "0")
            : 0,
      }
    }),
  )

  return stats
}


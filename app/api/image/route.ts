// app/api/image/route.js - Modified to use existing images instead of external API calls
import { NextRequest, NextResponse } from "next/server"

const EXISTING_IMAGES = {
  default: "/generic-course-improved.svg",
  tech: "/generic-course-tech-improved.svg",
  programming: "/generic-course-tech-improved.svg",
  "web-development": "/generic-course-tech-improved.svg",
  "data-science": "/generic-course-tech-improved.svg",
  business: "/generic-course-business-improved.svg",
  marketing: "/generic-course-business-improved.svg",
  design: "/generic-course-creative-improved.svg",
  creative: "/generic-course-creative-improved.svg",
  ai: "/generic-course-tech-improved.svg",
  cloud: "/generic-course-tech-improved.svg",
  mobile: "/generic-course-tech-improved.svg",
  security: "/generic-course-tech-improved.svg",
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const topic = searchParams.get("topic")

  try {
    // Use existing images instead of making external API calls
    const normalizedTopic = topic?.toLowerCase().trim() || ''
    let selectedImage = EXISTING_IMAGES.default

    if (normalizedTopic.includes('programming') || normalizedTopic.includes('code') || normalizedTopic.includes('developer')) {
      selectedImage = EXISTING_IMAGES.tech
    } else if (normalizedTopic.includes('business') || normalizedTopic.includes('marketing') || normalizedTopic.includes('finance')) {
      selectedImage = EXISTING_IMAGES.business
    } else if (normalizedTopic.includes('design') || normalizedTopic.includes('creative') || normalizedTopic.includes('art')) {
      selectedImage = EXISTING_IMAGES.design
    } else if (normalizedTopic.includes('data') || normalizedTopic.includes('science') || normalizedTopic.includes('analytics')) {
      selectedImage = EXISTING_IMAGES.tech
    } else if (normalizedTopic.includes('ai') || normalizedTopic.includes('machine') || normalizedTopic.includes('learning')) {
      selectedImage = EXISTING_IMAGES.tech
    }

    // Return existing image data
    return NextResponse.json({
      data: {
        urls: {
          small: selectedImage,
          thumb: selectedImage,
          regular: selectedImage
        }
      }
    })
  } catch (error) {
    console.error('Image API error:', error)
    return NextResponse.json({
      error: "Failed to get image",
      data: {
        urls: {
          small: EXISTING_IMAGES.default,
          thumb: EXISTING_IMAGES.default,
          regular: EXISTING_IMAGES.default
        }
      }
    }, { status: 500 })
  }
}
// app/api/unsplash/route.js
import { NextResponse } from "next/server"
import https from "https"
import { apiClient } from "@/lib/api-client"

export async function GET(req, res) {
  const { searchParams } = new URL(req.url)
  const topic = searchParams.get("topic")
  
  // Create a custom axios-like instance for server-side only
  const serverRequest = async (url: string, options: any) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
      },
      // Use Node.js HTTPS agent to handle certificate issues
      agent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    return response.json();
  }
  
  try {
    // Use server-side request function for external API calls
    const data = await serverRequest(`https://api.unsplash.com/photos/random`, {
      headers: {
        Authorization: `Client-ID ${process.env.UNSPLASH_API_KEY}`,
      },
      params: { query: topic }
    });
    
    return NextResponse.json({ data })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 })
  }
}

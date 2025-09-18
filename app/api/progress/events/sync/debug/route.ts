import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    status: "API route is accessible",
    time: new Date().toISOString()
  })
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ 
    status: "POST endpoint is accessible",
    time: new Date().toISOString()
  })
}
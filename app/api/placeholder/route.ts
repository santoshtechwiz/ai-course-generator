import { NextRequest, NextResponse } from 'next/server'
import { generatePlaceholderUrl, generateInitials, getTextColor } from '@/lib/utils/placeholder'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Extract parameters
    const text = searchParams.get('text') || 'CA'
    const width = parseInt(searchParams.get('width') || '100')
    const height = parseInt(searchParams.get('height') || '100')
    const variant = searchParams.get('variant') || 'default'
    const bgColor = searchParams.get('bgColor')
    const textColor = searchParams.get('textColor') || 'ffffff'
    
    // Validate dimensions
    const maxSize = 500
    const safeWidth = Math.min(Math.max(width, 10), maxSize)
    const safeHeight = Math.min(Math.max(height, 10), maxSize)
    
    // Generate the placeholder SVG
    const svg = generatePlaceholderSvg({
      text: text.slice(0, 10), // Limit text length
      width: safeWidth,
      height: safeHeight,
      variant,
      bgColor: bgColor || getTextColor(text),
      textColor
    })
    
    // Return SVG with proper headers
    return new NextResponse(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Error generating placeholder:', error)
    
    // Return a fallback placeholder
    const fallbackSvg = generatePlaceholderSvg({
      text: 'CA',
      width: 100,
      height: 100,
      variant: 'default',
      bgColor: '4f46e5',
      textColor: 'ffffff'
    })
    
    return new NextResponse(fallbackSvg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour on error
      },
    })
  }
}

function generatePlaceholderSvg(options: {
  text: string
  width: number
  height: number
  variant: string
  bgColor: string
  textColor: string
}) {
  const { text, width, height, variant, bgColor, textColor } = options
  
  let iconPath = ''
  let fontSize = Math.min(width, height) * 0.3
  
  // Generate icon based on variant
  switch (variant) {
    case 'course':
      iconPath = `
        <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zM12 20c-4.42 0-8-3.58-8-8V9l8-4 8 4v3c0 4.42-3.58 8-8 8z"/>
        <path d="M12 6l-6 3v3c0 3.31 2.69 6 6 6s6-2.69 6-6V9l-6-3z"/>
      `
      break
    case 'user':
      iconPath = `
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
      `
      break
    default:
      // Use text instead of icon for default variant
      return `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#${bgColor}"/>
          <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${fontSize}" 
                fill="#${textColor}" text-anchor="middle" dy="0.35em" font-weight="bold">
            ${text.slice(0, 2).toUpperCase()}
          </text>
        </svg>
      `.replace(/\s+/g, ' ').trim()
  }
  
  // Return SVG with icon
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#${bgColor}"/>
      <g transform="translate(${width/2}, ${height/2}) scale(${Math.min(width, height) / 48})" fill="#${textColor}">
        ${iconPath}
      </g>
    </svg>
  `.replace(/\s+/g, ' ').trim()
}
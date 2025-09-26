import { NextResponse } from "next/server"

export const runtime = 'nodejs'

// 1x1 transparent GIF
const GIF_BASE64 =
  "R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="

export async function GET() {
  const buffer = Buffer.from(GIF_BASE64, 'base64')
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  })
}



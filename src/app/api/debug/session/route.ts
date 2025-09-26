import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "No session found" },
        { status: 401 }
      )
    }

    return NextResponse.json({
      session: {
        user: session.user,
        hasAccessToken: !!session.accessToken,
        accessTokenPreview: session.accessToken ? session.accessToken.substring(0, 20) + '...' : 'No token',
        tokenLength: session.accessToken ? session.accessToken.length : 0
      },
      message: "Session debug information"
    })

  } catch (error) {
    console.error("Error getting session debug info:", error)
    return NextResponse.json(
      { error: "Failed to get session info", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}



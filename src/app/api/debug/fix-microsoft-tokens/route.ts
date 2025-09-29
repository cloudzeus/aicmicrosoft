import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "No session found" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { accounts: true }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const microsoftAccount = user.accounts.find(account => 
      account.provider === "c03bef53-43af-4d5e-be22-da859317086c"
    )

    if (!microsoftAccount) {
      return NextResponse.json({ 
        error: "No Microsoft account found. Please sign in with Microsoft again.",
        solution: "Go to /auth/signin and sign in with Microsoft"
      }, { status: 404 })
    }

    // Check if we have a refresh token
    if (!microsoftAccount.refresh_token) {
      return NextResponse.json({ 
        error: "No refresh token found in Microsoft account",
        solution: "Please sign out and sign back in with Microsoft to get a fresh refresh token",
        microsoftAccount: {
          id: microsoftAccount.id,
          hasAccessToken: !!microsoftAccount.access_token,
          hasRefreshToken: false,
          expiresAt: microsoftAccount.expires_at,
          isExpired: microsoftAccount.expires_at ? 
            new Date(Number(microsoftAccount.expires_at)) < new Date() : 
            true
        }
      }, { status: 400 })
    }

    // If we have a refresh token, try to refresh the access token
    try {
      const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.AUTH_MICROSOFT_CLIENT_ID!,
          client_secret: process.env.AUTH_MICROSOFT_CLIENT_SECRET!,
          refresh_token: microsoftAccount.refresh_token,
          grant_type: 'refresh_token',
          scope: 'https://graph.microsoft.com/.default'
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        return NextResponse.json({ 
          error: "Failed to refresh token",
          details: errorText,
          solution: "Please sign out and sign back in with Microsoft"
        }, { status: 400 })
      }

      const tokenData = await response.json()
      
      // Update the database with new tokens
      await prisma.account.update({
        where: { id: microsoftAccount.id },
        data: {
          access_token: tokenData.access_token,
          expires_at: Math.floor(Date.now() / 1000) + tokenData.expires_in,
          refresh_token: tokenData.refresh_token || microsoftAccount.refresh_token
        }
      })

      return NextResponse.json({ 
        success: true,
        message: "Microsoft tokens refreshed successfully",
        expiresIn: tokenData.expires_in
      })

    } catch (refreshError) {
      return NextResponse.json({ 
        error: "Error refreshing token",
        details: refreshError instanceof Error ? refreshError.message : "Unknown error",
        solution: "Please sign out and sign back in with Microsoft"
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error fixing Microsoft tokens:', error)
    return NextResponse.json(
      { error: 'Failed to fix Microsoft tokens' },
      { status: 500 }
    )
  }
}

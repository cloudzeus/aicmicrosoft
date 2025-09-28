import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { accounts: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const microsoftAccount = user.accounts.find(a => a.provider === "c03bef53-43af-4d5e-be22-da859317086c")
    
    if (!microsoftAccount) {
      return NextResponse.json({ error: 'No Microsoft account found' }, { status: 404 })
    }

    const now = Math.floor(Date.now() / 1000)
    const expiresAt = microsoftAccount.expires_at ? Math.floor(microsoftAccount.expires_at / 1000) : 0
    const timeUntilExpiry = expiresAt - now

    return NextResponse.json({
      success: true,
      tokenInfo: {
        hasAccessToken: !!microsoftAccount.access_token,
        hasRefreshToken: !!microsoftAccount.refresh_token,
        expiresAt: microsoftAccount.expires_at,
        timeUntilExpiry: timeUntilExpiry,
        isExpired: timeUntilExpiry <= 0,
        needsRefresh: timeUntilExpiry < 300 // 5 minutes buffer
      }
    })

  } catch (error) {
    console.error('Error checking token status:', error)
    return NextResponse.json({ 
      error: 'Failed to check token status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

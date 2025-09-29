import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
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

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      microsoftAccount: microsoftAccount ? {
        id: microsoftAccount.id,
        provider: microsoftAccount.provider,
        providerAccountId: microsoftAccount.providerAccountId,
        hasRefreshToken: !!microsoftAccount.refresh_token,
        hasAccessToken: !!microsoftAccount.access_token,
        tokenType: microsoftAccount.token_type,
        scope: microsoftAccount.scope,
        expiresAt: microsoftAccount.expires_at,
        isExpired: microsoftAccount.expires_at ? 
          new Date(Number(microsoftAccount.expires_at)) < new Date() : 
          true
      } : null,
      allAccounts: user.accounts.map(acc => ({
        id: acc.id,
        provider: acc.provider,
        hasRefreshToken: !!acc.refresh_token,
        hasAccessToken: !!acc.access_token,
        expiresAt: acc.expires_at
      }))
    })
  } catch (error) {
    console.error('Error checking Microsoft account:', error)
    return NextResponse.json(
      { error: 'Failed to check Microsoft account' },
      { status: 500 }
    )
  }
}

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

    // Find and delete the Microsoft account
    const microsoftAccount = user.accounts.find(account => 
      account.provider === "c03bef53-43af-4d5e-be22-da859317086c"
    )

    if (microsoftAccount) {
      await prisma.account.delete({
        where: { id: microsoftAccount.id }
      })
      
      console.log(`Deleted Microsoft account for user: ${user.email}`)
    }

    // Also clear any sessions to force re-authentication
    await prisma.session.deleteMany({
      where: { userId: user.id }
    })

    console.log(`Cleared sessions for user: ${user.email}`)

    return NextResponse.json({ 
      success: true,
      message: "Microsoft authentication reset successfully. Please sign in again.",
      redirectUrl: "/auth/signin"
    })

  } catch (error) {
    console.error('Error resetting Microsoft authentication:', error)
    return NextResponse.json(
      { error: 'Failed to reset Microsoft authentication' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true,
        isFromTenantSync: true
      }
    })

    return NextResponse.json({
      session: {
        user: session.user,
        role: session.user.role,
        accessToken: !!session.accessToken
      },
      database: {
        user: dbUser,
        found: !!dbUser
      },
      message: 'Debug info retrieved'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get debug info', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

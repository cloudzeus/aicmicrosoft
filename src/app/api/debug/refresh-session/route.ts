import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export async function POST() {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }

    // Get the current user from database
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

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'Session refresh needed',
      currentSession: {
        role: session.user.role,
        email: session.user.email
      },
      databaseUser: {
        role: dbUser.role,
        email: dbUser.email
      },
      needsRefresh: session.user.role !== dbUser.role,
      instructions: 'Please sign out and sign in again to refresh your session with the correct role'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

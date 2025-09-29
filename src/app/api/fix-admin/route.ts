import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }

    console.log('Fixing admin role for:', session.user.email)

    // Update or create user with ADMIN role
    const user = await prisma.user.upsert({
      where: { email: session.user.email },
      update: { 
        role: 'ADMIN',
        name: session.user.name || session.user.email,
        tenantId: session.user.id,
        isFromTenantSync: true
      },
      create: {
        email: session.user.email,
        name: session.user.name || session.user.email,
        role: 'ADMIN',
        tenantId: session.user.id,
        isFromTenantSync: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true
      }
    })

    console.log('User updated:', user)

    return NextResponse.json({
      message: 'User role fixed to ADMIN',
      user: user,
      instructions: 'Please sign out and sign in again to refresh your session'
    })
  } catch (error) {
    console.error('Error fixing admin role:', error)
    return NextResponse.json(
      { error: 'Failed to fix admin role', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


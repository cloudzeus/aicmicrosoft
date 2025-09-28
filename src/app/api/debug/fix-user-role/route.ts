import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }

    // Check if user exists in database
    let dbUser = await prisma.user.findUnique({
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
      // Create user if doesn't exist
      dbUser = await prisma.user.create({
        data: {
          name: session.user.name || session.user.email,
          email: session.user.email,
          role: 'ADMIN', // Set as ADMIN by default
          tenantId: session.user.id,
          isFromTenantSync: true
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          tenantId: true,
          isFromTenantSync: true
        }
      })
    } else {
      // Update user role to ADMIN if not already
      if (dbUser.role !== 'ADMIN') {
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: { role: 'ADMIN' },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            tenantId: true,
            isFromTenantSync: true
          }
        })
      }
    }

    return NextResponse.json({
      message: 'User role fixed',
      user: dbUser,
      sessionRole: session.user.role
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fix user role', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

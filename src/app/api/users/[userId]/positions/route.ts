import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAccess } from '@/lib/auth-helpers'
import { z } from 'zod'

// Validation schemas
const assignPositionSchema = z.object({
  positionId: z.string().min(1, 'Position ID is required'),
})

// GET /api/users/[userId]/positions - Get user's position assignments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAccess({ action: 'read', resource: 'user' })

    const { userId } = await params

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userPositions = await prisma.userPosition.findMany({
      where: { userId },
      include: {
        position: {
          select: {
            id: true,
            name: true,
            description: true,
            department: {
              select: {
                id: true,
                name: true,
                code: true,
                description: true,
              },
            },
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    })

    return NextResponse.json({ 
      user,
      userPositions 
    })
  } catch (error) {
    console.error('Error fetching user positions:', error)
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch user positions' },
      { status: 500 }
    )
  }
}

// POST /api/users/[userId]/positions - Assign user to a position
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAccess({ action: 'write', resource: 'user' })

    const { userId } = await params
    const body = await request.json()
    const validatedData = assignPositionSchema.parse(body)

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if position exists
    const position = await prisma.position.findUnique({
      where: { id: validatedData.positionId },
      select: { 
        id: true, 
        name: true, 
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    })

    if (!position) {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      )
    }

    // Check if user is already assigned to this position
    const existingAssignment = await prisma.userPosition.findUnique({
      where: {
        userId_positionId: {
          userId,
          positionId: validatedData.positionId,
        },
      },
    })

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'User is already assigned to this position' },
        { status: 400 }
      )
    }

    const userPosition = await prisma.userPosition.create({
      data: {
        userId,
        positionId: validatedData.positionId,
      },
      include: {
        position: {
          select: {
            id: true,
            name: true,
            description: true,
            department: {
              select: {
                id: true,
                name: true,
                code: true,
                description: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ userPosition }, { status: 201 })
  } catch (error) {
    console.error('Error assigning user to position:', error)
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to assign user to position' },
      { status: 500 }
    )
  }
}

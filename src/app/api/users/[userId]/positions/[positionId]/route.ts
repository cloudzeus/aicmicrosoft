import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAccess } from '@/lib/auth-helpers'

// DELETE /api/users/[userId]/positions/[positionId] - Remove user from position
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; positionId: string }> }
) {
  try {
    await requireAccess({ action: 'write', resource: 'user' })

    const { userId, positionId } = await params

    // Check if user position assignment exists
    const existingAssignment = await prisma.userPosition.findUnique({
      where: {
        userId_positionId: {
          userId,
          positionId,
        },
      },
    })

    if (!existingAssignment) {
      return NextResponse.json(
        { error: 'User position assignment not found' },
        { status: 404 }
      )
    }

    await prisma.userPosition.delete({
      where: {
        userId_positionId: {
          userId,
          positionId,
        },
      },
    })

    return NextResponse.json({ message: 'User removed from position successfully' })
  } catch (error) {
    console.error('Error removing user from position:', error)
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to remove user from position' },
      { status: 500 }
    )
  }
}

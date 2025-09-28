import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAccess } from '@/lib/auth-helpers'

// DELETE /api/users/assignments/[assignmentId] - Delete an assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    await requireAccess({ action: 'write', resource: 'user' })

    const { assignmentId } = await params

    // Try to find and delete user department assignment
    const userDepartment = await prisma.userDepartment.findUnique({
      where: { id: assignmentId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        department: {
          select: { id: true, name: true, code: true },
        },
      },
    })

    if (userDepartment) {
      await prisma.userDepartment.delete({
        where: { id: assignmentId },
      })

      return NextResponse.json({ 
        message: 'Department assignment deleted successfully',
        type: 'department',
        assignment: userDepartment
      })
    }

    // Try to find and delete user position assignment
    const userPosition = await prisma.userPosition.findUnique({
      where: { id: assignmentId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        position: {
          select: { 
            id: true, 
            name: true,
            department: {
              select: { id: true, name: true, code: true },
            },
          },
        },
      },
    })

    if (userPosition) {
      await prisma.userPosition.delete({
        where: { id: assignmentId },
      })

      return NextResponse.json({ 
        message: 'Position assignment deleted successfully',
        type: 'position',
        assignment: userPosition
      })
    }

    return NextResponse.json(
      { error: 'Assignment not found' },
      { status: 404 }
    )
  } catch (error) {
    console.error('Error deleting assignment:', error)
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to delete assignment' },
      { status: 500 }
    )
  }
}

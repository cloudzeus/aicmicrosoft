import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAccess } from '@/lib/auth-helpers'
import { z } from 'zod'

// Validation schemas
const updateDepartmentAssignmentSchema = z.object({
  isPrimary: z.boolean(),
})

// PUT /api/users/[userId]/departments/[departmentId] - Update user's department assignment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; departmentId: string }> }
) {
  try {
    await requireAccess({ action: 'write', resource: 'user' })

    const { userId, departmentId } = await params
    const body = await request.json()
    const validatedData = updateDepartmentAssignmentSchema.parse(body)

    // Check if user department assignment exists
    const existingAssignment = await prisma.userDepartment.findUnique({
      where: {
        userId_departmentId: {
          userId,
          departmentId,
        },
      },
    })

    if (!existingAssignment) {
      return NextResponse.json(
        { error: 'User department assignment not found' },
        { status: 404 }
      )
    }

    // If this is set as primary, unset other primary assignments
    if (validatedData.isPrimary && !existingAssignment.isPrimary) {
      await prisma.userDepartment.updateMany({
        where: {
          userId,
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      })
    }

    const userDepartment = await prisma.userDepartment.update({
      where: {
        userId_departmentId: {
          userId,
          departmentId,
        },
      },
      data: {
        isPrimary: validatedData.isPrimary,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
          },
        },
      },
    })

    return NextResponse.json({ userDepartment })
  } catch (error) {
    console.error('Error updating user department assignment:', error)
    
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
      { error: 'Failed to update user department assignment' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[userId]/departments/[departmentId] - Remove user from department
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; departmentId: string }> }
) {
  try {
    await requireAccess({ action: 'write', resource: 'user' })

    const { userId, departmentId } = await params

    // Check if user department assignment exists
    const existingAssignment = await prisma.userDepartment.findUnique({
      where: {
        userId_departmentId: {
          userId,
          departmentId,
        },
      },
    })

    if (!existingAssignment) {
      return NextResponse.json(
        { error: 'User department assignment not found' },
        { status: 404 }
      )
    }

    await prisma.userDepartment.delete({
      where: {
        userId_departmentId: {
          userId,
          departmentId,
        },
      },
    })

    return NextResponse.json({ message: 'User removed from department successfully' })
  } catch (error) {
    console.error('Error removing user from department:', error)
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to remove user from department' },
      { status: 500 }
    )
  }
}

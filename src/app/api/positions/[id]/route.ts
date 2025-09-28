import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAccess } from '@/lib/auth-helpers'
import { z } from 'zod'

// Validation schemas
const updatePositionSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  departmentId: z.string().min(1, 'Department ID is required').optional(),
})

// GET /api/positions/[id] - Get a specific position
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAccess({ action: 'read', resource: 'position' })

    const { id } = await params
    const position = await prisma.position.findUnique({
      where: { id },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
          },
        },
        userPositions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                jobTitle: true,
              },
            },
          },
        },
        _count: {
          select: {
            userPositions: true,
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

    return NextResponse.json({ position })
  } catch (error) {
    console.error('Error fetching position:', error)
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch position' },
      { status: 500 }
    )
  }
}

// PUT /api/positions/[id] - Update a position
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAccess({ action: 'write', resource: 'position' })

    const { id } = await params
    const body = await request.json()
    const validatedData = updatePositionSchema.parse(body)

    // Check if position exists
    const existingPosition = await prisma.position.findUnique({
      where: { id },
    })

    if (!existingPosition) {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      )
    }

    // Check if department exists if provided
    if (validatedData.departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: validatedData.departmentId },
      })

      if (!department) {
        return NextResponse.json(
          { error: 'Department not found' },
          { status: 400 }
        )
      }
    }

    // Check if position with same name already exists in the department
    if (validatedData.name || validatedData.departmentId) {
      const name = validatedData.name || existingPosition.name
      const departmentId = validatedData.departmentId || existingPosition.departmentId

      const duplicatePosition = await prisma.position.findFirst({
        where: {
          name,
          departmentId,
          id: { not: id },
        },
      })

      if (duplicatePosition) {
        return NextResponse.json(
          { error: 'Position with this name already exists in the department' },
          { status: 400 }
        )
      }
    }

    const position = await prisma.position.update({
      where: { id },
      data: validatedData,
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
          },
        },
        _count: {
          select: {
            userPositions: true,
          },
        },
      },
    })

    return NextResponse.json({ position })
  } catch (error) {
    console.error('Error updating position:', error)
    
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
      { error: 'Failed to update position' },
      { status: 500 }
    )
  }
}

// DELETE /api/positions/[id] - Delete a position
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAccess({ action: 'delete', resource: 'position' })

    const { id } = await params

    // Check if position exists
    const existingPosition = await prisma.position.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            userPositions: true,
          },
        },
      },
    })

    if (!existingPosition) {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      )
    }

    // Check if position has assigned users
    if (existingPosition._count.userPositions > 0) {
      return NextResponse.json(
        { error: 'Cannot delete position with assigned users' },
        { status: 400 }
      )
    }

    await prisma.position.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Position deleted successfully' })
  } catch (error) {
    console.error('Error deleting position:', error)
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to delete position' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAccess } from '@/lib/auth-helpers'
import { z } from 'zod'

// Validation schemas
const updateGroupSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').optional(),
  emailAddress: z.string().email('Invalid email format').optional(),
  description: z.string().optional(),
  groupType: z.enum(['SECURITY', 'DISTRIBUTION', 'UNIFIED', 'MICROSOFT365']).optional(),
})

// GET /api/departments/[departmentId]/groups/[id] - Get a specific group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ departmentId: string; id: string }> }
) {
  try {
    await requireAccess({ action: 'read', resource: 'group' })

    const { departmentId, id } = await params
    const group = await prisma.departmentGroup.findUnique({
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
      },
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    // Verify the group belongs to the specified department
    if (group.departmentId !== departmentId) {
      return NextResponse.json(
        { error: 'Group does not belong to the specified department' },
        { status: 400 }
      )
    }

    return NextResponse.json({ group })
  } catch (error) {
    console.error('Error fetching group:', error)
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch group' },
      { status: 500 }
    )
  }
}

// PUT /api/departments/[departmentId]/groups/[id] - Update a group
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ departmentId: string; id: string }> }
) {
  try {
    await requireAccess({ action: 'update', resource: 'group' })

    const { departmentId, id } = await params
    const body = await request.json()
    const validatedData = updateGroupSchema.parse(body)

    // Check if group exists and belongs to department
    const existingGroup = await prisma.departmentGroup.findUnique({
      where: { id },
    })

    if (!existingGroup) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    if (existingGroup.departmentId !== departmentId) {
      return NextResponse.json(
        { error: 'Group does not belong to the specified department' },
        { status: 400 }
      )
    }

    const group = await prisma.departmentGroup.update({
      where: { id },
      data: validatedData,
    })

    return NextResponse.json({ 
      group,
      message: 'Group updated successfully' 
    })
  } catch (error) {
    console.error('Error updating group:', error)
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update group' },
      { status: 500 }
    )
  }
}

// DELETE /api/departments/[departmentId]/groups/[id] - Delete a group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ departmentId: string; id: string }> }
) {
  try {
    await requireAccess({ action: 'delete', resource: 'group' })

    const { departmentId, id } = await params

    // Check if group exists and belongs to department
    const existingGroup = await prisma.departmentGroup.findUnique({
      where: { id },
    })

    if (!existingGroup) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    if (existingGroup.departmentId !== departmentId) {
      return NextResponse.json(
        { error: 'Group does not belong to the specified department' },
        { status: 400 }
      )
    }

    await prisma.departmentGroup.delete({
      where: { id },
    })

    return NextResponse.json({ 
      message: 'Group deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting group:', error)
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to delete group' },
      { status: 500 }
    )
  }
}

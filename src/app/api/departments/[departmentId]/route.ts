import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAccess } from '@/lib/auth-helpers'
import { z } from 'zod'

// Validation schemas
const updateDepartmentSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  code: z.string().min(1, 'Code is required').toUpperCase().optional(),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
  managerId: z.string().nullable().optional(),
})

// GET /api/departments/[departmentId] - Get a specific department
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ departmentId: string }> }
) {
  try {
    await requireAccess({ action: 'read', resource: 'department' })

    const { departmentId } = await params
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        parent: true,
        children: true,
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            jobTitle: true,
          },
        },
        positions: true,
        userDepartments: {
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
        sharePoints: true,
        _count: {
          select: {
            userDepartments: true,
            positions: true,
            sharePoints: true,
            children: true,
          },
        },
      },
    })

    if (!department) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ department })
  } catch (error) {
    console.error('Error fetching department:', error)
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch department' },
      { status: 500 }
    )
  }
}

// PUT /api/departments/[departmentId] - Update a department
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ departmentId: string }> }
) {
  try {
    await requireAccess({ action: 'write', resource: 'department' })

    const { departmentId } = await params
    const body = await request.json()
    const validatedData = updateDepartmentSchema.parse(body)

    // Check if department exists
    const existingDepartment = await prisma.department.findUnique({
      where: { id: departmentId },
    })

    if (!existingDepartment) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      )
    }

    // Check if code already exists (excluding current department)
    if (validatedData.code) {
      const codeExists = await prisma.department.findFirst({
        where: {
          code: validatedData.code,
          id: { not: departmentId },
        },
      })

      if (codeExists) {
        return NextResponse.json(
          { error: 'Department code already exists' },
          { status: 400 }
        )
      }
    }

    // Validate parent department exists if provided
    if (validatedData.parentId && validatedData.parentId !== null) {
      if (validatedData.parentId === departmentId) {
        return NextResponse.json(
          { error: 'Department cannot be its own parent' },
          { status: 400 }
        )
      }

      const parentDepartment = await prisma.department.findUnique({
        where: { id: validatedData.parentId },
      })

      if (!parentDepartment) {
        return NextResponse.json(
          { error: 'Parent department not found' },
          { status: 400 }
        )
      }

      // Check for circular references
      const isCircular = await checkCircularReference(departmentId, validatedData.parentId)
      if (isCircular) {
        return NextResponse.json(
          { error: 'Cannot set parent: would create circular reference' },
          { status: 400 }
        )
      }
    }

    // Validate manager exists if provided
    if (validatedData.managerId && validatedData.managerId !== null && validatedData.managerId !== '') {
      const manager = await prisma.user.findUnique({
        where: { id: validatedData.managerId },
      })

      if (!manager) {
        return NextResponse.json(
          { error: 'Manager not found' },
          { status: 400 }
        )
      }
    }

    const department = await prisma.department.update({
      where: { id: departmentId },
      data: validatedData,
      include: {
        parent: true,
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            jobTitle: true,
          },
        },
        _count: {
          select: {
            userDepartments: true,
            positions: true,
            sharePoints: true,
          },
        },
      },
    })

    return NextResponse.json({ department })
  } catch (error) {
    console.error('Error updating department:', error)
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update department' },
      { status: 500 }
    )
  }
}

// DELETE /api/departments/[departmentId] - Delete a department
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ departmentId: string }> }
) {
  try {
    await requireAccess({ action: 'delete', resource: 'department' })

    const { departmentId } = await params
    // Check if department exists
    const existingDepartment = await prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        _count: {
          select: {
            children: true,
            userDepartments: true,
            positions: true,
            sharePoints: true,
          },
        },
      },
    })

    if (!existingDepartment) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      )
    }

    // Check if department has children
    if (existingDepartment._count.children > 0) {
      return NextResponse.json(
        { error: 'Cannot delete department with child departments' },
        { status: 400 }
      )
    }

    // Check if department has users
    if (existingDepartment._count.userDepartments > 0) {
      return NextResponse.json(
        { error: 'Cannot delete department with assigned users' },
        { status: 400 }
      )
    }

    // Check if department has positions
    if (existingDepartment._count.positions > 0) {
      return NextResponse.json(
        { error: 'Cannot delete department with positions' },
        { status: 400 }
      )
    }

    // Check if department has SharePoint sites
    if (existingDepartment._count.sharePoints > 0) {
      return NextResponse.json(
        { error: 'Cannot delete department with SharePoint sites' },
        { status: 400 }
      )
    }

    await prisma.department.delete({
      where: { id: departmentId },
    })

    return NextResponse.json({ message: 'Department deleted successfully' })
  } catch (error) {
    console.error('Error deleting department:', error)
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to delete department' },
      { status: 500 }
    )
  }
}

// Helper function to check for circular references
async function checkCircularReference(departmentId: string, parentId: string): Promise<boolean> {
  let currentParentId = parentId
  
  while (currentParentId) {
    if (currentParentId === departmentId) {
      return true
    }
    
    const parent = await prisma.department.findUnique({
      where: { id: currentParentId },
      select: { parentId: true },
    })
    
    currentParentId = parent?.parentId || null
  }
  
  return false
}

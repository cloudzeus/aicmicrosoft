import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAccess } from '@/lib/auth-helpers'
import { z } from 'zod'

// Validation schemas
const assignDepartmentSchema = z.object({
  departmentId: z.string().min(1, 'Department ID is required'),
  isPrimary: z.boolean().default(false),
})

const updateDepartmentAssignmentSchema = z.object({
  isPrimary: z.boolean(),
})

// GET /api/users/[userId]/departments - Get user's department assignments
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

    const userDepartments = await prisma.userDepartment.findMany({
      where: { userId },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
            parent: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            manager: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: [
        { isPrimary: 'desc' },
        { assignedAt: 'desc' },
      ],
    })

    return NextResponse.json({ 
      user,
      userDepartments 
    })
  } catch (error) {
    console.error('Error fetching user departments:', error)
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch user departments' },
      { status: 500 }
    )
  }
}

// POST /api/users/[userId]/departments - Assign user to a department
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAccess({ action: 'write', resource: 'user' })

    const { userId } = await params
    const body = await request.json()
    const validatedData = assignDepartmentSchema.parse(body)

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

    // Check if department exists
    const department = await prisma.department.findUnique({
      where: { id: validatedData.departmentId },
      select: { id: true, name: true, code: true },
    })

    if (!department) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      )
    }

    // Check if user is already assigned to this department
    const existingAssignment = await prisma.userDepartment.findUnique({
      where: {
        userId_departmentId: {
          userId,
          departmentId: validatedData.departmentId,
        },
      },
    })

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'User is already assigned to this department' },
        { status: 400 }
      )
    }

    // If this is set as primary, unset other primary assignments
    if (validatedData.isPrimary) {
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

    const userDepartment = await prisma.userDepartment.create({
      data: {
        userId,
        departmentId: validatedData.departmentId,
        isPrimary: validatedData.isPrimary,
      },
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

    return NextResponse.json({ userDepartment }, { status: 201 })
  } catch (error) {
    console.error('Error assigning user to department:', error)
    
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
      { error: 'Failed to assign user to department' },
      { status: 500 }
    )
  }
}

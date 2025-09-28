import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAccess } from '@/lib/auth-helpers'
import { z } from 'zod'

// Validation schemas
const createAssignmentSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  departmentId: z.string().optional(),
  positionId: z.string().optional(),
  isPrimary: z.boolean().default(false),
})

// GET /api/users/assignments - Get user assignments overview
export async function GET(request: NextRequest) {
  try {
    await requireAccess({ action: 'read', resource: 'user' })

    const { searchParams } = new URL(request.url)
    const departmentId = searchParams.get('departmentId')
    const positionId = searchParams.get('positionId')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const where: Record<string, unknown> = {}
    
    if (departmentId) {
      where.userDepartments = {
        some: {
          departmentId,
        },
      }
    }
    
    if (positionId) {
      where.userPositions = {
        some: {
          positionId,
        },
      }
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        jobTitle: true,
        phone: true,
        mobile: true,
        extension: true,
        userDepartments: {
          include: {
            department: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        userPositions: {
          include: {
            position: {
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
            },
          },
        },
        managedDepartments: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    // Get statistics
    const stats = await prisma.$transaction([
      prisma.user.count(),
      prisma.userDepartment.count(),
      prisma.userPosition.count(),
      prisma.department.count(),
      prisma.position.count(),
      prisma.departmentSharePoint.count(),
    ])

    const [totalUsers, totalDeptAssignments, totalPositionAssignments, totalDepartments, totalPositions, totalSharePoints] = stats

    return NextResponse.json({ 
      users,
      statistics: {
        totalUsers,
        totalDeptAssignments,
        totalPositionAssignments,
        totalDepartments,
        totalPositions,
        totalSharePoints,
      }
    })
  } catch (error) {
    console.error('Error fetching user assignments:', error)
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch user assignments' },
      { status: 500 }
    )
  }
}

// POST /api/users/assignments - Create a new assignment
export async function POST(request: NextRequest) {
  try {
    await requireAccess({ action: 'write', resource: 'user' })

    const body = await request.json()
    const validatedData = createAssignmentSchema.parse(body)

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: validatedData.userId },
      select: { id: true, name: true, email: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (validatedData.departmentId) {
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
            userId: validatedData.userId,
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

      const userDepartment = await prisma.userDepartment.create({
        data: {
          userId: validatedData.userId,
          departmentId: validatedData.departmentId,
          isPrimary: validatedData.isPrimary,
        },
        include: {
          department: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      })

      return NextResponse.json({ userDepartment }, { status: 201 })
    }

    if (validatedData.positionId) {
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
            userId: validatedData.userId,
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
          userId: validatedData.userId,
          positionId: validatedData.positionId,
        },
        include: {
          position: {
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
          },
        },
      })

      return NextResponse.json({ userPosition }, { status: 201 })
    }

    return NextResponse.json(
      { error: 'Either departmentId or positionId must be provided' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error creating assignment:', error)
    
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
      { error: 'Failed to create assignment' },
      { status: 500 }
    )
  }
}
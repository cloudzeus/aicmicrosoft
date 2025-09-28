import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAccess } from '@/lib/auth-helpers'

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

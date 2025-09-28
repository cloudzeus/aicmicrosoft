import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }

    console.log('Testing data access for:', session.user.email, 'Role:', session.user.role)

    // Get departments count
    const departmentsCount = await prisma.department.count()
    const departments = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        isFromTenantSync: true,
        _count: {
          select: {
            userDepartments: true,
            positions: true,
            children: true
          }
        }
      },
      take: 5
    })

    // Get positions count
    const positionsCount = await prisma.position.count()
    const positions = await prisma.position.findMany({
      select: {
        id: true,
        name: true,
        departmentId: true,
        isFromTenantSync: true,
        _count: {
          select: {
            userPositions: true
          }
        }
      },
      take: 5
    })

    // Get users count
    const usersCount = await prisma.user.count()
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isFromTenantSync: true
      },
      take: 5
    })

    // Get assignments
    const userDepartmentsCount = await prisma.userDepartment.count()
    const userPositionsCount = await prisma.userPosition.count()

    return NextResponse.json({
      session: {
        email: session.user.email,
        role: session.user.role,
        hasAccessToken: !!session.accessToken
      },
      data: {
        departments: {
          count: departmentsCount,
          sample: departments
        },
        positions: {
          count: positionsCount,
          sample: positions
        },
        users: {
          count: usersCount,
          sample: users
        },
        assignments: {
          userDepartments: userDepartmentsCount,
          userPositions: userPositionsCount
        }
      }
    })
  } catch (error) {
    console.error('Error testing data:', error)
    return NextResponse.json(
      { error: 'Failed to test data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

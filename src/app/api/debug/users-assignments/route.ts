import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get all users with their assignments
    const users = await prisma.user.findMany({
      include: {
        userDepartments: {
          include: {
            department: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
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
                    code: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            userDepartments: true,
            userPositions: true
          }
        }
      }
    })

    // Get all departments and positions
    const departments = await prisma.department.findMany()
    const positions = await prisma.position.findMany()

    return NextResponse.json({
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        userDepartments: user.userDepartments,
        userPositions: user.userPositions,
        _count: user._count
      })),
      departments,
      positions,
      totalUsers: users.length,
      totalDepartments: departments.length,
      totalPositions: positions.length
    })
  } catch (error) {
    console.error('Error fetching debug data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch debug data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


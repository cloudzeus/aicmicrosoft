"use server"

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function getUsersWithAssignments() {
  try {
    const session = await auth()
    
    if (!session?.user) {
      throw new Error('Unauthorized')
    }

    // Get users from local database with assignments
    const users = await prisma.user.findMany({
      include: {
        userDepartments: {
          include: {
            department: {
              select: {
                id: true,
                name: true,
                code: true,
                description: true
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
                description: true,
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
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Get departments
    const departments = await prisma.department.findMany({
      orderBy: {
        name: 'asc'
      }
    })

    return {
      users,
      departments,
      success: true
    }
  } catch (error) {
    console.error('Error fetching users with assignments:', error)
    return {
      users: [],
      departments: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}


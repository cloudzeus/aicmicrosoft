"use server"

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function getDepartmentsWithData() {
  try {
    const session = await auth()
    
    if (!session?.user) {
      throw new Error('Unauthorized')
    }

    // Get departments with all related data
    const departments = await prisma.department.findMany({
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            jobTitle: true,
            tenantId: true
          }
        },
        positions: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        sharePoints: {
          select: {
            id: true,
            displayName: true,
            siteUrl: true,
            accessLevel: true
          }
        },
        _count: {
          select: {
            userDepartments: true,
            positions: true,
            sharePoints: true,
            children: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Get users with their position assignments
    const users = await prisma.user.findMany({
      include: {
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
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return {
      departments,
      users,
      success: true
    }
  } catch (error) {
    console.error('Error fetching departments with data:', error)
    return {
      departments: [],
      users: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}


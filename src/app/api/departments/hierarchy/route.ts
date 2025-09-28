import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAccess } from '@/lib/auth-helpers'

// GET /api/departments/hierarchy - Get department hierarchy
export async function GET(request: NextRequest) {
  try {
    await requireAccess({ action: 'read', resource: 'department' })

    // Get all departments with their parent-child relationships
    const departments = await prisma.department.findMany({
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
          },
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            children: true,
            userDepartments: true,
            positions: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    // Build hierarchy tree
    const buildHierarchy = (parentId: string | null = null): typeof departments => {
      return departments
        .filter(dept => dept.parentId === parentId)
        .map(dept => ({
          ...dept,
          children: buildHierarchy(dept.id),
        }))
    }

    const hierarchy = buildHierarchy()

    return NextResponse.json({ 
      departments: hierarchy,
      flatDepartments: departments 
    })
  } catch (error) {
    console.error('Error fetching department hierarchy:', error)
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch department hierarchy' },
      { status: 500 }
    )
  }
}

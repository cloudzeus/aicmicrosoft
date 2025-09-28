import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAccess } from '@/lib/auth-helpers'

// GET /api/sharepoints - List all SharePoint sites with optional filtering
export async function GET(request: NextRequest) {
  try {
    await requireAccess({ action: 'read', resource: 'sharepoint' })

    const { searchParams } = new URL(request.url)
    const departmentId = searchParams.get('departmentId')
    const accessLevel = searchParams.get('accessLevel')

    const where: Record<string, unknown> = {}
    
    if (departmentId) {
      where.departmentId = departmentId
    }
    
    if (accessLevel) {
      where.accessLevel = accessLevel
    }

    const sharePoints = await prisma.departmentSharePoint.findMany({
      where,
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
      orderBy: [
        { department: { name: 'asc' } },
        { displayName: 'asc' },
      ],
    })

    return NextResponse.json({ sharePoints })
  } catch (error) {
    console.error('Error fetching SharePoint sites:', error)
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch SharePoint sites' },
      { status: 500 }
    )
  }
}

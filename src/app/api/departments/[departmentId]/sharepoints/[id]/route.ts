import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAccess } from '@/lib/auth-helpers'
import { z } from 'zod'

// Validation schemas
const updateSharePointSchema = z.object({
  siteUrl: z.string().url('Invalid URL format').optional(),
  displayName: z.string().min(1, 'Display name is required').optional(),
  accessLevel: z.enum(['READ', 'CONTRIBUTE', 'OWNER']).optional(),
})

// GET /api/departments/[departmentId]/sharepoints/[id] - Get a specific SharePoint site
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ departmentId: string; id: string }> }
) {
  try {
    await requireAccess({ action: 'read', resource: 'sharepoint' })

    const { departmentId, id } = await params
    const sharePoint = await prisma.departmentSharePoint.findUnique({
      where: { id },
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

    if (!sharePoint) {
      return NextResponse.json(
        { error: 'SharePoint site not found' },
        { status: 404 }
      )
    }

    // Verify the SharePoint site belongs to the specified department
    if (sharePoint.departmentId !== departmentId) {
      return NextResponse.json(
        { error: 'SharePoint site does not belong to the specified department' },
        { status: 400 }
      )
    }

    return NextResponse.json({ sharePoint })
  } catch (error) {
    console.error('Error fetching SharePoint site:', error)
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch SharePoint site' },
      { status: 500 }
    )
  }
}

// PUT /api/departments/[departmentId]/sharepoints/[id] - Update a SharePoint site
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ departmentId: string; id: string }> }
) {
  try {
    await requireAccess({ action: 'write', resource: 'sharepoint' })

    const { departmentId, id } = await params
    const body = await request.json()
    const validatedData = updateSharePointSchema.parse(body)

    // Check if SharePoint site exists
    const existingSharePoint = await prisma.departmentSharePoint.findUnique({
      where: { id },
    })

    if (!existingSharePoint) {
      return NextResponse.json(
        { error: 'SharePoint site not found' },
        { status: 404 }
      )
    }

    // Verify the SharePoint site belongs to the specified department
    if (existingSharePoint.departmentId !== departmentId) {
      return NextResponse.json(
        { error: 'SharePoint site does not belong to the specified department' },
        { status: 400 }
      )
    }

    const sharePoint = await prisma.departmentSharePoint.update({
      where: { id },
      data: validatedData,
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

    return NextResponse.json({ sharePoint })
  } catch (error) {
    console.error('Error updating SharePoint site:', error)
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update SharePoint site' },
      { status: 500 }
    )
  }
}

// DELETE /api/departments/[departmentId]/sharepoints/[id] - Delete a SharePoint site
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ departmentId: string; id: string }> }
) {
  try {
    await requireAccess({ action: 'delete', resource: 'sharepoint' })

    const { departmentId, id } = await params

    // Check if SharePoint site exists
    const existingSharePoint = await prisma.departmentSharePoint.findUnique({
      where: { id },
    })

    if (!existingSharePoint) {
      return NextResponse.json(
        { error: 'SharePoint site not found' },
        { status: 404 }
      )
    }

    // Verify the SharePoint site belongs to the specified department
    if (existingSharePoint.departmentId !== departmentId) {
      return NextResponse.json(
        { error: 'SharePoint site does not belong to the specified department' },
        { status: 400 }
      )
    }

    await prisma.departmentSharePoint.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'SharePoint site deleted successfully' })
  } catch (error) {
    console.error('Error deleting SharePoint site:', error)
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to delete SharePoint site' },
      { status: 500 }
    )
  }
}

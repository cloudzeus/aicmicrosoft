import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAccess } from '@/lib/auth-helpers'
import { z } from 'zod'

// Validation schemas
const createSharePointSchema = z.object({
  siteId: z.string().min(1, 'Site ID is required'),
  siteUrl: z.string().url('Invalid URL format'),
  displayName: z.string().min(1, 'Display name is required'),
  accessLevel: z.enum(['READ', 'CONTRIBUTE', 'OWNER']).default('READ'),
})

const updateSharePointSchema = z.object({
  siteUrl: z.string().url('Invalid URL format').optional(),
  displayName: z.string().min(1, 'Display name is required').optional(),
  accessLevel: z.enum(['READ', 'CONTRIBUTE', 'OWNER']).optional(),
})

// GET /api/departments/[departmentId]/sharepoints - List SharePoint sites for a department
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ departmentId: string }> }
) {
  try {
    await requireAccess({ action: 'read', resource: 'sharepoint' })

    const { departmentId } = await params

    // Check if department exists
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { id: true, name: true, code: true },
    })

    if (!department) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      )
    }

    const sharePoints = await prisma.departmentSharePoint.findMany({
      where: { departmentId },
      orderBy: { displayName: 'asc' },
    })

    return NextResponse.json({ 
      department,
      sharePoints 
    })
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

// POST /api/departments/[departmentId]/sharepoints - Create a new SharePoint site
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ departmentId: string }> }
) {
  try {
    await requireAccess({ action: 'write', resource: 'sharepoint' })

    const { departmentId } = await params
    const body = await request.json()
    const validatedData = createSharePointSchema.parse(body)

    // Check if department exists
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { id: true, name: true, code: true },
    })

    if (!department) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      )
    }

    // Check if site ID already exists
    const existingSharePoint = await prisma.departmentSharePoint.findUnique({
      where: { siteId: validatedData.siteId },
    })

    if (existingSharePoint) {
      return NextResponse.json(
        { error: 'SharePoint site ID already exists' },
        { status: 400 }
      )
    }

    const sharePoint = await prisma.departmentSharePoint.create({
      data: {
        ...validatedData,
        departmentId,
      },
    })

    return NextResponse.json({ sharePoint }, { status: 201 })
  } catch (error) {
    console.error('Error creating SharePoint site:', error)
    
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
      { error: 'Failed to create SharePoint site' },
      { status: 500 }
    )
  }
}

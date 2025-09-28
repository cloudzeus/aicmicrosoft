import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAccess } from '@/lib/auth-helpers'
import { z } from 'zod'

// Validation schemas
const createGroupSchema = z.object({
  groupId: z.string().min(1, 'Group ID is required'),
  displayName: z.string().min(1, 'Display name is required'),
  emailAddress: z.string().email('Invalid email format').optional(),
  description: z.string().optional(),
  groupType: z.enum(['SECURITY', 'DISTRIBUTION', 'UNIFIED', 'MICROSOFT365']).default('SECURITY'),
})

const updateGroupSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').optional(),
  emailAddress: z.string().email('Invalid email format').optional(),
  description: z.string().optional(),
  groupType: z.enum(['SECURITY', 'DISTRIBUTION', 'UNIFIED', 'MICROSOFT365']).optional(),
})

// GET /api/departments/[departmentId]/groups - List groups for a department
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ departmentId: string }> }
) {
  try {
    await requireAccess({ action: 'read', resource: 'group' })

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

    const groups = await prisma.departmentGroup.findMany({
      where: { departmentId },
      orderBy: { displayName: 'asc' },
    })

    return NextResponse.json({ 
      department,
      groups 
    })
  } catch (error) {
    console.error('Error fetching groups:', error)
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    )
  }
}

// POST /api/departments/[departmentId]/groups - Create a new group
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ departmentId: string }> }
) {
  try {
    await requireAccess({ action: 'create', resource: 'group' })

    const { departmentId } = await params
    const body = await request.json()
    const validatedData = createGroupSchema.parse(body)

    // Check if department exists
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { id: true, name: true },
    })

    if (!department) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      )
    }

    // Check if group already exists
    const existingGroup = await prisma.departmentGroup.findUnique({
      where: { groupId: validatedData.groupId },
    })

    if (existingGroup) {
      return NextResponse.json(
        { error: 'Group already exists' },
        { status: 400 }
      )
    }

    const group = await prisma.departmentGroup.create({
      data: {
        ...validatedData,
        departmentId,
      },
    })

    return NextResponse.json({ 
      group,
      message: 'Group created successfully' 
    })
  } catch (error) {
    console.error('Error creating group:', error)
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    )
  }
}

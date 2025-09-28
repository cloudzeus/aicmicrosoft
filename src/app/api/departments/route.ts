import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAccess } from '@/lib/auth-helpers'
import { z } from 'zod'

// Validation schemas
const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required').toUpperCase(),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
  managerId: z.string().nullable().optional(),
})

const updateDepartmentSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  code: z.string().min(1, 'Code is required').toUpperCase().optional(),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
  managerId: z.string().nullable().optional(),
})

// GET /api/departments - List all departments with optional filtering
export async function GET(request: NextRequest) {
  try {
    await requireAccess({ action: 'read', resource: 'department' })

    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get('parentId')
    const includeChildren = searchParams.get('includeChildren') === 'true'
    const includeManager = searchParams.get('includeManager') === 'true'
    const includePositions = searchParams.get('includePositions') === 'true'

    const where = parentId ? { parentId } : undefined

    const departments = await prisma.department.findMany({
      where,
      include: {
        parent: true,
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            jobTitle: true,
          },
        },
        children: includeChildren,
        positions: includePositions,
        _count: {
          select: {
            userDepartments: true,
            positions: true,
            sharePoints: true,
            children: true,
          },
        },
      },
      orderBy: [
        { name: 'asc' },
      ],
    })

    return NextResponse.json({ departments })
  } catch (error) {
    console.error('Error fetching departments:', error)
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch departments' },
      { status: 500 }
    )
  }
}

// POST /api/departments - Create a new department
export async function POST(request: NextRequest) {
  try {
    await requireAccess({ action: 'write', resource: 'department' })

    const body = await request.json()
    const validatedData = createDepartmentSchema.parse(body)

    // Check if code already exists
    const existingDepartment = await prisma.department.findUnique({
      where: { code: validatedData.code },
    })

    if (existingDepartment) {
      return NextResponse.json(
        { error: 'Department code already exists' },
        { status: 400 }
      )
    }

    // Validate parent department exists if provided
    if (validatedData.parentId && validatedData.parentId !== null) {
      const parentDepartment = await prisma.department.findUnique({
        where: { id: validatedData.parentId },
      })

      if (!parentDepartment) {
        return NextResponse.json(
          { error: 'Parent department not found' },
          { status: 400 }
        )
      }
    }

    // Validate manager exists if provided
    if (validatedData.managerId && validatedData.managerId !== null && validatedData.managerId !== '') {
      const manager = await prisma.user.findUnique({
        where: { id: validatedData.managerId },
      })

      if (!manager) {
        return NextResponse.json(
          { error: 'Manager not found' },
          { status: 400 }
        )
      }
    }

    const department = await prisma.department.create({
      data: validatedData,
      include: {
        parent: true,
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            jobTitle: true,
          },
        },
        _count: {
          select: {
            userDepartments: true,
            positions: true,
            sharePoints: true,
          },
        },
      },
    })

    return NextResponse.json({ department }, { status: 201 })
  } catch (error) {
    console.error('Error creating department:', error)
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create department' },
      { status: 500 }
    )
  }
}

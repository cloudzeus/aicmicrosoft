import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAccess } from '@/lib/auth-helpers'
import { z } from 'zod'

// Validation schemas
const createPositionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  departmentId: z.string().min(1, 'Department ID is required'),
})

const updatePositionSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  departmentId: z.string().min(1, 'Department ID is required').optional(),
})

// GET /api/positions - List all positions with optional filtering
export async function GET(request: NextRequest) {
  try {
    await requireAccess({ action: 'read', resource: 'position' })

    const { searchParams } = new URL(request.url)
    const departmentId = searchParams.get('departmentId')
    const includeUsers = searchParams.get('includeUsers') === 'true'

    const where = departmentId ? { departmentId } : undefined

    const positions = await prisma.position.findMany({
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
        userPositions: includeUsers ? {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                jobTitle: true,
              },
            },
          },
        } : false,
        _count: {
          select: {
            userPositions: true,
          },
        },
      },
      orderBy: [
        { department: { name: 'asc' } },
        { name: 'asc' },
      ],
    })

    return NextResponse.json({ positions })
  } catch (error) {
    console.error('Error fetching positions:', error)
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch positions' },
      { status: 500 }
    )
  }
}

// POST /api/positions - Create a new position
export async function POST(request: NextRequest) {
  try {
    await requireAccess({ action: 'write', resource: 'position' })

    const body = await request.json()
    const validatedData = createPositionSchema.parse(body)

    // Check if department exists
    const department = await prisma.department.findUnique({
      where: { id: validatedData.departmentId },
    })

    if (!department) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 400 }
      )
    }

    // Check if position with same name already exists in the department
    const existingPosition = await prisma.position.findFirst({
      where: {
        name: validatedData.name,
        departmentId: validatedData.departmentId,
      },
    })

    if (existingPosition) {
      return NextResponse.json(
        { error: 'Position with this name already exists in the department' },
        { status: 400 }
      )
    }

    const position = await prisma.position.create({
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
        _count: {
          select: {
            userPositions: true,
          },
        },
      },
    })

    return NextResponse.json({ position }, { status: 201 })
  } catch (error) {
    console.error('Error creating position:', error)
    
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
      { error: 'Failed to create position' },
      { status: 500 }
    )
  }
}

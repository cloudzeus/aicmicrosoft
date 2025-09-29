import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAccess } from '@/lib/auth-helpers'
import { z } from 'zod'

// Validation schemas
const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  extension: z.string().optional(),
  jobTitle: z.string().optional(),
  officeLocation: z.string().optional(),
  role: z.enum(['USER', 'ADMIN', 'MANAGER']).optional(),
})

// GET /api/users/[userId] - Get a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAccess({ action: 'read', resource: 'user' })

    const { userId } = await params

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userDepartments: {
          include: {
            department: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
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
                    code: true,
                  },
                },
              },
            },
          },
        },
        managedDepartments: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error fetching user:', error)
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PUT /api/users/[userId] - Update a user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAccess({ action: 'write', resource: 'user' })

    const { userId } = await params
    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, isFromTenantSync: true },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if email is being changed and if it already exists
    if (validatedData.email && validatedData.email !== existingUser.email) {
      if (existingUser.isFromTenantSync) {
        return NextResponse.json(
          { error: 'Cannot change email for Office 365 synced users' },
          { status: 400 }
        )
      }

      const emailExists = await prisma.user.findUnique({
        where: { email: validatedData.email },
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        )
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: validatedData,
      include: {
        userDepartments: {
          include: {
            department: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
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
                    code: true,
                  },
                },
              },
            },
          },
        },
        managedDepartments: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error updating user:', error)
    
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
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[userId] - Delete a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAccess({ action: 'delete', resource: 'user' })

    const { userId } = await params

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        isFromTenantSync: true,
        _count: {
          select: {
            userDepartments: true,
            userPositions: true,
            managedDepartments: true,
          },
        },
      },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user is from tenant sync
    if (existingUser.isFromTenantSync) {
      return NextResponse.json(
        { error: 'Cannot delete Office 365 synced users' },
        { status: 400 }
      )
    }

    // Check if user has assignments
    if (existingUser._count.userDepartments > 0 || 
        existingUser._count.userPositions > 0 || 
        existingUser._count.managedDepartments > 0) {
      return NextResponse.json(
        { error: 'Cannot delete user with existing assignments' },
        { status: 400 }
      )
    }

    await prisma.user.delete({
      where: { id: userId },
    })

    return NextResponse.json({ 
      message: 'User deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}

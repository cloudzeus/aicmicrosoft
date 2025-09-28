import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAccess } from '@/lib/auth-helpers'
import { z } from 'zod'

// Validation schemas
const updateMailboxSchema = z.object({
  emailAddress: z.string().email('Invalid email format').optional(),
  displayName: z.string().min(1, 'Display name is required').optional(),
  accessLevel: z.enum(['READ', 'CONTRIBUTE', 'OWNER']).optional(),
})

// GET /api/departments/[departmentId]/mailboxes/[id] - Get a specific mailbox
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ departmentId: string; id: string }> }
) {
  try {
    await requireAccess({ action: 'read', resource: 'mailbox' })

    const { departmentId, id } = await params
    const mailbox = await prisma.departmentMailbox.findUnique({
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

    if (!mailbox) {
      return NextResponse.json(
        { error: 'Mailbox not found' },
        { status: 404 }
      )
    }

    // Verify the mailbox belongs to the specified department
    if (mailbox.departmentId !== departmentId) {
      return NextResponse.json(
        { error: 'Mailbox does not belong to the specified department' },
        { status: 400 }
      )
    }

    return NextResponse.json({ mailbox })
  } catch (error) {
    console.error('Error fetching mailbox:', error)
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch mailbox' },
      { status: 500 }
    )
  }
}

// PUT /api/departments/[departmentId]/mailboxes/[id] - Update a mailbox
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ departmentId: string; id: string }> }
) {
  try {
    await requireAccess({ action: 'update', resource: 'mailbox' })

    const { departmentId, id } = await params
    const body = await request.json()
    const validatedData = updateMailboxSchema.parse(body)

    // Check if mailbox exists and belongs to department
    const existingMailbox = await prisma.departmentMailbox.findUnique({
      where: { id },
    })

    if (!existingMailbox) {
      return NextResponse.json(
        { error: 'Mailbox not found' },
        { status: 404 }
      )
    }

    if (existingMailbox.departmentId !== departmentId) {
      return NextResponse.json(
        { error: 'Mailbox does not belong to the specified department' },
        { status: 400 }
      )
    }

    const mailbox = await prisma.departmentMailbox.update({
      where: { id },
      data: validatedData,
    })

    return NextResponse.json({ 
      mailbox,
      message: 'Mailbox updated successfully' 
    })
  } catch (error) {
    console.error('Error updating mailbox:', error)
    
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
      { error: 'Failed to update mailbox' },
      { status: 500 }
    )
  }
}

// DELETE /api/departments/[departmentId]/mailboxes/[id] - Delete a mailbox
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ departmentId: string; id: string }> }
) {
  try {
    await requireAccess({ action: 'delete', resource: 'mailbox' })

    const { departmentId, id } = await params

    // Check if mailbox exists and belongs to department
    const existingMailbox = await prisma.departmentMailbox.findUnique({
      where: { id },
    })

    if (!existingMailbox) {
      return NextResponse.json(
        { error: 'Mailbox not found' },
        { status: 404 }
      )
    }

    if (existingMailbox.departmentId !== departmentId) {
      return NextResponse.json(
        { error: 'Mailbox does not belong to the specified department' },
        { status: 400 }
      )
    }

    await prisma.departmentMailbox.delete({
      where: { id },
    })

    return NextResponse.json({ 
      message: 'Mailbox deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting mailbox:', error)
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to delete mailbox' },
      { status: 500 }
    )
  }
}

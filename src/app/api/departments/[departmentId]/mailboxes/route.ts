import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAccess } from '@/lib/auth-helpers'
import { z } from 'zod'

// Validation schemas
const createMailboxSchema = z.object({
  mailboxId: z.string().min(1, 'Mailbox ID is required'),
  emailAddress: z.string().email('Invalid email format'),
  displayName: z.string().min(1, 'Display name is required'),
  accessLevel: z.enum(['READ', 'CONTRIBUTE', 'OWNER']).default('READ'),
})

const updateMailboxSchema = z.object({
  emailAddress: z.string().email('Invalid email format').optional(),
  displayName: z.string().min(1, 'Display name is required').optional(),
  accessLevel: z.enum(['READ', 'CONTRIBUTE', 'OWNER']).optional(),
})

// GET /api/departments/[departmentId]/mailboxes - List mailboxes for a department
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ departmentId: string }> }
) {
  try {
    await requireAccess({ action: 'read', resource: 'mailbox' })

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

    const mailboxes = await prisma.departmentMailbox.findMany({
      where: { departmentId },
      orderBy: { displayName: 'asc' },
    })

    return NextResponse.json({ 
      department,
      mailboxes 
    })
  } catch (error) {
    console.error('Error fetching mailboxes:', error)
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch mailboxes' },
      { status: 500 }
    )
  }
}

// POST /api/departments/[departmentId]/mailboxes - Create a new mailbox
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ departmentId: string }> }
) {
  try {
    await requireAccess({ action: 'create', resource: 'mailbox' })

    const { departmentId } = await params
    const body = await request.json()
    const validatedData = createMailboxSchema.parse(body)

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

    // Check if mailbox already exists
    const existingMailbox = await prisma.departmentMailbox.findUnique({
      where: { mailboxId: validatedData.mailboxId },
    })

    if (existingMailbox) {
      return NextResponse.json(
        { error: 'Mailbox already exists' },
        { status: 400 }
      )
    }

    const mailbox = await prisma.departmentMailbox.create({
      data: {
        ...validatedData,
        departmentId,
      },
    })

    return NextResponse.json({ 
      mailbox,
      message: 'Mailbox created successfully' 
    })
  } catch (error) {
    console.error('Error creating mailbox:', error)
    
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
      { error: 'Failed to create mailbox' },
      { status: 500 }
    )
  }
}

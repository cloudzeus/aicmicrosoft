import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAccess } from "@/lib/auth-helpers"
import { z } from "zod"

const createTodoSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().datetime().optional(),
  assignedTo: z.string().min(1, 'Assigned user is required'),
})

const getTodosSchema = z.object({
  assignedTo: z.string().optional(),
  createdBy: z.string().optional(),
  completed: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
})

// GET /api/todos - Get todos
export async function GET(request: NextRequest) {
  try {
    await requireAccess({ action: 'read', resource: 'user' })

    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    const validatedQuery = getTodosSchema.parse(query)

    const where: any = {}
    
    if (validatedQuery.assignedTo) {
      where.assignedTo = validatedQuery.assignedTo
    }
    
    if (validatedQuery.createdBy) {
      where.createdBy = validatedQuery.createdBy
    }
    
    if (validatedQuery.completed !== undefined) {
      where.completed = validatedQuery.completed === 'true'
    }
    
    if (validatedQuery.priority) {
      where.priority = validatedQuery.priority
    }

    const todos = await prisma.todo.findMany({
      where,
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: [
        { completed: 'asc' },
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({ todos })
  } catch (error) {
    console.error('Error fetching todos:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch todos' },
      { status: 500 }
    )
  }
}

// POST /api/todos - Create a new todo
export async function POST(request: NextRequest) {
  try {
    await requireAccess({ action: 'create', resource: 'user' })

    const body = await request.json()
    const validatedData = createTodoSchema.parse(body)

    // Verify assigned user exists
    const assignedUser = await prisma.user.findUnique({
      where: { id: validatedData.assignedTo },
      select: { id: true, name: true, email: true }
    })

    if (!assignedUser) {
      return NextResponse.json(
        { error: 'Assigned user not found' },
        { status: 404 }
      )
    }

    // Get current user for createdBy
    const currentUser = await requireAccess({ action: 'read', resource: 'user' })

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Current user not found' },
        { status: 404 }
      )
    }

    const todo = await prisma.todo.create({
      data: {
        ...validatedData,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        createdBy: currentUser.id,
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    return NextResponse.json({ todo }, { status: 201 })
  } catch (error) {
    console.error('Error creating todo:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create todo' },
      { status: 500 }
    )
  }
}

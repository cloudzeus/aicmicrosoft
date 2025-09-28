import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAccess } from "@/lib/auth-helpers"
import { z } from "zod"

const updateTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  completed: z.boolean().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().datetime().optional(),
  assignedTo: z.string().min(1, 'Assigned user is required').optional(),
})

// GET /api/todos/[todoId] - Get a specific todo
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ todoId: string }> }
) {
  try {
    await requireAccess({ action: 'read', resource: 'user' })

    const { todoId } = await params

    const todo = await prisma.todo.findUnique({
      where: { id: todoId },
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

    if (!todo) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ todo })
  } catch (error) {
    console.error('Error fetching todo:', error)
    return NextResponse.json(
      { error: 'Failed to fetch todo' },
      { status: 500 }
    )
  }
}

// PATCH /api/todos/[todoId] - Update a todo
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ todoId: string }> }
) {
  try {
    await requireAccess({ action: 'update', resource: 'user' })

    const { todoId } = await params
    const body = await request.json()
    const validatedData = updateTodoSchema.parse(body)

    // Check if todo exists
    const existingTodo = await prisma.todo.findUnique({
      where: { id: todoId },
      select: { id: true, assignedTo: true, createdBy: true }
    })

    if (!existingTodo) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      )
    }

    // Get current user
    const currentUser = await requireAccess({ action: 'read', resource: 'user' })

    // Check permissions: user can update if they created it, are assigned to it, or are admin
    const canUpdate = 
      existingTodo.createdBy === currentUser.id ||
      existingTodo.assignedTo === currentUser.id ||
      currentUser.role === 'ADMIN'

    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Insufficient permissions to update this todo' },
        { status: 403 }
      )
    }

    // If changing assignedTo, verify the new user exists
    if (validatedData.assignedTo) {
      const assignedUser = await prisma.user.findUnique({
        where: { id: validatedData.assignedTo },
        select: { id: true }
      })

      if (!assignedUser) {
        return NextResponse.json(
          { error: 'Assigned user not found' },
          { status: 404 }
        )
      }
    }

    const updateData: any = { ...validatedData }
    if (validatedData.dueDate) {
      updateData.dueDate = new Date(validatedData.dueDate)
    }

    const todo = await prisma.todo.update({
      where: { id: todoId },
      data: updateData,
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

    return NextResponse.json({ todo })
  } catch (error) {
    console.error('Error updating todo:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update todo' },
      { status: 500 }
    )
  }
}

// DELETE /api/todos/[todoId] - Delete a todo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ todoId: string }> }
) {
  try {
    await requireAccess({ action: 'delete', resource: 'user' })

    const { todoId } = await params

    // Check if todo exists
    const existingTodo = await prisma.todo.findUnique({
      where: { id: todoId },
      select: { id: true, createdBy: true }
    })

    if (!existingTodo) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      )
    }

    // Get current user
    const currentUser = await requireAccess({ action: 'read', resource: 'user' })

    // Check permissions: user can delete if they created it or are admin
    const canDelete = 
      existingTodo.createdBy === currentUser.id ||
      currentUser.role === 'ADMIN'

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete this todo' },
        { status: 403 }
      )
    }

    await prisma.todo.delete({
      where: { id: todoId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting todo:', error)
    return NextResponse.json(
      { error: 'Failed to delete todo' },
      { status: 500 }
    )
  }
}

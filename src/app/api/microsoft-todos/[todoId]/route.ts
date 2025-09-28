import { NextRequest, NextResponse } from "next/server"
import { requireAccess } from "@/lib/auth-helpers"
import { graphAPI } from "@/lib/microsoft-graph"
import { z } from "zod"

const updateTodoSchema = z.object({
  status: z.enum(['notStarted', 'inProgress', 'completed', 'waitingOnOthers', 'deferred']).optional(),
  title: z.string().min(1, 'Title is required').optional(),
  importance: z.enum(['low', 'normal', 'high']).optional(),
  dueDateTime: z.string().datetime().optional(),
  body: z.object({
    content: z.string(),
    contentType: z.enum(['text', 'html']).default('text')
  }).optional(),
})

// GET /api/microsoft-todos/[todoId] - Get a specific Microsoft To Do item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ todoId: string }> }
) {
  try {
    await requireAccess({ action: 'read', resource: 'user' })

    const { todoId } = await params
    const { searchParams } = new URL(request.url)
    const listId = searchParams.get('listId') || 'default'

    const todo = await graphAPI.getToDoTask(listId, todoId)

    return NextResponse.json({ todo })
  } catch (error) {
    console.error('Error fetching Microsoft To Do item:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Microsoft To Do item' },
      { status: 500 }
    )
  }
}

// PATCH /api/microsoft-todos/[todoId] - Update a Microsoft To Do item
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ todoId: string }> }
) {
  try {
    await requireAccess({ action: 'update', resource: 'user' })

    const { todoId } = await params
    const body = await request.json()
    const validatedData = updateTodoSchema.parse(body)

    const { searchParams } = new URL(request.url)
    const listId = searchParams.get('listId') || 'default'

    const todo = await graphAPI.updateToDoTask(listId, todoId, validatedData)

    return NextResponse.json({ todo })
  } catch (error) {
    console.error('Error updating Microsoft To Do item:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update Microsoft To Do item' },
      { status: 500 }
    )
  }
}

// DELETE /api/microsoft-todos/[todoId] - Delete a Microsoft To Do item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ todoId: string }> }
) {
  try {
    await requireAccess({ action: 'delete', resource: 'user' })

    const { todoId } = await params
    const { searchParams } = new URL(request.url)
    const listId = searchParams.get('listId') || 'default'

    await graphAPI.deleteToDoTask(listId, todoId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting Microsoft To Do item:', error)
    return NextResponse.json(
      { error: 'Failed to delete Microsoft To Do item' },
      { status: 500 }
    )
  }
}

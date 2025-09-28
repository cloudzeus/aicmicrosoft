import { NextRequest, NextResponse } from "next/server"
import { requireAccess } from "@/lib/auth-helpers"
import { graphAPI } from "@/lib/microsoft-graph"

// GET /api/microsoft-todos - Get Microsoft To Do items
export async function GET(request: NextRequest) {
  try {
    await requireAccess({ action: 'read', resource: 'user' })

    const { searchParams } = new URL(request.url)
    const listId = searchParams.get('listId') || 'default'
    const filter = searchParams.get('filter') || ''

    // Get Microsoft To Do tasks
    const todos = await graphAPI.getToDoTasks(listId, filter)

    return NextResponse.json({ todos })
  } catch (error) {
    console.error('Error fetching Microsoft To Do items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Microsoft To Do items' },
      { status: 500 }
    )
  }
}

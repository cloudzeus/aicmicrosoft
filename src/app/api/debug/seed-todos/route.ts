import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAccess } from "@/lib/auth-helpers"

export async function POST(request: NextRequest) {
  try {
    await requireAccess({ action: 'admin', resource: 'user' })

    // Get all users to assign todos to
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true }
    })

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'No users found to assign todos to' },
        { status: 400 }
      )
    }

    // Create sample todos
    const sampleTodos = [
      {
        title: "Review quarterly reports",
        description: "Analyze Q4 performance metrics and prepare summary for management",
        priority: "HIGH" as const,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        assignedTo: users[0].id,
        createdBy: users[0].id,
      },
      {
        title: "Update user documentation",
        description: "Revise the user manual with latest feature changes",
        priority: "MEDIUM" as const,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        assignedTo: users[0].id,
        createdBy: users[0].id,
      },
      {
        title: "Fix critical security vulnerability",
        description: "Address the security issue reported in the authentication system",
        priority: "URGENT" as const,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        assignedTo: users[0].id,
        createdBy: users[0].id,
      },
      {
        title: "Plan team building event",
        description: "Organize quarterly team building activity for the department",
        priority: "LOW" as const,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        assignedTo: users[0].id,
        createdBy: users[0].id,
      },
      {
        title: "Complete training module",
        description: "Finish the mandatory compliance training before deadline",
        priority: "MEDIUM" as const,
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago (overdue)
        assignedTo: users[0].id,
        createdBy: users[0].id,
      },
      {
        title: "Update project status",
        description: "Send weekly project update to stakeholders",
        priority: "MEDIUM" as const,
        assignedTo: users[0].id,
        createdBy: users[0].id,
        completed: true,
      },
    ]

    // Create todos
    const createdTodos = await prisma.todo.createMany({
      data: sampleTodos
    })

    return NextResponse.json({ 
      message: `Created ${createdTodos.count} sample todos`,
      todos: createdTodos.count
    })
  } catch (error) {
    console.error('Error seeding todos:', error)
    return NextResponse.json(
      { error: 'Failed to seed todos' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'
import { requireAccess } from '@/lib/auth-helpers'

export async function GET() {
  try {
    await requireAccess({ action: 'read', resource: 'user' })

    // Get users from local database only
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        jobTitle: true,
        role: true,
      },
      orderBy: {
        name: 'asc'
      }
    })

    console.log(`Found ${users.length} local users`)

    return NextResponse.json({
      users: users,
      total: users.length,
      message: "Local users fetched successfully"
    })

  } catch (error) {
    console.error("Error fetching local users:", error)
    return NextResponse.json(
      { error: "Failed to fetch users", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}



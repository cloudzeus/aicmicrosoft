import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { graphAPI } from '@/lib/microsoft-graph'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user || !session.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    console.log("Fetching mailboxes for:", session.user.email)

    // For now, we'll return a mock list of mailboxes
    // In a real implementation, you would fetch from Microsoft Graph
    const mailboxes = [
      {
        id: "mailbox-1",
        displayName: "IT Department Mailbox",
        emailAddress: "it@company.com",
        description: "IT Department shared mailbox"
      },
      {
        id: "mailbox-2", 
        displayName: "HR Department Mailbox",
        emailAddress: "hr@company.com",
        description: "HR Department shared mailbox"
      },
      {
        id: "mailbox-3",
        displayName: "Finance Department Mailbox", 
        emailAddress: "finance@company.com",
        description: "Finance Department shared mailbox"
      }
    ]

    console.log(`Found ${mailboxes.length} mailboxes`)

    return NextResponse.json({
      mailboxes: mailboxes,
      total: mailboxes.length,
      message: "Mailboxes fetched successfully"
    })

  } catch (error) {
    console.error("Error fetching mailboxes:", error)
    return NextResponse.json(
      { error: "Failed to fetch mailboxes", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

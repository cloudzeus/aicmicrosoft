import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { graphAPI } from '@/lib/microsoft-graph'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    console.log("Fetching mailboxes for:", session.user.email)

    try {
      // Fetch real shared mailboxes from Microsoft Graph
      const sharedMailboxes = await graphAPI.getSharedMailboxesIAmMember()
      
      // Also fetch groups that might be mail-enabled
      const groups = await graphAPI.getMyGroups()
      const mailEnabledGroups = groups.filter(g => g.mailEnabled && g.mail)
      
      // Combine shared mailboxes and mail-enabled groups
      const allMailboxes = [
        ...sharedMailboxes.map(mb => ({
          id: mb.id,
          displayName: mb.displayName,
          emailAddress: mb.mail || mb.displayName,
          description: `Shared mailbox: ${mb.displayName}`
        })),
        ...mailEnabledGroups.map(g => ({
          id: g.id,
          displayName: g.displayName,
          emailAddress: g.mail || g.displayName,
          description: `Mail-enabled group: ${g.displayName}`
        }))
      ]

      console.log(`Found ${allMailboxes.length} mailboxes (${sharedMailboxes.length} shared + ${mailEnabledGroups.length} groups)`)

      return NextResponse.json({
        mailboxes: allMailboxes,
        total: allMailboxes.length,
        message: "Mailboxes fetched successfully"
      })
    } catch (error) {
      console.error("Error fetching real mailboxes, falling back to sample data:", error)
      
      // Fallback to sample data if Microsoft Graph fails
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

      return NextResponse.json({
        mailboxes: mailboxes,
        total: mailboxes.length,
        message: "Using sample data - Microsoft Graph unavailable"
      })
    }

  } catch (error) {
    console.error("Error fetching mailboxes:", error)
    return NextResponse.json(
      { error: "Failed to fetch mailboxes", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

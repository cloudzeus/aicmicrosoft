import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { graphAPI } from "@/lib/microsoft-graph"
import { PrismaClient } from "@prisma/client"

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    console.log("Emails API: Starting request")
    const session = await auth()
    
    if (!session?.user) {
      console.log("Emails API: No session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Emails API: Session found for user:", session.user.email)
    console.log("Emails API: Access token available:", !!session.accessToken)

    // Ensure user exists in database (upsert)
    const user = await prisma.user.upsert({
      where: { email: session.user.email! },
      update: {},
      create: {
        email: session.user.email!,
        name: session.user.name,
        image: session.user.image,
        role: 'USER'
      }
    })
    
    console.log("Emails API: User ID:", user.id)

    // Get pagination parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '200')
    const offset = (page - 1) * limit

    console.log(`Emails API: Page ${page}, Limit ${limit}, Offset ${offset}`)

    // Always fetch from Microsoft Graph for live, correct ordering
    const folder = (searchParams.get('folder') || 'INBOX').toUpperCase()
    const folderId = searchParams.get('folderId') || undefined
    const nextLink = searchParams.get('nextLink') || undefined
    console.log(`Emails API: Fetching from Graph (folder ${folder}, top ${limit}, folderId ${folderId || 'none'})`)
    const { value: graphEmails, nextLink: serverNextLink } = await graphAPI.getMessages(folder, limit, nextLink, folderId)
    const emails = graphEmails.map((graphEmail: {
      id: string;
      subject?: string;
      from?: { emailAddress?: { address?: string } };
      toRecipients?: Array<{ emailAddress?: { address?: string } }>;
      body?: { contentType?: string; content?: string };
      receivedDateTime: string;
      isRead?: boolean;
      importance?: string;
      hasAttachments?: boolean;
    }) => ({
      id: graphEmail.id,
      messageId: graphEmail.id,
      subject: (graphEmail.subject || 'No Subject'),
      sender: (graphEmail.from?.emailAddress?.address || 'Unknown Sender'),
      recipient: (graphEmail.toRecipients?.[0]?.emailAddress?.address || session.user.email!),
      body: graphEmail.body?.contentType === 'text' ? graphEmail.body?.content : null,
      htmlBody: graphEmail.body?.contentType === 'html' ? graphEmail.body?.content : null,
      receivedAt: graphEmail.receivedDateTime,
      isRead: graphEmail.isRead || false,
      isImportant: graphEmail.importance === 'high',
      hasAttachments: graphEmail.hasAttachments || false,
      attachments: null,
      userId: user.id,
      folder
    }))

    // Return paginated response
    return NextResponse.json({
      emails,
      nextLink: serverNextLink || null,
      pagination: {
        page,
        limit,
        total: emails.length,
        totalPages: 1,
        hasNext: Boolean(serverNextLink),
        hasPrev: page > 1
      }
    })
  } catch (error) {
    console.error("Error fetching emails:", error)
    return NextResponse.json(
      { error: "Failed to fetch emails" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action, messageId, comment, to } = body

    switch (action) {
      case 'markAsRead':
        await graphAPI.markEmailAsRead(messageId)
        // Update local database
        await prisma.email.updateMany({
          where: { messageId, userId: session.user.id },
          data: { isRead: true }
        })
        break

      case 'archive':
        // Move to archive folder (update folder in database)
        await prisma.email.updateMany({
          where: { messageId, userId: session.user.id },
          data: { folder: 'ARCHIVE' }
        })
        break

      case 'delete':
        await graphAPI.deleteEmail(messageId)
        // Remove from local database
        await prisma.email.deleteMany({
          where: { messageId, userId: session.user.id }
        })
        break

      case 'reply':
        await graphAPI.replyEmail(messageId, comment || '')
        break

      case 'forward':
        if (!Array.isArray(to) || to.length === 0) {
          return NextResponse.json({ error: "Missing forward recipients" }, { status: 400 })
        }
        await graphAPI.forwardEmail(messageId, to, comment || '')
        break

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing email action:", error)
    return NextResponse.json(
      { error: "Failed to process email action" },
      { status: 500 }
    )
  }
}

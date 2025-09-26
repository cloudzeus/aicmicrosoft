import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const eventData = await request.json()
    const { eventId } = await params
    console.log("Updating event:", eventId, eventData)

    if (!session.accessToken) {
      return NextResponse.json(
        { error: "No access token available" },
        { status: 401 }
      )
    }

    const graphEvent = {
      subject: eventData.title,
      start: {
        dateTime: eventData.start.toISOString(),
        timeZone: "UTC"
      },
      end: {
        dateTime: eventData.end.toISOString(),
        timeZone: "UTC"
      },
      location: eventData.location ? {
        displayName: eventData.location
      } : undefined,
      body: {
        contentType: "text",
        content: eventData.description || ""
      },
      showAs: eventData.showAs || "busy",
      isOnlineMeeting: eventData.isOnlineMeeting || false
    }

    const response = await fetch(`https://graph.microsoft.com/v1.0/me/events/${eventId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(graphEvent)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Graph API error:', errorText)
      throw new Error(`Failed to update event: ${response.status} ${response.statusText}`)
    }

    const updatedEvent = await response.json()
    console.log('Event updated successfully:', updatedEvent.id)

    return NextResponse.json({
      success: true,
      event: updatedEvent,
      message: "Event updated successfully"
    })

  } catch (error) {
    console.error("Error updating calendar event:", error)
    return NextResponse.json(
      { error: "Failed to update calendar event", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { eventId } = await params
    console.log("Deleting event:", eventId)

    if (!session.accessToken) {
      return NextResponse.json(
        { error: "No access token available" },
        { status: 401 }
      )
    }

    const response = await fetch(`https://graph.microsoft.com/v1.0/me/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Graph API error:', errorText)
      throw new Error(`Failed to delete event: ${response.status} ${response.statusText}`)
    }

    console.log('Event deleted successfully:', eventId)

    return NextResponse.json({
      success: true,
      message: "Event deleted successfully"
    })

  } catch (error) {
    console.error("Error deleting calendar event:", error)
    return NextResponse.json(
      { error: "Failed to delete calendar event", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}



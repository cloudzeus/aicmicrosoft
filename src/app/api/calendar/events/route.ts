import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { graphAPI } from "@/lib/microsoft-graph"

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check if requesting events for a specific user
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    
    if (userId) {
      console.log(`Group calendar free/busy request for user: ${userId} range: ${start} - ${end}`)

      if (!start || !end) {
        return NextResponse.json(
          { error: "Missing required 'start' and 'end' query parameters (ISO strings)" },
          { status: 400 }
        )
      }

      // We will use getSchedule to fetch free/busy blocks. The schedules array must be UPN or SMTP addresses.
      // The client passes userId (Graph id). We cannot resolve arbitrary ids to emails without extra calls,
      // so expect the client to pass the user's userPrincipalName or mail here instead.
      // For backward compatibility, attempt with the raw value. If Graph rejects, surface empty schedule.
      try {
        const schedules = [userId]
        const schedule = await graphAPI.getFreeBusy(schedules, start, end, 30)

        // Flatten to busy events without subjects
        const events = (schedule?.[0]?.scheduleItems || []).map(item => ({
          id: `${userId}-${item.start.dateTime}-${item.end.dateTime}`,
          subject: 'BUSY',
          start: item.start,
          end: item.end,
          isAllDay: false,
          showAs: item.status || 'busy',
          sensitivity: 'normal',
          location: item.location
        }))

        return NextResponse.json({
          events,
          userId
        })
      } catch (e) {
        console.warn('getSchedule failed for provided identifier. Returning empty events.', e)
        return NextResponse.json({ events: [], userId })
      }
    }

    console.log("Fetching calendar events for user:", session.user.email)

    // Try to get real calendar events from Microsoft Graph API
    const events = await graphAPI.getCalendarEvents()

    console.log(`Found ${events.length} calendar events`)

    return NextResponse.json({
      events: events,
      user: session.user,
      message: events.length > 0 && events[0].id.startsWith('mock-') 
        ? "Calendar events fetched successfully (mock data - Azure permissions not configured yet)"
        : "Calendar events fetched successfully from Microsoft Graph API"
    })

  } catch (error) {
    console.error("Error fetching calendar events:", error)
    return NextResponse.json(
      { error: "Failed to fetch calendar events", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const eventData = await request.json()
    console.log("Creating new event:", eventData)

    // Get access token from database
    const accessToken = await graphAPI.getAccessTokenFromSession()
    
    if (!accessToken) {
      return NextResponse.json(
        { error: "No access token available" },
        { status: 401 }
      )
    }

    const graphEvent: {
      subject: string;
      start: { dateTime: string; timeZone: string };
      end: { dateTime: string; timeZone: string };
      attendees?: Array<{ emailAddress: { address: string } }>;
      body?: { contentType: string; content: string };
      location?: { displayName: string };
      showAs?: string;
      isOnlineMeeting?: boolean;
      onlineMeetingProvider?: string;
    } = {
      subject: eventData.title,
      start: {
        dateTime: new Date(eventData.start).toISOString(),
        timeZone: "UTC"
      },
      end: {
        dateTime: new Date(eventData.end).toISOString(),
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
      isOnlineMeeting: !!eventData.isOnlineMeeting,
      attendees: eventData.attendees ? eventData.attendees.split(',').map((email: string) => ({
        emailAddress: {
          address: email.trim(),
          name: email.trim()
        },
        type: "required"
      })) : []
    }

    if (graphEvent.isOnlineMeeting) {
      graphEvent.onlineMeetingProvider = "teamsForBusiness"
    }

    const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(graphEvent)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Graph API error:', errorText)
      throw new Error(`Failed to create event: ${response.status} ${response.statusText}`)
    }

    const createdEvent = await response.json()
    console.log('Event created successfully:', createdEvent.id)

    return NextResponse.json({
      success: true,
      event: createdEvent,
      message: "Event created successfully"
    })

  } catch (error) {
    console.error("Error creating calendar event:", error)
    return NextResponse.json(
      { error: "Failed to create calendar event", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
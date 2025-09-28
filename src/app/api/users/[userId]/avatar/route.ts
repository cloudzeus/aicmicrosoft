import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getToken } from 'next-auth/jwt'

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const session = await auth()

    console.log('Avatar API - session check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      hasAccessToken: !!session?.accessToken,
      userId: userId
    })

    if (!session?.user) {
      console.log('Avatar API - unauthorized, no session')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Use session access token directly
    const accessToken = session.accessToken

    console.log('Avatar API - token check:', {
      hasAccessToken: !!accessToken,
      sessionRole: session.user?.role
    })

    if (!accessToken) {
      console.log('Avatar API - no access token available')
      return NextResponse.json(
        { error: 'No access token available' },
        { status: 401 }
      )
    }

    // Fetch user avatar from Microsoft Graph API
    const graphUrl = `https://graph.microsoft.com/v1.0/users/${userId}/photo/$value`
    console.log('Avatar API - fetching from Graph:', { graphUrl, userId })
    
    const response = await fetch(graphUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
    
    console.log('Avatar API - Graph response:', { 
      status: response.status, 
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    })

    if (!response.ok) {
      // If no photo exists, return 404
      if (response.status === 404) {
        console.log('Avatar API - no photo found for user:', userId)
        return NextResponse.json(
          { error: 'No photo found' },
          { status: 404 }
        )
      }
      
      console.log('Avatar API - Graph API error:', { 
        status: response.status, 
        statusText: response.statusText,
        userId 
      })
      
      return NextResponse.json(
        { error: 'Failed to fetch photo' },
        { status: response.status }
      )
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error('Error fetching user avatar:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

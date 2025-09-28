import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs'

export async function GET() {
  try {
    const session = await auth()

    console.log("Session check:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      hasAccessToken: !!session?.accessToken,
      userEmail: session?.user?.email
    })

    if (!session?.user) {
      console.log("No session or user found")
      return NextResponse.json(
        { error: "Unauthorized - No session found" },
        { status: 401 }
      )
    }

    console.log("Fetching users for:", session.user.email)

    // Try to get users from Microsoft Graph API first
    let graphUsers: any[] = []
    if (session.accessToken) {
      try {
        const response = await fetch('https://graph.microsoft.com/v1.0/users', {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          console.log('Graph API response:', { totalUsers: data.value?.length || 0 })
          graphUsers = data.value.map((user: { 
            id: string; 
            displayName: string; 
            mail: string; 
            userPrincipalName?: string;
            jobTitle?: string;
            department?: string;
            officeLocation?: string;
          }) => ({
            id: user.id,
            name: user.displayName,
            email: user.mail,
            displayName: user.displayName,
            mail: user.mail,
            userPrincipalName: user.userPrincipalName,
            jobTitle: user.jobTitle,
            department: user.department,
            officeLocation: user.officeLocation,
            role: 'USER' // Default role for Graph API users
          }))
          console.log(`Found ${graphUsers.length} users from Graph API`)
        } else {
          const errorText = await response.text()
          console.error('Graph API error:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText
          })
        }
      } catch (graphError) {
        console.warn('Graph API failed, falling back to local users:', graphError)
      }
    }

    // Fallback: Get users from local database
    const { prisma } = await import('@/lib/prisma')
    const localUsers = await prisma.user.findMany({
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

    // Transform local users to match expected format
    const transformedLocalUsers = localUsers.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      jobTitle: user.jobTitle,
      role: user.role,
    }))

    console.log(`Found ${transformedLocalUsers.length} users from local database`)

    // Combine and deduplicate users (Graph API users take precedence)
    const allUsers = [...graphUsers, ...transformedLocalUsers]
    const uniqueUsers = allUsers.filter((user, index, self) => 
      index === self.findIndex(u => u.email === user.email)
    )

    console.log(`Total unique users: ${uniqueUsers.length}`)

    return NextResponse.json({
      users: uniqueUsers,
      total: uniqueUsers.length,
      message: "Users fetched successfully"
    })

  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Failed to fetch users", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

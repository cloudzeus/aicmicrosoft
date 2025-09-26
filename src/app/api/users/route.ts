import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

// Force Node.js runtime for Prisma compatibility
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

    console.log("Fetching users from tenant for:", session.user.email)

    // Get users from the same tenant using Microsoft Graph API
    const response = await fetch('https://graph.microsoft.com/v1.0/users', {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Graph API error:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Error details:', errorText)
      return NextResponse.json(
        { error: "Failed to fetch users from Microsoft Graph", details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Transform the users data to include only relevant fields
    const users = data.value.map((user: { 
      id: string; 
      displayName: string; 
      mail: string; 
      userPrincipalName?: string;
      jobTitle?: string;
      department?: string;
      officeLocation?: string;
    }) => ({
      id: user.id,
      displayName: user.displayName,
      mail: user.mail,
      userPrincipalName: user.userPrincipalName,
      jobTitle: user.jobTitle,
      department: user.department,
      officeLocation: user.officeLocation
    }))

    console.log(`Found ${users.length} users in tenant`)

    return NextResponse.json({
      users: users,
      total: users.length,
      message: "Users fetched successfully from tenant"
    })

  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Failed to fetch users", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

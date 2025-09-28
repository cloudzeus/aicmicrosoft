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

    console.log("Fetching groups for:", session.user.email)

    try {
      // Fetch real groups from Microsoft Graph
      const groups = await graphAPI.getMyGroups()
      
      // Filter and format groups
      const formattedGroups = groups.map(group => ({
        id: group.id,
        displayName: group.displayName,
        emailAddress: group.mail || group.displayName,
        description: group.description || `Group: ${group.displayName}`,
        groupType: group.securityEnabled ? "SECURITY" : "DISTRIBUTION"
      }))

      console.log(`Found ${formattedGroups.length} groups`)

      return NextResponse.json({
        groups: formattedGroups,
        total: formattedGroups.length,
        message: "Groups fetched successfully"
      })
    } catch (error) {
      console.error("Error fetching real groups, falling back to sample data:", error)
      
      // Fallback to sample data if Microsoft Graph fails
      const groups = [
        {
          id: "group-1",
          displayName: "IT Department Group",
          emailAddress: "it-group@company.com",
          description: "IT Department security group",
          groupType: "SECURITY"
        },
        {
          id: "group-2",
          displayName: "HR Department Group", 
          emailAddress: "hr-group@company.com",
          description: "HR Department security group",
          groupType: "SECURITY"
        },
        {
          id: "group-3",
          displayName: "Finance Department Group",
          emailAddress: "finance-group@company.com", 
          description: "Finance Department security group",
          groupType: "SECURITY"
        },
        {
          id: "group-4",
          displayName: "All Employees Distribution",
          emailAddress: "all-employees@company.com",
          description: "Distribution list for all employees",
          groupType: "DISTRIBUTION"
        }
      ]

      return NextResponse.json({
        groups: groups,
        total: groups.length,
        message: "Using sample data - Microsoft Graph unavailable"
      })
    }

  } catch (error) {
    console.error("Error fetching groups:", error)
    return NextResponse.json(
      { error: "Failed to fetch groups", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeAssignments = searchParams.get('includeAssignments') === 'true'
    
    console.log('Users API - parameters:', {
      includeAssignments,
      url: request.url,
      searchParams: Object.fromEntries(searchParams.entries())
    })
    
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
            role: 'USER', // Default role for Graph API users
            tenantId: user.id,
            isFromTenantSync: true,
            // Graph API users don't have local assignments, so always return empty arrays
            userDepartments: [],
            userPositions: [],
            _count: { userDepartments: 0, userPositions: 0 }
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
      include: {
        userDepartments: includeAssignments ? {
          include: {
            department: {
              select: {
                id: true,
                name: true,
                code: true,
                description: true
              }
            }
          }
        } : false,
        userPositions: includeAssignments ? {
          include: {
            position: {
              select: {
                id: true,
                name: true,
                description: true,
                department: {
                  select: {
                    id: true,
                    name: true,
                    code: true
                  }
                }
              }
            }
          }
        } : false,
        _count: includeAssignments ? {
          select: {
            userDepartments: true,
            userPositions: true
          }
        } : false
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Transform local users to match expected format
    const transformedLocalUsers = localUsers.map(user => {
      const transformed = {
        id: user.id,
        name: user.name,
        email: user.email,
        jobTitle: user.jobTitle,
        role: user.role,
        tenantId: user.tenantId,
        isFromTenantSync: user.isFromTenantSync,
        ...(includeAssignments && {
          userDepartments: user.userDepartments || [],
          userPositions: user.userPositions || [],
          _count: user._count || { userDepartments: 0, userPositions: 0 }
        })
      }
      
      if (includeAssignments) {
        console.log('Transforming user with assignments:', {
          id: user.id,
          name: user.name,
          email: user.email,
          hasUserDepartments: !!user.userDepartments,
          userDepartmentsCount: user.userDepartments?.length || 0,
          hasUserPositions: !!user.userPositions,
          userPositionsCount: user.userPositions?.length || 0,
          hasCount: !!user._count,
          countData: user._count
        })
      }
      
      return transformed
    })

    console.log(`Found ${transformedLocalUsers.length} users from local database`)

    // Combine and deduplicate users (Graph API users take precedence)
    const allUsers = [...graphUsers, ...transformedLocalUsers]
    const uniqueUsers = allUsers.filter((user, index, self) => 
      index === self.findIndex(u => u.email === user.email)
    )

    console.log(`Total unique users: ${uniqueUsers.length}`)
    
    // Debug: Log sample user data when includeAssignments is true
    if (includeAssignments && uniqueUsers.length > 0) {
      console.log('Sample user with assignments:', {
        id: uniqueUsers[0].id,
        name: uniqueUsers[0].name,
        email: uniqueUsers[0].email,
        tenantId: uniqueUsers[0].tenantId,
        isFromTenantSync: uniqueUsers[0].isFromTenantSync,
        hasUserDepartments: !!uniqueUsers[0].userDepartments,
        userDepartmentsCount: uniqueUsers[0].userDepartments?.length || 0,
        hasUserPositions: !!uniqueUsers[0].userPositions,
        userPositionsCount: uniqueUsers[0].userPositions?.length || 0,
        hasCount: !!uniqueUsers[0]._count,
        countData: uniqueUsers[0]._count,
        sampleDepartment: uniqueUsers[0].userDepartments?.[0],
        samplePosition: uniqueUsers[0].userPositions?.[0]
      })
    }

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

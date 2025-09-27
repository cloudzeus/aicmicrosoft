import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { FaUsers, FaExclamationTriangle, FaSignOutAlt } from "react-icons/fa"
import { TenantUsersClient } from "./tenant-users-client"
import { auth, signOut } from "@/lib/auth"

interface TenantUser {
  id: string
  displayName: string
  mail: string
  userPrincipalName?: string
  jobTitle?: string
  department?: string
  officeLocation?: string
}


async function fetchTenantUsers(): Promise<TenantUser[]> {
  try {
    const session = await auth()
    
    if (!session?.user) {
      throw new Error('No authenticated session found')
    }

    if (session.error === "RefreshAccessTokenError") {
      throw new Error('Authentication token expired. Please sign out and sign in again to refresh your session.')
    }

    if (!session.accessToken) {
      throw new Error('No access token found. Please sign out and sign in again.')
    }

    console.log('Fetching users from tenant for:', session.user.email)

    // Get users from the same tenant using Microsoft Graph API
    // Use session.accessToken which is automatically refreshed by NextAuth
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
      
      // Check if it's a token expiry error
      if (response.status === 401) {
        throw new Error('Authentication token expired. Please sign out and sign in again to refresh your session.')
      }
      
      throw new Error(`Failed to fetch users from Microsoft Graph: ${errorText}`)
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
    return users
  } catch (error) {
    console.error('Error fetching users:', error)
    throw error
  }
}

function getMockUsers(): TenantUser[] {
  return [
    {
      id: "mock-user-1",
      displayName: "John Doe",
      mail: "john.doe@aic.gr",
      userPrincipalName: "john.doe@aic.gr",
      jobTitle: "Software Developer",
      department: "IT Department",
      officeLocation: "Athens Office"
    },
    {
      id: "mock-user-2", 
      displayName: "Jane Smith",
      mail: "jane.smith@aic.gr",
      userPrincipalName: "jane.smith@aic.gr",
      jobTitle: "Project Manager",
      department: "Project Management",
      officeLocation: "Thessaloniki Office"
    },
    {
      id: "mock-user-3",
      displayName: "Mike Johnson", 
      mail: "mike.johnson@aic.gr",
      userPrincipalName: "mike.johnson@aic.gr",
      jobTitle: "Senior Developer",
      department: "IT Department",
      officeLocation: "Athens Office"
    },
    {
      id: "mock-user-4",
      displayName: "Sarah Wilson",
      mail: "sarah.wilson@aic.gr", 
      userPrincipalName: "sarah.wilson@aic.gr",
      jobTitle: "Business Analyst",
      department: "Business Development",
      officeLocation: "Remote"
    },
    {
      id: "mock-user-5",
      displayName: "Alex Petrov",
      mail: "alex.petrov@aic.gr",
      userPrincipalName: "alex.petrov@aic.gr", 
      jobTitle: "UX Designer",
      department: "Design Team",
      officeLocation: "Athens Office"
    }
  ]
}

export async function TenantUsersList() {
  let users: TenantUser[] = []
  let error: string | null = null
  let useMockData = false

  try {
    users = await fetchTenantUsers()
  } catch (err) {
    console.error('Error in TenantUsersList:', err)
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users'
    
    // If it's a token expiry error, show the error
    if (errorMessage.includes('token expired')) {
      error = errorMessage
    } else {
      // For other errors, fall back to mock data
      console.warn('Falling back to mock data due to API error')
      users = getMockUsers()
      useMockData = true
    }
  }

  const getUniqueDomains = () => {
    const domains = new Set<string>()
    users.forEach(user => {
      if (user.mail) {
        const domain = user.mail.split('@')[1] || ''
        if (domain) domains.add(domain)
      }
    })
    return Array.from(domains).sort()
  }

  const uniqueDomains = getUniqueDomains()

  if (error) {
    const isTokenExpired = error.includes('token expired')
    
    return (
      <div className="space-y-6">
        <Card className="border border-[#e5e7eb] shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[15px] font-semibold text-[#1f2328]">
              <FaUsers className="w-4 h-4 text-[#5e5e5e]" />
              TENANT USERS & DOMAINS
            </CardTitle>
            <CardDescription className="text-[12px]">Error loading tenant users</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className={isTokenExpired ? "border-[#dc2626] bg-[#fef2f2]" : ""}>
              <FaExclamationTriangle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
            {isTokenExpired && (
              <div className="mt-4">
                <form action={async () => {
                  'use server'
                  await signOut({ redirectTo: '/auth/signin' })
                }}>
                  <Button type="submit" variant="outline" className="border-[#dc2626] text-[#dc2626] hover:bg-[#dc2626] hover:text-white">
                    <FaSignOutAlt className="w-4 h-4 mr-2" />
                    Sign Out & Refresh Session
                  </Button>
                </form>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border border-[#e5e7eb] shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[15px] font-semibold text-[#1f2328]">
            <FaUsers className="w-4 h-4 text-[#5e5e5e]" />
            TENANT USERS & DOMAINS
            {useMockData && (
              <span className="text-[12px] font-normal text-[#dc2626] ml-2">
                (DEMO DATA)
              </span>
            )}
          </CardTitle>
          <CardDescription className="text-[12px]">
            {users.length} users found across {uniqueDomains.length} domains
            {useMockData && (
              <span className="text-[#dc2626] ml-2">
                - Showing demo data due to API error
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TenantUsersClient users={users} />
        </CardContent>
      </Card>
    </div>
  )
}

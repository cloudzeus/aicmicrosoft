import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAccess } from '@/lib/auth-helpers'
import { graphAPI } from '@/lib/microsoft-graph'
import { auth } from '@/lib/auth'

// GET /api/management/sync-status - Get comprehensive sync status of all items
export async function GET(request: NextRequest) {
  try {
    console.log('Sync status API called')
    
    // Check authentication first
    const session = await auth()
    console.log('Session check:', {
      hasUser: !!session?.user,
      hasAccessToken: !!session?.accessToken,
      userEmail: session?.user?.email,
      userRole: session?.user?.role
    })
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No authenticated session found' },
        { status: 401 }
      )
    }
    
    await requireAccess({ action: 'read', resource: 'user' })

    const { searchParams } = new URL(request.url)
    const includeTenantData = searchParams.get('includeTenantData') === 'true'

    // Get local database items
    const [localUsers, localDepartments, localPositions, localSharePoints] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          jobTitle: true,
          isFromTenantSync: true,
          aadObjectId: true,
          tenantId: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { name: 'asc' },
      }),
      prisma.department.findMany({
        select: {
          id: true,
          name: true,
          code: true,
          description: true,
          isFromTenantSync: true,
          tenantId: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              userDepartments: true,
              positions: true,
              sharePoints: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.position.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          isFromTenantSync: true,
          tenantId: true,
          createdAt: true,
          updatedAt: true,
          department: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          _count: {
            select: {
              userPositions: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.departmentSharePoint.findMany({
        select: {
          id: true,
          siteId: true,
          siteUrl: true,
          displayName: true,
          accessLevel: true,
          isFromTenantSync: true,
          tenantSiteId: true,
          createdAt: true,
          updatedAt: true,
          department: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
        orderBy: { displayName: 'asc' },
      }),
    ])

    let tenantData = null
    if (includeTenantData) {
      try {
        console.log('Fetching tenant data from Microsoft Graph...')
        
        // Check if we have a valid access token
        if (!session.accessToken) {
          console.log('No access token available for tenant data fetch')
          tenantData = { error: 'No access token available' }
        } else {
          // Fetch tenant data from Microsoft Graph
          const [tenantUsers, tenantSites] = await Promise.all([
            fetchTenantUsers(),
            graphAPI.getSharePointSites(),
          ])

          tenantData = {
            users: tenantUsers,
            sharePointSites: tenantSites,
          }
          
          console.log('Tenant data fetched successfully:', {
            usersCount: tenantUsers.length,
            sitesCount: tenantSites.length
          })
        }
      } catch (error) {
        console.error('Error fetching tenant data:', error)
        tenantData = { error: error instanceof Error ? error.message : 'Failed to fetch tenant data' }
      }
    }

    // Calculate statistics
    const stats = {
      users: {
        total: localUsers.length,
        fromTenantSync: localUsers.filter(u => u.isFromTenantSync).length,
        local: localUsers.filter(u => !u.isFromTenantSync).length,
      },
      departments: {
        total: localDepartments.length,
        fromTenantSync: localDepartments.filter(d => d.isFromTenantSync).length,
        local: localDepartments.filter(d => !d.isFromTenantSync).length,
      },
      positions: {
        total: localPositions.length,
        fromTenantSync: localPositions.filter(p => p.isFromTenantSync).length,
        local: localPositions.filter(p => !p.isFromTenantSync).length,
      },
      sharePoints: {
        total: localSharePoints.length,
        fromTenantSync: localSharePoints.filter(s => s.isFromTenantSync).length,
        local: localSharePoints.filter(s => !s.isFromTenantSync).length,
      },
    }

    return NextResponse.json({
      local: {
        users: localUsers,
        departments: localDepartments,
        positions: localPositions,
        sharePoints: localSharePoints,
      },
      tenant: tenantData,
      statistics: stats,
    })
  } catch (error) {
    console.error('Error fetching sync status:', error)
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch sync status' },
      { status: 500 }
    )
  }
}

// Helper function to fetch tenant users
async function fetchTenantUsers() {
  try {
    const session = await auth()
    if (!session?.user || !session.accessToken) {
      throw new Error('No authenticated session found')
    }

    const response = await fetch('https://graph.microsoft.com/v1.0/users', {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.status}`)
    }

    const data = await response.json()
    return data.value.map((user: { id: string; displayName: string; mail?: string; userPrincipalName?: string; jobTitle?: string; department?: string; officeLocation?: string }) => ({
      id: user.id,
      displayName: user.displayName,
      mail: user.mail,
      userPrincipalName: user.userPrincipalName,
      jobTitle: user.jobTitle,
      department: user.department,
      officeLocation: user.officeLocation,
    }))
  } catch (error) {
    console.error('Error fetching tenant users:', error)
    return []
  }
}

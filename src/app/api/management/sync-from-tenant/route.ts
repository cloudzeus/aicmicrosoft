import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAccess } from '@/lib/auth-helpers'
import { graphAPI } from '@/lib/microsoft-graph'
import { auth } from '@/lib/auth'

// POST /api/management/sync-from-tenant - Sync data from Microsoft Graph to local database
export async function POST(request: NextRequest) {
  try {
    await requireAccess({ action: 'write', resource: 'user' })

    const session = await auth()
    if (!session?.user || !session.accessToken) {
      return NextResponse.json(
        { error: 'No authenticated session or access token found' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const syncType = searchParams.get('type') || 'all' // all, users, sharepoints

    const results = {
      users: { synced: 0, errors: [] as string[] },
      sharePoints: { synced: 0, errors: [] as string[] },
    }

    // Sync Users from Microsoft Graph
    if (syncType === 'all' || syncType === 'users') {
      try {
        const response = await fetch('https://graph.microsoft.com/v1.0/users', {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          const tenantUsers = data.value || []

          for (const tenantUser of tenantUsers) {
            try {
              // Check if user already exists by aadObjectId
              const existingUser = await prisma.user.findFirst({
                where: {
                  OR: [
                    { aadObjectId: tenantUser.id },
                    { email: tenantUser.mail || tenantUser.userPrincipalName }
                  ]
                }
              })

              if (existingUser) {
                // Update existing user with tenant sync flag
                await prisma.user.update({
                  where: { id: existingUser.id },
                  data: {
                    isFromTenantSync: true,
                    aadObjectId: tenantUser.id,
                    tenantId: tenantUser.id, // Using AAD object ID as tenant ID
                    name: tenantUser.displayName || existingUser.name,
                    email: tenantUser.mail || tenantUser.userPrincipalName || existingUser.email,
                    jobTitle: tenantUser.jobTitle || existingUser.jobTitle,
                  }
                })
              } else {
                // Create new user from tenant
                await prisma.user.create({
                  data: {
                    name: tenantUser.displayName || 'Unknown',
                    email: tenantUser.mail || tenantUser.userPrincipalName || '',
                    isFromTenantSync: true,
                    aadObjectId: tenantUser.id,
                    tenantId: tenantUser.id,
                    jobTitle: tenantUser.jobTitle,
                    role: 'USER', // Default role for synced users
                  }
                })
              }
              results.users.synced++
            } catch (userError) {
              results.users.errors.push(`User ${tenantUser.displayName}: ${userError instanceof Error ? userError.message : 'Unknown error'}`)
            }
          }
        } else {
          results.users.errors.push(`Failed to fetch users from Graph API: ${response.status}`)
        }
      } catch (error) {
        results.users.errors.push(`Error syncing users: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Sync SharePoint Sites (as DepartmentSharePoint entries)
    if (syncType === 'all' || syncType === 'sharepoints') {
      try {
        const sharePointSites = await graphAPI.getSharePointSites()
        
        // Get or create a default department for SharePoint sites
        let defaultDepartment = await prisma.department.findFirst({
          where: { code: 'SHAREPOINT_DEFAULT' }
        })

        if (!defaultDepartment) {
          defaultDepartment = await prisma.department.create({
            data: {
              name: 'SharePoint Sites',
              code: 'SHAREPOINT_DEFAULT',
              description: 'Default department for SharePoint sites from tenant sync',
              isFromTenantSync: true,
              tenantId: 'tenant-sync',
            }
          })
        }

        for (const site of sharePointSites) {
          try {
            // Check if SharePoint site already exists
            const existingSite = await prisma.departmentSharePoint.findFirst({
              where: {
                OR: [
                  { siteId: site.id },
                  { siteUrl: site.webUrl }
                ]
              }
            })

            if (!existingSite) {
              await prisma.departmentSharePoint.create({
                data: {
                  siteId: site.id,
                  siteUrl: site.webUrl,
                  displayName: site.displayName,
                  accessLevel: 'READ', // Default access level
                  isFromTenantSync: true,
                  tenantSiteId: site.id,
                  departmentId: defaultDepartment.id,
                }
              })
              results.sharePoints.synced++
            }
          } catch (siteError) {
            results.sharePoints.errors.push(`Site ${site.displayName}: ${siteError instanceof Error ? siteError.message : 'Unknown error'}`)
          }
        }
      } catch (error) {
        results.sharePoints.errors.push(`Error syncing SharePoint sites: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Sync completed',
      results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error syncing from tenant:', error)
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to sync from tenant', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}



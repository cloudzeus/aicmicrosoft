import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FolderOpen, Plus, Building, Database, ExternalLink, Edit, Trash2 } from "lucide-react"
import Link from "next/link"

export default async function SharePointManagementPage() {
  const session = await auth()

  if (!session) {
    redirect("/auth/signin")
  }

  // Check if user is admin
  if (session.user?.role !== 'ADMIN') {
    redirect("/dashboard")
  }

  // Fetch SharePoint sites with full details
  const sharePointSites = await prisma.departmentSharePoint.findMany({
    include: {
      department: {
        select: {
          id: true,
          name: true,
          code: true,
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: [
      { department: { name: 'asc' } },
      { displayName: 'asc' },
    ],
  })

  // Fetch statistics
  const stats = await prisma.$transaction([
    prisma.departmentSharePoint.count(),
    prisma.departmentSharePoint.count({
      where: { isFromTenantSync: false },
    }),
    prisma.departmentSharePoint.count({
      where: { isFromTenantSync: true },
    }),
    prisma.department.count({
      where: {
        sharePoints: {
          some: {},
        },
      },
    }),
  ])

  const [totalSites, localSites, tenantSyncSites, departmentsWithSites] = stats

  // Group sites by department
  const sitesByDepartment = sharePointSites.reduce((acc, site) => {
    const deptName = site.department.name
    if (!acc[deptName]) {
      acc[deptName] = []
    }
    acc[deptName].push(site)
    return acc
  }, {} as Record<string, typeof sharePointSites>)

  // Group sites by access level
  const sitesByAccessLevel = sharePointSites.reduce((acc, site) => {
    if (!acc[site.accessLevel]) {
      acc[site.accessLevel] = []
    }
    acc[site.accessLevel].push(site)
    return acc
  }, {} as Record<string, typeof sharePointSites>)

  return (
    <DashboardLayout pageTitle="SharePoint Management">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SharePoint Management</h1>
            <p className="text-gray-600 mt-1">Manage SharePoint sites and department connections</p>
          </div>
          <Button asChild>
            <Link href="/management/sharepoints/new">
              <Plus className="w-4 h-4 mr-2" />
              Add SharePoint Site
            </Link>
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Sites</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSites}</div>
              <p className="text-xs text-gray-500">Connected sites</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Local Sites</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{localSites}</div>
              <p className="text-xs text-gray-500">Created locally</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Tenant Sync</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tenantSyncSites}</div>
              <p className="text-xs text-gray-500">From Office 365</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Departments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{departmentsWithSites}</div>
              <p className="text-xs text-gray-500">With sites</p>
            </CardContent>
          </Card>
        </div>

        {/* SharePoint Sites by Department */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              SharePoint Sites by Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(sitesByDepartment).map(([departmentName, deptSites]) => (
                <div key={departmentName}>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    {departmentName}
                    <Badge variant="outline" className="text-xs">
                      {deptSites.length} sites
                    </Badge>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {deptSites.map((site) => (
                      <div key={site.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <FolderOpen className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{site.displayName}</h4>
                            <p className="text-sm text-gray-500 break-all">{site.siteUrl}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={site.isFromTenantSync ? "default" : "secondary"} className="text-xs">
                                {site.isFromTenantSync ? (
                                  <>
                                    <Database className="w-3 h-3 mr-1" />
                                    Office 365
                                  </>
                                ) : (
                                  <>
                                    <Database className="w-3 h-3 mr-1" />
                                    Local
                                  </>
                                )}
                              </Badge>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  site.accessLevel === 'OWNER' ? 'border-purple-200 text-purple-700' :
                                  site.accessLevel === 'CONTRIBUTE' ? 'border-blue-200 text-blue-700' :
                                  'border-green-200 text-green-700'
                                }`}
                              >
                                {site.accessLevel}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={site.siteUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </Button>
                          {!site.isFromTenantSync && (
                            <>
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/management/sharepoints/${site.id}/edit`}>
                                  <Edit className="w-4 h-4" />
                                </Link>
                              </Button>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {sharePointSites.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No SharePoint sites found</p>
                  <Button asChild className="mt-4">
                    <Link href="/management/sharepoints/new">
                      <Plus className="w-4 h-4 mr-2" />
                      Create First SharePoint Site
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Access Level Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Access Level Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg bg-green-50">
                <h4 className="font-semibold mb-2 text-green-600 flex items-center gap-2">
                  <Badge variant="outline" className="border-green-200 text-green-700">READ</Badge>
                  Read Access
                </h4>
                <div className="text-2xl font-bold text-green-600">
                  {sitesByAccessLevel.READ?.length || 0}
                </div>
                <p className="text-xs text-gray-500">Sites with read access</p>
              </div>
              
              <div className="p-4 border rounded-lg bg-blue-50">
                <h4 className="font-semibold mb-2 text-blue-600 flex items-center gap-2">
                  <Badge variant="outline" className="border-blue-200 text-blue-700">CONTRIBUTE</Badge>
                  Contribute Access
                </h4>
                <div className="text-2xl font-bold text-blue-600">
                  {sitesByAccessLevel.CONTRIBUTE?.length || 0}
                </div>
                <p className="text-xs text-gray-500">Sites with contribute access</p>
              </div>
              
              <div className="p-4 border rounded-lg bg-purple-50">
                <h4 className="font-semibold mb-2 text-purple-600 flex items-center gap-2">
                  <Badge variant="outline" className="border-purple-200 text-purple-700">OWNER</Badge>
                  Owner Access
                </h4>
                <div className="text-2xl font-bold text-purple-600">
                  {sitesByAccessLevel.OWNER?.length || 0}
                </div>
                <p className="text-xs text-gray-500">Sites with owner access</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sync Status Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Sync Status Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  Local Sites ({localSites})
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Created and managed locally</li>
                  <li>• Can be edited and deleted</li>
                  <li>• Full administrative control</li>
                  <li>• Custom access levels</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Database className="w-4 h-4 text-green-600" />
                  Office 365 Synced ({tenantSyncSites})
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Synced from Microsoft Graph</li>
                  <li>• Read-only in this system</li>
                  <li>• Managed in Office 365</li>
                  <li>• Cannot be deleted locally</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
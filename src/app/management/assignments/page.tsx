import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserCheck, Plus, Users, Building, Briefcase, Database, Edit, Trash2, UserPlus } from "lucide-react"
import Link from "next/link"

export default async function UserAssignmentsPage() {
  const session = await auth()

  if (!session) {
    redirect("/auth/signin")
  }

  // Check if user is admin
  if (session.user?.role !== 'ADMIN') {
    redirect("/dashboard")
  }

  // Fetch users with their assignments
  const users = await prisma.user.findMany({
    include: {
      userDepartments: {
        include: {
          department: {
            select: {
              id: true,
              name: true,
              code: true,
              description: true,
            },
          },
        },
      },
      userPositions: {
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
                  code: true,
                },
              },
            },
          },
        },
      },
      managedDepartments: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      _count: {
        select: {
          userDepartments: true,
          userPositions: true,
          managedDepartments: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  // Fetch statistics
  const stats = await prisma.$transaction([
    prisma.user.count(),
    prisma.userDepartment.count(),
    prisma.userPosition.count(),
    prisma.user.count({
      where: {
        AND: [
          { userDepartments: { none: {} } },
          { userPositions: { none: {} } },
        ],
      },
    }),
  ])

  const [totalUsers, totalDeptAssignments, totalPosAssignments, unassignedUsers] = stats

  // Separate users by assignment status
  const assignedUsers = users.filter(user => 
    user._count.userDepartments > 0 || user._count.userPositions > 0
  )
  const unassignedUsersList = users.filter(user => 
    user._count.userDepartments === 0 && user._count.userPositions === 0
  )

  return (
    <DashboardLayout pageTitle="User Assignments">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Assignments</h1>
            <p className="text-gray-600 mt-1">Manage user department and position assignments</p>
          </div>
          <Button asChild>
            <Link href="/management/users">
              <UserPlus className="w-4 h-4 mr-2" />
              Manage Users
            </Link>
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-gray-500">Active users</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Department Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDeptAssignments}</div>
              <p className="text-xs text-gray-500">User-department links</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Position Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPosAssignments}</div>
              <p className="text-xs text-gray-500">User-position links</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Unassigned Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{unassignedUsers}</div>
              <p className="text-xs text-gray-500">Need assignment</p>
            </CardContent>
          </Card>
        </div>

        {/* Assigned Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              Assigned Users ({assignedUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assignedUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{user.name || 'Unknown'}</h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      {user.jobTitle && (
                        <p className="text-sm text-gray-600">{user.jobTitle}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'} className="text-xs">
                          {user.role}
                        </Badge>
                        <Badge variant={user.isFromTenantSync ? "default" : "secondary"} className="text-xs">
                          {user.isFromTenantSync ? (
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
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    {/* Departments */}
                    <div className="text-center min-w-[80px]">
                      <div className="text-sm font-medium">{user._count.userDepartments}</div>
                      <div className="text-xs text-gray-500">Departments</div>
                      {user.userDepartments.length > 0 && (
                        <div className="text-xs text-gray-400 mt-1">
                          {user.userDepartments.map(dept => dept.department.name).join(', ')}
                        </div>
                      )}
                    </div>
                    
                    {/* Positions */}
                    <div className="text-center min-w-[80px]">
                      <div className="text-sm font-medium">{user._count.userPositions}</div>
                      <div className="text-xs text-gray-500">Positions</div>
                      {user.userPositions.length > 0 && (
                        <div className="text-xs text-gray-400 mt-1">
                          {user.userPositions.map(pos => pos.position.name).join(', ')}
                        </div>
                      )}
                    </div>
                    
                    {/* Managed Departments */}
                    {user._count.managedDepartments > 0 && (
                      <div className="text-center min-w-[80px]">
                        <div className="text-sm font-medium">{user._count.managedDepartments}</div>
                        <div className="text-xs text-gray-500">Manages</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {user.managedDepartments.map(dept => dept.name).join(', ')}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/management/users/${user.id}/assignments`}>
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {assignedUsers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <UserCheck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No users with assignments found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Unassigned Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <Users className="w-5 h-5" />
              Unassigned Users ({unassignedUsersList.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {unassignedUsersList.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg bg-orange-50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                      <Users className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{user.name || 'Unknown'}</h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'} className="text-xs">
                          {user.role}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          No assignments
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/management/users/${user.id}/assignments`}>
                        <Building className="w-4 h-4 mr-1" />
                        Assign Dept
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/management/users/${user.id}/assignments`}>
                        <Briefcase className="w-4 h-4 mr-1" />
                        Assign Position
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}

              {unassignedUsersList.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>All users have assignments</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Assignment Rules */}
        <Card>
          <CardHeader>
            <CardTitle>Assignment Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Department Rules
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Users can be assigned to multiple departments</li>
                  <li>• One department can be marked as primary</li>
                  <li>• Department managers inherit admin privileges</li>
                  <li>• Office 365 synced items cannot be modified</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Position Rules
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Users can have multiple positions</li>
                  <li>• Positions are linked to departments</li>
                  <li>• Assignment date is tracked</li>
                  <li>• Office 365 synced items cannot be modified</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}